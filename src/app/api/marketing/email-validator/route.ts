import { NextResponse } from "next/server";
import { resolveMx } from "node:dns/promises";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Lista (parcial) de domínios descartáveis comuns
const DISPOSABLE = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "throwaway.email",
  "trashmail.com",
  "fakeinbox.com",
  "getnada.com",
  "maildrop.cc",
  "sharklasers.com",
  "spam4.me",
  "temp-mail.org",
  "dispostable.com",
]);

// Regex RFC 5322 simplificada
const EMAIL_RE =
  /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

type Status = "valid" | "invalid" | "risky" | "disposable" | "unknown";

type ValidationResult = {
  email: string;
  status: Status;
  reason: string;
};

async function validateOne(email: string): Promise<ValidationResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { email, status: "invalid", reason: "vazio" };
  if (!EMAIL_RE.test(trimmed))
    return { email: trimmed, status: "invalid", reason: "formato inválido" };

  const domain = trimmed.split("@")[1];
  if (!domain) return { email: trimmed, status: "invalid", reason: "sem domínio" };

  if (DISPOSABLE.has(domain))
    return { email: trimmed, status: "disposable", reason: "domínio descartável" };

  try {
    const mx = await Promise.race([
      resolveMx(domain),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000)),
    ]);
    if (!mx || (mx as Array<{ exchange: string }>).length === 0)
      return { email: trimmed, status: "invalid", reason: "sem MX" };
    return { email: trimmed, status: "valid", reason: "MX OK" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ENOTFOUND") || msg.includes("ENODATA"))
      return { email: trimmed, status: "invalid", reason: "domínio não existe" };
    return { email: trimmed, status: "unknown", reason: `DNS: ${msg}` };
  }
}

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireSession();
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: { emails?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const emails = Array.isArray(body.emails) ? body.emails.slice(0, 1000) : [];
  if (emails.length === 0)
    return NextResponse.json({ error: "Lista vazia" }, { status: 400 });

  // Process com concorrência limitada
  const results: ValidationResult[] = [];
  const concurrency = 10;
  for (let i = 0; i < emails.length; i += concurrency) {
    const slice = emails.slice(i, i + concurrency);
    const r = await Promise.all(slice.map((e) => validateOne(String(e))));
    results.push(...r);
  }

  // Loga em batch (best effort)
  const supabase = createAdminClient();
  const rows = results.map((r) => ({
    organization_id: ctx.org.id,
    email: r.email,
    status: r.status,
    reason: r.reason,
  }));
  if (rows.length) {
    const { error } = await supabase.from("email_validations").insert(rows);
    if (error) console.error("[email_validations insert]", error.message);
  }

  return NextResponse.json({ results });
}
