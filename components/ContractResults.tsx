"use client";

import { FileDown, Loader2, RefreshCw, CheckCircle2, Phone, Mail, Calendar, MessageCircle } from "lucide-react";
import jsPDF from "jspdf";
import { useState, useEffect } from "react";
import { UpdateClientDialog } from "./UpdateClientDialog";

interface ContractResultsProps {
  results: any;
}

interface ExistingCase {
  id: string;
  product: string;
  bank_name: string;
  debt_amount: string | null;
  installment_value: string | null;
  installments_total: number | null;
}

export function ContractResults({ results }: ContractResultsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [creationStatus, setCreationStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [existingCases, setExistingCases] = useState<ExistingCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showAllCases, setShowAllCases] = useState(false);
  const CASES_PER_PAGE = 5; // Mostrar 5 casos por vez

  // Função para normalizar casos (garante que todos os campos estejam presentes)
  const normalizeCase = (caseItem: any) => {
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

  // Usar casos existentes que já vêm da resposta do SCU
  useEffect(() => {
    if (results.cliente_no_scu && results.cliente_scu_id) {
      setIsLoadingCases(true);
      // Se os casos já vêm na resposta do SCU, usa eles diretamente
      if (results.existing_cases && Array.isArray(results.existing_cases)) {
        const normalizedCases = results.existing_cases.map(normalizeCase);
        setExistingCases(normalizedCases);
        setIsLoadingCases(false);
      } else {
        // Se não vieram na resposta, busca separadamente
        const fetchExistingCases = async () => {
          try {
            const response = await fetch(`/api/scu/cases/client/${results.cliente_scu_id}`);
            if (response.ok) {
              const data = await response.json();
              const cases = data.cases || [];
              const normalizedCases = cases.map(normalizeCase);
              setExistingCases(normalizedCases);
            }
          } catch (error) {
            console.error("Erro ao buscar casos existentes:", error);
          } finally {
            setIsLoadingCases(false);
          }
        };
        fetchExistingCases();
      }
    } else {
      setExistingCases([]);
      setIsLoadingCases(false);
    }
  }, [results.cliente_no_scu, results.cliente_scu_id, results.existing_cases]);

  // Função para mapear tipo de contrato para produto do SCU
  const mapTipoContratoToProduct = (tipoContrato: string | null | undefined, hasVehicleInfo: boolean): string => {
    // Se tem informações de veículo, é financiamento veicular
    if (hasVehicleInfo) {
      return "Financiamento veicular";
    }
    
    if (!tipoContrato) return "Empréstimo";
    
    const tipoLower = tipoContrato.toLowerCase();
    
    // Financiamento veicular (várias variações)
    if (tipoLower.includes("financiamento") && (tipoLower.includes("veículo") || tipoLower.includes("veiculo") || tipoLower.includes("veicular") || tipoLower.includes("veiculo"))) {
      return "Financiamento veicular";
    }
    if (tipoLower.includes("financiamento de veículo") || tipoLower.includes("financiamento veicular")) {
      return "Financiamento veicular";
    }
    
    // Cartão de crédito
    if (tipoLower.includes("cartão") || tipoLower.includes("cartao") || tipoLower.includes("crédito") || tipoLower.includes("credito")) {
      if (tipoLower.includes("cartão") || tipoLower.includes("cartao")) {
        return "Cartão de Crédito";
      }
    }
    
    // Empréstimo consignado
    if (tipoLower.includes("consignado")) {
      return "Empréstimo consignado";
    }
    
    // Empréstimo não consignado
    if (tipoLower.includes("não consignado") || tipoLower.includes("nao consignado") || tipoLower.includes("não-consignado") || tipoLower.includes("nao-consignado")) {
      return "Empréstimo não consignado";
    }
    
    // Empréstimo genérico
    if (tipoLower.includes("empréstimo") || tipoLower.includes("emprestimo")) {
      return "Empréstimo";
    }
    
    return "Empréstimo"; // Default
  };

  // Função para criar cliente e caso
  const handleCreateClient = async () => {
    if (!results.cpf_cnpj || !results.nome_cliente) {
      setCreationStatus({ type: 'error', message: 'Dados insuficientes para criar cliente' });
      return;
    }

    const cpfLimpo = results.cpf_cnpj.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      setCreationStatus({ type: 'error', message: 'CPF inválido' });
      return;
    }

    setIsCreating(true);
    setCreationStatus({ type: null, message: '' });

    try {
      // 1. Criar cliente
      const clientData = {
        cpf: cpfLimpo,
        full_name: results.nome_cliente,
        email: `cliente.${cpfLimpo}@temp.com`, // Email temporário, pode ser atualizado depois
        phone: "(00) 00000-0000", // Telefone temporário, pode ser atualizado depois
        birth_date: new Date("1990-01-01").toISOString(), // Data temporária, pode ser atualizada depois
      };

      console.log("Criando cliente:", clientData);
      const clientResponse = await fetch("/api/scu/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientData),
      });

      if (!clientResponse.ok) {
        const errorData = await clientResponse.json();
        throw new Error(errorData.error || "Erro ao criar cliente");
      }

      const clientResult = await clientResponse.json();
      const clientId = clientResult.client?.id;

      if (!clientId) {
        throw new Error("ID do cliente não retornado");
      }

      console.log("Cliente criado com sucesso, ID:", clientId);

      // 2. Criar caso
      const hasVehicleInfo = !!(results.veiculo_marca || results.veiculo_modelo || results.veiculo_ano || results.veiculo_cor || results.veiculo_placa);
      const product = mapTipoContratoToProduct(results.tipo_contrato, hasVehicleInfo);
      const caseData = {
        clientId: clientId,
        product: product,
        bank_name: "Não informado", // Pode ser extraído do contrato se disponível
        installments_total: results.quantidade_parcelas || null,
        installments_value: results.valor_parcela ? String(results.valor_parcela) : null,
        debt_amount: results.valor_divida ? String(results.valor_divida) : null,
        paid_installments: null,
        paid_debt_amount: null,
      };

      console.log("Criando caso:", caseData);
      const caseResponse = await fetch("/api/scu/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(caseData),
      });

      if (!caseResponse.ok) {
        const errorData = await caseResponse.json();
        throw new Error(errorData.error || "Erro ao criar caso");
      }

      const caseResult = await caseResponse.json();
      console.log("Caso criado com sucesso:", caseResult);

      // Atualizar o estado para indicar que o cliente agora existe no SCU
      setCreationStatus({ 
        type: 'success', 
        message: 'Cliente e caso criados com sucesso! Redirecionando...' 
      });
      
      // Abrir a página do cliente no SCU em nova aba após 1.5 segundos
      setTimeout(() => {
        window.open(`https://cadastro-unico.grupoflex.com.br/clientes/${clientId}`, '_blank');
      }, 1500);

    } catch (error: any) {
      console.error("Erro ao criar cliente/caso:", error);
      setCreationStatus({ 
        type: 'error', 
        message: error.message || 'Erro ao criar cliente e caso no SCU' 
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Função para criar apenas o caso (quando cliente já existe)
  const handleCreateCase = async () => {
    if (!results.cliente_scu_id) {
      setCreationStatus({ type: 'error', message: 'ID do cliente não encontrado' });
      return;
    }

    setIsCreating(true);
    setCreationStatus({ type: null, message: '' });

    try {
      const hasVehicleInfo = !!(results.veiculo_marca || results.veiculo_modelo || results.veiculo_ano || results.veiculo_cor || results.veiculo_placa);
      const product = mapTipoContratoToProduct(results.tipo_contrato, hasVehicleInfo);
      const caseData = {
        clientId: results.cliente_scu_id,
        product: product,
        bank_name: "Não informado",
        installments_total: results.quantidade_parcelas || null,
        installments_value: results.valor_parcela ? String(results.valor_parcela) : null,
        debt_amount: results.valor_divida ? String(results.valor_divida) : null,
        paid_installments: null,
        paid_debt_amount: null,
      };

      const caseResponse = await fetch("/api/scu/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(caseData),
      });

      if (!caseResponse.ok) {
        const errorData = await caseResponse.json();
        throw new Error(errorData.error || "Erro ao criar caso");
      }

      const caseResult = await caseResponse.json();
      console.log("Caso criado com sucesso:", caseResult);

      // Recarregar casos existentes
      const response = await fetch(`/api/scu/cases/client/${results.cliente_scu_id}`);
      if (response.ok) {
        const data = await response.json();
        const cases = data.cases || [];
        const normalizedCases = cases.map(normalizeCase);
        setExistingCases(normalizedCases);
      }

      setCreationStatus({ 
        type: 'success', 
        message: 'Caso criado com sucesso!' 
      });
      
      setTimeout(() => {
        window.open(`https://cadastro-unico.grupoflex.com.br/clientes/${results.cliente_scu_id}`, '_blank');
      }, 1500);

    } catch (error: any) {
      console.error("Erro ao criar caso:", error);
      setCreationStatus({ 
        type: 'error', 
        message: error.message || 'Erro ao criar caso no SCU' 
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Função para atualizar um caso existente
  const handleUpdateCase = async (caseId: string) => {
    setIsUpdating(caseId);
    setCreationStatus({ type: null, message: '' });

    try {
      const hasVehicleInfo = !!(results.veiculo_marca || results.veiculo_modelo || results.veiculo_ano || results.veiculo_cor || results.veiculo_placa);
      const product = mapTipoContratoToProduct(results.tipo_contrato, hasVehicleInfo);
      const updateData = {
        product: product,
        bank_name: "Não informado",
        installments_total: results.quantidade_parcelas || null,
        installments_value: results.valor_parcela ? String(results.valor_parcela) : null,
        debt_amount: results.valor_divida ? String(results.valor_divida) : null,
      };

      const response = await fetch(`/api/scu/cases/${caseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar caso");
      }

      const caseResult = await response.json();
      console.log("Caso atualizado com sucesso:", caseResult);

      // Recarregar casos existentes para mostrar dados atualizados
      const casesResponse = await fetch(`/api/scu/cases/client/${results.cliente_scu_id}`);
      if (casesResponse.ok) {
        const data = await casesResponse.json();
        const cases = data.cases || [];
        const normalizedCases = cases.map(normalizeCase);
        setExistingCases(normalizedCases);
      }

      setCreationStatus({ 
        type: 'success', 
        message: 'Caso atualizado com sucesso!' 
      });
      
      setTimeout(() => {
        window.open(`https://cadastro-unico.grupoflex.com.br/clientes/${results.cliente_scu_id}`, '_blank');
      }, 1500);

    } catch (error: any) {
      console.error("Erro ao atualizar caso:", error);
      setCreationStatus({ 
        type: 'error', 
        message: error.message || 'Erro ao atualizar caso no SCU' 
      });
    } finally {
      setIsUpdating(null);
    }
  };

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

  const formatCurrency = (value: number | null | undefined | string) => {
    if (!value) return "N/A";
    // Se for string, tenta converter primeiro
    if (typeof value === 'string') {
      const numValue = parseFormattedValue(value);
      if (numValue === null) return value; // Se não conseguir converter, retorna o valor original
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(numValue);
    }
    const numValue = value;
    if (isNaN(numValue)) return "N/A";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR");
    } catch {
      return dateStr;
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;

    // Título
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Análise de Contrato", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Grupo Flex
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Grupo Flex - Flex Análise", pageWidth / 2, yPos, { align: "center" });
    yPos += 20;

    // Linha divisória
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Dados do Cliente
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Dados do Cliente", margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${results.nome_cliente || "N/A"}`, margin, yPos);
    yPos += 7;

    if (results.cpf_cnpj) {
      doc.text(`CPF/CNPJ: ${results.cpf_cnpj}`, margin, yPos);
      yPos += 7;
      
      // Status SCU
      if (results.cliente_no_scu !== undefined && results.cliente_no_scu !== null) {
        if (results.cliente_no_scu) {
          doc.setTextColor(16, 185, 129); // Verde
          doc.text("✓ Cliente cadastrado no SCU", margin, yPos);
        } else {
          doc.setTextColor(239, 68, 68); // Vermelho
          doc.text("✗ Cliente não encontrado no SCU", margin, yPos);
        }
        doc.setTextColor(0, 0, 0); // Volta para preto
        yPos += 7;
      }
    }

    if (results.numero_contrato) {
      doc.text(`Nº Contrato: ${results.numero_contrato}`, margin, yPos);
      yPos += 7;
    }

    if (results.tipo_contrato) {
      doc.text(`Tipo: ${results.tipo_contrato}`, margin, yPos);
      yPos += 7;
    }

    yPos += 5;

    // Informações do Veículo
    if (results.veiculo_marca || results.veiculo_modelo || results.veiculo_ano || results.veiculo_cor) {
      if (yPos > 250) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Informações do Veículo", margin, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      if (results.veiculo_marca) {
        doc.text(`Marca: ${results.veiculo_marca}`, margin, yPos);
        yPos += 7;
      }

      if (results.veiculo_modelo) {
        doc.text(`Modelo: ${results.veiculo_modelo}`, margin, yPos);
        yPos += 7;
      }

      if (results.veiculo_ano) {
        doc.text(`Ano: ${results.veiculo_ano}`, margin, yPos);
        yPos += 7;
      }

      if (results.veiculo_cor) {
        doc.text(`Cor: ${results.veiculo_cor}`, margin, yPos);
        yPos += 7;
      }

      if (results.veiculo_placa) {
        doc.text(`Placa: ${results.veiculo_placa}`, margin, yPos);
        yPos += 7;
      }

      yPos += 5;
    }

    // Valores
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Valores Financeiros", margin, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    if (results.valor_divida) {
      doc.text(`Valor da Dívida: ${formatCurrency(results.valor_divida)}`, margin, yPos);
      yPos += 7;
    }

    doc.text(`Quantidade de Parcelas: ${results.quantidade_parcelas || 0}`, margin, yPos);
    yPos += 7;

    if (results.valor_parcela) {
      doc.text(`Valor da Parcela: ${formatCurrency(results.valor_parcela)}`, margin, yPos);
      yPos += 7;
    }

    if (results.taxa_juros) {
      doc.text(`Taxa de Juros: ${results.taxa_juros}%`, margin, yPos);
      yPos += 7;
    }

    yPos += 5;

    // Datas
    if (results.data_vencimento_primeira || results.data_vencimento_ultima) {
      if (yPos > 250) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Datas de Vencimento", margin, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      if (results.data_vencimento_primeira) {
        doc.text(`Primeira Parcela: ${formatDate(results.data_vencimento_primeira)}`, margin, yPos);
        yPos += 7;
      }

      if (results.data_vencimento_ultima) {
        doc.text(`Última Parcela: ${formatDate(results.data_vencimento_ultima)}`, margin, yPos);
        yPos += 7;
      }

      yPos += 5;
    }

    // Observações
    if (results.observacoes) {
      if (yPos > 220) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Observações e Análise", margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const splitObservacoes = doc.splitTextToSize(results.observacoes, pageWidth - 2 * margin);
      doc.text(splitObservacoes, margin, yPos);
    }

    // Data de geração
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR") + " " + now.toLocaleTimeString("pt-BR");
    doc.setFontSize(8);
    doc.text(`Gerado em: ${dateStr}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

    // Salvar PDF
    const fileName = `contrato_${results.numero_contrato || results.nome_cliente?.replace(/\s/g, "_") || "analise"}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="mt-16 animate-fade-in">
      {/* Header flutuante */}
      <div className="sticky top-6 z-10 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-lg rounded-2xl p-5 shadow-lg border-2 border-[#cbd5e1]">
          <div>
            <h2 className="text-2xl font-bold text-[#1e3a8a]">Análise do Contrato</h2>
            <p className="text-xs text-[#64748b] mt-0.5">Informações extraídas do documento</p>
          </div>
          <button
            onClick={generatePDF}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <FileDown className="h-4 w-4" />
            Baixar PDF
          </button>
        </div>
      </div>

      {/* Layout assimétrico e inovador */}
      <div className="space-y-8">
        {/* Seção superior: Dados principais em grid assimétrico */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card grande - Dados do Cliente */}
          <div className="lg:col-span-2 relative overflow-hidden bg-white rounded-2xl p-8 shadow-xl border-2 border-[#cbd5e1]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#1e3a8a]/5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-8 bg-[#1e3a8a] rounded-full"></div>
                <h3 className="text-lg font-bold text-[#1e3a8a]">Dados do Cliente</h3>
              </div>
              <div className="space-y-6">
                {/* Informações do Cliente */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Nome Completo</span>
                    <p className="text-lg font-semibold text-[#1e293b]">{results.nome_cliente || "Não informado"}</p>
                  </div>
                  {results.cpf_cnpj && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide">CPF/CNPJ</span>
                      <p className="text-lg font-semibold text-[#1e293b]">{results.cpf_cnpj}</p>
                    </div>
                  )}
                  {/* Data de Nascimento, Email e Telefone - do SCU se disponível */}
                  {results.cliente_no_scu && results.cliente_scu_data && (
                    <>
                      {results.cliente_scu_data.birth_date && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Data de Nascimento
                          </span>
                          <p className="text-lg font-semibold text-[#1e293b]">
                            {new Date(results.cliente_scu_data.birth_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                      {results.cliente_scu_data.email && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Email
                          </span>
                          <p className="text-lg font-semibold text-[#1e293b]">{results.cliente_scu_data.email}</p>
                        </div>
                      )}
                      {results.cliente_scu_data.phone && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Telefone
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-lg font-semibold text-[#1e293b]">{results.cliente_scu_data.phone}</p>
                            <a
                              href={`https://wa.me/55${results.cliente_scu_data.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              <MessageCircle className="h-3 w-3" />
                              WhatsApp
                            </a>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {results.numero_contrato && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Nº Contrato</span>
                      <p className="text-lg font-semibold text-[#1e293b]">{results.numero_contrato}</p>
                    </div>
                  )}
                  {results.tipo_contrato && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Tipo</span>
                      <p className="text-lg font-semibold text-[#1e293b]">{results.tipo_contrato}</p>
                    </div>
                  )}
                </div>

                {/* Status e Botões - Embaixo das informações */}
                {results.cliente_no_scu !== undefined && results.cliente_no_scu !== null && (
                  <div className="pt-4 border-t border-[#cbd5e1]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {results.cliente_no_scu ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#10b981]/10 text-[#10b981] text-xs font-semibold rounded-lg border border-[#10b981]/20">
                            <span className="w-2 h-2 bg-[#10b981] rounded-full"></span>
                            Cliente cadastrado no SCU
                          </span>
                          {results.cliente_scu_id && (
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => {
                                  window.open(`https://cadastro-unico.grupoflex.com.br/clientes/${results.cliente_scu_id}`, '_blank');
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                              >
                                Ver Cliente no SCU
                              </button>
                              <button
                                onClick={() => setIsUpdateDialogOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                              >
                                Atualizar Dados
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ef4444]/10 text-[#ef4444] text-xs font-semibold rounded-lg border border-[#ef4444]/20">
                            <span className="w-2 h-2 bg-[#ef4444] rounded-full"></span>
                            Cliente não encontrado no SCU
                          </span>
                          <button
                            onClick={handleCreateClient}
                            disabled={isCreating}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] disabled:bg-[#64748b] text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                          >
                            {isCreating ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Criando...
                              </>
                            ) : (
                              "Criar Cliente"
                            )}
                          </button>
                        </>
                      )}
                    </div>
                    {!results.cliente_no_scu && creationStatus.type && (
                      <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium ${
                        creationStatus.type === 'success' 
                          ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' 
                          : 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20'
                      }`}>
                        {creationStatus.message}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Cards de Valores Financeiros - Valor da Parcela, Valor Dívida e Parcelas */}
        <div className="grid md:grid-cols-3 gap-6">
          {results.valor_parcela && (
            <div className="relative overflow-hidden bg-[#00C853] rounded-2xl p-6 shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
              <div className="relative">
                <span className="text-xs font-medium text-white/90 block mb-2">Valor da Parcela</span>
                <p className="text-2xl font-bold text-white">{formatCurrency(results.valor_parcela)}</p>
              </div>
            </div>
          )}
          {results.valor_divida && (
            <div className="relative overflow-hidden bg-[#FF6B6B] rounded-2xl p-6 shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
              <div className="relative">
                <span className="text-xs font-medium text-white/90 block mb-2">Valor Dívida</span>
                <p className="text-2xl font-bold text-white">{formatCurrency(results.valor_divida)}</p>
              </div>
            </div>
          )}
          {results.quantidade_parcelas && (
            <div className="relative overflow-hidden bg-[#1e3a8a] rounded-2xl p-6 shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
              <div className="relative">
                <span className="text-xs font-medium text-white/90 block mb-2">Parcelas</span>
                <p className="text-2xl font-bold text-white">{results.quantidade_parcelas}</p>
              </div>
            </div>
          )}
        </div>

        {/* Seção de Comparação: Contrato vs Casos SCU */}
        {results.cliente_no_scu && results.cliente_scu_id && (
          <div className="relative overflow-hidden bg-white rounded-2xl p-8 shadow-xl border-2 border-[#cbd5e1]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#1e3a8a]/5 rounded-full -mr-16 -mt-16" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-8 bg-[#1e3a8a] rounded-full"></div>
                <h3 className="text-lg font-bold text-[#1e3a8a]">Comparação: Dados do Caso/Produto</h3>
              </div>

              {isLoadingCases && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#1e3a8a]" />
                  <span className="ml-2 text-sm text-[#64748b]">Carregando casos existentes...</span>
                </div>
              )}
              {!isLoadingCases && existingCases.length === 0 && (
                <div className="bg-[#fef3c7] border-2 border-[#fbbf24] rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1">
                      <p className="font-semibold text-[#92400e] mb-2">Nenhum caso encontrado no SCU.</p>
                      <p className="text-sm text-[#78350f] mb-4">Você pode criar um novo caso com estes dados.</p>
                      <button
                        onClick={handleCreateCase}
                        disabled={isCreating}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] disabled:bg-[#64748b] text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          "Criar Novo Caso"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {!isLoadingCases && existingCases.length > 0 && (
                <div className="space-y-6">
                  {/* Contrato Lido pela IA */}
                  <div className="bg-gradient-to-br from-[#1e3a8a]/10 to-[#1e40af]/5 rounded-xl p-6 border-2 border-[#1e3a8a]/20">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-[#1e3a8a] rounded-full" />
                      <h4 className="font-bold text-[#1e3a8a]">Contrato Lido pela IA</h4>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-xs font-medium text-[#64748b] block mb-1">Produto:</span>
                        <p className="font-semibold text-[#1e293b]">
                          {(() => {
                            const hasVehicleInfo = !!(results.veiculo_marca || results.veiculo_modelo || results.veiculo_ano || results.veiculo_cor || results.veiculo_placa);
                            return mapTipoContratoToProduct(results.tipo_contrato, hasVehicleInfo);
                          })()}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-[#64748b] block mb-1">Parcelas:</span>
                        <p className="font-semibold text-[#1e293b]">{results.quantidade_parcelas || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-[#64748b] block mb-1">Valor Parcela:</span>
                        <p className="font-semibold text-[#1e293b]">{formatCurrency(results.valor_parcela)}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-[#64748b] block mb-1">Valor Dívida:</span>
                        <p className="font-semibold text-[#1e293b]">{formatCurrency(results.valor_divida)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Casos Existentes */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-[#1e293b] text-sm uppercase tracking-wide">
                      Casos Existentes no SCU ({existingCases.length})
                    </h4>
                    {(showAllCases ? existingCases : existingCases.slice(0, CASES_PER_PAGE)).map((existingCase, index) => {
                      const hasVehicleInfo = !!(results.veiculo_marca || results.veiculo_modelo || results.veiculo_ano || results.veiculo_cor || results.veiculo_placa);
                      const contractProduct = mapTipoContratoToProduct(results.tipo_contrato, hasVehicleInfo);
                      // Banco pode vir como banco, banco_credor, ou não estar no contrato
                      const contractBank = (results.banco || results.banco_credor || "").trim();
                      const isSimilarProduct = existingCase.product.toLowerCase() === contractProduct.toLowerCase();
                      
                      // Se o contrato tem banco, compara banco também. Se não tem, só compara produto
                      const hasContractBank = contractBank && contractBank.toLowerCase() !== "não informado";
                      const isSimilarBank = hasContractBank 
                        ? (existingCase.bank_name && 
                           existingCase.bank_name.toLowerCase() !== "n/c" && 
                           existingCase.bank_name.toLowerCase() !== "não informado" &&
                           existingCase.bank_name.toLowerCase() === contractBank.toLowerCase())
                        : true; // Se não tem banco no contrato, considera similar (só valida produto)
                      
                      const canUpdate = isSimilarProduct && isSimilarBank;
                      
                      return (
                        <div 
                          key={existingCase.id} 
                          className={`bg-white rounded-xl p-6 border-2 ${
                            canUpdate 
                              ? 'border-[#10b981]/30 bg-[#10b981]/5' 
                              : 'border-[#cbd5e1]'
                          }`}
                        >
                          <div className="grid md:grid-cols-5 gap-4 items-center">
                            <div>
                              <span className="text-xs font-medium text-[#64748b] block mb-1">Nome/Produto:</span>
                              <p className="font-semibold text-[#1e293b]">{existingCase.product || "N/A"}</p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-[#64748b] block mb-1">Banco:</span>
                              <p className="font-semibold text-[#1e293b]">{existingCase.bank_name || "N/A"}</p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-[#64748b] block mb-1">Valor:</span>
                              <p className="font-semibold text-[#1e293b]">{formatCurrency(existingCase.debt_amount)}</p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-[#64748b] block mb-1">Parcelas:</span>
                              <p className="font-semibold text-[#1e293b]">{existingCase.installments_total || "N/A"}</p>
                            </div>
                            <div className="flex gap-2 items-center justify-end">
                              {canUpdate && (
                                <>
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#10b981]/10 text-[#10b981] text-xs font-semibold rounded border border-[#10b981]/20">
                                    Produto Similar
                                  </span>
                                  <button
                                    onClick={() => handleUpdateCase(existingCase.id)}
                                    disabled={isUpdating === existingCase.id}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#10b981] hover:bg-[#059669] disabled:bg-[#64748b] text-white text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                                  >
                                    {isUpdating === existingCase.id ? (
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
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Botão Ver Mais */}
                    {existingCases.length > CASES_PER_PAGE && (
                      <div className="flex justify-center pt-2">
                        <button
                          onClick={() => setShowAllCases(!showAllCases)}
                          className="px-4 py-2 text-sm font-medium text-[#1e3a8a] hover:text-[#1e40af] hover:bg-[#1e3a8a]/5 rounded-lg transition-colors"
                        >
                          {showAllCases ? (
                            <>Ver menos ({existingCases.length - CASES_PER_PAGE} casos ocultos)</>
                          ) : (
                            <>Ver mais ({existingCases.length - CASES_PER_PAGE} casos adicionais)</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Opções de Ação */}
                  <div className="flex justify-end pt-4 border-t border-[#cbd5e1]">
                    <button
                      onClick={handleCreateCase}
                      disabled={isCreating}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] disabled:bg-[#64748b] text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Criar Novo Caso
                        </>
                      )}
                    </button>
                  </div>

                  {creationStatus.type && (
                    <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
                      creationStatus.type === 'success' 
                        ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' 
                        : 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20'
                    }`}>
                      {creationStatus.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card de Informações do Veículo */}
        {(results.veiculo_marca || results.veiculo_modelo || results.veiculo_ano || results.veiculo_cor) && (
          <div className="relative overflow-hidden bg-white rounded-2xl p-8 shadow-xl border-2 border-[#cbd5e1]">
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#00C853]/5 rounded-full -ml-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-8 bg-[#00C853] rounded-full"></div>
                <h3 className="text-lg font-bold text-[#1e3a8a]">Informações do Veículo</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {results.veiculo_marca && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Marca</span>
                    <p className="text-lg font-semibold text-[#1e293b]">{results.veiculo_marca}</p>
                  </div>
                )}
                {results.veiculo_modelo && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Modelo</span>
                    <p className="text-lg font-semibold text-[#1e293b]">{results.veiculo_modelo}</p>
                  </div>
                )}
                {results.veiculo_ano && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Ano</span>
                    <p className="text-lg font-semibold text-[#1e293b]">{results.veiculo_ano}</p>
                  </div>
                )}
                {results.veiculo_cor && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Cor</span>
                    <p className="text-lg font-semibold text-[#1e293b]">{results.veiculo_cor}</p>
                  </div>
                )}
                {results.veiculo_placa && (
                  <div className="space-y-1 sm:col-span-2 lg:col-span-4">
                    <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide">Placa</span>
                    <p className="text-lg font-semibold text-[#1e293b]">{results.veiculo_placa}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Taxa de Juros */}
        {results.taxa_juros && (
          <div className="relative overflow-hidden bg-[#FF8C42] rounded-2xl p-6 shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
            <div className="relative">
              <span className="text-xs font-medium text-white/90 block mb-2">Taxa de Juros</span>
              <p className="text-2xl font-bold text-white">{results.taxa_juros}%</p>
            </div>
          </div>
        )}

        {/* Datas em formato timeline */}
        {(results.data_vencimento_primeira || results.data_vencimento_ultima) && (
          <div className="relative bg-white rounded-2xl p-8 shadow-lg border-2 border-[#cbd5e1]">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-8 bg-[#1e3a8a] rounded-full"></div>
              <h3 className="text-lg font-bold text-[#1e3a8a]">Cronograma de Pagamento</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-8 relative">
              {/* Linha conectora */}
              <div className="hidden md:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-gradient-to-r from-transparent via-[#1e3a8a]/30 to-transparent"></div>
              
              {results.data_vencimento_primeira && (
                <div className="relative">
                  <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-[#1e3a8a] rounded-full border-2 border-white"></div>
                  <span className="text-xs font-medium text-[#64748b] block mb-2">Primeira Parcela</span>
                  <p className="text-xl font-bold text-[#1e293b]">{formatDate(results.data_vencimento_primeira)}</p>
                </div>
              )}
              {results.data_vencimento_ultima && (
                <div className="relative">
                  <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-[#1e3a8a] rounded-full border-2 border-white"></div>
                  <span className="text-xs font-medium text-[#64748b] block mb-2">Última Parcela</span>
                  <p className="text-xl font-bold text-[#1e293b]">{formatDate(results.data_vencimento_ultima)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Observações em formato de artigo */}
        {results.observacoes && (
          <div className="relative overflow-hidden bg-white rounded-2xl p-8 shadow-lg border-2 border-[#cbd5e1]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF6B6B] via-[#FF8C42] via-[#1e3a8a] to-[#00C853]"></div>
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-8 bg-[#1e3a8a] rounded-full"></div>
                <h3 className="text-lg font-bold text-[#1e3a8a]">Análise Detalhada</h3>
              </div>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#334155] space-y-4">
                  {results.observacoes.split('\n\n').map((paragraph: string, index: number) => (
                    <p key={index} className="mb-4 last:mb-0">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialog de Atualização */}
      {results.cliente_scu_id && (
        <UpdateClientDialog
          isOpen={isUpdateDialogOpen}
          onClose={() => setIsUpdateDialogOpen(false)}
          clientId={results.cliente_scu_id}
          contractData={results}
        />
      )}
    </div>
  );
}


