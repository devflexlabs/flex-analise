import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;

    // URL da API do SCU
    const scuApiUrl = process.env.SCU_API_URL || "https://cadastro-unico-api-production.up.railway.app";
    const url = `${scuApiUrl}/api/cases/client/${clientId}`;

    console.log(`[SCU Proxy] Buscando casos do cliente:`, clientId);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(`[SCU Proxy] Status code: ${response.status}`);

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.message || "Erro ao buscar casos do cliente no SCU" },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error("[SCU Proxy] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar casos do cliente no SCU" },
      { status: 500 }
    );
  }
}

