import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SequenceStepsEditor } from "@/components/sequences/steps-editor";

export const dynamic = "force-dynamic";

export default async function CadenciaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireSession();
  const { id } = await params;
  const supabase = await createClient();

  const { data: seq } = await supabase
    .from("sequences")
    .select("*")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!seq) notFound();

  const { data: steps } = await supabase
    .from("sequence_steps")
    .select("*")
    .eq("sequence_id", id)
    .order("position");

  const { count: enrolledCount } = await supabase
    .from("sequence_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("sequence_id", id)
    .eq("status", "active");

  const s = seq as unknown as {
    id: string;
    name: string;
    description: string | null;
    default_channel: string;
    is_active: boolean;
    ai_prompt: string | null;
  };

  return (
    <div className="space-y-6">
      <Link
        href="/app/cadencias"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <ArrowLeft className="h-3 w-3" /> Cadências
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Send className="h-6 w-6 text-brand-400" />
            {s.name}
          </h1>
          {s.description && (
            <p className="text-muted-foreground mt-1">{s.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {enrolledCount ?? 0} contatos ativos
          </div>
          <Badge variant={s.is_active ? "success" : "secondary"}>
            {s.is_active ? "Ativa" : "Pausada"}
          </Badge>
        </div>
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle>Passos</CardTitle>
        </CardHeader>
        <CardContent>
          <SequenceStepsEditor
            sequenceId={id}
            defaultChannel={s.default_channel as "email" | "whatsapp"}
            initialSteps={
              (steps ?? []) as unknown as Array<{
                id: string;
                position: number;
                kind: string;
                wait_days: number;
                wait_hours: number;
                subject: string | null;
                body: string | null;
              }>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
