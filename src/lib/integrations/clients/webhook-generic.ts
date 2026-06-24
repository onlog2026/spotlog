import { createHmac } from "node:crypto";

/**
 * Dispara um webhook outbound (n8n, Make, Zapier, custom URL).
 * Se "secret" for fornecido, calcula HMAC-SHA256 do body e envia em X-Spotlog-Signature.
 *
 * Retries: tenta 3x com backoff exponencial em caso de erro de rede ou 5xx.
 */
export async function dispatchWebhook(
  url: string,
  payload: unknown,
  secret?: string,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!url) return { ok: false, error: "URL ausente." };
  const body = JSON.stringify(payload);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Spotlog-Webhook/1.0",
  };
  if (secret) {
    headers["X-Spotlog-Signature"] = createHmac("sha256", secret)
      .update(body)
      .digest("hex");
  }

  let lastErr = "unknown";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10_000);
      const res = await fetch(url, { method: "POST", headers, body, signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) return { ok: true, status: res.status };
      if (res.status < 500 && res.status !== 429) {
        // 4xx (não 429) — não retentar
        return { ok: false, status: res.status, error: `HTTP ${res.status}` };
      }
      lastErr = `HTTP ${res.status}`;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : "fetch error";
    }
    // backoff: 500ms, 1500ms
    if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1) ** 2));
  }
  return { ok: false, error: lastErr };
}
