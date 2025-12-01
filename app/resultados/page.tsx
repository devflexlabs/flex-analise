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
    
    const loadAndVerifySCU = async (parsedData: any) => {
      // Verifica se o cliente está no SCU (se tiver CPF)
      if (parsedData.cpf_cnpj) {
        const cpfLimpo = parsedData.cpf_cnpj.replace(/\D/g, ''); // Remove formatação
        if (cpfLimpo.length === 11) {
          console.log("🔍 Verificando cliente no SCU com CPF:", cpfLimpo);
          try {
            // Usa o proxy do Next.js para evitar problemas de CORS
            const scuResponse = await fetch(`/api/scu/check?cpf=${cpfLimpo}`);
            
            if (scuResponse.ok) {
              const scuData = await scuResponse.json();
              parsedData.cliente_no_scu = scuData.cliente_no_scu;
              parsedData.cliente_scu_id = scuData.client_id || null;
              
              // Salva dados completos do cliente do SCU se disponível
              if (scuData.dados?.client) {
                parsedData.cliente_scu_data = {
                  birth_date: scuData.dados.client.birth_date || null,
                  email: scuData.dados.client.email || null,
                  phone: scuData.dados.client.phone || null,
                };
              }
              
              // Extrai os casos da resposta se disponível
              // A API pode retornar em client.Case (maiúsculo) ou client.cases (minúsculo)
              const cases = scuData.dados?.client?.cases || scuData.dados?.client?.Case || [];
              if (Array.isArray(cases) && cases.length > 0) {
                parsedData.existing_cases = cases.map((caseItem: any) => ({
                  id: caseItem.id,
                  product: caseItem.product || "N/A",
                  bank_name: caseItem.bank_name || "N/A",
                  debt_amount: caseItem.debt_amount ? String(caseItem.debt_amount) : null,
                  installment_value: (caseItem.installments_value || caseItem.installment_value) ? String(caseItem.installments_value || caseItem.installment_value) : null,
                  installments_total: caseItem.installments_total || null,
                }));
                console.log("📋 Casos encontrados:", parsedData.existing_cases.length, parsedData.existing_cases);
              } else {
                parsedData.existing_cases = [];
                console.log("📋 Nenhum caso encontrado na resposta do SCU");
              }
              
              console.log("✅ Resultado SCU:", parsedData.cliente_no_scu ? "Cliente ENCONTRADO no SCU" : "Cliente NÃO encontrado no SCU");
              if (parsedData.cliente_no_scu && parsedData.cliente_scu_id) {
                console.log("🆔 ID do cliente no SCU:", parsedData.cliente_scu_id);
              }
            } else {
              parsedData.cliente_no_scu = false;
              parsedData.existing_cases = [];
              console.log("⚠️ Erro ao verificar SCU, assumindo que não está cadastrado");
            }
          } catch (error) {
            console.error("❌ Erro ao verificar SCU:", error);
            parsedData.cliente_no_scu = null;
            parsedData.existing_cases = [];
          }
        } else {
          parsedData.cliente_no_scu = null; // É CNPJ, não verifica
          parsedData.existing_cases = [];
        }
      } else {
        parsedData.cliente_no_scu = null;
        parsedData.existing_cases = [];
      }
      
      setResults(parsedData);
    };
    
    if (fromStorage === "true") {
      // Busca dados do sessionStorage (só funciona no cliente)
      console.log("Buscando dados do sessionStorage");
      if (typeof window !== "undefined") {
        const storedData = sessionStorage.getItem('contractResults');
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            console.log("Dados parseados do storage:", parsed);
            // NÃO limpa o sessionStorage aqui - mantém os dados para permitir refresh da página
            // Verifica SCU e atualiza os resultados
            loadAndVerifySCU(parsed);
            return;
          } catch (e) {
            console.error("Erro ao parsear dados do storage:", e);
            // Limpa apenas em caso de erro de parsing
            sessionStorage.removeItem('contractResults');
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
        // Verifica SCU e atualiza os resultados
        loadAndVerifySCU(parsed);
      } catch (e) {
        console.error("Erro ao parsear dados:", e);
        router.push("/");
      }
    } else if (!fromStorage) {
      // Se não tem fromStorage e não tem data, tenta carregar do sessionStorage mesmo assim (para permitir refresh)
      if (typeof window !== "undefined") {
        const storedData = sessionStorage.getItem('contractResults');
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            console.log("Carregando dados do sessionStorage (refresh da página)");
            loadAndVerifySCU(parsed);
            return;
          } catch (e) {
            console.error("Erro ao parsear dados do storage:", e);
            router.push("/");
            return;
          }
        } else {
          console.error("Nenhum parâmetro 'data' ou 'fromStorage' encontrado e nenhum dado no storage");
          router.push("/");
        }
      }
    }

    // NÃO limpa o sessionStorage no cleanup - permite refresh da página mantendo os dados
  }, [searchParams, router, mounted]);

  if (!mounted || !results) {
    return (
      <main className="min-h-screen bg-[#f1f5f9] text-[#1e293b] flex items-center justify-center">
        <div className="text-center space-y-6">
          {/* Animação de loading */}
          <div className="relative w-20 h-20 mx-auto">
            {/* Círculo externo animado */}
            <div className="absolute inset-0 border-4 border-[#1e3a8a]/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#1e3a8a] rounded-full animate-spin"></div>
            
            {/* Círculo interno animado (sentido contrário) */}
            <div className="absolute inset-2 border-4 border-[#1e3a8a]/10 rounded-full"></div>
            <div className="absolute inset-2 border-4 border-transparent border-b-[#1e40af] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
            
            {/* Ponto central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-[#1e3a8a] rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Texto com animação */}
          <div className="space-y-2">
            <p className="text-lg font-semibold text-[#1e3a8a] animate-pulse">
              Processando contrato...
            </p>
            <p className="text-sm text-[#64748b]">
              Analisando dados e verificando no SCU
            </p>
          </div>
          
          {/* Barra de progresso animada */}
          <div className="w-64 h-1 bg-[#cbd5e1] rounded-full mx-auto overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] rounded-full w-1/3 animate-shimmer"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f1f5f9] text-[#1e293b]">
      <div className="container mx-auto px-6 py-20 max-w-5xl">
        <button
          onClick={() => {
            // Limpa o sessionStorage ao voltar para página inicial
            if (typeof window !== "undefined") {
              sessionStorage.removeItem('contractResults');
              console.log("🧹 SessionStorage limpo ao voltar para página inicial");
            }
            router.push("/");
          }}
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
        <div className="text-center space-y-6">
          {/* Animação de loading */}
          <div className="relative w-20 h-20 mx-auto">
            {/* Círculo externo animado */}
            <div className="absolute inset-0 border-4 border-[#1e3a8a]/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#1e3a8a] rounded-full animate-spin"></div>
            
            {/* Círculo interno animado (sentido contrário) */}
            <div className="absolute inset-2 border-4 border-[#1e3a8a]/10 rounded-full"></div>
            <div className="absolute inset-2 border-4 border-transparent border-b-[#1e40af] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
            
            {/* Ponto central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-[#1e3a8a] rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Texto com animação */}
          <div className="space-y-2">
            <p className="text-lg font-semibold text-[#1e3a8a] animate-pulse">
              Carregando...
            </p>
          </div>
        </div>
      </main>
    }>
      <ResultadosContent />
    </Suspense>
  );
}

