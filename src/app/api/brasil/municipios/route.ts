import { NextResponse } from "next/server";
import { listarMunicipios } from "@/lib/brasil/ibge";
import { isValidUf } from "@/lib/data/uf";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const uf = (url.searchParams.get("uf") ?? "").trim().toUpperCase();
  if (!isValidUf(uf)) {
    return NextResponse.json({ municipios: [] });
  }
  const municipios = await listarMunicipios(uf);
  return NextResponse.json(
    { uf, municipios },
    {
      headers: {
        "cache-control": "public, s-maxage=86400, stale-while-revalidate=86400",
      },
    },
  );
}
