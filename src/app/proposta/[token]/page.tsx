import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AcceptProposal } from "@/components/proposals/accept-proposal";
import { TemplatePackageSection } from "@/components/proposals/template-package-section";
import type { TemplateRegionRow } from "@/lib/proposal-templates";

export const dynamic = "force-dynamic";

const NAVY = "#011960";
const RED = "#BA0102";

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
    template_id: string | null;
    reajuste_pct: number | null;
  };

  const accepted = p.status === "accepted";
  const expired = p.expires_at && new Date(p.expires_at) < new Date();

  let templatePackage: {
    name: string;
    regions: TemplateRegionRow[];
    rules: Array<{ codigo: string; descricao: string }>;
  } | null = null;
  if (p.template_id) {
    const [{ data: tpl }, { data: regionRows }, { data: ruleRows }] = await Promise.all([
      admin.from("proposal_templates").select("name").eq("id", p.template_id).maybeSingle(),
      admin
        .from("proposal_template_regions")
        .select("uf, cidade, regiao, cep_inicio, cep_fim, prazo_entrega, precos")
        .eq("template_id", p.template_id)
        .order("position"),
      admin
        .from("proposal_template_rules")
        .select("codigo, descricao")
        .eq("template_id", p.template_id)
        .order("position"),
    ]);
    if (tpl) {
      templatePackage = {
        name: (tpl as { name: string }).name,
        regions: (regionRows ?? []) as unknown as TemplateRegionRow[],
        rules: (ruleRows ?? []) as Array<{ codigo: string; descricao: string }>,
      };
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className={templatePackage ? "max-w-5xl mx-auto" : "max-w-3xl mx-auto"}>
        <header className="flex items-center justify-between mb-6">
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
              <div
                className="grid h-10 w-10 place-items-center rounded-lg font-bold text-white"
                style={{ background: NAVY }}
              >
                {p.organization?.name?.[0] ?? "S"}
              </div>
            )}
            <div>
              <div className="font-bold text-slate-900">{p.organization?.name}</div>
              <div className="text-xs text-slate-500">Proposta #{p.number}</div>
            </div>
          </div>
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">
            Powered by Spotlog
          </Link>
        </header>

        <div className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 overflow-hidden">
          <div style={{ background: NAVY }} className="px-8 py-6 md:px-12">
            <div className="text-xs uppercase tracking-wider text-white/60 mb-1">
              Proposta comercial
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{p.title}</h1>
            <div className="text-sm text-white/70 mt-2">
              Para <span className="font-medium text-white">{p.contact?.full_name ?? p.company?.name}</span>
              {p.expires_at && <> · Válida até {formatDate(p.expires_at)}</>}
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-8">
            {p.intro_text && (
              <p className="text-slate-700 leading-relaxed">{p.intro_text}</p>
            )}

            <div>
              <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
                Itens
              </h2>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead style={{ background: "#f1f5f9" }}>
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-700">Item</th>
                      <th className="text-right p-3 font-semibold text-slate-700">Qtd</th>
                      <th className="text-right p-3 font-semibold text-slate-700">Unit.</th>
                      <th className="text-right p-3 font-semibold text-slate-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.items
                      .sort((a, b) => a.position - b.position)
                      .map((it) => (
                        <tr key={it.id} className="border-t border-slate-100">
                          <td className="p-3">
                            <div className="font-medium text-slate-900">{it.name}</div>
                            {it.description && (
                              <div className="text-xs text-slate-500 mt-0.5">{it.description}</div>
                            )}
                          </td>
                          <td className="p-3 text-right text-slate-700">{it.quantity}</td>
                          <td className="p-3 text-right text-slate-500">
                            {formatCurrency(Number(it.unit_price), p.currency)}
                          </td>
                          <td className="p-3 text-right font-medium text-slate-900">
                            {formatCurrency(Number(it.total), p.currency)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="space-y-1.5 text-sm w-64">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(p.subtotal), p.currency)}</span>
                </div>
                {p.discount_amount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Desconto ({p.discount_pct}%)</span>
                    <span>-{formatCurrency(Number(p.discount_amount), p.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                  <span className="text-slate-900">Total</span>
                  <span style={{ color: RED }}>
                    {formatCurrency(Number(p.total), p.currency)}
                  </span>
                </div>
              </div>
            </div>

            {templatePackage && (
              <TemplatePackageSection
                templateName={templatePackage.name}
                regions={templatePackage.regions}
                rules={templatePackage.rules}
                reajustePct={p.reajuste_pct ?? 0}
              />
            )}

            {(p.payment_terms || p.delivery_terms || p.scope) && (
              <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                {p.payment_terms && (
                  <div>
                    <h3 className="font-semibold text-sm mb-1 text-slate-900">Pagamento</h3>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{p.payment_terms}</p>
                  </div>
                )}
                {p.delivery_terms && (
                  <div>
                    <h3 className="font-semibold text-sm mb-1 text-slate-900">Entrega</h3>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{p.delivery_terms}</p>
                  </div>
                )}
                {p.scope && (
                  <div className="sm:col-span-2">
                    <h3 className="font-semibold text-sm mb-1 text-slate-900">Escopo</h3>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{p.scope}</p>
                  </div>
                )}
              </div>
            )}

            <div className="pt-8 border-t border-slate-200">
              {accepted ? (
                <div className="text-center py-6">
                  <div className="text-emerald-600 font-semibold text-lg">✓ Proposta aceita</div>
                  <div className="text-sm text-slate-500 mt-1">
                    Assinada por {p.signed_by_name} em {p.signed_at && formatDate(p.signed_at)}
                  </div>
                </div>
              ) : expired ? (
                <div className="text-center py-6 font-semibold" style={{ color: "#b45309" }}>
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
    </div>
  );
}
