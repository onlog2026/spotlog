import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Integração REAL com o Google Calendar via OAuth 2.0 (authorization code + refresh token).
 *
 * Setup necessário (uma vez, no Google Cloud Console):
 *   1. Criar OAuth Client (tipo "Web application").
 *   2. Authorized redirect URI = <APP_URL>/api/integrations/google-calendar/callback
 *   3. Setar GOOGLE_OAUTH_CLIENT_ID e GOOGLE_OAUTH_CLIENT_SECRET na Vercel.
 *   4. Scope usado: calendar.events (criar/editar eventos).
 *
 * O refresh_token de cada org fica salvo em `integrations.credentials` (provider=google_calendar).
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GCAL_SCOPE = "https://www.googleapis.com/auth/calendar.events";

function clientCreds(): { id: string; secret: string } | null {
  const id = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!id || !secret) return null;
  return { id, secret };
}

export function googleConfigured(): boolean {
  return !!clientCreds();
}

/** URL de callback estável (bate com o que precisa ser registrado no Google Cloud). */
export function callbackUrl(reqUrl: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || new URL(reqUrl).origin).replace(/\/$/, "");
  return `${base}/api/integrations/google-calendar/callback`;
}

export function buildAuthUrl(state: string, redirectUri: string): string | null {
  const c = clientCreds();
  if (!c) return null;
  const p = new URLSearchParams({
    client_id: c.id,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GCAL_SCOPE,
    access_type: "offline",
    prompt: "consent", // força retorno do refresh_token mesmo em reconexão
    state,
  });
  return `${AUTH_URL}?${p.toString()}`;
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<{ refresh_token?: string; access_token?: string } | null> {
  const c = clientCreds();
  if (!c) return null;
  const body = new URLSearchParams({
    code,
    client_id: c.id,
    client_secret: c.secret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) {
    console.warn("[gcal] exchangeCode", r.status, (await r.text().catch(() => "")).slice(0, 200));
    return null;
  }
  return r.json();
}

async function accessFromRefresh(refreshToken: string): Promise<string | null> {
  const c = clientCreds();
  if (!c) return null;
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: c.id,
    client_secret: c.secret,
    grant_type: "refresh_token",
  });
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) {
    console.warn("[gcal] refresh", r.status);
    return null;
  }
  const j = (await r.json()) as { access_token?: string };
  return j.access_token ?? null;
}

type ApptRow = {
  title: string;
  description?: string | null;
  scheduled_at: string;
  duration_minutes?: number | null;
  meeting_url?: string | null;
  meeting_location?: string | null;
};

/**
 * Cria um evento no Google Calendar a partir de um appointment.
 * `cred` vem de integrations.credentials (refresh_token + calendar_id).
 */
export async function createCalendarEventForAppointment(
  orgId: string,
  appointmentId: string,
  cred: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  const refresh = cred.refresh_token;
  if (!refresh) return { ok: false, error: "no_refresh_token" };
  const access = await accessFromRefresh(refresh);
  if (!access) return { ok: false, error: "refresh_failed" };

  const admin = createAdminClient();
  const { data } = await admin
    .from("appointments")
    .select("title, description, scheduled_at, duration_minutes, meeting_url, meeting_location")
    .eq("id", appointmentId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!data) return { ok: false, error: "appointment_not_found" };

  const a = data as ApptRow;
  const start = new Date(a.scheduled_at);
  if (isNaN(start.getTime())) return { ok: false, error: "invalid_date" };
  const end = new Date(start.getTime() + (a.duration_minutes ?? 30) * 60_000);
  const calendarId = cred.calendar_id || "primary";

  const event = {
    summary: a.title,
    description: [a.description, a.meeting_url].filter(Boolean).join("\n\n") || undefined,
    location: a.meeting_location || undefined,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
  };

  const r = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
      body: JSON.stringify(event),
    },
  );
  if (!r.ok) {
    console.warn("[gcal] insert", r.status, (await r.text().catch(() => "")).slice(0, 200));
    return { ok: false, error: `gcal_${r.status}` };
  }
  return { ok: true };
}
