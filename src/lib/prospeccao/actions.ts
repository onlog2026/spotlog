"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { requireOrgModule } from "@/lib/entitlements";
import { createAdminClient } from "@/lib/supabase/admin";
import { runCampaign, type CampaignType } from "@/lib/prospeccao/engine";
import { analyzeLeadSite } from "@/lib/sdr/enrich-web";
import { chatComplete } from "@/lib/ai/openai-client";
import { sendWhatsapp } from "@/lib/integrations/whatsapp";
import { getIntegration } from "@/lib/integrations";
import { isSafeToContact } from "@/lib/sdr/lgpd";
import {
  normalizePhoneBR,
  isValidPhoneBR,
  isValidEmail,
  dedupeKey,
} from "@/lib/sdr/validate";

const createSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  type: z.enum(["cnpj_list", "segmento", "domain_list", "internet"]),
  cnpjs_raw: z.string().optional(),
  domains_raw: z.string().optional(),
  industries: z.string().optional(),
  keywords: z.string().optional(),
  nome: z.string().optional(),
  bairro: z.string().optional(),
  states: z.string().optional(),
  cities: z.string().optional(),
  limit: z.string().optional(),
  ai_persona: z.string().optional(),
  sequence_id: z.string().optional(),
  auto_enroll: z.string().optional(),
  icp_ai: z.string().optional(),
});

