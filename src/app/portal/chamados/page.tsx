import Link from "next/link";
import { Headphones, Plus, ArrowRight } from "lucide-react";
import { requireClientSession } from "@/lib/auth-client";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type Ticket = {
  id: string;
  protocol: string;
  subject: string;
  category: string | null;
  status: string;
  priority: string | null;
  opened_at: string | null;
  created_at: string | null;
};

export default async function PortalChamadosPage() {
  const ctx = await requireClientSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_tickets")
    .select(
      "id, protocol, subject, category, status, priority, opened_at, created_at",
    )
    .eq("company_id", ctx.company.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const tickets = (data ?? []) as Ticket[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Headphones className="h-6 w-6" />
            Meus chamados
          </h1>
          <p className="text-muted-foreground">
            Suporte da sua transportadora
          </p>
        </div>
        <Button asChild variant="orange">
          <Link href="/portal/chamados/novo">
            <Plus className="h-4 w-4 mr-1" /> Abrir chamado
          </Link>
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Headphones className="h-12 w-12 mx-auto mb-3 opacity-30" />
            Você ainda não abriu nenhum chamado.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-white/5">
            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/portal/chamados/${t.protocol}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-white/5"
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate">{t.subject}</div>
                  <div className="text-xs text-muted-foreground">
                    #{t.protocol}
                    {t.category ? ` · ${t.category}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="outline">{t.status}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
