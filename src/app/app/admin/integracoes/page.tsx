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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Integrações</h1>
        <p className="text-muted-foreground mt-1">
          Conecte sua IA, e-mail, WhatsApp e bases de prospecção. Sem chave,
          essas funções ficam em modo manual.
        </p>
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
