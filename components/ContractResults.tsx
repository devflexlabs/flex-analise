"use client";

import { FileDown } from "lucide-react";
import jsPDF from "jspdf";

interface ContractResultsProps {
  results: any;
}

export function ContractResults({ results }: ContractResultsProps) {
  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
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
            </div>
          </div>

          {/* Card vertical - Valores destacados */}
          <div className="space-y-4">
            {results.valor_divida && (
              <div className="bg-[#FF6B6B] rounded-2xl p-6 shadow-lg">
                <span className="text-xs font-medium text-white/90 block mb-2">Valor Total</span>
                <p className="text-3xl font-bold text-white">{formatCurrency(results.valor_divida)}</p>
              </div>
            )}
            <div className="bg-[#1e3a8a] rounded-2xl p-6 shadow-lg">
              <span className="text-xs font-medium text-white/90 block mb-2">Parcelas</span>
              <p className="text-4xl font-bold text-white">{results.quantidade_parcelas || 0}</p>
            </div>
          </div>
        </div>

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

        {/* Seção média: Valores financeiros em cards horizontais */}
        <div className="grid md:grid-cols-2 gap-6">
          {results.valor_parcela && (
            <div className="relative overflow-hidden bg-[#00C853] rounded-2xl p-6 shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
              <div className="relative">
                <span className="text-xs font-medium text-white/90 block mb-2">Valor da Parcela</span>
                <p className="text-2xl font-bold text-white">{formatCurrency(results.valor_parcela)}</p>
              </div>
            </div>
          )}
          {results.taxa_juros && (
            <div className="relative overflow-hidden bg-[#FF8C42] rounded-2xl p-6 shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
              <div className="relative">
                <span className="text-xs font-medium text-white/90 block mb-2">Taxa de Juros</span>
                <p className="text-2xl font-bold text-white">{results.taxa_juros}%</p>
              </div>
            </div>
          )}
        </div>

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
    </div>
  );
}


