# HANDOFF — Projeto SPOTLOG (cole isto como 1ª mensagem de uma nova conversa)

> Leia INTEIRO antes de agir. Você assume o **Spotlog**: site institucional v3 + SaaS (CRM/atendimento/prospecção/robô) multi-tenant. Este doc tem PASSADO, PRESENTE, FUTURO e o que NÃO fazer. Detalhe fino está nas memórias (MEMORY.md → `spotlog_*`).

---

## ⛔ REGRAS INVIOLÁVEIS (quebrou, deu ruim)
1. **Dono NÃO é dev.** Fale "onde clicar", passo numerado, sem jargão. Padrão world-class (Netflix/OpenAI).
2. **NUNCA quebrar produção.** SELECT livre; UPDATE/DELETE em dado de prod só com necessidade clara. Antes de sobrescrever/excluir algo que você não criou, olhe o conteúdo primeiro.
3. **NUNCA demos/simulações.** Só feature real end-to-end.
4. **CONFERIR DE VERDADE antes de dizer "pronto".** Build/deploy READY + verificar o comportamento real (curl na URL de produção, olhar o HTML/banco). Já me pegaram entregando 5% alegando 100%.
5. **Não desligar o PC do dono** (as ferramentas rodam nele).
6. **Discutir/planejar antes do não-trivial** (o dono aprova plano; refactor grande → modo plano).
7. Contas/infra ISOLADAS por projeto — Downloads tem VÁRIOS projetos. Este é só o `spotlog`.

## 🔧 INFRA (decore)
- Pasta `C:\Users\user\Downloads\spotlog` · Next 15 + TS · **Supabase `lfvuwrpfdnyqfxjaicba`** · **Vercel PROJETO `spotlog-nine`** (conta **onlogjf-1751**) · GitHub onlog2026/spotlog.
- **DOMÍNIO DE PRODUÇÃO = `https://www.spotlog.com.br`** (aliased ao projeto `spotlog-nine`; `spotlog.com.br` sem www dá 308→www; `spotlog-nine.vercel.app` ainda serve o mesmo build). ⚠️ Ao verificar por curl, use **www.spotlog.com.br**. O código não tem mais URL fixa de vercel.app — a env **`NEXT_PUBLIC_APP_URL=https://www.spotlog.com.br`** (Production, setada) é a fonte da baseURL/metadata/redirects (magic-link, convites, propostas, forms embed). Se trocar domínio de novo: `vercel env rm NEXT_PUBLIC_APP_URL production --yes` + `printf "https://novo" | vercel env add NEXT_PUBLIC_APP_URL production` e **redeploy** (NEXT_PUBLIC_* é embutida no build).
- **Deploy (git push trava):** `cd spotlog; VERCEL_TOKEN=$(tr -d '[:space:]' < vercel-token.txt) npx vercel@54.6.1 deploy --prod --yes` (use 54.6.1; 54.15 quebra). O deploy continua no PROJETO `spotlog-nine`; o domínio é só alias.
- **⚠️ Build LOCAL está instável** (erro de fork/recursos, muitos processos) → **deploye direto na Vercel** (o build remoto valida e só promove se passar; se o JSX estiver quebrado, o deploy falha e o site atual fica intacto). Faça build local só pra pegar erro de tag em mudança JSX estrutural grande.
- **DDL/migrations:** o dono cola SQL no editor `https://supabase.com/dashboard/project/lfvuwrpfdnyqfxjaicba/sql/new` (MCP Supabase está em conta errada).
- **Dados/seed via REST** (service_role do `.env.local`): `POST/PATCH https://<sup>/rest/v1/site_cards...`. ⚠️ **corpo JSON com acento tem que ir por ARQUIVO** (`--data-binary @f.json` UTF-8; montar inline no Git Bash quebra = PGRST102). Upsert: `?on_conflict=page,section,slot` + header `Prefer: resolution=merge-duplicates`.
- **Env var na Vercel:** `npx vercel env add NOME production`.
- `next.config` tem `typescript.ignoreBuildErrors:true` + `eslint.ignoreDuringBuilds:true` (erros "never" dos types do Supabase são baseline).

## 🧩 QUIRKS
- **Web search OFF** (modelo local Jan). **Sub-agentes Explore/general FALHAM** (retornam erro de modelo). → **faça a exploração/edição você mesmo**, sequencial.
- Navegador do dono = "Chrome Onlog" (VÁRIOS Chrome conectados → seleção pede escolha).
- **Não consigo logar no `/app`** (auth-gated) → teste LOGADO é sempre do dono. Peça o resultado, não presuma.

