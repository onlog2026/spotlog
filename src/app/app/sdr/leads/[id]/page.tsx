import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Mail, Phone, MapPin } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getSdrClient } from "@/lib/sdr/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GenerateSequenceButton } from "@/components/sdr/generate-sequence-button";

export const dynamic = "force-dynamic";

interface ScoreReason {
  label: string;
  points: number;
}

export default async function SdrLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireSession();
  const supabase = await getSdrClient();

  const { data: lead } = await supabase
    .from("leads")
    .select(
      "id, full_name, email, phone, company_name, job_title, status, source, source_detail, score, created_at, custom_fields",
    )
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();

  if (!lead) notFound();

  const cnpj = (lead.custom_fields as Record<string, unknown> | null)?.cnpj as
    | string
    | undefined;

  // Company + enrichment
  let company: {
    name: string;
    legal_name: string | null;
    cnpj: string | null;
    industry: string | null;
    city: string | null;
    state: string | null;
    phone: string | null;
    website: string | null;
  } | null = null;
  let enrichment: Record<string, unknown> | null = null;
  if (lead.company_name) {
    const { data: c } = await supabase
      .from("companies")
      .select("name, legal_name, cnpj, industry, city, state, phone, website")
      .eq("organization_id", ctx.org.id)
      .ilike("name", lead.company_name)
      .maybeSingle();
    company = c;
    if (c?.cnpj) {
      const { data: enr } = await supabase
        .from("company_enrichment")
        .select("enriched_data")
        .eq("organization_id", ctx.org.id)
        .eq("cnpj", c.cnpj)
        .maybeSingle();
      enrichment = enr?.enriched_data as Record<string, unknown> | null;
    }
  }

  // Latest score
  const { data: scoreRow } = await supabase
    .from("lead_scores")
    .select("score, reasons, computed_at")
    .eq("lead_id", lead.id)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const reasons = (scoreRow?.reasons as ScoreReason[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/app/sdr/leads"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar para Leads SDR
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-white/10 bg-card/50">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-spotorange-500 font-semibold">
                    {lead.source}
                  </div>
                  <h2 className="text-2xl font-bold mt-1">
                    {lead.company_name ?? "Empresa sem nome"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lead.full_name ?? "Contato não identificado"}
                    {lead.job_title ? ` · ${lead.job_title}` : ""}
                  </p>
                </div>
                <Badge variant={lead.score && lead.score >= 60 ? "success" : "outline"}>
                  Score {lead.score ?? "—"}
                </Badge>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-2 text-sm">
                {lead.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" /> {lead.email}
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" /> {lead.phone}
                  </div>
                )}
                {(company?.city || company?.state) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />{" "}
                    {[company?.city, company?.state].filter(Boolean).join("/")}
                  </div>
                )}
                {(company?.cnpj || cnpj) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" /> CNPJ{" "}
                    {formatCnpj(company?.cnpj || cnpj || "")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-card/50">
            <CardContent className="p-6 space-y-3">
              <h3 className="font-semibold">Gerar sequência outbound (IA)</h3>
              <p className="text-sm text-muted-foreground">
                3 e-mails personalizados com base no segmento, porte e
                localização. Tom consultivo brasileiro, sem hard-sell, sem
                promessa de SLA/preço/certificação.
              </p>
              <GenerateSequenceButton leadId={lead.id} />
            </CardContent>
          </Card>

          {enrichment && (
            <Card className="border-white/10 bg-card/50">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold">Enrichment</h3>
                <EnrichmentView data={enrichment} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-white/10 bg-card/50">
            <CardContent className="p-6 space-y-3">
              <h3 className="font-semibold">Score breakdown</h3>
              {reasons.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Score ainda não calculado. Use o botão na lista de leads para
                  recalcular.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {reasons.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-muted-foreground">{r.label}</span>
                      <Badge
                        variant={r.points > 0 ? "success" : "destructive"}
                        className="text-[10px]"
                      >
                        {r.points > 0 ? `+${r.points}` : r.points}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 text-xs text-amber-200">
              Dados de contato tratados sob{" "}
              <strong>interesse legítimo</strong> (LGPD Art. 7º, IX). Verifique
              consentimento antes do envio em{" "}
              <Link className="underline" href="/app/sdr/lgpd">
                /app/sdr/lgpd
              </Link>
              .
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatCnpj(cnpj: string): string {
  const c = cnpj.replace(/\D/g, "").padStart(14, "0");
  if (c.length !== 14) return cnpj;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}

function EnrichmentView({ data }: { data: Record<string, unknown> }) {
  const fields: Array<{ label: string; value: string | undefined }> = [
    { label: "Razão social", value: str(data.razao_social) },
    { label: "Nome fantasia", value: str(data.nome_fantasia) },
    { label: "CNAE", value: str(data.cnae_descricao) },
    { label: "Porte", value: str(data.porte) },
    {
      label: "Capital social",
      value: data.capital_social
        ? `R$ ${Number(data.capital_social).toLocaleString("pt-BR")}`
        : undefined,
    },
    { label: "Situação", value: str(data.situacao) },
    { label: "Início atividade", value: str(data.data_inicio) },
    { label: "Telefone", value: str(data.telefone) },
    { label: "E-mail", value: str(data.email) },
  ];

  const endereco = data.endereco as Record<string, unknown> | undefined;
  const enderecoFmt = endereco
    ? [
        endereco.logradouro,
        endereco.numero,
        endereco.bairro,
        endereco.municipio,
        endereco.uf,
        endereco.cep,
      ]
        .filter(Boolean)
        .join(", ")
    : undefined;
  if (enderecoFmt) fields.push({ label: "Endereço", value: enderecoFmt });

  const socios = data.socios as Array<Record<string, unknown>> | undefined;

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {fields
          .filter((f) => f.value)
          .map((f) => (
            <div key={f.label}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {f.label}
              </div>
              <div className="text-foreground">{f.value}</div>
            </div>
          ))}
      </div>
      {socios && socios.length > 0 && (
        <div className="pt-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Sócios
          </div>
          <ul className="text-sm space-y-1">
            {socios.slice(0, 5).map((s, i) => (
              <li key={i}>
                <span className="font-medium">{str(s.nome) ?? "—"}</span>
                {s.qualificacao ? (
                  <span className="text-muted-foreground text-xs">
                    {" "}
                    · {str(s.qualificacao)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function str(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s.length > 0 ? s : undefined;
}
