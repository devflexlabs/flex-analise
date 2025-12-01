import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // URL da API do SCU
    const scuApiUrl = process.env.SCU_API_URL || "https://cadastro-unico-api-production.up.railway.app";
    const url = `${scuApiUrl}/api/clients/${id}?include=cases`;

    console.log(`[SCU Proxy] Buscando cliente completo:`, id);

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
        { error: data.message || "Erro ao buscar cliente no SCU" },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error("[SCU Proxy] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar cliente no SCU" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // URL da API do SCU
    const scuApiUrl = process.env.SCU_API_URL || "https://cadastro-unico-api-production.up.railway.app";
    const url = `${scuApiUrl}/api/clients/${id}`;

    console.log(`[SCU Proxy] Atualizando cliente:`, id, body);

    const response = await fetch(url, {
      method: "PATCH",
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
        { error: data.message || "Erro ao atualizar cliente no SCU" },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error("[SCU Proxy] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar cliente no SCU" },
      { status: 500 }
    );
  }
}