function splitLines(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function criarCampanha(formData: FormData) {
  const ctx = await requireSession();
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    cnpjs_raw: formData.get("cnpjs_raw") ?? "",
    domains_raw: formData.get("domains_raw") ?? "",
    industries: formData.get("industries") ?? "",
    keywords: formData.get("keywords") ?? "",
    nome: formData.get("nome") ?? "",
    bairro: formData.get("bairro") ?? "",
    states: formData.get("states") ?? "",
    cities: formData.get("cities") ?? "",
    limit: formData.get("limit") ?? "",
    ai_persona: formData.get("ai_persona") ?? "",
    sequence_id: formData.get("sequence_id") ?? "",
    auto_enroll: formData.get("auto_enroll") ?? "",
    icp_ai: formData.get("icp_ai") ?? "",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const v = parsed.data;
  const type = v.type as CampaignType;
  const cnpjs = splitLines(v.cnpjs_raw);
  const domains = splitLines(v.domains_raw);
  const industries = splitLines(v.industries);
  // Nome (opcional) entra como mais um termo de busca junto do nicho.
  const nome = (v.nome ?? "").trim();
  const keywords = [...splitLines(v.keywords), ...(nome ? [nome] : [])];
  const bairro = (v.bairro ?? "").trim();
  const states = splitLines(v.states);
  const cities = splitLines(v.cities);
  const limit = Math.min(Math.max(Number(v.limit) || 30, 1), 60);

  // ICP completo gerado pelo Agente Estrategista (frase → perfil), quando usado.
  // Fica salvo dentro do próprio icp jsonb (chave ai) — Score IA e Conversacional leem daqui.
  let icpAi: Record<string, unknown> | null = null;
  if (v.icp_ai && v.icp_ai.trim().startsWith("{")) {
    try {
      icpAi = JSON.parse(v.icp_ai) as Record<string, unknown>;
    } catch {
      icpAi = null; // fail-open: nunca trava a criação da campanha
    }
  }

  const icp: Record<string, unknown> = {
    type,
    cnpjs: type === "cnpj_list" ? cnpjs : [],
    domains: type === "domain_list" ? domains : [],
    industries,
    keywords,
    neighborhood: bairro || undefined,
    states,
    cities,
    limit,
    ...(icpAi ? { ai: icpAi } : {}),
  };

  const totalTarget =
    type === "cnpj_list"
      ? cnpjs.length || 1
      : type === "domain_list"
        ? domains.length || 1
        : type === "internet"
          ? limit
          : 100;

  // Fonte de busca real por tipo. "internet" = Google Places (rápido/instantâneo,
  // já configurado) + OpenStreetMap (reserva grátis). Apify está PRONTO
  // (searchApify + APIFY_TOKEN) mas fora do padrão porque é lento (~1-2min,
  // run-sync) e traz o mesmo Google Maps — usar só em "busca profunda".
  const sources =
    type === "internet" ? ["google_places", "openstreetmap"] : [type];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("prospecting_campaigns")
    .insert({
      organization_id: ctx.org.id,
      name: v.name,
      icp,
      sources,
      daily_limit: Math.min(500, totalTarget),
      total_target: totalTarget,
      ai_persona: v.ai_persona ?? null,
      // Follow-up automático: sequência escolhida no form (vazio = sem cadência)
      sequence_id: v.sequence_id?.trim() || null,
      auto_enroll: v.auto_enroll === "on" && !!v.sequence_id?.trim(),
      status: "running",
      created_by: ctx.user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Erro ao criar campanha");
  }
  const id = (data as { id: string }).id;

  if (type === "internet") {
    // Busca na internet roda RÁPIDO (2 chamadas) → executa SÍNCRONO e espera
    // salvar ANTES de redirecionar. Fire-and-forget é morto pelo serverless
    // antes de terminar (era por isso que a campanha ficava "rodando" e vazia).
    try {
      await runCampaign(id);
    } catch (e) {
      console.warn("[criarCampanha] runCampaign (internet)", e);
    }
  } else {
    // Tipos que podem demorar (enriquecer muitos CNPJs) seguem em background.
    // `after()` (Next 15) garante que a função roda até o fim mesmo depois da
    // resposta/redirect — um `void` puro era morto pelo serverless no meio,
    // igual ao bug que já tinha sido corrigido pro tipo "internet" acima.
    after(() =>
      runCampaign(id).catch((e) =>
        console.warn("[criarCampanha] runCampaign falhou", e),
      ),
    );
  }

  revalidatePath("/app/prospeccao");
  redirect(`/app/prospeccao/${id}`);
}

/**
 * MÁQUINA DE LEADS — fluxo sem jargão: o dono digita "o que buscar" + região
 * e a máquina faz o resto (busca instantânea + raspagem profunda do Google
 * Maps + enriquecimento automático quando a raspagem termina).
 */
export async function criarMaquina(formData: FormData) {
  const ctx = await requireSession();
  const termos = splitLines(String(formData.get("termos") ?? ""));
  const cargo = String(formData.get("cargo") ?? "").trim();
  const estado = String(formData.get("estado") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim();
  const bairro = String(formData.get("bairro") ?? "").trim();
  const limit = Math.min(Math.max(Number(formData.get("limit")) || 30, 10), 200);
  // Fonte extra (add-on "Prospecção Avançada"): links de post do Instagram,
  // um por linha — vazio = não usa essa fonte, comportamento igual a antes.
  const instagramPosts = splitLines(String(formData.get("instagram_posts") ?? ""));
  const minScore = Number(formData.get("min_score_to_enroll"));
  const minScoreToEnroll = Number.isFinite(minScore) && minScore > 0 ? Math.min(100, minScore) : null;

  if (termos.length === 0) throw new Error("Diga o que buscar (ex: farmácia de manipulação).");
  if (!estado && !cidade) throw new Error("Informe pelo menos o estado ou a cidade.");

  const nomeAuto = `Máquina: ${termos[0]}${cidade ? ` — ${cidade}` : estado ? ` — ${estado}` : ""}`;

  const icp: Record<string, unknown> = {
    type: "internet",
    industries: termos,
    keywords: cargo ? [cargo] : [],
    cargo: cargo || undefined,
    neighborhood: bairro || undefined,
    states: estado ? [estado] : [],
    cities: cidade ? [cidade] : [],
    limit,
  };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("prospecting_campaigns")
    .insert({
      organization_id: ctx.org.id,
      name: nomeAuto,
      icp,
      sources: ["google_places", "openstreetmap"],
      daily_limit: limit,
      total_target: limit,
      status: "running",
      created_by: ctx.user.id,
      min_score_to_enroll: minScoreToEnroll,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Erro ao criar busca");
  const id = (data as { id: string }).id;

  // 1) Busca instantânea (Google Places + OSM) — resultado na hora
  try {
    await runCampaign(id);
  } catch (e) {
    console.warn("[criarMaquina] runCampaign", e);
  }

  // 2) Raspagem profunda (Apify/Google Maps) — dispara em paralelo; a coleta
  //    acontece pelo botão/polling na página da campanha e já enriquece sozinha.
  try {
    const { startApifyDeep } = await import("@/lib/prospeccao/apify-deep");
    await startApifyDeep(ctx.org.id, id);
  } catch (e) {
    console.warn("[criarMaquina] startApifyDeep", e);
  }

  // 3) Fonte Instagram (opcional, exige o módulo add-on "prospeccao_avancada").
  //    Falha silenciosa se o cliente não tem o módulo — não quebra a Máquina base.
  if (instagramPosts.length > 0) {
    try {
      const ok = await requireOrgModule("prospeccao_avancada").then(() => true).catch(() => false);
      if (ok) {
        const { startApifyInstagram } = await import("@/lib/prospeccao/apify-instagram");
        await startApifyInstagram(ctx.org.id, id, instagramPosts);
      }
    } catch (e) {
      console.warn("[criarMaquina] startApifyInstagram", e);
    }
  }

  revalidatePath("/app/prospeccao");
  redirect(`/app/prospeccao/${id}?maquina=1`);
}

/** Fonte Instagram avulsa (add-on). Dispara o run — coleta é feita por polling/botão. */
export async function iniciarBuscaInstagram(campaignId: string, postUrls: string[]) {
  const ctx = await requireOrgModule("prospeccao_avancada");
  if (!campaignId) throw new Error("id obrigatório");
  const { startApifyInstagram } = await import("@/lib/prospeccao/apify-instagram");
  const r = await startApifyInstagram(ctx.org.id, campaignId, postUrls);
  if (!r.ok) throw new Error(r.error || "Falha ao iniciar busca no Instagram.");
  revalidatePath(`/app/prospeccao/${campaignId}`);
  return r;
}

export async function coletarBuscaInstagram(campaignId: string) {
  const ctx = await requireOrgModule("prospeccao_avancada");
  if (!campaignId) throw new Error("id obrigatório");
  const { collectApifyInstagram } = await import("@/lib/prospeccao/apify-instagram");
  const r = await collectApifyInstagram(ctx.org.id, campaignId);
  if (r.status === "done" && (r.added ?? 0) > 0) {
    try {
      await enriquecerCampanha(campaignId);
    } catch (e) {
      console.warn("[coletarBuscaInstagram] auto-enrich", e);
    }
  }
  revalidatePath(`/app/prospeccao/${campaignId}`);
  return r;
}

export async function excluirCampanha(formData: FormData) {
  const ctx = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id obrigatório");

  const admin = createAdminClient();
  // Cascata: results, jobs, campaign
  await admin
    .from("prospecting_results")
    .delete()
    .eq("organization_id", ctx.org.id)
    .eq("campaign_id", id);
  await admin
    .from("prospecting_jobs")
    .delete()
    .eq("organization_id", ctx.org.id)
    .eq("campaign_id", id);
  await admin
    .from("prospecting_campaigns")
    .delete()
    .eq("organization_id", ctx.org.id)
    .eq("id", id);

  revalidatePath("/app/prospeccao");
  redirect("/app/prospeccao");
}

/**
 * Enriquecimento + Validação/limpeza (os dois "agentes" juntos):
 *  1) lê o SITE de cada lead e completa telefone/WhatsApp/e-mail que faltam;
 *  2) normaliza telefone, descarta e-mail inválido, e marca DUPLICADOS.
 * Grátis (só fetch). Nunca inventa dado. Cap de sites p/ caber no tempo.
 */
export async function enriquecerCampanha(campaignId: string) {
  const ctx = await requireSession();
  if (!campaignId) throw new Error("id obrigatório");
  const admin = createAdminClient();

  const { data: rowsRaw } = await admin
    .from("prospecting_results")
    .select("*")
    .eq("organization_id", ctx.org.id)
    .eq("campaign_id", campaignId)
    .in("status", ["new"]);
  const rows = (rowsRaw ?? []) as Array<Record<string, unknown>>;

  let enriched = 0;
  let duplicates = 0;
  let fetched = 0;
  const MAX_FETCH = 25;
  const seen = new Set<string>();

  // Processa em pequenos lotes (concorrência 4) pra não estourar tempo.
  const batchSize = 4;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (r) => {
        const cd = { ...((r.company_data ?? {}) as Record<string, string | undefined>) };
        const pd = { ...((r.contact_data ?? {}) as Record<string, string | undefined>) };
        let dores: string[] | null = null;

        // 1) ENRIQUECER + ANALISAR o site (contatos + dores, num crawl só)
        const website = cd.website;
        if (website && fetched < MAX_FETCH) {
          fetched++;
          const web = await analyzeLeadSite(website, ctx.org.id);
          dores = web.dores;
          // telefone: prioriza WhatsApp; só aceita número que PASSA na validação
          const cand = [...web.whatsapps, ...web.phones];
          const wphone = cand.find((p) => isValidPhoneBR(p)) ?? "";
          const waValid = web.whatsapps.find((p) => isValidPhoneBR(p)) ?? "";
          if (!cd.phone && wphone) cd.phone = wphone;
          if (!pd.email && web.emails[0]) pd.email = web.emails[0];
          if (waValid) pd.phone = pd.phone || waValid;
          if (web.socials.length > 0)
            (cd as Record<string, unknown>).socials = web.socials;
          if (wphone || web.emails[0]) enriched++;
        }

        // 2) VALIDAR / LIMPAR
        const normPhone = normalizePhoneBR(cd.phone);
        if (cd.phone && normPhone) cd.phone = normPhone;
        if (pd.email && !isValidEmail(pd.email)) delete pd.email;

        // 3) SCORE (recalculado pela completude do contato)
        const hasPhone = isValidPhoneBR(cd.phone);
        const hasEmail = !!pd.email && isValidEmail(pd.email);
        const score = Math.min(
          40 + (hasPhone ? 25 : 0) + (hasEmail ? 20 : 0) + (cd.website ? 10 : 0),
          100,
        );

        // 4) DEDUPE (dentro da campanha)
        const key = dedupeKey({ phone: cd.phone, website: cd.website, name: cd.name });
        let status = r.status as string;
        if (key) {
          if (seen.has(key)) {
            status = "discarded"; // duplicado
            duplicates++;
          } else {
            seen.add(key);
          }
        }

        // guarda as dores em company_data (jsonb) sem quebrar o tipo
        const companyOut: Record<string, unknown> = { ...cd };
        if (dores !== null) companyOut.dores = dores;

        await admin
          .from("prospecting_results")
          .update({
            company_data: companyOut,
            contact_data: Object.keys(pd).length ? pd : null,
            match_score: score,
            status,
          })
          .eq("id", r.id as string)
          .eq("organization_id", ctx.org.id);
      }),
    );
  }

  revalidatePath(`/app/prospeccao/${campaignId}`);
  return { ok: true, enriched, duplicates, fetched };
}

/**
 * Agente Personalizador — a IA (OpenRouter grátis via orgId) escreve UMA
 * abordagem de WhatsApp por lead, citando um dado REAL (dor do site / setor /
 * cidade). Nunca inventa número. Guarda em company_data.pitch. Cap p/ tempo.
 */
export async function gerarAbordagem(campaignId: string) {
  const ctx = await requireSession();
  if (!campaignId) throw new Error("id obrigatório");
  const admin = createAdminClient();

  const { data: camp } = await admin
    .from("prospecting_campaigns")
    .select("ai_persona")
    .eq("id", campaignId)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  const persona =
    (camp as { ai_persona?: string } | null)?.ai_persona ||
    "Consultor da Spotlog, operador de logística B2B em São Paulo e região.";

  const { data: rowsRaw } = await admin
    .from("prospecting_results")
    .select("*")
    .eq("organization_id", ctx.org.id)
    .eq("campaign_id", campaignId)
    .in("status", ["new", "converted"]);
  const rows = (rowsRaw ?? []) as Array<Record<string, unknown>>;

  const CAP = 12;
  let generated = 0;
  const sys =
    "Você é um SDR brasileiro de logística B2B. Escreva UMA mensagem curta de primeiro contato por WhatsApp (máximo 45 palavras), tom humano e direto, em PT-BR, citando um dado REAL da empresa. Nunca invente números nem certificações. Termine com uma pergunta leve. Não assine, não use nome de remetente, evite emojis.";

  for (const r of rows) {
    if (generated >= CAP) break;
    const cd = { ...((r.company_data ?? {}) as Record<string, string | undefined>) };
    if (!cd.name || cd.pitch) continue;
    const dores = ((r.company_data as { dores?: string[] } | null)?.dores) ?? [];
    const dado = dores[0] || cd.industry || cd.city || "";
    // Decisor real (sócio do CNPJ ou contato descoberto) — mensagem nominal
    // pra decisor responde MUITO mais que "prezada empresa".
    const pdR = (r.contact_data ?? {}) as { full_name?: string; job_title?: string };
    const socios =
      ((r.company_data as { socios?: Array<{ nome?: string }> } | null)?.socios) ?? [];
    const decisor = pdR.full_name || socios[0]?.nome || "";
    const usr =
      `Quem fala: ${persona}\n` +
      `Empresa alvo: ${cd.name}${cd.city ? ` (${cd.city})` : ""}${cd.industry ? ` — setor: ${cd.industry}` : ""}.\n` +
      (decisor
        ? `Decisor (use o primeiro nome dele na saudação): ${decisor}${pdR.job_title ? ` — ${pdR.job_title}` : ""}\n`
        : "") +
      `Dado real observado: ${dado || "(nada específico)"}\n` +
      `Escreva a abordagem.`;
    const res = await chatComplete({
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 160,
      orgId: ctx.org.id,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
    });
    if (res.ok && res.content.trim()) {
      cd.pitch = res.content.trim().slice(0, 600);
      await admin
        .from("prospecting_results")
        .update({ company_data: { ...cd } })
        .eq("id", r.id as string)
        .eq("organization_id", ctx.org.id);
      generated++;
    }
  }

  revalidatePath(`/app/prospeccao/${campaignId}`);
  return { ok: true, generated };
}

/**
 * Agente Score IA — avalia o FIT de cada empresa contra o ICP da campanha
 * (gerado pelo Estrategista) em UM call de IA por lote. O score final vira a
 * média entre a regra (contatabilidade) e o fit de ICP; o motivo fica em
 * company_data.score_reason. Sem ICP de IA na campanha → não faz nada.
 */
async function scoreIcpIA(orgId: string, campaignId: string): Promise<number> {
  const admin = createAdminClient();
  const { data: campRow } = await admin
    .from("prospecting_campaigns")
    .select("icp")
    .eq("id", campaignId)
    .eq("organization_id", orgId)
    .maybeSingle();
  const ai = ((campRow as { icp?: { ai?: Record<string, unknown> } } | null)?.icp)?.ai;
  if (!ai) return 0;

  const { data: rowsRaw } = await admin
    .from("prospecting_results")
    .select("id, match_score, company_data")
    .eq("organization_id", orgId)
    .eq("campaign_id", campaignId)
    .eq("status", "new")
    .limit(40);
  const rows = (rowsRaw ?? []) as Array<{
    id: string;
    match_score: number | null;
    company_data: Record<string, unknown> | null;
  }>;
  if (rows.length === 0) return 0;

  const lista = rows
    .map((r, i) => {
      const cd = (r.company_data ?? {}) as Record<string, unknown>;
      const dores = Array.isArray(cd.dores) ? (cd.dores as string[]).slice(0, 2).join("; ") : "";
      return `${i}: ${String(cd.name ?? "?")} | setor: ${String(cd.industry ?? "?")} | cidade: ${String(cd.city ?? "?")} | site: ${cd.website ? "sim" : "não"}${dores ? ` | dores: ${dores}` : ""}`;
    })
    .join("\n");

  const res = await chatComplete({
    model: "gpt-4o-mini",
    temperature: 0.2,
    maxTokens: 1200,
    orgId,
    messages: [
      {
        role: "system",
        content:
          'Você avalia FIT de empresas contra um perfil de cliente ideal (ICP) B2B. Responda APENAS JSON válido: {"scores":[{"i":0,"fit":0-100,"motivo":"1 frase"}...]} — um item por empresa da lista, na ordem. Seja criterioso: fora do segmento = fit baixo.',
      },
      {
        role: "user",
        content: `ICP: ${JSON.stringify(ai)}\n\nEMPRESAS:\n${lista}`,
      },
    ],
  });
  if (!res.ok || !res.content) return 0;

  let scores: Array<{ i: number; fit: number; motivo?: string }> = [];
  try {
    const raw = res.content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as {
      scores?: Array<{ i: number; fit: number; motivo?: string }>;
    };
    scores = parsed.scores ?? [];
  } catch {
    return 0;
  }

  let updated = 0;
  for (const s of scores) {
    const row = rows[s.i];
    if (!row || typeof s.fit !== "number") continue;
    const fit = Math.max(0, Math.min(100, Math.round(s.fit)));
    const rule = Number(row.match_score ?? 50);
    const final = Math.round(rule * 0.5 + fit * 0.5);
    const cd = { ...((row.company_data ?? {}) as Record<string, unknown>) };
    cd.icp_fit = fit;
    if (s.motivo) cd.score_reason = String(s.motivo).slice(0, 240);
    await admin
      .from("prospecting_results")
      .update({ match_score: final, company_data: cd })
      .eq("id", row.id)
      .eq("organization_id", orgId);
    updated++;
  }
  return updated;
}

/**
 * Orquestrador — roda o time todo num clique: Enriquecer + Validar + Score +
 * Dores → Score IA (fit de ICP) → Converter os qualificados (score>=50) em
 * leads no CRM → Personalizar a abordagem com IA. Reaproveita o que já existe.
 */
export async function rodarTudo(campaignId: string) {
  const ctx = await requireSession();
  if (!campaignId) throw new Error("id obrigatório");

  const enrich = await enriquecerCampanha(campaignId);

  // Score IA fit-ICP (só age se a campanha nasceu do Agente Estrategista)
  try {
    await scoreIcpIA(ctx.org.id, campaignId);
  } catch (e) {
    console.warn("[rodarTudo] scoreIcpIA", e);
  }

  const admin = createAdminClient();
  const { data: results } = await admin
    .from("prospecting_results")
    .select("*")
    .eq("organization_id", ctx.org.id)
    .eq("campaign_id", campaignId)
    .eq("status", "new");
  let converted = 0;
  for (const r of (results ?? []) as Array<Record<string, unknown>>) {
    if (Number(r.match_score ?? 0) >= 50) {
      await convertSingleResult(ctx.org.id, r);
      converted++;
    }
  }

  const pitch = await gerarAbordagem(campaignId);

  revalidatePath(`/app/prospeccao/${campaignId}`);
  return { ...enrich, converted, generated: pitch.generated };
}

/** Resolve o serviceId do número COMERCIAL (SDR) no Digisac. */
async function getSdrServiceId(orgId: string): Promise<string | null> {
  const digisac = await getIntegration(orgId, "digisac");
  const sid = (digisac?.credentials as { sdr_service_id?: string } | undefined)
    ?.sdr_service_id;
  return sid ?? null;
}

/** TESTE: manda 1 mensagem pro seu próprio número (sem LGPD, é teste). */
export async function enviarTeste(phone: string, text: string) {
  const ctx = await requireSession();
  const p = (phone ?? "").replace(/\D/g, "");
  if (p.length < 10) throw new Error("Informe um número válido (com DDD).");
  const serviceId = await getSdrServiceId(ctx.org.id);
  if (!serviceId)
    throw new Error("Número Comercial (SDR) não configurado na integração Digisac.");
  const res = await sendWhatsapp({
    organization_id: ctx.org.id,
    to: p,
    text: text?.trim() || "✅ Teste do SDR Spotlog — o envio pelo Comercial está funcionando.",
    serviceId,
  });
  if (!res.ok) throw new Error(res.error || "Falha ao enviar (Digisac).");
  return { ok: true };
}

/**
 * Envia a abordagem (mensagem da IA) pros leads SELECIONADOS, pelo número
 * Comercial do SDR. Respeita LGPD (opt-out), intervala os envios (anti-spam)
 * e marca o lead como "contatado". Só roda com a ação explícita do dono.
 */
export async function enviarAbordagens(campaignId: string, resultIds: string[]) {
  const ctx = await requireSession();
  if (!resultIds?.length) throw new Error("Selecione ao menos 1 lead.");
  const serviceId = await getSdrServiceId(ctx.org.id);
  if (!serviceId)
    throw new Error("Número Comercial (SDR) não configurado na integração Digisac.");

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("prospecting_results")
    .select("id, company_data, contact_data")
    .eq("organization_id", ctx.org.id)
    .eq("campaign_id", campaignId)
    .in("id", resultIds.slice(0, 25)); // teto por clique (anti-spam)

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const r of (rows ?? []) as Array<Record<string, unknown>>) {
    const cd = (r.company_data ?? {}) as Record<string, string | undefined>;
    const pd = (r.contact_data ?? {}) as Record<string, string | undefined>;
    const phone = pd.phone || cd.phone; // WhatsApp do enriquecimento tem preferência
    const text = cd.pitch;
    if (!phone || !text) {
      skipped++;
      continue;
    }
    const safe = await isSafeToContact(ctx.org.id, pd.email ?? null, phone);
    if (!safe) {
      skipped++; // opt-out / não permitido
      continue;
    }
    const res = await sendWhatsapp({
      organization_id: ctx.org.id,
      to: phone,
      text,
      serviceId,
    });
    if (res.ok) {
      sent++;
      await admin
        .from("prospecting_results")
        .update({ status: "contacted" })
        .eq("id", r.id as string)
        .eq("organization_id", ctx.org.id);
    } else {
      failed++;
    }
    await new Promise((res2) => setTimeout(res2, 2500)); // intervalo entre envios
  }

  revalidatePath(`/app/prospeccao/${campaignId}`);
  return { sent, skipped, failed };
}

/**
 * Busca profunda (Apify) — raspagem legítima de Google Maps em escala, async.
 * Dispara o run (volta rápido) e a coleta é feita depois (botão/refresh).
 */
export async function iniciarBuscaProfunda(campaignId: string) {
  const ctx = await requireSession();
  if (!campaignId) throw new Error("id obrigatório");
  const { startApifyDeep } = await import("@/lib/prospeccao/apify-deep");
  const r = await startApifyDeep(ctx.org.id, campaignId);
  if (!r.ok) throw new Error(r.error || "Falha ao iniciar busca profunda.");
  revalidatePath(`/app/prospeccao/${campaignId}`);
  return r;
}

export async function coletarBuscaProfunda(campaignId: string) {
  const ctx = await requireSession();
  if (!campaignId) throw new Error("id obrigatório");
  const { collectApifyDeep } = await import("@/lib/prospeccao/apify-deep");
  const r = await collectApifyDeep(ctx.org.id, campaignId);
  // Máquina de Leads: assim que a raspagem termina, enriquece sozinho
  // (site → e-mail/WhatsApp/redes). Best-effort — a coleta nunca falha por isso.
  if (r.status === "done" && (r.added ?? 0) > 0) {
    try {
      await enriquecerCampanha(campaignId);
    } catch (e) {
      console.warn("[coletarBuscaProfunda] auto-enrich", e);
    }
  }
  revalidatePath(`/app/prospeccao/${campaignId}`);
  return r;
}

export async function reexecutarCampanha(formData: FormData) {
  const ctx = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id obrigatório");
  const admin = createAdminClient();
  await admin
    .from("prospecting_campaigns")
    .update({ status: "running" })
    .eq("organization_id", ctx.org.id)
    .eq("id", id);
  after(() =>
    runCampaign(id).catch((e) => console.warn("[reexecutarCampanha]", e)),
  );
  revalidatePath(`/app/prospeccao/${id}`);
}

/**
 * Pausar/retomar campanha — o cron diário (/api/prospecting/run) só pega
 * campanhas com status 'running', então pausar de verdade impede o
 * próximo tick de continuar processando essa campanha.
 */
export async function pausarCampanha(formData: FormData) {
  const ctx = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id obrigatório");
  const admin = createAdminClient();
  await admin
    .from("prospecting_campaigns")
    .update({ status: "paused" })
    .eq("organization_id", ctx.org.id)
    .eq("id", id);
  revalidatePath("/app/prospeccao");
  revalidatePath(`/app/prospeccao/${id}`);
}

export async function retomarCampanha(formData: FormData) {
  const ctx = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id obrigatório");
  const admin = createAdminClient();
  await admin
    .from("prospecting_campaigns")
    .update({ status: "running" })
    .eq("organization_id", ctx.org.id)
    .eq("id", id);
  revalidatePath("/app/prospeccao");
  revalidatePath(`/app/prospeccao/${id}`);
}

/**
 * "Informar CNPJ" — pros resultados da busca de internet (que não têm CNPJ).
 * Roda o enrichment oficial (BrasilAPI, grátis) e preenche razão social,
 * CNAE e SÓCIOS (decisores prováveis) no resultado. Dado real, nunca inventado.
 */
export async function informarCnpj(resultId: string, cnpjRaw: string) {
  const ctx = await requireSession();
  const cnpj = (cnpjRaw ?? "").replace(/\D/g, "");
  if (cnpj.length !== 14) throw new Error("CNPJ inválido (precisa de 14 dígitos).");

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("prospecting_results")
    .select("id, campaign_id, company_data, contact_data")
    .eq("id", resultId)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!row) throw new Error("Resultado não encontrado");

  const { enrichCompanyByCnpj } = await import("@/lib/sdr/enrich");
  const ec = await enrichCompanyByCnpj(ctx.org.id, cnpj);
  if (!ec) throw new Error("CNPJ não encontrado na Receita (BrasilAPI).");

  const cd = {
    ...((row.company_data ?? {}) as Record<string, unknown>),
    cnpj,
    legal_name: ec.razao_social ?? undefined,
    industry:
      ((row.company_data as { industry?: string } | null)?.industry) ??
      ec.cnae_descricao ??
      undefined,
    socios: ec.socios && ec.socios.length > 0 ? ec.socios : undefined,
  };
  const pd = {
    ...((row.contact_data ?? {}) as Record<string, unknown>),
  } as Record<string, unknown>;
  if (!pd.full_name && ec.socios?.[0]?.nome) {
    pd.full_name = ec.socios[0].nome;
    pd.job_title = ec.socios[0].qualificacao ?? "Sócio(a)";
  }
  if (!pd.email && ec.email) pd.email = ec.email;

  await admin
    .from("prospecting_results")
    .update({
      company_data: cd,
      contact_data: Object.keys(pd).length ? pd : null,
    })
    .eq("id", resultId)
    .eq("organization_id", ctx.org.id);

  revalidatePath(`/app/prospeccao/${(row as { campaign_id: string }).campaign_id}`);
  return { ok: true, socios: ec.socios?.length ?? 0 };
}

