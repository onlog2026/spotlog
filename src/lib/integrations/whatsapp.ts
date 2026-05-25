import { getIntegration } from "./index";
import { onlyDigits } from "@/lib/utils";

export type WhatsappSendOptions = {
  organization_id: string;
  to: string; // E.164 ou só dígitos
  text: string;
};

export type WhatsappResult = {
  ok: boolean;
  provider_message_id?: string;
  provider?: string;
  error?: string;
};

/**
 * Adapter genérico. Suporta Evolution API e Z-API. Tenta na ordem:
 * Evolution → Z-API. Falha clara se nenhuma configurada.
 */
export async function sendWhatsapp(
  opts: WhatsappSendOptions,
): Promise<WhatsappResult> {
  const evo = await getIntegration(opts.organization_id, "evolution");
  if (evo) return sendViaEvolution(opts, evo);

  const zapi = await getIntegration(opts.organization_id, "zapi");
  if (zapi) return sendViaZapi(opts, zapi);

  return {
    ok: false,
    error:
      "WhatsApp não está configurado. Conecte Evolution API ou Z-API em /app/admin/integracoes.",
  };
}

async function sendViaEvolution(
  opts: WhatsappSendOptions,
  cfg: {
    credentials: Record<string, string>;
  },
): Promise<WhatsappResult> {
  const base = cfg.credentials.url?.replace(/\/$/, "");
  const instance = cfg.credentials.instance ?? "default";
  const apikey = cfg.credentials.api_key;
  const number = formatNumber(opts.to);
  if (!base || !apikey)
    return { ok: false, error: "Evolution API: URL ou api_key ausentes." };

  try {
    const res = await fetch(`${base}/message/sendText/${instance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey },
      body: JSON.stringify({ number, text: opts.text }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      return {
        ok: false,
        provider: "evolution",
        error: data?.message ?? `Erro ${res.status}`,
      };
    return {
      ok: true,
      provider: "evolution",
      provider_message_id: data?.key?.id ?? data?.id,
    };
  } catch (e) {
    return {
      ok: false,
      provider: "evolution",
      error: e instanceof Error ? e.message : "Falha de rede",
    };
  }
}

async function sendViaZapi(
  opts: WhatsappSendOptions,
  cfg: { credentials: Record<string, string> },
): Promise<WhatsappResult> {
  const id = cfg.credentials.instance_id;
  const token = cfg.credentials.token;
  const clientToken = cfg.credentials.client_token;
  const phone = formatNumber(opts.to);
  if (!id || !token)
    return { ok: false, error: "Z-API: instance_id ou token ausentes." };

  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${id}/token/${token}/send-text`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(clientToken ? { "Client-Token": clientToken } : {}),
        },
        body: JSON.stringify({ phone, message: opts.text }),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      return {
        ok: false,
        provider: "zapi",
        error: data?.message ?? `Erro ${res.status}`,
      };
    return {
      ok: true,
      provider: "zapi",
      provider_message_id: data?.messageId ?? data?.id,
    };
  } catch (e) {
    return {
      ok: false,
      provider: "zapi",
      error: e instanceof Error ? e.message : "Falha de rede",
    };
  }
}

function formatNumber(input: string) {
  const digits = onlyDigits(input);
  if (digits.startsWith("55")) return digits;
  if (digits.length === 11 || digits.length === 10) return `55${digits}`;
  return digits;
}
