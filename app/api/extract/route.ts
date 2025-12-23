import { NextRequest, NextResponse } from "next/server";

/**
 * Formata erros técnicos em mensagens amigáveis para o usuário
 */
function formatarErroAmigavel(erro: string): string {
  if (!erro) return "Erro desconhecido ao processar o contrato";

  const erroLower = erro.toLowerCase();

  // Erros de modelo descontinuado
  if (erroLower.includes("decommissioned") || erroLower.includes("model_decommissioned") || erroLower.includes("no longer supported")) {
    return "O modelo de IA está temporariamente indisponível. Nossa equipe foi notificada e está trabalhando para resolver. Por favor, tente novamente em alguns minutos.";
  }

  // Erros de limite de tokens/rate limit
  if (erroLower.includes("rate_limit") || erroLower.includes("429") || erroLower.includes("tokens per day") || erroLower.includes("tokens per minute") || erroLower.includes("tpm")) {
    return "Limite de requisições atingido. Por favor, aguarde alguns minutos e tente novamente.";
  }

  // Erros de autenticação
  if (erroLower.includes("api_key") || erroLower.includes("unauthorized") || erroLower.includes("401") || erroLower.includes("authentication")) {
    return "Erro de autenticação com o serviço de IA. Nossa equipe foi notificada.";
  }

  // Erros de arquivo
  if (erroLower.includes("file") && (erroLower.includes("too large") || erroLower.includes("size"))) {
    return "O arquivo é muito grande. Por favor, use um arquivo menor ou compacte o PDF.";
  }

  if (erroLower.includes("file") && (erroLower.includes("format") || erroLower.includes("type") || erroLower.includes("invalid"))) {
    return "Formato de arquivo não suportado. Por favor, envie um PDF ou imagem (JPG, PNG).";
  }

  // Erros de processamento
  if (erroLower.includes("extract") || erroLower.includes("process") || erroLower.includes("ocr")) {
    return "Erro ao processar o documento. Verifique se o arquivo está legível e tente novamente.";
  }

  // Erros de conexão
  if (erroLower.includes("network") || erroLower.includes("connection") || erroLower.includes("timeout") || erroLower.includes("fetch")) {
    return "Erro de conexão. Verifique sua internet e tente novamente.";
  }

  // Erros de servidor
  if (erroLower.includes("500") || erroLower.includes("internal server error") || erroLower.includes("server error")) {
    return "Erro interno do servidor. Nossa equipe foi notificada. Por favor, tente novamente em alguns minutos.";
  }

  // Erros de banco de dados
  if (erroLower.includes("database") || erroLower.includes("db") || erroLower.includes("sql")) {
    return "Erro ao salvar os dados. Por favor, tente novamente.";
  }

  // Remove códigos de erro técnicos e JSON
  let mensagem = erro
    .replace(/error code: \d+/gi, "")
    .replace(/\{.*?\}/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/['"]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Se ainda tiver muito código técnico, usa mensagem genérica
  if (mensagem.length > 200 || mensagem.includes("traceback") || mensagem.includes("exception")) {
    return "Erro ao processar o contrato. Por favor, verifique se o arquivo está correto e tente novamente. Se o problema persistir, entre em contato com o suporte.";
  }

  // Capitaliza primeira letra
  return mensagem.charAt(0).toUpperCase() + mensagem.slice(1);
}

// Método GET para debug/health check
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: "Extract API está funcionando",
    pythonApiUrl: process.env.PYTHON_API_URL || "não configurado"
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // Cria FormData para enviar para a API Python
    const pythonFormData = new FormData();
    pythonFormData.append("file", file);

    // URL da API Python - usa Railway em produção, localhost em desenvolvimento
    const apiUrl = process.env.PYTHON_API_URL 
      ? `${process.env.PYTHON_API_URL}/api/extract`
      : process.env.NODE_ENV === "production"
      ? "https://flex-analise-backend-production.up.railway.app/api/extract"
      : "http://localhost:8000/api/extract";
    
    console.log("[Extract API] Chamando backend:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      body: pythonFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Erro ao processar contrato",
        detail: "Erro ao comunicar com a API de extração",
      }));
      
      // Formata erros para mensagens mais amigáveis
      if (errorData.detail) {
        errorData.detail = formatarErroAmigavel(errorData.detail);
      }
      if (errorData.error) {
        errorData.error = formatarErroAmigavel(errorData.error);
      }
      
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro na API:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}


