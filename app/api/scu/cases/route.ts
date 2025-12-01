import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // URL da API do SCU
    const scuApiUrl = process.env.SCU_API_URL || "https://cadastro-unico-api-production.up.railway.app";
    const url = `${scuApiUrl}/api/cases`;

    console.log(`[SCU Proxy] Criando caso:`, body);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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



