import { NextResponse } from "next/server";
import { buscarCnpj } from "@/lib/brasil/cnpj";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cnpj = url.searchParams.get("cnpj") ?? "";
  const result = await buscarCnpj(cnpj);
  if (!result) {
    return NextResponse.json({ error: "CNPJ não encontrado" }, { status: 404 });
  }
  return NextResponse.json(result, {
    headers: { "cache-control": "public, max-age=86400" },
  });
}
