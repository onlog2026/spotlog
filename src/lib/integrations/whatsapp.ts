import { getIntegration } from "./index";
import { onlyDigits } from "@/lib/utils";

export type WhatsappSendOptions = {
  organization_id: string;
  to: string; // E.164 ou só dígitos
  text: string;
  /**
   * Serviço/número do Digisac a usar (SDR usa o "Comercial"; atendimento usa o
   * "Sac"). Se vazio, cai no service_id padrão salvo na integração.
   */
  serviceId?: string;
  /**
   * Força um provider específico (ignora a cascata). O Robô/Flow Builder usa
   * "digisac" pra responder pelo mesmo canal que recebeu — senão a cascata
   * poderia mandar por Evolution/Z-API e quebrar o eco do webhook.
   */
  provider?: "evolution" | "zapi" | "digisac";
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
  // Provider forçado (Robô força "digisac"): usa só ele, sem cascata.
  if (opts.provider) {
    const cfg = await getIntegration(opts.organization_id, opts.provider);
    if (!cfg)
      return {
        ok: false,
        provider: opts.provider,
        error: `WhatsApp: provider "${opts.provider}" não está configurado.`,
      };
    if (opts.provider === "evolution") return sendViaEvolution(opts, cfg);
    if (opts.provider === "zapi") return sendViaZapi(opts, cfg);
    return sendViaDigisac(opts, cfg);
  }

  const evo = await getIntegration(opts.organization_id, "evolution");
  if (evo) return sendViaEvolution(opts, evo);

  const zapi = await getIntegration(opts.organization_id, "zapi");
  if (zapi) return sendViaZapi(opts, zapi);

  const digisac = await getIntegration(opts.organization_id, "digisac");
  if (digisac) return sendViaDigisac(opts, digisac);

  return {
    ok: false,
    error:
      "WhatsApp não está configurado. Conecte Evolution API, Z-API ou DIGISAC em /app/admin/integracoes.",
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

async function sendViaDigisac(
  opts: WhatsappSendOptions,
  cfg: { credentials: Record<string, string> },
): Promise<WhatsappResult> {
  const base = String(cfg.credentials.base_url || "").replace(/\/+$/, "");
  const token = cfg.credentials.token;
  // SDR passa o serviceId do "Comercial"; senão usa o padrão salvo.
  const serviceId = opts.serviceId || cfg.credentials.service_id;
  if (!base || !token || !serviceId)
    return {
      ok: false,
      provider: "digisac",
      error: "DIGISAC: base_url, token ou service_id ausentes.",
    };
  try {
    const res = await fetch(`${base}/api/v1/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: opts.text,
        type: "chat",
        number: formatNumber(opts.to),
        serviceId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      return {
        ok: false,
        provider: "digisac",
        error: data?.message ?? `Erro ${res.status}`,
      };
    return {
      ok: true,
      provider: "digisac",
      provider_message_id: data?.id ?? data?.messageId,
    };
  } catch (e) {
    return {
      ok: false,
      provider: "digisac",
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
