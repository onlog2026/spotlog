import Link from "next/link";
import { Truck, ArrowRight } from "lucide-react";
import { requireClientSession } from "@/lib/auth-client";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type Shipment = {
  id: string;
  code: string | null;
  recipient_name: string | null;
  destination_address: string | null;
  status: string | null;
  created_at: string | null;
  sla_deadline: string | null;
  delivered_at: string | null;
};

export default async function PortalRemessasPage() {
  const ctx = await requireClientSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("shipments")
    .select(
      "id, code, recipient_name, destination_address, status, created_at, sla_deadline, delivered_at",
    )
    .eq("company_id", ctx.company.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const shipments = (data ?? []) as Shipment[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Truck className="h-6 w-6" />
          Minhas remessas
        </h1>
        <p className="text-muted-foreground">
          Acompanhe todas as suas entregas em tempo real
        </p>
      </div>

      {shipments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-3 opacity-30" />
            Nenhuma remessa registrada ainda.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-white/5">
            {shipments.map((s) => (
              <Link
                key={s.id}
                href={`/portal/remessas/${s.code ?? s.id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-white/5"
              >
                <div className="min-w-0">
                  <div className="font-semibold">{s.code ?? "Sem código"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {s.recipient_name ?? "—"}
                    {s.destination_address ? ` · ${s.destination_address}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="outline">{s.status ?? "—"}</Badge>
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
