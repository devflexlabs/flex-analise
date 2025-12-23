"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Calendar, Building2, User, CreditCard } from "lucide-react";

interface Contrato {
  id: number;
  data_analise: string;
  nome_cliente: string;
  cpf_cnpj: string | null;
  numero_contrato: string | null;
  tipo_contrato: string | null;
  banco_credor: string | null;
  valor_divida: number | null;
  valor_parcela: number | null;
  quantidade_parcelas: number | null;
  taxa_juros: number | null;
  estado: string | null;
  cidade: string | null;
  tem_taxa_abusiva: boolean;
  tem_cet_alto: boolean;
  tem_clausulas_abusivas: boolean;
}

export default function ContratosPage() {
  const router = useRouter();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"nome" | "cpf">("nome");

  // URL da API - usa proxy do Next.js
  const apiUrl = "/api/relatorios";

  useEffect(() => {
    carregarContratos();
  }, []);

  const carregarContratos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}?tipo=analises&limite=1000`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || "Erro ao carregar contratos");
      }

      const data = await response.json();
      setContratos(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar contratos:", err);
      setError(err.message || "Erro ao carregar contratos");
    } finally {
      setLoading(false);
    }
  };

  const filtrarContratos = () => {
    if (!searchTerm.trim()) {
      return contratos;
    }

    const termo = searchTerm.toLowerCase().trim();

    if (searchType === "nome") {
      return contratos.filter((c) =>
        c.nome_cliente?.toLowerCase().includes(termo)
      );
    } else {
      // Busca por CPF/CNPJ (remove formatação)
      const termoLimpo = termo.replace(/\D/g, "");
      return contratos.filter((c) => {
        if (!c.cpf_cnpj) return false;
        const cpfLimpo = c.cpf_cnpj.replace(/\D/g, "");
        return cpfLimpo.includes(termoLimpo);
      });
    }
  };

  const contratosFiltrados = filtrarContratos();

  const formatarCPF = (cpf: string | null) => {
    if (!cpf) return "N/A";
    const cpfLimpo = cpf.replace(/\D/g, "");
    if (cpfLimpo.length === 11) {
      return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return cpf;
  };

  const formatarMoeda = (valor: number | null) => {
    if (!valor) return "N/A";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: string | null) => {
    if (!data) return "N/A";
    try {
      return new Date(data).toLocaleDateString("pt-BR");
    } catch {
      return data;
    }
  };

  const handleContratoClick = (contrato: Contrato) => {
    // Converte o contrato para o formato esperado pela página de resultados
    const contratoFormatado = {
      nome_cliente: contrato.nome_cliente,
      cpf_cnpj: contrato.cpf_cnpj,
      numero_contrato: contrato.numero_contrato,
      tipo_contrato: contrato.tipo_contrato,
      banco_credor: contrato.banco_credor,
      valor_divida: contrato.valor_divida,
      valor_parcela: contrato.valor_parcela,
      quantidade_parcelas: contrato.quantidade_parcelas,
      taxa_juros: contrato.taxa_juros,
      data_vencimento_primeira: null,
      data_vencimento_ultima: null,
      veiculo_marca: null,
      veiculo_modelo: null,
      veiculo_ano: null,
      veiculo_cor: null,
      veiculo_placa: null,
      veiculo_renavam: null,
      observacoes: null,
      recalculo_bacen: null,
      estado: contrato.estado,
      cidade: contrato.cidade,
      idade_cliente: null,
      tem_taxa_abusiva: contrato.tem_taxa_abusiva,
      tem_cet_alto: contrato.tem_cet_alto,
      tem_clausulas_abusivas: contrato.tem_clausulas_abusivas,
      analise_id: contrato.id,
    };

    // Salva no sessionStorage para a página de resultados
    if (typeof window !== "undefined") {
      sessionStorage.setItem("contractResults", JSON.stringify(contratoFormatado));
    }

    // Navega para a página de resultados
    router.push("/resultados?fromStorage=true");
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1e293b] mb-2">
            Contratos no Banco de Dados
          </h1>
          <p className="text-[#64748b]">
            Visualize e busque contratos armazenados no sistema
          </p>
        </div>

        {/* Barra de Busca */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b] h-5 w-5" />
                <input
                  type="text"
                  placeholder={
                    searchType === "nome"
                      ? "Buscar por nome do cliente..."
                      : "Buscar por CPF/CNPJ..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSearchType("nome")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  searchType === "nome"
                    ? "bg-[#1e3a8a] text-white"
                    : "bg-[#e2e8f0] text-[#64748b] hover:bg-[#cbd5e1]"
                }`}
              >
                <User className="inline h-4 w-4 mr-2" />
                Nome
              </button>
              <button
                onClick={() => setSearchType("cpf")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  searchType === "cpf"
                    ? "bg-[#1e3a8a] text-white"
                    : "bg-[#e2e8f0] text-[#64748b] hover:bg-[#cbd5e1]"
                }`}
              >
                <CreditCard className="inline h-4 w-4 mr-2" />
                CPF/CNPJ
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
            <p className="mt-4 text-[#64748b]">Carregando contratos...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Lista de Contratos */}
        {!loading && !error && (
          <>
            <div className="mb-4 text-[#64748b]">
              {contratosFiltrados.length === 0 ? (
                <p>Nenhum contrato encontrado</p>
              ) : (
                <p>
                  {contratosFiltrados.length} contrato
                  {contratosFiltrados.length !== 1 ? "s" : ""} encontrado
                  {searchTerm ? " para sua busca" : ""}
                </p>
              )}
            </div>

            {contratosFiltrados.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <FileText className="h-16 w-16 text-[#cbd5e1] mx-auto mb-4" />
                <p className="text-[#64748b] text-lg">
                  {searchTerm
                    ? "Nenhum contrato encontrado com os critérios de busca"
                    : "Nenhum contrato disponível no banco de dados"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {contratosFiltrados.map((contrato) => (
                  <div
                    key={contrato.id}
                    onClick={() => handleContratoClick(contrato)}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border border-[#e2e8f0] hover:border-[#1e3a8a]"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-[#1e293b]">
                            {contrato.nome_cliente}
                          </h3>
                          {(contrato.tem_taxa_abusiva ||
                            contrato.tem_cet_alto ||
                            contrato.tem_clausulas_abusivas) && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                              Irregularidades
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-[#64748b]">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>
                              <strong>CPF/CNPJ:</strong> {formatarCPF(contrato.cpf_cnpj)}
                            </span>
                          </div>
                          {contrato.numero_contrato && (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>
                                <strong>Contrato:</strong> {contrato.numero_contrato}
                              </span>
                            </div>
                          )}
                          {contrato.banco_credor && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <span>
                                <strong>Banco:</strong> {contrato.banco_credor}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              <strong>Data:</strong> {formatarData(contrato.data_analise)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          {contrato.valor_divida && (
                            <div>
                              <span className="text-[#64748b]">Valor da Dívida: </span>
                              <span className="font-semibold text-[#1e293b]">
                                {formatarMoeda(contrato.valor_divida)}
                              </span>
                            </div>
                          )}
                          {contrato.taxa_juros !== null && (
                            <div>
                              <span className="text-[#64748b]">Taxa de Juros: </span>
                              <span className="font-semibold text-[#1e293b]">
                                {contrato.taxa_juros.toFixed(2)}%
                              </span>
                            </div>
                          )}
                          {contrato.estado && (
                            <div>
                              <span className="text-[#64748b]">Localização: </span>
                              <span className="font-semibold text-[#1e293b]">
                                {contrato.estado}
                                {contrato.cidade ? ` - ${contrato.cidade}` : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center">
                        <button className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#1e40af] transition-colors font-medium">
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

