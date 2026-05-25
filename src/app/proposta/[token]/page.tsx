import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AcceptProposal } from "@/components/proposals/accept-proposal";

export const dynamic = "force-dynamic";

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: prop } = await admin
    .from("proposals")
    .select(
      "*, items:proposal_items(*), organization:organizations(name, logo_url), company:companies(name), contact:contacts(full_name, email)",
    )
    .eq("public_token", token)
    .maybeSingle();

  if (!prop) notFound();

  // Marca como visualizada (idempotente; só atualiza primeira vez)
  if (!(prop as { viewed_at: string | null }).viewed_at) {
    await admin
      .from("proposals")
      .update({
        viewed_at: new Date().toISOString(),
        status:
          (prop as { status: string }).status === "draft"
            ? "viewed"
            : (prop as { status: string }).status,
      })
      .eq("public_token", token);
  }

  const p = prop as unknown as {
    id: string;
    number: number;
    title: string;
    status: string;
    intro_text: string | null;
    scope: string | null;
    payment_terms: string | null;
    delivery_terms: string | null;
    validity_days: number;
    subtotal: number;
    discount_amount: number;
    discount_pct: number;
    total: number;
    currency: string;
    expires_at: string | null;
    signed_at: string | null;
    signed_by_name: string | null;
    public_token: string;
    items: Array<{
      id: string;
      position: number;
      name: string;
      description: string | null;
      quantity: number;
      unit: string;
      unit_price: number;
      discount_pct: number;
      total: number;
    }>;
    organization: { name: string; logo_url: string | null } | null;
    company: { name: string } | null;
    contact: { full_name: string; email: string } | null;
  };

  const accepted = p.status === "accepted";
  const expired = p.expires_at && new Date(p.expires_at) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-brand-950/30 to-slate-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {p.organization?.logo_url ? (
              <Image
                src={p.organization.logo_url}
                width={40}
                height={40}
                alt={p.organization.name}
                className="rounded-lg"
              />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-brand">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <div className="font-bold">{p.organization?.name}</div>
              <div className="text-xs text-muted-foreground">
                Proposta #{p.number}
              </div>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Powered by Spotlog
          </Link>
        </header>

        <div className="glass-strong rounded-2xl p-8 md:p-12 space-y-8">
          <div>
            <div className="text-xs text-muted-foreground mb-2">Proposta</div>
            <h1 className="text-3xl md:text-4xl font-bold">{p.title}</h1>
            <div className="text-sm text-muted-foreground mt-2">
              Para{" "}
              <span className="font-medium">
                {p.contact?.full_name ?? p.company?.name}
              </span>
              {p.expires_at && (
                <> · Válida até {formatDate(p.expires_at)}</>
              )}
            </div>
          </div>

          {p.intro_text && (
            <p className="text-muted-foreground leading-relaxed">
              {p.intro_text}
            </p>
          )}

          <div>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
              Itens
            </h2>
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-3 font-medium">Item</th>
                    <th className="text-right p-3 font-medium">Qtd</th>
                    <th className="text-right p-3 font-medium">Unit.</th>
                    <th className="text-right p-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {p.items
                    .sort((a, b) => a.position - b.position)
                    .map((it) => (
                      <tr
                        key={it.id}
                        className="border-t border-white/5"
                      >
                        <td className="p-3">
                          <div className="font-medium">{it.name}</div>
                          {it.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {it.description}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right">{it.quantity}</td>
                        <td className="p-3 text-right text-muted-foreground">
                          {formatCurrency(Number(it.unit_price), p.currency)}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(Number(it.total), p.currency)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="space-y-1 text-sm w-64">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(Number(p.subtotal), p.currency)}</span>
              </div>
              {p.discount_amount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Desconto ({p.discount_pct}%)</span>
                  <span>
                    -{formatCurrency(Number(p.discount_amount), p.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                <span>Total</span>
                <span className="text-gradient">
                  {formatCurrency(Number(p.total), p.currency)}
                </span>
              </div>
            </div>
          </div>

          {(p.payment_terms || p.delivery_terms || p.scope) && (
            <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-white/10">
              {p.payment_terms && (
                <div>
                  <h3 className="font-semibold text-sm mb-1">Pagamento</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {p.payment_terms}
                  </p>
                </div>
              )}
              {p.delivery_terms && (
                <div>
                  <h3 className="font-semibold text-sm mb-1">Entrega</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {p.delivery_terms}
                  </p>
                </div>
              )}
              {p.scope && (
                <div className="sm:col-span-2">
                  <h3 className="font-semibold text-sm mb-1">Escopo</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {p.scope}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="pt-8 border-t border-white/10">
            {accepted ? (
              <div className="text-center py-6">
                <div className="text-emerald-400 font-semibold text-lg">
                  ✓ Proposta aceita
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Assinada por {p.signed_by_name} em{" "}
                  {p.signed_at &&
                    formatDate(p.signed_at)}
                </div>
              </div>
            ) : expired ? (
              <div className="text-center py-6 text-amber-400 font-semibold">
                Esta proposta expirou. Solicite uma nova.
              </div>
            ) : (
              <AcceptProposal
                token={p.public_token}
                contactName={p.contact?.full_name ?? null}
                contactEmail={p.contact?.email ?? null}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
