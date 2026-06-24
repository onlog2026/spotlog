import { createHash, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ApiContext = {
  orgId: string;
  scopes: string[];
  apiKeyId: string;
};

export type ApiAuthError = {
  ok: false;
  status: number;
  body: { error: string; code: string };
};

export type ApiAuthSuccess = {
  ok: true;
  ctx: ApiContext;
};

export type ApiAuthResult = ApiAuthError | ApiAuthSuccess;

/**
 * Hash sha256 de um token plain-text.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Gera um token novo: spk_live_<hex32>.
 * Retorna { token, hash, prefix }. O token só pode ser mostrado UMA vez ao usuário.
 */
export function generateApiKey(): { token: string; hash: string; prefix: string } {
  const raw = randomBytes(32).toString("hex");
  const token = `spk_live_${raw}`;
  const hash = hashToken(token);
  const prefix = `${token.slice(0, 14)}...${token.slice(-4)}`;
  return { token, hash, prefix };
}

/**
 * Lê Authorization: Bearer <token>, hash, valida no banco.
 * Atualiza last_used_at de forma assíncrona.
 */
export async function authenticateApiRequest(
  req: NextRequest | Request,
  requiredScope?: string,
): Promise<ApiAuthResult> {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    return {
      ok: false,
      status: 401,
      body: { error: "Authorization header ausente ou mal formado.", code: "missing_token" },
    };
  }

  const token = match[1].trim();
  if (token.length < 30) {
    return {
      ok: false,
      status: 401,
      body: { error: "Token inválido.", code: "invalid_token" },
    };
  }

  const hash = hashToken(token);
  const admin = createAdminClient();
  // @ts-expect-error RPC nova não está nos types gerados
  const { data, error } = await admin.rpc("validate_api_token", { p_token_hash: hash });

  const rows = data as Array<{ organization_id: string; scopes: string[]; api_key_id: string }> | null;
  if (error || !rows || rows.length === 0) {
    return {
      ok: false,
      status: 401,
      body: { error: "Token inválido ou revogado.", code: "invalid_token" },
    };
  }

  const row = rows[0];
  const ctx: ApiContext = {
    orgId: row.organization_id,
    scopes: row.scopes ?? [],
    apiKeyId: row.api_key_id,
  };

  if (requiredScope && !ctx.scopes.includes(requiredScope)) {
    return {
      ok: false,
      status: 403,
      body: {
        error: `Token sem permissão para o escopo "${requiredScope}".`,
        code: "missing_scope",
      },
    };
  }

  // Atualiza last_used (fire-and-forget; não bloquear request)
  void admin
    .from("integration_api_keys")
    // @ts-expect-error tabela nova
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", ctx.apiKeyId);

  return { ok: true, ctx };
}

/**
 * Helper: já retorna NextResponse com erro se falhar, ou ctx se OK.
 */
export async function requireApiAuth(
  req: NextRequest | Request,
  requiredScope?: string,
): Promise<{ ctx: ApiContext; error?: never } | { ctx?: never; error: NextResponse }> {
  const result = await authenticateApiRequest(req, requiredScope);
  if (!result.ok) {
    return { error: NextResponse.json(result.body, { status: result.status }) };
  }
  return { ctx: result.ctx };
}

// -------- Rate limit em memória (100/min por API key) --------

type RateBucket = { count: number; resetAt: number };
const buckets = new Map<string, RateBucket>();
const RATE_LIMIT = 100;
const WINDOW_MS = 60_000;

export function checkRateLimit(apiKeyId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const existing = buckets.get(apiKeyId);
  if (!existing || existing.resetAt < now) {
    const fresh = { count: 1, resetAt: now + WINDOW_MS };
    buckets.set(apiKeyId, fresh);
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt: fresh.resetAt };
  }
  existing.count += 1;
  const remaining = Math.max(0, RATE_LIMIT - existing.count);
  return {
    allowed: existing.count <= RATE_LIMIT,
    remaining,
    resetAt: existing.resetAt,
  };
}

export function rateLimitResponse(resetAt: number): NextResponse {
  const retry = Math.ceil((resetAt - Date.now()) / 1000);
  return NextResponse.json(
    { error: "Rate limit excedido (100/min).", code: "rate_limited", retry_after_seconds: retry },
    {
      status: 429,
      headers: { "Retry-After": String(retry) },
    },
  );
}
