"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from "lucide-react";

interface UpdateClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  contractData: any;
}

export function UpdateClientDialog({
  isOpen,
  onClose,
  clientId,
  contractData,
}: UpdateClientDialogProps) {
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [selectedUpdates, setSelectedUpdates] = useState<{
    clientName: boolean;
    clientCpf: boolean;
    clientEmail: boolean;
    clientPhone: boolean;
    case: boolean;
    createCase: boolean;
  }>({
    clientName: false,
    clientCpf: false,
    clientEmail: false,
    clientPhone: false,
    case: false,
    createCase: false,
  });
  const [updateStatus, setUpdateStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [showAllCases, setShowAllCases] = useState(false);
  const CASES_PER_PAGE = 5; // Mostrar 5 casos por vez

  // Função para mapear tipo de contrato para produto
  const mapTipoContratoToProduct = (tipoContrato: string | null | undefined, hasVehicleInfo: boolean): string => {
    if (hasVehicleInfo) return "Financiamento veicular";
    if (!tipoContrato) return "Empréstimo";
    
    const tipoLower = tipoContrato.toLowerCase();
    if (tipoLower.includes("financiamento") && (tipoLower.includes("veículo") || tipoLower.includes("veiculo") || tipoLower.includes("veicular"))) {
      return "Financiamento veicular";
    }
    if (tipoLower.includes("cartão") || tipoLower.includes("cartao")) {
      return "Cartão de Crédito";
    }
    if (tipoLower.includes("consignado")) {
      return "Empréstimo consignado";
    }
    if (tipoLower.includes("não consignado") || tipoLower.includes("nao consignado")) {
      return "Empréstimo não consignado";
    }
    if (tipoLower.includes("empréstimo") || tipoLower.includes("emprestimo")) {
      return "Empréstimo";
    }
    return "Empréstimo";
  };

  // Buscar dados do cliente quando o dialog abrir
  useEffect(() => {
    if (isOpen && clientId) {
      fetchClientData();
    }
  }, [isOpen, clientId]);

  // Travar scroll da página quando o dialog estiver aberto
  useEffect(() => {
    if (isOpen) {
      // Trava o scroll do body
      document.body.style.overflow = 'hidden';
    } else {
      // Libera o scroll do body
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup: garante que o scroll seja liberado quando o componente for desmontado
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Função para converter string formatada (ex: "R$ 1.000,00" ou "416.67") para número
  const parseFormattedValue = (value: string | null | undefined): number | null => {
    if (!value) return null;
    const str = value.toString().trim();
    
    // Remove R$ e espaços
    let cleaned = str.replace(/R\$/g, '').replace(/\s/g, '');
    
    // Se tem vírgula, é formato brasileiro (ex: "1.000,00" ou "416,67")
    if (cleaned.includes(',')) {
      // Remove pontos de milhar (pontos seguidos de 3 dígitos antes da vírgula)
      cleaned = cleaned.replace(/\.(?=\d{3},)/g, '');
      // Substitui vírgula por ponto para parseFloat
      cleaned = cleaned.replace(',', '.');
    }
    // Se não tem vírgula mas tem ponto, pode ser formato americano (ex: "416.67")
    // Nesse caso, mantém o ponto como está
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  };

  const fetchClientData = async () => {
    setFetching(true);
    try {
      // Adiciona timestamp para evitar cache e força recarregamento
      const response = await fetch(`/api/scu/clients/${clientId}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      if (response.ok) {
        const data = await response.json();
        const clientDataRaw = data.client || data;
        
        // Normaliza os casos para garantir que todos os campos estejam presentes
        const normalizeCase = (caseItem: any) => {
          // Tenta obter dados de CreditCardInfo, LoanInfo ou diretamente do Case
          const creditCardInfo = caseItem.CreditCardInfo?.[0] || caseItem.creditCardInfo?.[0];
          const loanInfo = caseItem.LoanInfo?.[0] || caseItem.loanInfo?.[0];
          
          return {
            ...caseItem,
            // Prioriza: Case direto > CreditCardInfo > LoanInfo
            installments_total: caseItem.installments_total ?? 
                              creditCardInfo?.installments_qnt ?? 
                              loanInfo?.installments_qnt ?? 
                              null,
            installments_value: caseItem.installments_value || 
                              caseItem.installment_value || 
                              creditCardInfo?.installment_value || 
                              null,
            debt_amount: caseItem.debt_amount ?? 
                        creditCardInfo?.debt_amount ?? 
                        loanInfo?.loan_amount ?? 
                        null,
          };
        };
        
        if (clientDataRaw.cases && Array.isArray(clientDataRaw.cases)) {
          clientDataRaw.cases = clientDataRaw.cases.map(normalizeCase);
        }
        if (clientDataRaw.Case && Array.isArray(clientDataRaw.Case)) {
          clientDataRaw.Case = clientDataRaw.Case.map(normalizeCase);
        }
        
        // Força atualização do estado
        setClientData(clientDataRaw);
      } else {
        setUpdateStatus({
          type: "error",
          message: "Erro ao buscar dados do cliente",
        });
      }
    } catch (error: any) {
      setUpdateStatus({
        type: "error",
        message: error.message || "Erro ao buscar dados do cliente",
      });
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async (options?: { clientName?: boolean; clientCpf?: boolean; clientEmail?: boolean; clientPhone?: boolean; case?: boolean; createCase?: boolean }) => {
    const updatesToApply = options || selectedUpdates;
    
    const hasAnyUpdate = updatesToApply.clientName || updatesToApply.clientCpf || updatesToApply.clientEmail || updatesToApply.clientPhone || updatesToApply.case || updatesToApply.createCase;
    
    if (!hasAnyUpdate) {
      setUpdateStatus({
        type: "error",
        message: "Selecione pelo menos uma opção para atualizar",
      });
      return;
    }

    setLoading(true);
    setUpdateStatus({ type: null, message: "" });

    try {
      const updates: string[] = [];

      // Atualizar dados do cliente individualmente
        const clientUpdate: any = {};
      if (updatesToApply.clientName && contractData.nome_cliente && contractData.nome_cliente !== clientData?.full_name) {
          clientUpdate.full_name = contractData.nome_cliente;
        }
      if (updatesToApply.clientCpf && contractData.cpf_cnpj) {
          const cpfLimpo = contractData.cpf_cnpj.replace(/\D/g, "");
          if (cpfLimpo.length === 11 && cpfLimpo !== clientData?.cpf?.replace(/\D/g, "")) {
            clientUpdate.cpf = cpfLimpo;
          }
        }
      if (updatesToApply.clientEmail && contractData.email && contractData.email !== clientData?.email) {
        clientUpdate.email = contractData.email;
      }
      if (updatesToApply.clientPhone && contractData.telefone && contractData.telefone !== clientData?.phone) {
        clientUpdate.phone = contractData.telefone;
      }

        if (Object.keys(clientUpdate).length > 0) {
          const response = await fetch(`/api/scu/clients/${clientId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(clientUpdate),
          });

          if (response.ok) {
          const updatedFields = Object.keys(clientUpdate).map(key => {
            if (key === 'full_name') return 'Nome';
            if (key === 'cpf') return 'CPF';
            if (key === 'email') return 'Email';
            if (key === 'phone') return 'Telefone';
            return key;
          });
          updates.push(`Cliente atualizado: ${updatedFields.join(', ')}`);
          } else {
            throw new Error("Erro ao atualizar cliente");
        }
      }

      // Atualizar ou criar caso
      if (updatesToApply.case || updatesToApply.createCase) {
        const hasVehicleInfo = !!(
          contractData.veiculo_marca ||
          contractData.veiculo_modelo ||
          contractData.veiculo_ano ||
          contractData.veiculo_cor ||
          contractData.veiculo_placa
        );
        const product = mapTipoContratoToProduct(contractData.tipo_contrato, hasVehicleInfo);

        // Verificar se já existe um caso (pode vir como cases ou Case)
        const cases = clientData?.cases || clientData?.Case || [];
        const allCases = Array.isArray(cases) ? cases : [];

        if (updatesToApply.case && allCases.length > 0) {
          // Encontrar o caso mais similar (mesmo produto) ou usar o primeiro
          const similarCase = allCases.find((c: any) => 
            c.product?.toLowerCase() === product.toLowerCase()
          ) || allCases[0];

          // Atualizar caso existente
          const caseUpdate: any = {
            product: product,
            installments_total: contractData.quantidade_parcelas || null,
            installment_value: contractData.valor_parcela ? String(contractData.valor_parcela) : null,
            debt_amount: contractData.valor_divida ? String(contractData.valor_divida) : null,
          };

          const response = await fetch(`/api/scu/cases/${similarCase.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(caseUpdate),
          });

          if (response.ok) {
            updates.push(`Caso "${similarCase.product || 'N/A'}" atualizado`);
          } else {
            throw new Error("Erro ao atualizar caso");
          }
        } else if (updatesToApply.createCase) {
          // Criar novo caso
          const bankName = contractData.banco_credor && contractData.banco_credor.trim() 
            ? contractData.banco_credor.trim() 
            : "Não informado";
          const caseData = {
            clientId: clientId,
            product: product,
            bank_name: bankName,
            installments_total: contractData.quantidade_parcelas || null,
            installment_value: contractData.valor_parcela ? String(contractData.valor_parcela) : null,
            debt_amount: contractData.valor_divida ? String(contractData.valor_divida) : null,
            paid_installments: null,
            paid_debt_amount: null,
          };

          const caseResponse = await fetch("/api/scu/cases", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(caseData),
          });

          if (!caseResponse.ok) {
            throw new Error("Erro ao criar caso");
          }

          const caseResult = await caseResponse.json();
          const newCaseId = caseResult.case?.id || caseResult.id;
          updates.push("Novo caso criado");

          // Se for financiamento veicular, criar FinancingInfo
          const isVehicleFinancing = product.toLowerCase().includes("veicular") || 
                                     product.toLowerCase().includes("financiamento") ||
                                     !!(contractData.veiculo_marca || contractData.veiculo_modelo || contractData.veiculo_ano || contractData.veiculo_placa || contractData.veiculo_cor);

          if (isVehicleFinancing && newCaseId) {
            // Verificar se temos informações suficientes do veículo
            const hasVehicleInfo = !!(contractData.veiculo_placa && contractData.veiculo_cor && contractData.veiculo_modelo && contractData.veiculo_marca);
            
            if (hasVehicleInfo) {
              const financingInfoData = {
                clientId: clientId,
                caseId: newCaseId,
                license_plate: contractData.veiculo_placa || "",
                vehicle_color: contractData.veiculo_cor || "",
                renavam: contractData.veiculo_renavam || "N/C", // RENAVAM pode não estar no contrato
                vehicle_model: contractData.veiculo_modelo || "",
                vehicle_brand: contractData.veiculo_marca || "",
                contract_owner: contractData.nome_cliente || clientData?.full_name || "N/C",
              };

              const financingResponse = await fetch("/api/scu/financing-info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(financingInfoData),
              });

              if (financingResponse.ok) {
                updates.push("Informações do veículo adicionadas");
              } else {
                // Não falha se não conseguir criar FinancingInfo, apenas avisa
                console.warn("Erro ao criar FinancingInfo:", await financingResponse.json());
              }
            }
          }
        }
      }

      setUpdateStatus({
        type: "success",
        message: `Atualizações realizadas: ${updates.join(", ")}`,
      });

      // Recarregar dados do cliente
      await fetchClientData();
    } catch (error: any) {
      setUpdateStatus({
        type: "error",
        message: error.message || "Erro ao atualizar dados",
      });
    } finally {
      setLoading(false);
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col">
        {/* Header - Fixo */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1e3a8a]">Atualizar Dados do Cliente</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollável */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {fetching ? (
            <div className="space-y-6 animate-pulse">
              {/* Skeleton - Comparação de Dados do Cliente */}
              <div className="space-y-4">
                <div className="h-6 w-64 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 space-y-3">
                    <div className="h-4 w-20 bg-gray-300 rounded"></div>
                    <div className="h-5 w-32 bg-gray-300 rounded"></div>
                    <div className="h-4 w-16 bg-gray-300 rounded"></div>
                    <div className="h-5 w-28 bg-gray-300 rounded"></div>
                    <div className="h-4 w-20 bg-gray-300 rounded"></div>
                    <div className="h-5 w-36 bg-gray-300 rounded"></div>
                    <div className="h-4 w-24 bg-gray-300 rounded"></div>
                    <div className="h-5 w-32 bg-gray-300 rounded"></div>
                  </div>
                  <div className="hidden md:flex items-center justify-center">
                    <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300 space-y-3">
                    <div className="h-4 w-24 bg-blue-200 rounded"></div>
                    <div className="h-5 w-36 bg-blue-200 rounded"></div>
                    <div className="h-4 w-16 bg-blue-200 rounded"></div>
                    <div className="h-5 w-28 bg-blue-200 rounded"></div>
                    <div className="h-4 w-20 bg-blue-200 rounded"></div>
                    <div className="h-5 w-32 bg-blue-200 rounded"></div>
                    <div className="h-4 w-24 bg-blue-200 rounded"></div>
                    <div className="h-5 w-32 bg-blue-200 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Skeleton - Comparação de Dados do Caso */}
              <div className="space-y-4">
                <div className="h-6 w-72 bg-gray-200 rounded"></div>
                <div className="bg-gradient-to-br from-[#1e3a8a]/10 to-[#1e40af]/5 rounded-xl p-6 border-2 border-[#1e3a8a]/20">
                  <div className="h-5 w-48 bg-[#1e3a8a]/20 rounded mb-4"></div>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="h-20 bg-white/60 rounded-lg"></div>
                    <div className="h-20 bg-white/60 rounded-lg"></div>
                    <div className="h-20 bg-white/60 rounded-lg"></div>
                    <div className="h-20 bg-white/60 rounded-lg"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 w-48 bg-gray-200 rounded"></div>
                  <div className="bg-white rounded-xl p-6 border-2 border-[#cbd5e1]">
                    <div className="h-5 w-40 bg-gray-300 rounded mb-4"></div>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="h-16 bg-gray-100 rounded"></div>
                      <div className="h-16 bg-gray-100 rounded"></div>
                      <div className="h-16 bg-gray-100 rounded"></div>
                      <div className="h-16 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Comparação de Dados do Cliente */}
              {clientData && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-[#1e3a8a] border-b-2 border-[#1e3a8a] pb-2">
                    Comparação: Dados do Cliente
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Coluna SCU */}
                    <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <h4 className="font-semibold text-gray-700">SCU (Atual)</h4>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs">Nome:</span>
                          <p className="font-medium text-gray-800 mt-1">{clientData.full_name || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">CPF:</span>
                          <p className="font-medium text-gray-800 mt-1">{clientData.cpf || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Email:</span>
                          <p className="font-medium text-gray-800 mt-1">{clientData.email || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Telefone:</span>
                          <p className="font-medium text-gray-800 mt-1">{clientData.phone || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Seta */}
                    <div className="hidden md:flex items-center justify-center">
                      <ArrowRight className="h-8 w-8 text-gray-400" />
                    </div>

                    {/* Coluna Contrato */}
                    <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h4 className="font-semibold text-gray-700">Contrato Lido pela IA</h4>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs">Nome:</span>
                          <p className={`font-medium mt-1 ${
                            contractData.nome_cliente && contractData.nome_cliente !== clientData.full_name
                              ? "text-orange-600"
                              : "text-gray-800"
                          }`}>
                            {contractData.nome_cliente || "N/A"}
                            {contractData.nome_cliente && contractData.nome_cliente !== clientData.full_name && (
                              <AlertCircle className="inline-block h-3 w-3 ml-1 text-orange-600" />
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">CPF:</span>
                          <p className={`font-medium mt-1 ${
                            contractData.cpf_cnpj && 
                            contractData.cpf_cnpj.replace(/\D/g, "") !== clientData.cpf?.replace(/\D/g, "")
                              ? "text-orange-600"
                              : "text-gray-800"
                          }`}>
                            {contractData.cpf_cnpj || "N/A"}
                            {contractData.cpf_cnpj && 
                             contractData.cpf_cnpj.replace(/\D/g, "") !== clientData.cpf?.replace(/\D/g, "") && (
                              <AlertCircle className="inline-block h-3 w-3 ml-1 text-orange-600" />
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Email:</span>
                          <p className="font-medium text-gray-400 mt-1 italic">Não disponível no contrato</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Telefone:</span>
                          <p className="font-medium text-gray-400 mt-1 italic">Não disponível no contrato</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Opções de Atualização Individual do Cliente */}
                  {(contractData.nome_cliente && contractData.nome_cliente !== clientData.full_name) ||
                   (contractData.cpf_cnpj && contractData.cpf_cnpj.replace(/\D/g, "") !== clientData.cpf?.replace(/\D/g, "")) ||
                   (contractData.email && contractData.email !== clientData.email) ||
                   (contractData.telefone && contractData.telefone !== clientData.phone) ? (
                    <div className="mt-4 bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                      <h4 className="font-semibold text-sm text-[#1e3a8a] mb-3">Selecione quais dados do cliente deseja atualizar:</h4>
                      <div className="space-y-2">
                        {contractData.nome_cliente && contractData.nome_cliente !== clientData.full_name && (
                          <label className="flex items-center gap-2 p-2 hover:bg-blue-100 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedUpdates.clientName}
                              onChange={(e) =>
                                setSelectedUpdates({ ...selectedUpdates, clientName: e.target.checked })
                              }
                              className="w-4 h-4 text-[#1e3a8a] rounded"
                            />
                            <span className="text-sm">Atualizar Nome: <span className="font-medium">{contractData.nome_cliente}</span></span>
                          </label>
                        )}
                        {contractData.cpf_cnpj && contractData.cpf_cnpj.replace(/\D/g, "") !== clientData.cpf?.replace(/\D/g, "") && (
                          <label className="flex items-center gap-2 p-2 hover:bg-blue-100 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedUpdates.clientCpf}
                              onChange={(e) =>
                                setSelectedUpdates({ ...selectedUpdates, clientCpf: e.target.checked })
                              }
                              className="w-4 h-4 text-[#1e3a8a] rounded"
                            />
                            <span className="text-sm">Atualizar CPF: <span className="font-medium">{contractData.cpf_cnpj}</span></span>
                          </label>
                        )}
                        {contractData.email && contractData.email !== clientData.email && (
                          <label className="flex items-center gap-2 p-2 hover:bg-blue-100 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedUpdates.clientEmail}
                              onChange={(e) =>
                                setSelectedUpdates({ ...selectedUpdates, clientEmail: e.target.checked })
                              }
                              className="w-4 h-4 text-[#1e3a8a] rounded"
                            />
                            <span className="text-sm">Atualizar Email: <span className="font-medium">{contractData.email}</span></span>
                          </label>
                        )}
                        {contractData.telefone && contractData.telefone !== clientData.phone && (
                          <label className="flex items-center gap-2 p-2 hover:bg-blue-100 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedUpdates.clientPhone}
                              onChange={(e) =>
                                setSelectedUpdates({ ...selectedUpdates, clientPhone: e.target.checked })
                              }
                              className="w-4 h-4 text-[#1e3a8a] rounded"
                            />
                            <span className="text-sm">Atualizar Telefone: <span className="font-medium">{contractData.telefone}</span></span>
                          </label>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Comparação de Dados do Caso */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-8 bg-[#1e3a8a] rounded-full"></div>
                  <h3 className="font-bold text-xl text-[#1e3a8a]">
                  Comparação: Dados do Caso/Produto
                </h3>
                    </div>

                {(() => {
                  const cases = clientData?.cases || clientData?.Case || [];
                  // Normaliza os casos para garantir que todos os campos estejam presentes
                  const normalizeCaseForDisplay = (caseItem: any) => {
                    const creditCardInfo = caseItem.CreditCardInfo?.[0] || caseItem.creditCardInfo?.[0];
                    const loanInfo = caseItem.LoanInfo?.[0] || caseItem.loanInfo?.[0];
                    
                    return {
                      ...caseItem,
                      installments_total: caseItem.installments_total ?? 
                                        creditCardInfo?.installments_qnt ?? 
                                        loanInfo?.installments_qnt ?? 
                                        null,
                      installments_value: caseItem.installments_value || 
                                        caseItem.installment_value || 
                                        creditCardInfo?.installment_value || 
                                        null,
                      debt_amount: caseItem.debt_amount ?? 
                                  creditCardInfo?.debt_amount ?? 
                                  loanInfo?.loan_amount ?? 
                                  null,
                    };
                  };
                  
                  const allCases = Array.isArray(cases) ? cases.map(normalizeCaseForDisplay) : [];
                  const contractProduct = mapTipoContratoToProduct(
                              contractData.tipo_contrato,
                              !!(contractData.veiculo_marca || contractData.veiculo_modelo || contractData.veiculo_ano)
                  );

                  return (
                    <div className="space-y-6">
                      {/* Contrato Lido pela IA */}
                      <div className="bg-gradient-to-br from-[#1e3a8a]/10 to-[#1e40af]/5 rounded-xl p-6 border-2 border-[#1e3a8a]/20">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 bg-[#1e3a8a] rounded-full"></div>
                          <h4 className="font-bold text-lg text-[#1e3a8a]">Contrato Lido pela IA</h4>
                        </div>
                        <div className="grid md:grid-cols-4 gap-4">
                          <div className="bg-white/60 rounded-lg p-3">
                            <span className="text-xs font-medium text-[#64748b] block mb-1">Produto:</span>
                            <p className="font-semibold text-[#1e293b]">{contractProduct}</p>
                        </div>
                          <div className="bg-white/60 rounded-lg p-3">
                            <span className="text-xs font-medium text-[#64748b] block mb-1">Parcelas:</span>
                            <p className="font-semibold text-[#1e293b]">{contractData.quantidade_parcelas || "N/A"}</p>
                        </div>
                          <div className="bg-white/60 rounded-lg p-3">
                            <span className="text-xs font-medium text-[#64748b] block mb-1">Valor Parcela:</span>
                            <p className="font-semibold text-[#1e293b]">
                            {contractData.valor_parcela
                              ? new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(contractData.valor_parcela)
                              : "N/A"}
                          </p>
                        </div>
                          <div className="bg-white/60 rounded-lg p-3">
                            <span className="text-xs font-medium text-[#64748b] block mb-1">Valor Dívida:</span>
                            <p className="font-semibold text-[#1e293b]">
                            {contractData.valor_divida
                              ? new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(contractData.valor_divida)
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      </div>

                      {/* Casos Existentes no SCU */}
                      {allCases.length > 0 ? (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-[#1e293b] text-sm uppercase tracking-wide">
                            Casos Existentes no SCU ({allCases.length})
                          </h4>
                          {(showAllCases ? allCases : allCases.slice(0, CASES_PER_PAGE)).map((existingCase: any, index: number) => {
                            const contractBank = (contractData.banco_credor || "").trim();
                            const isSimilarProduct = existingCase.product?.toLowerCase() === contractProduct.toLowerCase();
                            
                            // Lógica de comparação de banco
                            const contractBankLower = contractBank.toLowerCase();
                            const existingBankLower = (existingCase.bank_name || "").toLowerCase();
                            
                            // Normaliza valores "não informado", "n/c", vazio para comparação
                            const normalizeBank = (bank: string) => {
                              const normalized = bank.toLowerCase().trim();
                              if (!normalized || normalized === "não informado" || normalized === "n/c" || normalized === "nao informado") {
                                return "não informado";
                              }
                              return normalized;
                            };
                            
                            const contractBankNormalized = normalizeBank(contractBank);
                            const existingBankNormalized = normalizeBank(existingCase.bank_name || "");
                            
                            // Considera similar se:
                            // 1. Ambos são "não informado" (normalizados)
                            // 2. Ambos têm banco e são iguais (após normalização)
                            // 3. Contrato não tem banco (vazio) - considera similar independente do banco do caso
                            const isSimilarBank = 
                              contractBankNormalized === "não informado" || // Contrato sem banco ou "Não informado" → sempre similar
                              contractBankNormalized === existingBankNormalized; // Bancos iguais (após normalização)
                            
                            const canUpdate = isSimilarProduct && isSimilarBank;
                            const installmentsValueNum = parseFormattedValue(existingCase.installments_value || existingCase.installment_value);
                            const debtAmountNum = parseFormattedValue(existingCase.debt_amount);
                            
                            const hasDifferences = 
                              contractData.quantidade_parcelas !== existingCase.installments_total ||
                              (contractData.valor_parcela && installmentsValueNum !== null && 
                               Math.abs(contractData.valor_parcela - installmentsValueNum) > 0.01) ||
                              (contractData.valor_divida && debtAmountNum !== null &&
                               Math.abs(contractData.valor_divida - debtAmountNum) > 0.01);

                            return (
                              <div
                                key={existingCase.id}
                                className={`bg-white rounded-xl p-6 border-2 ${
                                  canUpdate
                                    ? 'border-[#10b981]/30 bg-[#10b981]/5'
                                    : 'border-[#cbd5e1]'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${canUpdate ? 'bg-[#10b981]' : 'bg-gray-400'}`}></div>
                                    <h5 className="font-semibold text-[#1e293b]">
                                      Caso #{index + 1}: {existingCase.product || "N/A"}
                                    </h5>
                                    {canUpdate && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#10b981]/10 text-[#10b981] text-xs font-semibold rounded border border-[#10b981]/20">
                                        Produto Similar
                                      </span>
                                    )}
                    </div>
                  </div>
                                <div className="grid md:grid-cols-4 gap-4">
                                  <div>
                                    <span className="text-xs font-medium text-[#64748b] block mb-1">Banco:</span>
                                    <p className="font-semibold text-[#1e293b]">{existingCase.bank_name || "N/A"}</p>
                    </div>
                      <div>
                                    <span className="text-xs font-medium text-[#64748b] block mb-1">Parcelas:</span>
                                    <p className={`font-semibold ${
                                      contractData.quantidade_parcelas !== existingCase.installments_total
                                        ? 'text-orange-600'
                                        : 'text-[#1e293b]'
                                    }`}>
                                      {existingCase.installments_total || "N/A"}
                                      {contractData.quantidade_parcelas !== existingCase.installments_total && (
                                        <AlertCircle className="inline-block h-3 w-3 ml-1 text-orange-600" />
                          )}
                        </p>
                      </div>
                      <div>
                                    <span className="text-xs font-medium text-[#64748b] block mb-1">Valor Parcela:</span>
                                    <p className={`font-semibold ${
                                      (() => {
                                        const valueNum = parseFormattedValue(existingCase.installments_value || existingCase.installment_value);
                                        return valueNum !== null && contractData.valor_parcela && 
                                          Math.abs(contractData.valor_parcela - valueNum) > 0.01;
                                      })()
                                        ? 'text-orange-600'
                                        : 'text-[#1e293b]'
                                    }`}>
                                      {(() => {
                                        const value = existingCase.installments_value || existingCase.installment_value;
                                        if (!value) return "N/A";
                                        const numValue = parseFormattedValue(value);
                                        if (numValue === null) return value; // Se não conseguir converter, retorna o valor original
                                        return new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                                        }).format(numValue);
                                      })()}
                                      {(() => {
                                        const valueNum = parseFormattedValue(existingCase.installments_value || existingCase.installment_value);
                                        return valueNum !== null && contractData.valor_parcela && 
                                          Math.abs(contractData.valor_parcela - valueNum) > 0.01 && (
                                            <AlertCircle className="inline-block h-3 w-3 ml-1 text-orange-600" />
                                          );
                                      })()}
                        </p>
                      </div>
                      <div>
                                    <span className="text-xs font-medium text-[#64748b] block mb-1">Valor Dívida:</span>
                                    <p className={`font-semibold ${
                                      (() => {
                                        const valueNum = parseFormattedValue(existingCase.debt_amount);
                                        return valueNum !== null && contractData.valor_divida && 
                                          Math.abs(contractData.valor_divida - valueNum) > 0.01;
                                      })()
                                        ? 'text-orange-600'
                                        : 'text-[#1e293b]'
                                    }`}>
                                      {(() => {
                                        const value = existingCase.debt_amount;
                                        if (!value) return "N/A";
                                        const numValue = parseFormattedValue(value);
                                        if (numValue === null) return value; // Se não conseguir converter, retorna o valor original
                                        return new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                                        }).format(numValue);
                                      })()}
                                      {(() => {
                                        const valueNum = parseFormattedValue(existingCase.debt_amount);
                                        return valueNum !== null && contractData.valor_divida && 
                                          Math.abs(contractData.valor_divida - valueNum) > 0.01 && (
                                            <AlertCircle className="inline-block h-3 w-3 ml-1 text-orange-600" />
                                          );
                                      })()}
                      </p>
                    </div>
                                </div>
                                {/* Botão Atualizar - só aparece se o produto E banco forem iguais */}
                                {canUpdate && (
                                  <div className="mt-4 pt-4 border-t border-[#cbd5e1] flex justify-end">
                                    <button
                                      onClick={async () => {
                                        setLoading(true);
                                        setUpdateStatus({ type: null, message: "" });
                                        
                                        try {
                                          const updates: string[] = [];

                                          // Atualizar dados do cliente se selecionados
                                          const clientUpdate: any = {};
                                          if (selectedUpdates.clientName && contractData.nome_cliente && contractData.nome_cliente !== clientData?.full_name) {
                                            clientUpdate.full_name = contractData.nome_cliente;
                                          }
                                          if (selectedUpdates.clientCpf && contractData.cpf_cnpj) {
                                            const cpfLimpo = contractData.cpf_cnpj.replace(/\D/g, "");
                                            if (cpfLimpo.length === 11 && cpfLimpo !== clientData?.cpf?.replace(/\D/g, "")) {
                                              clientUpdate.cpf = cpfLimpo;
                                            }
                                          }
                                          if (selectedUpdates.clientEmail && contractData.email && contractData.email !== clientData?.email) {
                                            clientUpdate.email = contractData.email;
                                          }
                                          if (selectedUpdates.clientPhone && contractData.telefone && contractData.telefone !== clientData?.phone) {
                                            clientUpdate.phone = contractData.telefone;
                                          }

                                          if (Object.keys(clientUpdate).length > 0) {
                                            const clientResponse = await fetch(`/api/scu/clients/${clientId}`, {
                                              method: "PATCH",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify(clientUpdate),
                                            });

                                            if (clientResponse.ok) {
                                              const updatedFields = Object.keys(clientUpdate).map(key => {
                                                if (key === 'full_name') return 'Nome';
                                                if (key === 'cpf') return 'CPF';
                                                if (key === 'email') return 'Email';
                                                if (key === 'phone') return 'Telefone';
                                                return key;
                                              });
                                              updates.push(`Cliente: ${updatedFields.join(', ')}`);
                                            }
                                          }

                                          // Atualizar o caso específico
                                          const caseUpdate: any = {
                                            product: contractProduct,
                                            installments_total: contractData.quantidade_parcelas || null,
                                            installment_value: contractData.valor_parcela ? String(contractData.valor_parcela) : null,
                                            debt_amount: contractData.valor_divida ? String(contractData.valor_divida) : null,
                                          };

                                          const caseResponse = await fetch(`/api/scu/cases/${existingCase.id}`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(caseUpdate),
                                          });

                                          if (caseResponse.ok) {
                                            updates.push(`Caso "${existingCase.product || 'N/A'}"`);
                                            // Recarregar dados do cliente para atualizar a lista de casos
                                            // Aguarda um pouco para garantir que a API processou a atualização
                                            await new Promise(resolve => setTimeout(resolve, 800));
                                            // Força recarregamento sem cache
                                            await fetchClientData();
                                            setUpdateStatus({
                                              type: "success",
                                              message: `Atualizações realizadas: ${updates.join(", ")}`,
                                            });
                                          } else {
                                            throw new Error("Erro ao atualizar caso");
                                          }
                                        } catch (error: any) {
                                          setUpdateStatus({
                                            type: "error",
                                            message: error.message || "Erro ao atualizar",
                                          });
                                        } finally {
                                          setLoading(false);
                                        }
                                      }}
                                      disabled={loading}
                                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                      {loading ? (
                                        <>
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          Atualizando...
                                        </>
                                      ) : (
                                        <>
                                          <RefreshCw className="h-3 w-3" />
                                          Atualizar
                                        </>
                                      )}
                                    </button>
                  </div>
                )}
              </div>
                            );
                          })}
                          
                          {/* Botão Ver Mais */}
                          {allCases.length > CASES_PER_PAGE && (
                            <div className="flex justify-center pt-2">
                              <button
                                onClick={() => setShowAllCases(!showAllCases)}
                                className="px-4 py-2 text-sm font-medium text-[#1e3a8a] hover:text-[#1e40af] hover:bg-[#1e3a8a]/5 rounded-lg transition-colors"
                              >
                                {showAllCases ? (
                                  <>Ver menos ({allCases.length - CASES_PER_PAGE} casos ocultos)</>
                                ) : (
                                  <>Ver mais ({allCases.length - CASES_PER_PAGE} casos adicionais)</>
                                )}
                              </button>
                  </div>
                          )}
                    </div>
                ) : (
                        <div className="bg-[#fef3c7] border-2 border-[#fbbf24] rounded-xl p-6">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                    <div>
                              <p className="font-semibold text-[#92400e] mb-1">Nenhum caso encontrado no SCU.</p>
                              <p className="text-sm text-[#78350f]">Você pode criar um novo caso com os dados do contrato.</p>
                            </div>
                          </div>
                    </div>
                )}
                    </div>
                  );
                })()}
              </div>

              {/* Status */}
              {updateStatus.type && (
                <div
                  className={`p-4 rounded-lg ${
                    updateStatus.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {updateStatus.type === "success" && (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                    <p className="font-medium">{updateStatus.message}</p>
                  </div>
                </div>
              )}

            </>
          )}
        </div>

        {/* Actions - Fixo */}
        {!fetching && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between gap-3">
                <button
                  onClick={onClose}
                className="px-3 py-1.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                onClick={async () => {
                  await handleUpdate({ 
                    clientName: selectedUpdates.clientName,
                    clientCpf: selectedUpdates.clientCpf,
                    clientEmail: selectedUpdates.clientEmail,
                    clientPhone: selectedUpdates.clientPhone,
                    case: false, 
                    createCase: true 
                  });
                }}
                disabled={loading || isCreating}
                className="px-4 py-1.5 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#1e40af] font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                {isCreating ? (
                    <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Criando...
                    </>
                  ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Criar Novo Caso
                  </>
                  )}
                </button>
              </div>
          </div>
          )}
      </div>
    </div>
  );
}

