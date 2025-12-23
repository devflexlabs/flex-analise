"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BarChart3 } from "lucide-react";
import { ContractUpload } from "@/components/ContractUpload";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Limpa o sessionStorage quando a página carrega
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem('contractResults');
      console.log("🧹 SessionStorage limpo ao carregar página inicial");
    }
  }, []);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setError(null);

    // Limpa o sessionStorage antes de processar novo arquivo
    if (typeof window !== "undefined") {
      sessionStorage.removeItem('contractResults');
      console.log("🧹 SessionStorage limpo antes de processar novo contrato");
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Erro ao processar contrato";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.error || errorMessage;
        } catch (e) {
          // Se não conseguir parsear o JSON de erro, usa mensagem padrão
          errorMessage = `Erro ${response.status}: ${response.statusText || "Erro ao comunicar com a API"}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Dados recebidos:", data);

      // Limpa dados antigos e salva novos dados no sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem('contractResults'); // Garante limpeza antes de salvar
        const jsonString = JSON.stringify(data);
        sessionStorage.setItem('contractResults', jsonString);
        console.log("💾 Novos dados salvos no sessionStorage");
      }
      
      // Mostra toast de sucesso ou aviso se já existia
      if (data.ja_existia) {
        toast.success("Contrato processado! (Este contrato já estava no banco de dados)", {
          duration: 3000,
        });
      } else {
        toast.success("Contrato processado com sucesso!", {
          duration: 2000,
        });
      }
      
      console.log("Redirecionando para /resultados");
      
      // Aguarda um pouco para o toast aparecer antes de redirecionar
      setTimeout(() => {
        window.location.replace(`/resultados?fromStorage=true`);
      }, 500);
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
      toast.error(err.message || "Erro ao processar contrato", {
        duration: 4000,
      });
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f1f5f9] text-[#1e293b]">
      <div className="container mx-auto px-6 py-20 max-w-5xl">
        <header className="text-center mb-16 space-y-4">
          <div className="mb-2">
            <p className="text-sm font-medium text-[#64748b] uppercase tracking-wider mb-2">
              Grupo Flex
            </p>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[#1e3a8a]">
              Flex Análise
            </h1>
          </div>
          <div className="w-24 h-1 bg-[#1e3a8a] mx-auto rounded-full"></div>
          <p className="text-lg font-light text-[#64748b] mt-6 max-w-2xl mx-auto">
            Análise inteligente de contratos financeiros usando inteligência artificial
          </p>
        </header>

        <div className="mb-12">
          <ContractUpload onUpload={handleUpload} loading={loading} />
        </div>

        {/* Link para Relatórios */}
        <div className="text-center mb-8">
          <a
            href="/relatorios"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#1e40af] transition-colors font-medium"
          >
            <BarChart3 className="h-5 w-5" />
            Ver Relatórios e Estatísticas
          </a>
        </div>

        {error && (
          <div className="mt-8 p-6 border-2 border-[#ef4444] bg-red-50 rounded-lg animate-fade-in">
            <p className="font-semibold text-lg mb-2 text-[#ef4444]">Erro</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </main>
  );
}


