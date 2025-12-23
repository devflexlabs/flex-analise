import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy para os endpoints de relatórios da API Python.
 * Este arquivo serve como exemplo - os endpoints podem ser chamados diretamente
 * ou através deste proxy para evitar problemas de CORS.
 */

// URL da API Python - usa Railway em produção, localhost em desenvolvimento
const PYTHON_API_URL = process.env.PYTHON_API_URL || 
  (process.env.NODE_ENV === "production"
    ? "https://flex-analise-backend-production.up.railway.app"
    : "http://localhost:8000");

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tipo = searchParams.get("tipo");

  try {
    let url = "";

    switch (tipo) {
      case "estatisticas-banco":
        const estado = searchParams.get("estado");
        url = estado
          ? `${PYTHON_API_URL}/api/relatorios/estatisticas-banco?estado=${estado}`
          : `${PYTHON_API_URL}/api/relatorios/estatisticas-banco`;
        break;

      case "estatisticas-produto":
        const estadoProd = searchParams.get("estado");
        url = estadoProd
          ? `${PYTHON_API_URL}/api/relatorios/estatisticas-produto?estado=${estadoProd}`
          : `${PYTHON_API_URL}/api/relatorios/estatisticas-produto`;
        break;

      case "mapa-divida":
        const ano = searchParams.get("ano");
        const mes = searchParams.get("mes");
        const estadoMapa = searchParams.get("estado");
        let mapaUrl = `${PYTHON_API_URL}/api/relatorios/mapa-divida?ano=${ano}&mes=${mes}`;
        if (estadoMapa) {
          mapaUrl += `&estado=${estadoMapa}`;
        }
        url = mapaUrl;
        break;

      case "analises":
        const limite = searchParams.get("limite") || "100";
        const offset = searchParams.get("offset") || "0";
        const banco = searchParams.get("banco");
        const tipoContrato = searchParams.get("tipo_contrato");
        const estadoAnalises = searchParams.get("estado");
        let analisesUrl = `${PYTHON_API_URL}/api/relatorios/analises?limite=${limite}&offset=${offset}`;
        if (banco) analisesUrl += `&banco=${banco}`;
        if (tipoContrato) analisesUrl += `&tipo_contrato=${tipoContrato}`;
        if (estadoAnalises) analisesUrl += `&estado=${estadoAnalises}`;
        url = analisesUrl;
        break;

      default:
        return NextResponse.json(
          { error: "Tipo de relatório não especificado. Use: estatisticas-banco, estatisticas-produto, mapa-divida, ou analises" },
          { status: 400 }
        );
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Erro ao buscar relatório",
      }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Relatórios Proxy] Erro:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar relatório" },
      { status: 500 }
    );
  }
}

