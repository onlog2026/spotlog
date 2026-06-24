import { NextResponse, type NextRequest } from "next/server";
import {
  requireApiAuth,
  checkRateLimit,
  rateLimitResponse,
  type ApiContext,
} from "@/lib/api-auth";

/**
 * Pipeline padrão: bearer auth + rate limit. Use no início de cada handler.
 *
 *   const guard = await guardV1(req);
 *   if ("error" in guard) return guard.error;
 *   const { ctx } = guard;
 */
export async function guardV1(
  req: NextRequest | Request,
  requiredScope?: string,
): Promise<{ ctx: ApiContext; error?: never } | { ctx?: never; error: NextResponse }> {
  const auth = await requireApiAuth(req, requiredScope);
  if ("error" in auth) return auth;
  const rl = checkRateLimit(auth.ctx.apiKeyId);
  if (!rl.allowed) return { error: rateLimitResponse(rl.resetAt) };
  return { ctx: auth.ctx };
}

export function v1Json(
  data: unknown,
  init?: { status?: number; headers?: Record<string, string> },
): NextResponse {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  });
}

export function v1Error(
  message: string,
  status: number,
  code?: string,
): NextResponse {
  return NextResponse.json(
    { error: message, code: code ?? "error" },
    { status },
  );
}

export function parseListParams(req: NextRequest | Request) {
  const url = new URL(req.url);
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1),
    200,
  );
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);
  return { limit, offset, url };
}

export const v1Cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function v1Options() {
  return new NextResponse(null, { status: 204, headers: v1Cors });
}
