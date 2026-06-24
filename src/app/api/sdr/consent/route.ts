import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { recordConsent, recordOptOut } from "@/lib/sdr/lgpd";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const consentSchema = z.object({
  action: z.literal("consent"),
  contactId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  consentType: z
    .enum(["opt_in", "legitimate_interest"])
    .default("legitimate_interest"),
  legalBasis: z
    .enum([
      "consentimento",
      "interesse_legitimo",
      "execucao_contrato",
      "obrigacao_legal",
    ])
    .default("interesse_legitimo"),
  source: z.string().optional(),
  notes: z.string().optional(),
});

const optOutSchema = z.object({
  action: z.literal("opt_out"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  reason: z.string().min(3),
});

const bodySchema = z.discriminatedUnion("action", [consentSchema, optOutSchema]);

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSession();
    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const userAgent = req.headers.get("user-agent") ?? null;

    if (parsed.data.action === "consent") {
      const result = await recordConsent({
        orgId: ctx.org.id,
        contactId: parsed.data.contactId ?? null,
        email: parsed.data.email ?? null,
        phone: parsed.data.phone ?? null,
        consentType: parsed.data.consentType,
        legalBasis: parsed.data.legalBasis,
        source: parsed.data.source ?? "admin_ui",
        ip,
        userAgent,
        notes: parsed.data.notes,
      });
      return NextResponse.json({ ok: true, id: result.id });
    }

    await recordOptOut({
      orgId: ctx.org.id,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      reason: parsed.data.reason,
      source: "admin_ui",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/sdr/consent] fatal", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro inesperado." },
      { status: 500 },
    );
  }
}
