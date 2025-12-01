import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Remove campos null/undefined para evitar problemas com a API do SCU
    const cleanedBody: any = {};
    for (const [key, value] of Object.entries(body)) {
      if (value !== null && value !== undefined) {
        cleanedBody[key] = value;
      }
    }

    // URL da API do SCU
    const scuApiUrl = process.env.SCU_API_URL || "https://cadastro-unico-api-production.up.railway.app";
    const url = `${scuApiUrl}/api/cases`;

    console.log(`[SCU Proxy] Criando caso:`, cleanedBody);
    console.log(`[SCU Proxy] DEBUG - installments_value:`, cleanedBody.installments_value, "tipo:", typeof cleanedBody.installments_value);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanedBody),
    });

    console.log(`[SCU Proxy] Status code: ${response.status}`);

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: data.message || "Erro ao criar caso no SCU" },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error("[SCU Proxy] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar caso no SCU" },
      { status: 500 }
    );
  }
}






