import Link from "next/link";
import {
  Users,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getSdrClient } from "@/lib/sdr/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RepliedQueue, type RepliedItem } from "@/components/sdr/replied-queue";
import { AiConvos, type AiConvoItem } from "@/components/sdr/ai-convos";
import { BrainPanel } from "@/components/sdr/brain-panel";
import { getBrainStats } from "@/lib/sdr/brain";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function SdrDashboardPage() {
  const ctx = await requireSession();
  const supabase = await getSdrClient();

  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).toISOString();

  const [
    { count: totalSdrLeads },
    { count: qualified },
    { count: inSequence },
    { count: leadsFound },
    { count: optOutsThisMonth },
    { count: pendingQueue },
    { count: enriched },
    { data: repliedRows },
    { count: meetingsBooked },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .in("source", ["enrichment", "sdr_outbound", "prospecting"]),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .gte("score", 60)
      .in("source", ["enrichment", "sdr_outbound", "prospecting"]),
    supabase
      .from("sequence_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .eq("status", "active"),
    supabase
      // SDR isolado do Digisac: usa a prospecção, NÃO o inbox (conversations).
      .from("prospecting_results")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id),
    supabase
      .from("lead_consents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .eq("consent_type", "opt_out")
      .gte("recorded_at", startOfMonth),
    supabase
      .from("outbound_queue")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .eq("status", "pendente"),
    supabase
      .from("company_enrichment")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id),
    supabase
      // Fila "Responderam": cadência parada pelo webhook ao receber resposta.
      .from("sequence_enrollments")
      .select(
        "id, finished_at, contacts(full_name, email, whatsapp, phone, companies(name))",
      )
      .eq("organization_id", ctx.org.id)
      .eq("status", "replied")
      .order("finished_at", { ascending: false })
      .limit(30),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .eq("source", "sdr"),
  ]);

  const repliedItems: RepliedItem[] = (
    (repliedRows ?? []) as Array<Record<string, unknown>>
  ).map((r) => {
    const c = r.contacts as {
      full_name?: string;
      email?: string | null;
      whatsapp?: string | null;
      phone?: string | null;
      companies?: { name?: string } | null;
    } | null;
    return {
      enrollmentId: String(r.id),
      contactName: c?.full_name ?? "Contato",
      companyName: c?.companies?.name ?? null,
      phone: c?.whatsapp ?? c?.phone ?? null,
      email: c?.email ?? null,
      lastMessage: null,
      repliedAt: (r.finished_at as string | null) ?? null,
    };
  });

  // ── Fila "Conversas da IA": leads com o agente SDR conversando ─────────
  // Estado em leads.custom_fields.sdr (mode/bant/prob/briefing/meeting).
  const admin = createAdminClient();
  const brainStats = await getBrainStats(admin, ctx.org.id);
  const { data: aiLeadRows } = await admin
    .from("leads")
    .select("id, full_name, company_name, phone, custom_fields, created_at")
    .eq("organization_id", ctx.org.id)
    .not("custom_fields->sdr", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  const aiLeads = ((aiLeadRows ?? []) as Array<Record<string, unknown>>).map((l) => {
    const cf = (l.custom_fields ?? {}) as Record<string, unknown>;
    const sdr = (cf.sdr ?? {}) as Record<string, unknown>;
    return { l, sdr };
  });

  // Transcript: casa contatos pelos telefones (com/sem DDI) e pega as últimas msgs.
  const phoneSet = new Set<string>();
  for (const { l } of aiLeads) {
    const p = String(l.phone ?? "").replace(/\D/g, "");
    if (!p) continue;
    phoneSet.add(p);
    if (p.length >= 12 && p.startsWith("55")) phoneSet.add(p.slice(2));
    else if (p.length === 10 || p.length === 11) phoneSet.add(`55${p}`);
  }
  const phoneToContact = new Map<string, string>();
  const contactMsgs = new Map<string, { role: "lead" | "ia"; text: string }[]>();
  if (phoneSet.size > 0) {
    const list = [...phoneSet].join(",");
    const { data: cts } = await admin
      .from("contacts")
      .select("id, phone, whatsapp")
      .eq("organization_id", ctx.org.id)
      .or(`phone.in.(${list}),whatsapp.in.(${list})`);
    const ctIds: string[] = [];
    for (const c of (cts ?? []) as Array<{ id: string; phone: string | null; whatsapp: string | null }>) {
      ctIds.push(c.id);
      for (const p of [c.phone, c.whatsapp]) {
        if (p) phoneToContact.set(p.replace(/\D/g, ""), c.id);
      }
    }
    if (ctIds.length > 0) {
      const { data: msgs } = await admin
        .from("messages")
        .select("contact_id, direction, body_text, created_at")
        .eq("organization_id", ctx.org.id)
        .eq("channel", "whatsapp")
        .in("contact_id", ctIds)
        .order("created_at", { ascending: false })
        .limit(120);
      for (const mrow of ((msgs ?? []) as Array<Record<string, unknown>>).reverse()) {
        const cid2 = String(mrow.contact_id ?? "");
        const txt = String(mrow.body_text ?? "").trim();
        if (!cid2 || !txt) continue;
        const arr = contactMsgs.get(cid2) ?? [];
        arr.push({
          role: mrow.direction === "inbound" ? "lead" : "ia",
          text: txt.slice(0, 180),
        });
        contactMsgs.set(cid2, arr.slice(-3)); // últimas 3
      }
    }
  }

  const aiItems: AiConvoItem[] = aiLeads.map(({ l, sdr }) => {
    const p = String(l.phone ?? "").replace(/\D/g, "");
    const variants = [p, p.startsWith("55") ? p.slice(2) : `55${p}`];
    const ctId = variants.map((v) => phoneToContact.get(v)).find(Boolean);
    const bant = (sdr.bant ?? {}) as AiConvoItem["bant"];
    return {
      leadId: String(l.id),
      name: String(l.full_name ?? "Lead"),
      company: (l.company_name as string | null) ?? null,
      phone: p || null,
      mode: sdr.mode === "human" ? "human" : "ai",
      closed: Boolean(sdr.closed),
      intent: (sdr.last_intent as string | null) ?? null,
      prob: typeof sdr.prob === "number" ? (sdr.prob as number) : null,
      bant,
      briefing: (sdr.briefing as string | null) ?? null,
      meetingAt: (sdr.meeting_at as string | null) ?? null,
      lastMessages: ctId ? (contactMsgs.get(ctId) ?? []) : [],
      updatedAt: (sdr.updated_at as string | null) ?? null,
    };
  });

  const kpis = [
    {
      label: "Leads na fila",
      value: totalSdrLeads ?? 0,
      icon: Users,
      tone: "from-spotnavy-700 to-spotnavy-900",
    },
    {
      label: "Qualificados (score ≥ 60)",
      value: qualified ?? 0,
      icon: TrendingUp,
      tone: "from-emerald-700 to-emerald-900",
    },
    {
      label: "Em sequência",
      value: inSequence ?? 0,
      icon: Sparkles,
      tone: "from-spotorange-500 to-spotred-600",
    },
    {
      label: "Leads encontrados",
      value: leadsFound ?? 0,
      icon: MessageSquare,
      tone: "from-blue-700 to-blue-900",
    },
    {
      label: "Opt-outs no mês",
      value: optOutsThisMonth ?? 0,
      icon: ShieldCheck,
      tone: "from-amber-600 to-amber-800",
    },
    {
      label: "Empresas enriquecidas",
      value: enriched ?? 0,
      icon: Sparkles,
      tone: "from-purple-700 to-purple-900",
    },
  ];

  // Funil completo até o objetivo final: REUNIÃO marcada.
  const funnel = [
    { label: "Encontrados", value: leadsFound ?? 0 },
    { label: "Criados", value: totalSdrLeads ?? 0 },
    { label: "Enriquecidos", value: enriched ?? 0 },
    { label: "Qualificados", value: qualified ?? 0 },
    { label: "Em sequência", value: inSequence ?? 0 },
    { label: "Responderam", value: repliedItems.length },
    { label: "Reuniões marcadas", value: meetingsBooked ?? 0 },
  ];
  const max = Math.max(1, ...funnel.map((s) => s.value));

  return (
    <div className="space-y-6">
      <AiConvos items={aiItems} />
      <BrainPanel stats={brainStats} />
      <RepliedQueue items={repliedItems} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.map((k) => (
          <Card
            key={k.label}
            className="border-white/10 bg-card/50 hover:border-spotorange-500/40 transition"
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div
                className={`p-2 rounded-lg bg-gradient-to-br ${k.tone} shrink-0`}
              >
                <k.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold leading-none">{k.value}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {k.label}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-semibold">Funil SDR</h2>
              <p className="text-xs text-muted-foreground">
                Conversão do agente de prospecção (todos os tempos).
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              {pendingQueue ?? 0} mensagens pendentes na fila de envio
            </div>
          </div>
          <div className="space-y-2">
            {funnel.map((s) => {
              const pct = Math.round((s.value / max) * 100);
              return (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-muted-foreground">{s.value}</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-spotorange-500 to-spotred-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-6 space-y-3">
            <Sparkles className="h-5 w-5 text-spotorange-500" />
            <h3 className="font-semibold">Enriquecer empresas</h3>
            <p className="text-sm text-muted-foreground">
              Cole uma lista de CNPJs (ou CSV) e o agente busca razão social,
              CNAE, sócios, porte, capital e cria leads automaticamente.
            </p>
            <Button variant="orange" asChild>
              <Link href="/app/sdr/enriquecer">
                Começar enrichment <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-6 space-y-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold">Conformidade LGPD</h3>
            <p className="text-sm text-muted-foreground">
              Veja consentimentos, suppression list, opt-outs e estatísticas
              regulatórias. Toda mensagem outbound passa por checagem aqui.
            </p>
            <Button variant="outline" asChild>
              <Link href="/app/sdr/lgpd">
                Abrir painel LGPD <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Dados de contato tratados sob base legal de <strong>interesse legítimo</strong>{" "}
        ou <strong>consentimento</strong> (LGPD, Lei 13.709/2018). Opt-out
        1-clique em todas comunicações.
      </p>
    </div>
  );
}
