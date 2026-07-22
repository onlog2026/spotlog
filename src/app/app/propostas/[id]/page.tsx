import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, MessageCircle, Copy, Sparkles } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShareProposalActions } from "@/components/proposals/share-proposal-actions";
import { ProposalItemsEditor } from "@/components/proposals/proposal-items-editor";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireSession();
  const { id } = await params;
  const supabase = await createClient();

  const { data: prop } = await supabase
    .from("proposals")
    .select(
      "*, contact:contacts(full_name, email, whatsapp, phone), company:companies(name)",
    )
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!prop) notFound();

  const p = prop as unknown as {
    id: string;
    number: number;
    title: string;
    status: string;
    total: number;
    currency: string;
    public_token: string;
    discount_pct: number | null;
    sent_at: string | null;
    viewed_at: string | null;
    signed_at: string | null;
    signed_by_name: string | null;
    contact: { full_name: string; email: string; whatsapp: string; phone: string } | null;
    company: { name: string } | null;
  };

  const { data: itemRows } = await supabase
    .from("proposal_items")
    .select("product_id, name, description, quantity, unit_price, discount_pct")
    .eq("proposal_id", id)
    .order("position");

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/proposta/${p.public_token}`;

  return (
    <div className="space-y-6">
      <Link
        href="/app/propostas"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <ArrowLeft className="h-3 w-3" /> Propostas
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs text-muted-foreground">#{p.number}</div>
          <h1 className="text-2xl md:text-3xl font-bold">{p.title}</h1>
          <div className="text-sm text-muted-foreground mt-1">
            Para {p.contact?.full_name ?? p.company?.name ?? "—"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={p.status === "accepted" ? "success" : "outline"}>
            {p.status}
          </Badge>
          <Button variant="outline" asChild>
            <Link href={`/app/propostas/${p.id}/ia`}>
              <Sparkles className="h-4 w-4" /> Editor IA
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" /> Ver pública
            </a>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle>Compartilhar</CardTitle>
          </CardHeader>
          <CardContent>
            <ShareProposalActions
              proposalId={p.id}
              publicUrl={publicUrl}
              contact={p.contact}
            />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gradient">
              {formatCurrency(Number(p.total), p.currency)}
            </div>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              {p.sent_at && <div>Enviada em {formatDateTime(p.sent_at)}</div>}
              {p.viewed_at && (
                <div>Visualizada em {formatDateTime(p.viewed_at)}</div>
              )}
              {p.signed_at && p.signed_by_name && (
                <div className="text-emerald-400">
                  Aceita por {p.signed_by_name} em{" "}
                  {formatDateTime(p.signed_at)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ProposalItemsEditor
        proposalId={p.id}
        initialItems={(itemRows ?? []) as unknown as Array<{
          product_id: string | null;
          name: string;
          description: string | null;
          quantity: number;
          unit_price: number;
          discount_pct: number;
        }>}
        initialDiscountPct={p.discount_pct ?? 0}
        readOnly={p.status === "accepted"}
      />
    </div>
  );
}
