# SPEC — Time de Agentes SDR (prospecção real de leads)

> Objetivo do dono: um "time de agentes" que **encontra empresas reais**, pesquisa,
> enriquece, qualifica e entrega uma lista pronta pra contato — **sem inventar dados**,
> começando o mais barato possível. Fontes: Google Meu Negócio, Apollo (LinkedIn/email),
> site das empresas.

---

## 0. TL;DR — a verdade que muda o plano

**O seu app JÁ TEM ~80% desse pipeline construído e funcionando no backend.**
NÃO reconstruir do zero com N8N/Crawl4AI/Ollama — isso duplicaria e jogaria fora código
que já funciona. O que falta é **ligar a TELA de busca ao motor que já existe** e **testar
cada elo de ponta a ponta**. Só 1 agente é realmente novo (o "Identificador de Dores").

**Por que "não funciona" hoje:** a tela *Nova campanha* só faz CNPJ / segmento / domínios.
Ela **nunca chama** `/api/prospecting/run` com fonte `google_places`/`apollo`. O motor está
pronto, mas desconectado da interface.

---

## 0.1 ATUALIZAÇÃO — MODO 100% GRÁTIS (decisão do dono: não pagar nada pra buscar leads)

**Regra nova:** buscar leads **sem custo**. Nada é jogado fora — Google Places e Apollo
**continuam no código** como fontes **opcionais** (o dono liga se um dia quiser mais dados/pagar).
Mas o **padrão passa a ser fontes grátis**:

| Papel | Ferramenta GRÁTIS (padrão) | O que traz | Custo |
|---|---|---|---|
| **Buscar empresas** (Prospectador) | **OpenStreetMap / Overpass API** (sem chave, sem cartão) | Nome, Endereço, Telefone, Site, (às vezes) WhatsApp/e-mail | **R$0** |
| **Enriquecer** (pegar mais contatos) | **Crawler do próprio site** da empresa (fetch grátis / Crawl4AI open-source / Firecrawl free) | Telefone, **WhatsApp**, e-mail, serviços — lendo a página pública de contato | **R$0** (free tier / open source) |
| **CNPJ / dados oficiais** | **BrasilAPI / ReceitaWS** | Razão social, CNAE, sócios, endereço | **R$0** |
| **IA** (dores + mensagem) | **OpenRouter modelos grátis** (já ligado) | Análise do site + mensagem personalizada | **R$0** (tier grátis) |
| **Score** | **Regra própria** (sem IA) | Nota 0–100 por sinais objetivos | **R$0** |

**Pushback honesto (pra não te iludir):**
- Fonte grátis = **dado no nível da EMPRESA** (nome/endereço/telefone/site + o que estiver no site: WhatsApp/e-mail). Dá **totalmente** pra prospectar por WhatsApp/telefone/e-mail de contato.
- O que o grátis **não** entrega bem: **e-mail nominal do decisor + perfil LinkedIn em escala** — isso realmente depende do **Apollo (pago)**. Fica como botão opcional pra ligar quando/se quiser.
- **Cobertura do OpenStreetMap** é boa em muitas cidades/categorias, mas **menor que o Google**. Compensa cruzando com o **crawler do site** (que preenche WhatsApp/e-mail).
- Raspar Google Maps direto num navegador (Playwright/Browser Use) é possível e grátis, **mas é frágil e área-cinza dos termos** — deixo como plano B, não como padrão.

---

## 1. Mapa: os 8 agentes × o que já existe (verificado no código)

| # | Agente (arquitetura do dono) | Estado | Onde no código | Falta |
|---|---|---|---|---|
| 1 | **Prospectador** (buscar empresas) | ✅ motor pronto | `lib/integrations/prospecting.ts` (`searchProspects` → Apollo/Google Places/Apify); `api/prospecting/run` cria `prospecting_jobs`, busca e salva em `prospecting_results` | **UI que dispara** (campo nicho+cidade+fonte) |
| 2 | **Enriquecimento** (dados da empresa) | ✅ parcial | `lib/sdr/enrich.ts` (`enrichCompanyByCnpj` via BrasilAPI grátis; `enrichCompanyByDomain`) | ler o **site** do lead (crawler) p/ serviços/WhatsApp/emails |
| 3 | **Descoberta de decisores** (nome/cargo/email/LinkedIn) | ✅ fonte pronta | Apollo (`searchApollo` retorna pessoa + email + `linkedin_url`) | expor no fluxo pós-busca |
| 4 | **IA Analista / Score** (0–100) | ✅ pronto | `lib/sdr/scoring.ts` (`computeLeadScore`, `scoreAndPersistLead`) | ligar automático após a busca + exibir/ordenar |
| 5 | **Identificador de dores** (site lento, sem SSL, sem WhatsApp...) | ❌ **NOVO** | — | criar (IA lê o site via crawler e aponta problemas) |
| 6 | **Personalizador** (mensagem única) | ✅ pronto | `api/sdr/generate-sequence` + `lib/ai/sdr-prompts.ts` (`SDR_SEQUENCE_SYSTEM_PROMPT`) | revisão humana opcional |
| 7 | **CRM** (salvar tudo) | ✅ pronto | tabela `leads` + `api/prospecting/convert` (result→lead, com `auto_enroll`) | — |
| 8 | **Follow-up** (3/7/15 dias) | ✅ pronto | `sequences`/`sequence_steps`/`sequence_enrollments` + `api/cadence/tick` (cron) + `lib/sdr/scheduler.ts`; canais Digisac (WhatsApp) e Resend (e-mail) **ligados** | garantir disparo real + regras de dias |

