/**
 * Slack webhook notification client.
 * Use an "Incoming Webhook" URL from https://api.slack.com/messaging/webhooks
 */
export async function sendSlackNotification(
  webhookUrl: string,
  text: string,
  blocks?: unknown[],
): Promise<{ ok: boolean; error?: string }> {
  if (!webhookUrl) return { ok: false, error: "Webhook URL ausente." };
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blocks ? { text, blocks } : { text }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      return { ok: false, error: `Slack ${res.status}: ${err}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha de rede" };
  }
}
