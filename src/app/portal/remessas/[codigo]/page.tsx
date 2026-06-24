import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Truck, MapPin, User, Calendar } from "lucide-react";
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

export default async function RemessaDetalhePage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const ctx = await requireClientSession();
  const { codigo } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("shipments")
    .select("*")
    .eq("company_id", ctx.company.id)
    .or(`code.eq.${codigo},id.eq.${codigo}`)
    .maybeSingle();
  if (!data) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <Button asChild variant="ghost" size="sm">
        <Link href="/portal/remessas">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Remessa {(data as { code?: string }).code ?? codigo}
        </h1>
        <Badge variant="outline" className="mt-2">
          {(data as { status?: string }).status ?? "—"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" /> Destinatário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{(data as { recipient_name?: string }).recipient_name ?? "—"}</p>
          <p className="text-muted-foreground">
            {(data as { recipient_phone?: string }).recipient_phone ?? ""}
          </p>
          <p className="text-muted-foreground">
            {(data as { recipient_email?: string }).recipient_email ?? ""}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{(data as { destination_address?: string }).destination_address ?? "—"}</p>
          {(data as { sla_deadline?: string }).sla_deadline && (
            <p className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> SLA até{" "}
              {new Date(
                (data as { sla_deadline: string }).sla_deadline,
              ).toLocaleString("pt-BR")}
            </p>
          )}
          {(data as { delivered_at?: string }).delivered_at && (
            <p className="text-emerald-600 flex items-center gap-1">
              <Truck className="h-3 w-3" /> Entregue em{" "}
              {new Date(
                (data as { delivered_at: string }).delivered_at,
              ).toLocaleString("pt-BR")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