Integrações **ativas hoje** na org (verificado no banco): `google_places`, `apollo`,
`openai`, `openrouter`, `digisac`, `resend`. (Apify **não** está ligada — opcional.)

---

## 2. Arquitetura recomendada (e o pushback honesto)

**Reusar o que existe** — o "pipeline de agentes" já é o padrão do app:
Next.js (server actions/rotas) + Supabase (fila via `prospecting_jobs` + cron `cadence/tick`).
Cada "agente" = um passo desse pipeline. Não precisa de N8N/Ollama paralelos.

**Por que NÃO montar N8N + Crawl4AI + Ollama do zero (pushback):**
- Duplicaria o que já funciona → 2 sistemas pra manter, mais bug, mais custo de tempo.
- O único lugar onde um crawler externo agrega é o **Agente 2/5** (ler o site do lead) —
  aí sim dá pra plugar **Firecrawl (free tier)** ou **Crawl4AI (open source)** pontualmente.

**Fontes de dados (reais, sem inventar):**
- **Google Meu Negócio (Places)** ✅ → Nome, Endereço, Telefone, Site.
- **Apollo** ✅ → decisor (nome/cargo), **e-mail**, **LinkedIn**, telefone.
- **BrasilAPI** (CNPJ) ✅ grátis → razão social, CNAE, sócios, endereço.
- **Site da empresa** (crawler) → WhatsApp, e-mails, serviços (Agente 2/5).
- **LinkedIn**: ❌ não raspar (bloqueia + viola termos). O dado de LinkedIn vem **via Apollo**.

---

## 3. Custos (honesto — "grátis pra começar", não "grátis pra sempre")

| Item | Custo real |
|---|---|
| Google Places | crédito grátis mensal do Google; depois ~US$/1000 buscas. **Cap por busca** (ex.: 20). |
| Apollo | plano com créditos; e-mail/decisor **consome crédito**. Ligar por 2º. |
| BrasilAPI | **grátis**. |
| IA | OpenRouter tem modelos **grátis**; OpenAI é pago. Score pode usar regra (sem IA) + IA só na dor/mensagem. |
| Crawler (Firecrawl/Crawl4AI) | free tier / open source. |

→ Começa dentro do grátis; custo sobe com volume. Sempre com **limite por busca** pra não surpreender.

---

## 4. Ordem de construção (fatias finas — cada uma no ar e testada com dado REAL)

- **Slice 1 — MVP "funciona" (100% GRÁTIS)** (o que destrava tudo):
  Nova fonte **`openstreetmap`** em `lib/integrations/prospecting.ts` (Overpass API, sem chave) →
  UI de busca (Nicho/segmento + Cidade/Estado + limite) → chama `/api/prospecting/run`
  (fonte `openstreetmap`) → lista **resultados reais** (Nome, Endereço, Site, Telefone/WhatsApp,
  e-mail se houver) → botão **"Converter em leads"**. Google/Apollo ficam como opção desligada.
  *Aceite:* rodar uma busca real grátis, ver ≥1 empresa real com telefone/site, converter em lead no CRM.

- **Slice 2 — Enriquecimento** pós-busca (CNPJ/domínio já existem) + decisor via Apollo.
  *Aceite:* um lead ganha CNAE/sócios e/ou e-mail do decisor automaticamente.

- **Slice 3 — Score** automático (`scoring.ts`) exibido na lista + ordenar por score.
  *Aceite:* leads aparecem com nota 0–100 e dá pra ordenar.

- **Slice 4 — Agente de Dores (NOVO):** IA lê o site do lead (crawler) e lista problemas
  (site lento, sem SSL, sem WhatsApp, sem SEO...). *Aceite:* um lead mostra ≥1 dor real do site.

- **Slice 5 — Personalização** (`generate-sequence` já existe): gera a abordagem única por lead
  + revisão + enfileira na cadência. *Aceite:* mensagem citando um dado real do lead.

- **Slice 6 — Follow-up** (cadence/tick já dispara): garantir envio real WhatsApp/e-mail +
  regras 3/7/15 dias + parar ao responder. *Aceite:* um envio real sai pelo Digisac/Resend.

- **Slice 7 — Orquestrador + Funil:** botão "rodar tudo" que encadeia 1→6 por campanha +
  dashboard do funil (encontrados → enriquecidos → qualificados → contatados → responderam).

---

## 5. Decisões pro dono (aprovar antes de construir)

- **D1** — ✅ DECIDIDO: **100% grátis** → fonte padrão **OpenStreetMap** + crawler do site. Google/Apollo ficam opcionais (desligados).
- **D2** — Crawler de enriquecimento/dores: **fetch simples grátis** (começo) → depois **Crawl4AI** (open source) se precisar de mais. Firecrawl só se quiser facilidade.
- **D3** — Limite por busca (sugestão: **20–50**). Overpass é grátis, mas educado limitar.
- **D4** — ✅ Confirmado: LinkedIn **não** é prioridade agora (é pago via Apollo) — fica pra depois.
- **D5** — Score **por regra** (grátis) primeiro; IA (OpenRouter grátis) na análise de dores/mensagem.

---

## 6. Regras (invioláveis)
- **Sem inventar dados** — todo campo vem de Google/Apollo/BrasilAPI/site real. Se não achou, fica vazio.
- **LGPD** — já existe `lib/sdr/lgpd.ts` (consentimento, opt-out, unsubscribe). Respeitar `isSafeToContact` antes de enviar.
- **Cada slice**: build limpo + deploy READY + **1 teste real verificado** (dado real, não demo).
- **Não quebrar produção** — tudo aditivo; a tela nova não mexe nos modos CNPJ/segmento/domínio que já existem.
