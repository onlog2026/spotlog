import Link from "next/link";
import { Bell, CheckCheck, ArrowRight } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { marcarTodasLidas } from "./actions";

export const dynamic = "force-dynamic";

type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean | null;
  created_at: string | null;
};

async function loadNotifs(orgId: string, userId: string): Promise<Notif[]> {
  const supabase = await createClient();
  // Try direct table first
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, kind, title, body, link, is_read, created_at")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && data) return data as unknown as Notif[];
  } catch {
    // ignore
  }
  // Fallback RPC
  try {
    const { data } = await supabase.rpc("notif_list", {
      p_org: orgId,
      p_user: userId,
      p_limit: 100,
    });
    return ((data as unknown) as Notif[]) ?? [];
  } catch {
    return [];
  }
}

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const dd = Math.floor(h / 24);
  if (dd < 30) return `${dd} d`;
  return d.toLocaleDateString("pt-BR");
}

const KIND_BADGE: Record<string, { label: string; v: string }> = {
  lead: { label: "Lead", v: "default" },
  deal: { label: "Negócio", v: "success" },
  ticket: { label: "Ticket", v: "warning" },
  proposal: { label: "Proposta", v: "outline" },
  chatbot: { label: "Chatbot", v: "secondary" },
};

export default async function NotificacoesPage() {
  let ctx;
  try {
    ctx = await requireSession();
  } catch {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Notificações</h1>
        <Card className="border-white/10 bg-card/50">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Faça login para ver suas notificações.
          </CardContent>
        </Card>
      </div>
    );
  }

  const list = await loadNotifs(ctx.org.id, ctx.user.id);
  const unread = list.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-brand-400" /> Notificações
          </h1>
          <p className="text-muted-foreground mt-1">
            {unread > 0
              ? `${unread} não lida${unread === 1 ? "" : "s"}`
              : "Tudo em dia."}
          </p>
        </div>
        {unread > 0 && (
          <form action={marcarTodasLidas}>
            <Button variant="outline" type="submit">
              <CheckCheck className="h-4 w-4" /> Marcar todas como lidas
            </Button>
          </form>
        )}
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Histórico</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-brand/15 mb-4">
                <Bell className="h-7 w-7 text-brand-400" />
              </div>
              <h3 className="font-semibold text-lg">Sem notificações</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Quando houver leads novos, tickets, propostas aceitas ou
                atividades importantes, elas aparecem aqui.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {list.map((n) => {
                const k = KIND_BADGE[n.kind] ?? {
                  label: n.kind,
                  v: "outline" as const,
                };
                return (
                  <li
                    key={n.id}
                    className={`p-4 hover:bg-white/5 transition-colors ${
                      !n.is_read ? "bg-brand-500/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                          !n.is_read ? "bg-brand-400" : "bg-white/20"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={
                              k.v as
                                | "default"
                                | "secondary"
                                | "outline"
                                | "success"
                                | "warning"
                                | "destructive"
                            }
                            className="text-[10px]"
                          >
                            {k.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(n.created_at)}
                          </span>
                        </div>
                        <div className="font-medium mt-1">{n.title}</div>
                        {n.body && (
                          <p className="text-sm text-muted-foreground mt-0.5 break-words">
                            {n.body}
                          </p>
                        )}
                        {n.link && (
                          <Link
                            href={n.link}
                            className="text-brand-400 hover:underline text-xs flex items-center gap-1 mt-2"
                          >
                            Abrir <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
