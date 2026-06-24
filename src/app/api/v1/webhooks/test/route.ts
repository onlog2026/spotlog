import { type NextRequest } from "next/server";
import { guardV1, v1Json, v1Options } from "../../_lib";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/webhooks/test — echo do payload pra validação Zapier/n8n/Make.
 * Retorna 200 com o payload recebido + headers + timestamp.
 */
export async function POST(req: NextRequest) {
  const guard = await guardV1(req);
  if ("error" in guard) return guard.error;
  const body = await req.json().catch(() => null);
  return v1Json({
    ok: true,
    received: body,
    organization_id: guard.ctx.orgId,
    api_key_id: guard.ctx.apiKeyId,
    timestamp: new Date().toISOString(),
  });
}

export { v1Options as OPTIONS };
