import { NextRequest, NextResponse } from "next/server";

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

    // URL da API Python (ajuste conforme necessário)
    const apiUrl = process.env.PYTHON_API_URL || "http://localhost:8000/api/extract";

    const response = await fetch(apiUrl, {
      method: "POST",
      body: pythonFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Erro ao processar contrato",
        detail: "Erro ao comunicar com a API de extração",
      }));
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


