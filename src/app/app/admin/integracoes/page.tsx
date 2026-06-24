import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { IntegrationsPanel } from "@/components/admin/integrations-panel";

export const dynamic = "force-dynamic";

export default async function IntegracoesPage() {
  const ctx = await requireRole(["owner", "admin"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("integrations")
    .select("id, provider, is_active, display_name, last_test_ok, settings, updated_at")
    .eq("organization_id", ctx.org.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Marketplace de integrações</h1>
          <p className="text-muted-foreground mt-1">
            Conecte Slack, Discord, Telegram, Twilio, WhatsApp, e-mail, calendários,
            IA, prospecção e disparo de webhooks pra n8n/Zapier/Make.
          </p>
        </div>
        <a
          href="/api-docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm rounded-md border border-white/10 px-3 py-1.5 hover:bg-white/5"
        >
          Ver API pública →
        </a>
      </div>
      <IntegrationsPanel
        existing={
          (data ?? []).reduce<Record<string, (typeof data)[number]>>((acc, i) => {
            acc[(i as { provider: string }).provider] = i;
            return acc;
          }, {})
        }
      />
    </div>
  );
}
