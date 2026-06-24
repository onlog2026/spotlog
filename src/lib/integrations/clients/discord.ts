/**
 * Discord webhook notification client.
 * Use a Channel Webhook URL.
 */
export async function sendDiscordNotification(
  webhookUrl: string,
  content: string,
  embeds?: unknown[],
): Promise<{ ok: boolean; error?: string }> {
  if (!webhookUrl) return { ok: false, error: "Webhook URL ausente." };
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(embeds ? { content, embeds } : { content }),
    });
    if (!res.ok && res.status !== 204) {
      const err = await res.text().catch(() => "");
      return { ok: false, error: `Discord ${res.status}: ${err}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha de rede" };
  }
}