export async function converterResultadoEmLead(formData: FormData) {
  const ctx = await requireSession();
  const resultId = String(formData.get("result_id") ?? "");
  if (!resultId) throw new Error("result_id obrigatório");

  const admin = createAdminClient();
  const { data: rData } = await admin
    .from("prospecting_results")
    .select("*")
    .eq("id", resultId)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!rData) throw new Error("Resultado não encontrado");

  await convertSingleResult(ctx.org.id, rData);
  revalidatePath(
    `/app/prospeccao/${(rData as { campaign_id: string }).campaign_id}`,
  );
}

export async function converterTodosResultados(formData: FormData) {
  const ctx = await requireSession();
  const campaignId = String(formData.get("campaign_id") ?? "");
  if (!campaignId) throw new Error("campaign_id obrigatório");

  const admin = createAdminClient();
  const { data: results } = await admin
    .from("prospecting_results")
    .select("*")
    .eq("organization_id", ctx.org.id)
    .eq("campaign_id", campaignId)
    .eq("status", "new");

  for (const r of (results ?? []) as Array<Record<string, unknown>>) {
    await convertSingleResult(ctx.org.id, r);
  }
  revalidatePath(`/app/prospeccao/${campaignId}`);
}

export async function descartarResultado(formData: FormData) {
  const ctx = await requireSession();
  const id = String(formData.get("result_id") ?? "");
  if (!id) throw new Error("result_id obrigatório");

  const admin = createAdminClient();
  const { data } = await admin
    .from("prospecting_results")
    .update({ status: "discarded" })
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .select("campaign_id")
    .single();
  const campaignId = (data as { campaign_id?: string } | null)?.campaign_id;
  if (campaignId) revalidatePath(`/app/prospeccao/${campaignId}`);
}

