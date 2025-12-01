import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cpf = searchParams.get("cpf");

    if (!cpf) {
      return NextResponse.json(
        { error: "CPF não fornecido" },
        { status: 400 }
      );
    }

    // Remove formatação do CPF
    const cpfLimpo = cpf.replace(/\D/g, "");

    // Valida se tem 11 dígitos
    if (cpfLimpo.length !== 11) {
      return NextResponse.json(
        { error: "CPF inválido" },
        { status: 400 }
      );
    }

    // URL da API do SCU (rota correta com /full)
    const scuApiUrl = process.env.SCU_API_URL || "https://cadastro-unico-api-production.up.railway.app";
    const url = `${scuApiUrl}/api/clients/cpf/${cpfLimpo}/full`;

    console.log(`[SCU Proxy] Fazendo requisição para: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(`[SCU Proxy] Status code: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      // A rota /full retorna { message: "...", client: {...} }
      // Verifica se tem o campo 'client' e se não está vazio
      const clienteExiste = data && (
        (data.client && typeof data.client === "object" && Object.keys(data.client).length > 0) ||
        (typeof data === "object" && !data.message && Object.keys(data).length > 0) ||
        (Array.isArray(data) && data.length > 0)
      );
      
      // Extrai o ID do cliente se existir
      let clientId = null;
      if (data?.client?.id) {
        clientId = data.client.id;
      } else if (data?.id) {
        clientId = data.id;
      } else if (Array.isArray(data) && data.length > 0 && data[0]?.id) {
        clientId = data[0].id;
      }
      
      return NextResponse.json({ 
        cliente_no_scu: clienteExiste,
        client_id: clientId,
        dados: data 
      });
    } else if (response.status === 404) {
      return NextResponse.json({ 
        cliente_no_scu: false 
      });
    } else {
      return NextResponse.json(
        { error: "Erro ao verificar cliente no SCU" },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error("[SCU Proxy] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao verificar cliente no SCU" },
      { status: 500 }
    );
  }
}

