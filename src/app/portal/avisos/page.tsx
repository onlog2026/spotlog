import { Megaphone } from "lucide-react";
import { requireClientSession } from "@/lib/auth-client";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { BroadcastItem } from "@/components/portal/broadcast-item";

export const dynamic = "force-dynamic";

type Broadcast = {
  id: string;
  title: string;
  body: string;
  audience: string;
  created_at: string;
  read_at: string | null;
  sender: string | null;
};

export default async function AvisosPage() {
  const ctx = await requireClientSession();
  const supabase = await createClient();
  // @ts-expect-error rpc dinâmico
  const { data } = await supabase.rpc("portal_list_broadcasts", {
    p_user: ctx.user.id,
  });
  const broadcasts = ((data ?? []) as Broadcast[]) || [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone className="h-6 w-6" />
          Avisos da plataforma
        </h1>
        <p className="text-muted-foreground">
          Comunicados oficiais da Spotlog e da sua transportadora
        </p>
      </div>

      {broadcasts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
            Nenhum aviso recebido até agora.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b) => (
            <BroadcastItem key={b.id} broadcast={b} />
          ))}
        </div>
      )}
    </div>
  );
}
