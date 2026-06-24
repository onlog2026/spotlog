import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NewDealForm } from "@/components/pipeline/new-deal-form";

export const dynamic = "force-dynamic";

export default async function NewDealPage() {
  const ctx = await requireSession();
  const supabase = await createClient();

  const [pipelines, stages, companies, contacts, members] = await Promise.all([
    supabase
      .from("pipelines")
      .select("id, name")
      .eq("organization_id", ctx.org.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("pipeline_stages")
      .select("id, name, pipeline_id, position")
      .order("position", { ascending: true }),
    supabase
      .from("companies")
      .select("id, name")
      .eq("organization_id", ctx.org.id)
      .order("name", { ascending: true })
      .limit(500),
    supabase
      .from("contacts")
      .select("id, full_name, email")
      .eq("organization_id", ctx.org.id)
      .order("full_name", { ascending: true })
      .limit(500),
    supabase
      .from("organization_members")
      .select("user_id, role")
      .eq("organization_id", ctx.org.id),
  ]);

  // Buscar profiles dos members em batch
  const memberIds = (members.data ?? []).map((m: { user_id: string }) => m.user_id);
  const { data: profiles } = memberIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", memberIds)
    : { data: [] };

  const memberOptions = (members.data ?? []).map((m: { user_id: string; role: string }) => {
    const p = (profiles ?? []).find((x: { id: string }) => x.id === m.user_id) as
      | { id: string; full_name: string | null; email: string | null }
      | undefined;
    return {
      user_id: m.user_id,
      label: p?.full_name ?? p?.email ?? `Membro ${m.user_id.slice(0, 6)}`,
      role: m.role,
    };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/app/pipeline"
          className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-spotorange-600 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar pro pipeline
        </Link>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-spotorange-500/15 text-spotorange-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Nova negociação</h1>
            <p className="text-sm text-muted-foreground">
              Crie um deal e coloca direto na etapa do pipeline
            </p>
          </div>
        </div>
      </div>

      <NewDealForm
        pipelines={(pipelines.data ?? []) as { id: string; name: string }[]}
        stages={
          (stages.data ?? []) as {
            id: string;
            name: string;
            pipeline_id: string;
            position: number;
          }[]
        }
        companies={(companies.data ?? []) as { id: string; name: string }[]}
        contacts={
          (contacts.data ?? []) as {
            id: string;
            full_name: string;
            email: string | null;
          }[]
        }
        members={memberOptions}
        currentUserId={ctx.user.id}
      />
    </div>
  );
}
