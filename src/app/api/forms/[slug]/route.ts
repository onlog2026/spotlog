import { NextResponse, type NextRequest } from "next/server";
import { getFormBySlug } from "@/lib/forms/queries";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const form = await getFormBySlug(slug);
  if (!form) return NextResponse.json({ error: "Formulario nao encontrado" }, { status: 404 });
  return NextResponse.json(form, {
    headers: { "Cache-Control": "public, max-age=30, s-maxage=30" },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