async function convertSingleResult(
  orgId: string,
  result: Record<string, unknown>,
): Promise<void> {
  const admin = createAdminClient();
  const cd = (result.company_data ?? {}) as Record<string, string | undefined>;
  const pd = result.contact_data as Record<string, string | undefined> | null;
  const resultId = result.id as string;
  const campaignId = (result.campaign_id as string | undefined) ?? null;

  let companyId: string | null = null;
  if (cd?.name) {
    // Dedupe por CNPJ ou domain ou name
    const orParts: string[] = [];
    if (cd.cnpj) orParts.push(`cnpj.eq.${cd.cnpj}`);
    if (cd.domain) orParts.push(`domain.eq.${cd.domain}`);
    orParts.push(`name.eq.${cd.name.replace(/,/g, " ")}`);
    const { data: existing } = await admin
      .from("companies")
      .select("id")
      .eq("organization_id", orgId)
      .or(orParts.join(","))
      .maybeSingle();

    if (existing) {
      companyId = (existing as { id: string }).id;
    } else {
      const { data: newCo } = await admin
        .from("companies")
        .insert({
          organization_id: orgId,
          name: cd.name,
          legal_name: cd.legal_name ?? cd.name,
          cnpj: cd.cnpj ?? null,
          domain: cd.domain ?? null,
          website: cd.website ?? null,
          industry: cd.industry ?? null,
          size: cd.size ?? null,
          city: cd.city ?? null,
          state: cd.state ?? null,
          address: cd.address ?? null,
          phone: cd.phone ?? null,
          description: cd.description ?? null,
          source: "prospecting",
        })
        .select("id")
        .single();
      companyId = (newCo as { id: string } | null)?.id ?? null;
    }
  }

  // Cria lead na primeira stage da pipeline default
  const { data: lead } = await admin
    .from("leads")
    .insert({
      organization_id: orgId,
      source: "prospecting",
      source_detail: (result.source as string) ?? "prospeccao",
      status: "new",
      full_name: pd?.full_name ?? cd?.name ?? "Lead",
      email: pd?.email ?? null,
      phone: normalizePhoneBR(pd?.phone ?? cd?.phone) || null,
      company_name: cd?.name ?? null,
      job_title: pd?.job_title ?? null,
      score: Number(result.match_score ?? 50),
      custom_fields: {
        cnpj: cd?.cnpj,
        domain: cd?.domain,
        industry: cd?.industry,
        city: cd?.city,
        state: cd?.state,
        prospecting_result_id: resultId,
      },
    })
    .select("id")
    .single();
  const leadId = (lead as { id: string } | null)?.id ?? null;

  await admin
    .from("prospecting_results")
    .update({
      status: "converted",
      converted_company_id: companyId,
      converted_contact_id: leadId,
    })
    .eq("id", resultId);

  // Ponte pra CADÊNCIA: o motor (/api/cadence/tick) trabalha com `contacts` —
  // cria/acha o contato e inscreve na sequência da campanha (auto_enroll).
  // Falha aqui não desfaz a conversão (best-effort).
  try {
    if (!campaignId) return;
    const { data: campRow } = await admin
      .from("prospecting_campaigns")
      .select("auto_enroll, sequence_id, min_score_to_enroll")
      .eq("id", campaignId)
      .eq("organization_id", orgId)
      .maybeSingle();
    const camp = campRow as {
      auto_enroll?: boolean;
      sequence_id?: string | null;
      min_score_to_enroll?: number | null;
    } | null;
    if (!camp?.auto_enroll || !camp.sequence_id) return;

    // Nota de corte (add-on Prospecção Avançada): campanha sem corte definido
    // (null) preserva o comportamento de sempre — só filtra quando configurado.
    const cutoff = camp.min_score_to_enroll;
    if (cutoff != null && Number(result.match_score ?? 0) < cutoff) return;

    const phone = normalizePhoneBR(pd?.phone ?? cd?.phone) || null;
    const email = pd?.email && isValidEmail(pd.email) ? pd.email : null;
    if (!phone && !email) return; // sem canal de contato, não inscreve

    // LGPD: opt-out/suppression bloqueia a inscrição
    const safe = await isSafeToContact(orgId, email, phone);
    if (!safe) return;

    // find-or-create do contato (dedupe por email, depois por telefone)
    let contactId: string | null = null;
    const orParts: string[] = [];
    if (email) orParts.push(`email.eq.${email}`);
    if (phone) orParts.push(`whatsapp.eq.${phone}`, `phone.eq.${phone}`);
    const { data: existingCt } = await admin
      .from("contacts")
      .select("id")
      .eq("organization_id", orgId)
      .or(orParts.join(","))
      .limit(1)
      .maybeSingle();
    if (existingCt) {
      contactId = (existingCt as { id: string }).id;
    } else {
      const { data: newCt } = await admin
        .from("contacts")
        .insert({
          organization_id: orgId,
          company_id: companyId,
          full_name: pd?.full_name ?? cd?.name ?? "Contato",
          email,
          whatsapp: phone,
          phone,
          job_title: pd?.job_title ?? null,
          source: "prospecting",
        })
        .select("id")
        .single();
      contactId = (newCt as { id: string } | null)?.id ?? null;
    }
    if (!contactId) return;

    // Inscreve — unique(sequence_id, contact_id) impede duplicata; erro é ignorado.
    await admin.from("sequence_enrollments").insert({
      organization_id: orgId,
      sequence_id: camp.sequence_id,
      contact_id: contactId,
    });
  } catch (e) {
    console.warn("[convertSingleResult] enroll cadência falhou", e);
  }
}