---

## ⏮️ PASSADO — o que já está NO AR e funcionando

### A) Site público v3 (marketing) — foco recente, tudo deployado e verificado por curl
- **Casca:** `V3Shell` (server, `components/v3/V3Shell.tsx`) envolve as páginas públicas → Header + Footer + SiteScroll + tema. Home (`app/page.tsx`) renderiza o próprio Header/Footer (mesmos componentes).
- **Header** (`components/v3/Header.tsx`, client): mega-menu **Ecommerce/Farma** (de `services-data.ts` `SERVICE_TREE`) + dropdowns **Segmentos/Serviços** (mesmo layout mega, de `landing-pages.ts` `MENU_SEGMENTOS`/`MENU_SERVICOS`) + links simples (Integrações/Cobertura/Blog) + CTAs **Rastrear** (→ Octatracking, URL externa com logo base64) e **Minha Conta** (→ sistema.spotlog.com.br) + Diagnóstico. Menu tem TEXTO CLARO → faixa atrás dele TEM que combinar (legibilidade). Âncoras usam `/#secao` (funciona de subpáginas). **`menuLabels`** (prop) sobrepõe o nome do item com o TÍTULO do card CMS (`home/solucoes/slot`) — renomear card renomeia menu (fail-open via `slugOf(href)`).
- **Páginas de PRODUTO — TEMPLATE ÚNICO** `components/v3/ProductPage.tsx` (server): herói (texto-esq + imagem-dir emoldurada `.svc-photo` **aspecto 1536×1024 = 3:2**, padrão das artes que o dono sobe), benefícios, "ideal para", processo (navy), CTA. SEM legenda "IMAGEM ILUSTRATIVA". Grade da home (`SolucoesGridV3`) também usa cards **aspect-[1536/1024]**. Banner da seção Soluções (slot `banner`) = imagem LIMPA e INTEIRA (`<img>` altura auto, sem degradê/texto/corte). ⚠️ 2 imagens do dono ainda não são 3:2 e recortam: `armazenagem`(4:3) e `distribuicao`(16:9) — pedir re-export 1536×1024. "Distribuição Inteligente" agora tem página real `/solucoes/distribuicao` (entrada em `solucoes-content.ts` + `SERVICE_HREF.distribuicao`). Rotas: `app/[slug]/page.tsx` (20 segmentos/serviços, `dynamicParams=false`) e `app/solucoes/[slug]/page.tsx` (9 soluções). Ambas leem a imagem-herói do CMS: `cmsCardImage(slug)` = `site_cards home/solucoes/slot=<slug>` (fetch anon cacheado, tag `site-cards`) || imagem do código.
- **Home ordem** (`app/page.tsx`): Hero → Soluções(banner+3 cards) → Integrações → 3 cards → Beneficios(operador+números) → 3 cards → Processo → 3 cards → Focos → Creatives → Dores → Portfolio → Cobertura → Blog → Contato. Grade `SolucoesGridV3` fatiável (`slice`/`header`); `GRID_DEFAULTS` exportado; 3/linha (1 no mobile).
- **Roteamento consertado (a "bagunça"):** o **modal** de serviço (`ServiceModalHost`/`ServicePage`) foi **MORTO** — mega-menu, Focos e Portfolio agora **navegam** (`serviceHref(id)`). URL = conteúdo = nome do menu. (ServiceModalHost existe só pro legado `/nova`, não é montado no site.)
- **CMS "Mapa do Site"** (`app/app/cms/site/mapa`): espelha o site (Menu Ecommerce/Farma/Segmentos/Serviços, Home—grade, Home—seções, Páginas fixas, Tema). Cada item: thumb + "Aparece em" + ver-no-site + **Editar** (`cards/abrir?page&section&slot&label` = find-or-create → editor). Botão **Sincronizar** cria faltantes. Seção **Órfãos** (cards que o site não usa mais, ex.: `page='servico'`) com Excluir(confirm+guarda `isOrphan`)/Desativar. Registro derivado do CÓDIGO em `lib/site-map.ts` → produto novo aparece; removido vira órfão. Nav: aba "Mapa do site" (1ª) + "Cards (avançado)" (lista crua, com 📍Aparece-em + badge órfão) + "Tema do site".
- **Tema (logo/favicon SEPARADOS site×admin):** CMS→Tema. Tokens `logoUrl/faviconUrl`(admin) + `logoUrlSite/faviconUrlSite`(site, fallback). Favicon via `generateMetadata` (root=site, `app/app/layout.tsx`=admin).
- **Cobertura mobile:** rótulos do mapa somem em ≤760px; nomes ficam nas tags abaixo.
- **SiteScroll** (`components/v3/site-scroll.tsx`): rola pro topo ao trocar de página + botão flutuante fixo discreto (canto inferior-direito). Substituiu a seta do footer.
- **Imagens IA:** **Pollinations** (grátis, sem login, URL própria) → hospedadas no Supabase Storage bucket `cms`/`branding` (público). Trocar imagem de produto = CMS→Mapa/Cards.

