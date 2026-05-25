import { NewCampaignForm } from "@/components/prospecting/new-campaign-form";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NovaCampanhaPage() {
  const ctx = await requireSession();
  const supabase = await createClient();

  const [{ data: sequences }, { data: integrations }] = await Promise.all([
    supabase
      .from("sequences")
      .select("id, name")
      .eq("organization_id", ctx.org.id)
      .eq("is_active", true),
    supabase
      .from("integrations")
      .select("provider, is_active")
      .eq("organization_id", ctx.org.id)
      .eq("is_active", true),
  ]);

  const enabledSources = (integrations ?? []).map(
    (i) => (i as { provider: string }).provider,
  );
  const possibleSources = ["apollo", "google_places"].filter((s) =>
    enabledSources.includes(s),
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Nova campanha</h1>
        <p className="text-muted-foreground mt-1">
          Defina quem o agente deve procurar. Quanto mais específico o ICP,
          melhor o resultado.
        </p>
      </div>
      <NewCampaignForm
        sequences={(sequences ?? []) as never}
        availableSources={possibleSources}
      />
    </div>
  );
}
