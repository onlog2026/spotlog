import { NextResponse } from "next/server";
import { buscarCep } from "@/lib/brasil/cep";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cep = url.searchParams.get("cep") ?? "";
  const result = await buscarCep(cep);
  if (!result) {
    return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });
  }
  return NextResponse.json(result, {
    headers: { "cache-control": "public, max-age=86400" },
  });
}