### B) SaaS `/app` — construído antes desta sessão (ver memórias `spotlog_*`)
- **SDR (prospecção)** 9/9 no ar (buscar/enriquecer/validar/score/dores/personalizar/rodar/agente-cron/enviar-WhatsApp-com-aprovação). Bloqueio = **dono testar logado**.
- **Robô / Flow Builder:** migration + canvas + **motor** (`lib/fluxos/engine.ts` + webhook Digisac + `api/fluxos/tick`) construídos e deployados. Bloqueio = **dono testar logado** (criar fluxo, ativar, mandar msg → robô responde).
- **Épico 2 (entitlements)** base pronta e NEUTRA (enforcement OFF).

## ⏸️ PRESENTE
- Site v3 + páginas de produto unificadas + CMS Mapa do Site + menu renomeável + scroll = **tudo deployado e verificado por curl**.
- Só o DONO valida logado: (a) editar card no Mapa e ver no front; (b) renomear card → nome no menu; (c) excluir órfãos `servico/*`; (d) testar SDR; (e) testar o motor do Robô.

## ⏭️ FUTURO — o que fazer (em ordem)
1. **Confirmar com o dono** que o Mapa do Site resolveu o "não me acho". Ajustar rótulos de `HOME_SECTIONS`/grupos se preciso.
2. **Rodapé & Portfolio**: nomes de serviço no RODAPÉ e no Portfolio da home são listas próprias hardcoded — NÃO seguem `menuLabels`. Se o dono quiser refletir renomeações lá, ligar ao mesmo override.
3. **`<title>`/SEO** das páginas de produto: renomear card muda o menu, não o title. Ligar se pedirem.
4. **SDR**: guiar o teste de 3 cliques do dono; envio real só com aprovação.
5. **Robô**: delays/wait_reply, condições/tags, 18 blocos (ver `spotlog-digisac-builder-spec`), depois "+50%".
6. **Épico 2 Passo 6 (LIGAR enforcement)** — só quando o dono decidir; antes alinhar catálogo modules × permissions.ts.

## 🚫 NÃO FAZER
- ❌ Recriar sistemas paralelos de card. Fonte de imagem/texto de produto = `site_cards home/solucoes/slot=<slug>` (UM lugar só). Menu/páginas/grade leem daí.
- ❌ Ressuscitar o modal de serviço no site (foi morto de propósito). Tudo navega.
- ❌ Mexer em `getPageCards`/`mergeBySlot`/comportamento do front além do combinado (labels são fail-open).
- ❌ Inventar rota/slug que o front não lê (foi a bagunça que consertamos). Slug do card = último segmento da URL do produto.
- ❌ Apagar `home/theme`, `home/header/*`, heros de páginas fixas (não são órfãos).
- ❌ Alegar pronto sem curl/verificação real.

## 📌 Como reportar (o dono cobra clareza)
Placar simples (✅/⏳) do que ficou pronto + qual é o ÚNICO passo pendente e de quem é (quase sempre "teste logado do dono"). Nada de deixar o dono perguntando "como está?".

## 🗂️ Arquivos-chave
- Site: `components/v3/{V3Shell,Header,Footer,ProductPage,site-scroll,services-data,cms}.ts(x)`, `components/v3/legacy/SolucoesGridV3.tsx`, `lib/{landing-pages,solucoes-content,site-map}.ts`, `app/page.tsx`, `app/[slug]/page.tsx`, `app/solucoes/[slug]/page.tsx`.
- CMS: `app/app/cms/site/{mapa,cards,tema}/…`, `components/cms/cms-subnav.tsx`, `components/v3/cms.ts` (getPageCards).
- SaaS: `lib/fluxos/engine.ts`, `app/api/{webhooks/digisac,fluxos/tick,prospecting/*,cadence/tick}`, `lib/sdr/*`, `lib/prospeccao/*`.
