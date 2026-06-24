import { NextResponse, type NextRequest } from "next/server";
import { consultarCep } from "@/lib/abrangencia";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cep = req.nextUrl.searchParams.get("cep") ?? "";
  const resultado = consultarCep(cep);
  return NextResponse.json(resultado, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
