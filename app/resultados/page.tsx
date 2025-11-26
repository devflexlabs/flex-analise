"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { ContractResults } from "@/components/ContractResults";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, Suspense } from "react";

function ResultadosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    console.log("ResultadosContent montado");
    console.log("searchParams:", searchParams.toString());
    
    const fromStorage = searchParams.get("fromStorage");
    const data = searchParams.get("data");
    
    if (fromStorage === "true") {
      // Busca dados do sessionStorage (só funciona no cliente)
      console.log("Buscando dados do sessionStorage");
      if (typeof window !== "undefined") {
        const storedData = sessionStorage.getItem('contractResults');
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            console.log("Dados parseados do storage:", parsed);
            setResults(parsed);
            return;
          } catch (e) {
            console.error("Erro ao parsear dados do storage:", e);
            router.push("/");
            return;
          }
        } else {
          console.error("Nenhum dado encontrado no sessionStorage");
          router.push("/");
          return;
        }
      }
    }
    
    if (data) {
      console.log("Buscando dados da URL");
      try {
        const parsed = JSON.parse(decodeURIComponent(data));
        console.log("Dados parseados da URL:", parsed);
        setResults(parsed);
      } catch (e) {
        console.error("Erro ao parsear dados:", e);
        router.push("/");
      }
    } else if (!fromStorage) {
      console.error("Nenhum parâmetro 'data' ou 'fromStorage' encontrado");
      router.push("/");
    }
  }, [searchParams, router, mounted]);

  if (!mounted || !results) {
    return (
      <main className="min-h-screen bg-[#f1f5f9] text-[#1e293b] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#64748b]">Carregando resultados...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f1f5f9] text-[#1e293b]">
      <div className="container mx-auto px-6 py-20 max-w-5xl">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 text-[#1e3a8a] hover:text-[#1e40af] font-medium transition-colors hover:bg-[#1e3a8a]/5 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar para tela inicial
        </button>
        
        <ContractResults results={results} />
      </div>
    </main>
  );
}

export default function ResultadosPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#f1f5f9] text-[#1e293b] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#64748b]">Carregando...</p>
        </div>
      </main>
    }>
      <ResultadosContent />
    </Suspense>
  );
}

