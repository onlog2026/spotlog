/**
 * Telegram Bot API client.
 * Bot token from @BotFather. chat_id pode ser pessoal ou de grupo.
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<{ ok: boolean; error?: string; message_id?: number }> {
  if (!botToken || !chatId) {
    return { ok: false, error: "Bot token ou chat_id ausentes." };
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      description?: string;
      result?: { message_id?: number };
    };
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        error: data.description ?? `Telegram ${res.status}`,
      };
    }
    return { ok: true, message_id: data.result?.message_id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha de rede" };
  }
}
