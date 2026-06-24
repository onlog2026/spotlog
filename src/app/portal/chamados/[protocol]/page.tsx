import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Headphones } from "lucide-react";
import { requireClientSession } from "@/lib/auth-client";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ChamadoDetalhePage({
  params,
}: {
  params: Promise<{ protocol: string }>;
}) {
  const ctx = await requireClientSession();
  const { protocol } = await params;
  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("company_id", ctx.company.id)
    .eq("protocol", protocol)
    .maybeSingle();
  if (!ticket) notFound();

  const t = ticket as {
    id: string;
    subject: string;
    description: string | null;
    status: string;
    category: string | null;
    priority: string | null;
    protocol: string;
    created_at: string | null;
  };

  const { data: msgs } = await supabase
    .from("ticket_messages")
    .select("id, body, author_kind, created_at")
    .eq("ticket_id", t.id)
    .order("created_at", { ascending: true });

  const messages = (msgs ?? []) as Array<{
    id: string;
    body: string;
    author_kind: string | null;
    created_at: string;
  }>;

  return (
    <div className="space-y-6 max-w-3xl">
      <Button asChild variant="ghost" size="sm">
        <Link href="/portal/chamados">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Headphones className="h-6 w-6" /> {t.subject}
        </h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="outline">#{t.protocol}</Badge>
          <Badge>{t.status}</Badge>
          {t.priority && <Badge variant="outline">{t.priority}</Badge>}
          {t.category && <Badge variant="outline">{t.category}</Badge>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Descrição</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{t.description ?? "—"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de mensagens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma resposta ainda. A equipe responderá em breve.
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className="rounded-md border border-white/5 p-3 text-sm"
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {m.author_kind ?? "Sistema"} ·{" "}
                  {new Date(m.created_at).toLocaleString("pt-BR")}
                </div>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
