import { NextResponse, type NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getIntegration } from "@/lib/integrations";
import { aiGenerate } from "@/lib/integrations/ai";

export async function POST(req: NextRequest) {
  const ctx = await requireRole(["owner", "admin"]);
  const { provider } = await req.json();
  const admin = createAdminClient();
  const i = await getIntegration(ctx.org.id, provider);
  if (!i) {
    await admin
      .from("integrations")
      .update({
        last_test_at: new Date().toISOString(),
        last_test_ok: false,
        last_test_error: "não configurado",
      })
      .eq("organization_id", ctx.org.id)
      .eq("provider", provider);
    return NextResponse.json({ ok: false, error: "não configurado" });
  }

  try {
    if (provider === "openai" || provider === "anthropic") {
      const out = await aiGenerate({
        organization_id: ctx.org.id,
        max_tokens: 10,
        messages: [{ role: "user", content: 'Responda só: "ok"' }],
      });
      await markOk(ctx.org.id, provider, !!out);
      return NextResponse.json({ ok: true, sample: out });
    }
    if (provider === "resend") {
      const res = await fetch("https://api.resend.com/api-keys", {
        headers: { Authorization: `Bearer ${i.credentials.api_key}` },
      });
      const ok = res.ok;
      await markOk(ctx.org.id, provider, ok);
      return NextResponse.json({
        ok,
        error: ok ? undefined : `status ${res.status}`,
      });
    }
    if (provider === "apollo") {
      const res = await fetch(
        `https://api.apollo.io/v1/auth/health?api_key=${i.credentials.api_key}`,
      );
      const ok = res.ok;
      await markOk(ctx.org.id, provider, ok);
      return NextResponse.json({
        ok,
        error: ok ? undefined : `status ${res.status}`,
      });
    }
    if (provider === "google_places") {
      const res = await fetch(
        `https://places.googleapis.com/v1/places:searchText`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": i.credentials.api_key,
            "X-Goog-FieldMask": "places.id",
          },
          body: JSON.stringify({ textQuery: "test" }),
        },
      );
      const ok = res.ok;
      await markOk(ctx.org.id, provider, ok);
      return NextResponse.json({
        ok,
        error: ok ? undefined : `status ${res.status}`,
      });
    }
    if (provider === "evolution") {
      const base = i.credentials.url?.replace(/\/$/, "");
      const res = await fetch(`${base}/instance/connectionState/${i.credentials.instance}`, {
        headers: { apikey: i.credentials.api_key },
      });
      const ok = res.ok;
      await markOk(ctx.org.id, provider, ok);
      return NextResponse.json({
        ok,
        error: ok ? undefined : `status ${res.status}`,
      });
    }
    if (provider === "slack" || provider === "discord") {
      const url = i.credentials.webhook_url ?? "";
      const body =
        provider === "slack"
          ? JSON.stringify({ text: "Spotlog: teste de conexão ✅" })
          : JSON.stringify({ content: "Spotlog: teste de conexão ✅" });
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const ok = r.ok || r.status === 204;
      await markOk(ctx.org.id, provider, ok);
      return NextResponse.json({ ok, error: ok ? undefined : `status ${r.status}` });
    }
    if (provider === "telegram") {
      const t = i.credentials.bot_token ?? "";
      const c = i.credentials.chat_id ?? "";
      const r = await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: c, text: "Spotlog: teste de conexão ✅" }),
      });
      const data = (await r.json().catch(() => ({}))) as { ok?: boolean; description?: string };
      const ok = !!data.ok;
      await markOk(ctx.org.id, provider, ok, ok ? undefined : data.description);
      return NextResponse.json({ ok, error: ok ? undefined : data.description });
    }
    if (provider === "twilio") {
      const sid = i.credentials.account_sid ?? "";
      const tok = i.credentials.auth_token ?? "";
      const auth = Buffer.from(`${sid}:${tok}`).toString("base64");
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      const ok = r.ok;
      await markOk(ctx.org.id, provider, ok);
      return NextResponse.json({ ok, error: ok ? undefined : `status ${r.status}` });
    }
    if (provider === "webhook") {
      const r = await fetch(i.credentials.url ?? "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "test", timestamp: new Date().toISOString() }),
      });
      const ok = r.ok;
      await markOk(ctx.org.id, provider, ok);
      return NextResponse.json({ ok, error: ok ? undefined : `status ${r.status}` });
    }
    if (provider === "openrouter") {
      const r = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${i.credentials.api_key}` },
      });
      const ok = r.ok;
      await markOk(ctx.org.id, provider, ok);
      return NextResponse.json({ ok, error: ok ? undefined : `status ${r.status}` });
    }
    if (provider === "google_calendar") {
      // O callback OAuth grava `refresh_token` (nunca `oauth_token`) — essa
      // checagem usava o nome errado e reportava falha mesmo conectado.
      const ok = !!i.credentials.refresh_token;
      await markOk(ctx.org.id, provider, ok, ok ? undefined : "Refresh token ausente — reconecte o Google Calendar.");
      return NextResponse.json({ ok });
    }
    if (provider === "digisac") {
      const base = String(i.credentials.base_url || "").replace(/\/+$/, "");
      const res = await fetch(`${base}/api/v1/services?perPage=1`, {
        headers: { Authorization: `Bearer ${i.credentials.token}` },
      });
      const ok = res.ok;
      await markOk(ctx.org.id, provider, ok);
      return NextResponse.json({ ok, error: ok ? undefined : `status ${res.status}` });
    }
    if (provider === "zapi") {
      const res = await fetch(
        `https://api.z-api.io/instances/${i.credentials.instance_id}/token/${i.credentials.token}/status`,
        {
          headers: i.credentials.client_token
            ? { "Client-Token": i.credentials.client_token }
            : undefined,
        },
      );
      const ok = res.ok;
      await markOk(ctx.org.id, provider, ok);
      return NextResponse.json({
        ok,
        error: ok ? undefined : `status ${res.status}`,
      });
    }
    await markOk(ctx.org.id, provider, true);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "falha";
    await markOk(ctx.org.id, provider, false, msg);
    return NextResponse.json({ ok: false, error: msg });
  }
}

async function markOk(
  org: string,
  provider: string,
  ok: boolean,
  err?: string,
) {
  const admin = createAdminClient();
  await admin
    .from("integrations")
    .update({
      last_test_at: new Date().toISOString(),
      last_test_ok: ok,
      last_test_error: err ?? null,
    })
    .eq("organization_id", org)
    .eq("provider", provider);
}
