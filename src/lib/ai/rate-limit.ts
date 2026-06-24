import "server-only";

/**
 * Rate limit in-memory por organização, cumulativo entre endpoints /api/ia/*.
 * Máximo 30 requests por hora por org. Sobrevive enquanto o processo viver
 * (não persiste entre cold starts da Vercel — proposital, é só freio leve).
 */

const WINDOW_MS = 60 * 60 * 1000; // 1h
const MAX_PER_WINDOW = 30;

type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; remaining: 0; resetAt: number; retryAfterSec: number };

export function checkIaRateLimit(orgId: string): RateLimitResult {
  const now = Date.now();
  const cur = buckets.get(orgId);
  if (!cur || cur.resetAt < now) {
    const resetAt = now + WINDOW_MS;
    buckets.set(orgId, { count: 1, resetAt });
    return { ok: true, remaining: MAX_PER_WINDOW - 1, resetAt };
  }
  if (cur.count >= MAX_PER_WINDOW) {
    return {
      ok: false,
      remaining: 0,
      resetAt: cur.resetAt,
      retryAfterSec: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)),
    };
  }
  cur.count += 1;
  return {
    ok: true,
    remaining: MAX_PER_WINDOW - cur.count,
    resetAt: cur.resetAt,
  };
}
