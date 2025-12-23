"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, Building2, DollarSign, Car, Users, MapPin } from "lucide-react";

interface EstatisticasBanco {
  banco: string;
  total_contratos: number;
  taxa_juros_media: number;
  valor_medio_divida: number;
  valor_total_divida: number;
  total_veiculos: number;
  total_taxa_abusiva: number;
  percentual_taxa_abusiva: number;
}

interface MapaDivida {
  periodo: {
    ano: number;
    mes: number;
  };
  resumo: {
    total_analises: number;
    taxa_juros_media: number;
    valor_medio_divida: number;
    valor_total_divida: number;
    idade_media: number | null;
  };
  top_bancos_juros: Array<{ banco: string; taxa_media: number }>;
  bancos_mais_veiculos: Array<{ banco: string; total_veiculos: number }>;
  distribuicao_estado: Array<{ estado: string; total: number }>;
  distribuicao_idade: Array<{ faixa_etaria: string; total: number }>;
}

export default function RelatoriosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estatisticasBanco, setEstatisticasBanco] = useState<EstatisticasBanco[]>([]);
  const [mapaDivida, setMapaDivida] = useState<MapaDivida | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState<string>("");
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);

  // URL da API Python - usa Railway em produção, localhost em desenvolvimento
  // No Next.js, variáveis de ambiente públicas precisam ter prefixo NEXT_PUBLIC_
  const apiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 
    (typeof window !== "undefined" && window.location.hostname !== "localhost" 
      ? "https://flex-analise-backend-production.up.railway.app"
      : "http://localhost:8000");

  useEffect(() => {
    carregarDados();
  }, [estadoFiltro]);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);

    try {
      // Carrega estatísticas por banco
      const urlBanco = estadoFiltro
        ? `${apiUrl}/api/relatorios/estatisticas-banco?estado=${estadoFiltro}`
        : `${apiUrl}/api/relatorios/estatisticas-banco`;

      console.log("🔍 Buscando estatísticas por banco:", urlBanco);
      const responseBanco = await fetch(urlBanco);
      console.log("📡 Resposta da API (estatísticas banco):", responseBanco.status, responseBanco.statusText);
      
      if (responseBanco.ok) {
        const data = await responseBanco.json();
        console.log("📊 Estatísticas por banco recebidas:", data);
        setEstatisticasBanco(Array.isArray(data) ? data : []);
      } else {
        const errorData = await responseBanco.json().catch(() => ({}));
        console.error("❌ Erro ao buscar estatísticas por banco:", responseBanco.status, errorData);
        setError(`Erro ${responseBanco.status}: ${errorData.detail || errorData.error || "Erro ao buscar estatísticas"}`);
        setEstatisticasBanco([]); // Garante que é uma lista vazia
      }

      // Carrega mapa da dívida
      const urlMapa = estadoFiltro
        ? `${apiUrl}/api/relatorios/mapa-divida?ano=${ano}&mes=${mes}&estado=${estadoFiltro}`
        : `${apiUrl}/api/relatorios/mapa-divida?ano=${ano}&mes=${mes}`;

      console.log("🔍 Buscando mapa da dívida:", urlMapa);
      const responseMapa = await fetch(urlMapa);
      console.log("📡 Resposta da API (mapa dívida):", responseMapa.status, responseMapa.statusText);
      
      if (responseMapa.ok) {
        const data = await responseMapa.json();
        console.log("📈 Mapa da dívida recebido:", data);
        setMapaDivida(data);
      } else {
        const errorData = await responseMapa.json().catch(() => ({}));
        console.error("❌ Erro ao buscar mapa da dívida:", responseMapa.status, errorData);
        // Não define erro aqui para não sobrescrever outros erros, mas loga para debug
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar relatórios");
      setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(2)}%`;
  };

  const nomeMes = (mes: number) => {
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return meses[mes - 1];
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f1f5f9] text-[#1e293b] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#1e3a8a]/20 border-t-[#1e3a8a] rounded-full animate-spin mx-auto"></div>
          <p className="text-lg font-semibold text-[#1e3a8a]">Carregando relatórios...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f1f5f9] text-[#1e293b]">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 mb-4 px-4 py-2 text-[#1e3a8a] hover:text-[#1e40af] font-medium transition-colors hover:bg-[#1e3a8a]/5 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </button>
            <h1 className="text-4xl font-bold text-[#1e3a8a]">Relatórios e Estatísticas</h1>
            <p className="text-[#64748b] mt-2">Análise de dados de inadimplência e práticas bancárias</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#64748b] mb-2">
                Estado (opcional)
              </label>
              <input
                type="text"
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value.toUpperCase())}
                placeholder="Ex: RS"
                maxLength={2}
                className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#64748b] mb-2">
                Ano
              </label>
              <input
                type="number"
                value={ano}
                onChange={(e) => setAno(parseInt(e.target.value))}
                min={2020}
                max={new Date().getFullYear()}
                className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#64748b] mb-2">
                Mês
              </label>
              <select
                value={mes}
                onChange={(e) => setMes(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-[#cbd5e1] rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {nomeMes(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={carregarDados}
            className="mt-4 px-6 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#1e40af] transition-colors"
          >
            Atualizar Relatórios
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800 font-semibold">Erro</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Mapa da Dívida */}
        {mapaDivida && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-bold text-[#1e3a8a] mb-6 flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              Mapa da Dívida - {nomeMes(mapaDivida.periodo.mes)}/{mapaDivida.periodo.ano}
            </h2>

            {/* Resumo Geral */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Total de Análises</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{mapaDivida.resumo.total_analises}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Taxa Média</span>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {formatarPercentual(mapaDivida.resumo.taxa_juros_media)} a.m.
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">Valor Total</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {formatarMoeda(mapaDivida.resumo.valor_total_divida)}
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">Idade Média</span>
                </div>
                <p className="text-2xl font-bold text-orange-900">
                  {mapaDivida.resumo.idade_media ? `${Math.round(mapaDivida.resumo.idade_media)} anos` : "N/A"}
                </p>
              </div>
            </div>

            {/* Top Bancos por Juros */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#1e293b] mb-4">Top 10 Bancos por Taxa de Juros</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#f1f5f9]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#64748b]">Rank</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#64748b]">Banco</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-[#64748b]">Taxa Média</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mapaDivida.top_bancos_juros.map((item, index) => (
                      <tr key={index} className="border-b border-[#e2e8f0]">
                        <td className="px-4 py-3 text-sm font-medium text-[#1e293b]">#{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-[#64748b]">{item.banco || "Não informado"}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-right text-red-600">
                          {formatarPercentual(item.taxa_media)} a.m.
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bancos que Mais Apreendem Veículos */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#1e293b] mb-4 flex items-center gap-2">
                <Car className="h-5 w-5" />
                Bancos que Mais Apreendem Veículos
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#f1f5f9]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#64748b]">Rank</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#64748b]">Banco</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-[#64748b]">Total de Veículos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mapaDivida.bancos_mais_veiculos.map((item, index) => (
                      <tr key={index} className="border-b border-[#e2e8f0]">
                        <td className="px-4 py-3 text-sm font-medium text-[#1e293b]">#{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-[#64748b]">{item.banco || "Não informado"}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-right text-[#1e3a8a]">
                          {item.total_veiculos}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Distribuição por Estado */}
            {mapaDivida.distribuicao_estado.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#1e293b] mb-4">Distribuição por Estado</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mapaDivida.distribuicao_estado.map((item, index) => (
                    <div key={index} className="bg-[#f1f5f9] rounded-lg p-4">
                      <p className="text-sm font-medium text-[#64748b]">{item.estado}</p>
                      <p className="text-xl font-bold text-[#1e3a8a]">{item.total}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Distribuição por Idade */}
            {mapaDivida.distribuicao_idade.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[#1e293b] mb-4">Distribuição por Faixa Etária</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mapaDivida.distribuicao_idade.map((item, index) => (
                    <div key={index} className="bg-[#f1f5f9] rounded-lg p-4">
                      <p className="text-sm font-medium text-[#64748b]">{item.faixa_etaria}</p>
                      <p className="text-xl font-bold text-[#1e3a8a]">{item.total}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estatísticas por Banco */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-[#1e3a8a] mb-6 flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Estatísticas por Banco
          </h2>
          {estatisticasBanco.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#64748b] mb-2">Nenhum dado disponível ainda.</p>
              <p className="text-sm text-[#94a3b8]">
                Faça upload de contratos para começar a gerar estatísticas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f1f5f9]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#64748b]">Banco</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#64748b]">Total Contratos</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#64748b]">Taxa Média</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#64748b]">Valor Médio</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#64748b]">Valor Total</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#64748b]">Veículos</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#64748b]">% Taxa Abusiva</th>
                  </tr>
                </thead>
                <tbody>
                  {estatisticasBanco.map((banco, index) => (
                    <tr key={index} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
                      <td className="px-4 py-3 text-sm font-medium text-[#1e293b]">{banco.banco || "Não informado"}</td>
                      <td className="px-4 py-3 text-sm text-right text-[#64748b]">{banco.total_contratos}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                        {formatarPercentual(banco.taxa_juros_media)} a.m.
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-[#64748b]">
                        {formatarMoeda(banco.valor_medio_divida)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-[#1e3a8a]">
                        {formatarMoeda(banco.valor_total_divida)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-[#64748b]">{banco.total_veiculos}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-orange-600">
                        {formatarPercentual(banco.percentual_taxa_abusiva)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

