/**
 * Twilio SMS client.
 * Requires Account SID, Auth Token, and a "from" phone number (E.164).
 */
export async function sendSms(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string,
): Promise<{ ok: boolean; error?: string; sid?: string }> {
  if (!accountSid || !authToken || !from || !to) {
    return { ok: false, error: "Credenciais Twilio incompletas." };
  }
  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const params = new URLSearchParams({ From: from, To: to, Body: body });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      sid?: string;
      message?: string;
    };
    if (!res.ok) {
      return { ok: false, error: data.message ?? `Twilio ${res.status}` };
    }
    return { ok: true, sid: data.sid };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha de rede" };
  }
}
