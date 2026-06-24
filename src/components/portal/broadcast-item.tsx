"use client";
import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, MailOpen, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Broadcast = {
  id: string;
  title: string;
  body: string;
  audience: string;
  created_at: string;
  read_at: string | null;
  sender: string | null;
};

export function BroadcastItem({ broadcast }: { broadcast: Broadcast }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(!!broadcast.read_at);
  const [, startTransition] = useTransition();

  const audienceLabel: Record<string, string> = {
    all_clients: "Todos os clientes",
    specific_company: "Sua empresa",
    specific_org: "Sua transportadora",
    all_orgs: "Todas as transportadoras",
  };

  async function toggle() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && !read) {
      setRead(true);
      startTransition(async () => {
        try {
          await fetch("/api/portal/broadcasts/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ broadcast_id: broadcast.id }),
          });
        } catch {
          /* ignore */
        }
      });
    }
  }

  const created = new Date(broadcast.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className={cn(!read && "border-spotorange-500/40 bg-spotorange-50/30")}>
      <CardContent className="p-4">
        <button
          onClick={toggle}
          className="w-full text-left flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                "grid h-10 w-10 place-items-center rounded-md shrink-0",
                read ? "bg-navy-50 text-navy-900" : "bg-spotorange-100 text-spotorange-700",
              )}
            >
              {read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base">{broadcast.title}</h3>
                {!read && (
                  <Badge variant="default" className="text-[10px] bg-red-600">
                    Novo
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {audienceLabel[broadcast.audience] ?? broadcast.audience} ·{" "}
                {created}
                {broadcast.sender ? ` · de ${broadcast.sender}` : ""}
              </div>
            </div>
          </div>
          {open ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>
        {open && (
          <div className="mt-4 pl-13 whitespace-pre-wrap text-sm text-foreground leading-relaxed border-t border-white/5 pt-4">
            {broadcast.body}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
