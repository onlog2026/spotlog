import { Inbox } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const ctx = await requireSession();
  const supabase = await createClient();
  const { data: convs } = await supabase
    .from("conversations")
    .select(
      "id, channel, subject, last_message_at, unread_count, is_open, contact:contacts(full_name, email)",
    )
    .eq("organization_id", ctx.org.id)
    .order("last_message_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Inbox</h1>
        <p className="text-muted-foreground mt-1">
          Conversas centralizadas — e-mail, WhatsApp, formulário.
        </p>
      </div>

      {!convs || convs.length === 0 ? (
        <div className="text-center py-16 max-w-md mx-auto">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-brand/15 mb-4">
            <Inbox className="h-7 w-7 text-brand-400" />
          </div>
          <h3 className="font-semibold text-lg">Inbox vazia</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Quando seus contatos responderem às cadências ou formulários,
            aparecem aqui.
          </p>
        </div>
      ) : (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-0">
            <ul className="divide-y divide-white/5">
              {convs.map((c) => {
                const co = c as unknown as {
                  id: string;
                  channel: string;
                  subject: string | null;
                  last_message_at: string;
                  unread_count: number;
                  contact: { full_name: string; email: string } | null;
                };
                return (
                  <li
                    key={co.id}
                    className="p-4 flex items-center gap-4 hover:bg-white/5"
                  >
                    <Badge variant="outline" className="text-[10px]">
                      {co.channel}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {co.contact?.full_name ?? co.subject ?? "Sem nome"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {co.subject ?? co.contact?.email}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(co.last_message_at)}
                    </div>
                    {co.unread_count > 0 && (
                      <Badge variant="gradient">{co.unread_count}</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
