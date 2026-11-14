# HANDOFF SPOTLOG — Prompt de continuação (passado · presente · futuro)
> Cole o conteúdo abaixo como PRIMEIRA mensagem de uma nova conversa. Quem pegar saberá o que fazer.
> Atualizado: 2026-06-30.

---

CONTINUAÇÃO DO PROJETO SPOTLOG — leia este briefing inteiro antes de agir.

Você está assumindo o **Spotlog**: um SaaS de logística + atendimento/CRM (WhatsApp), construído como um **SELLER** (um tenant da plataforma). Antes de tudo, **LEIA as memórias** (têm os detalhes e IDs): `MEMORY.md` + `spotlog_project`, `spotlog_audit_fixes`, `spotlog_flowbuilder_superadmin_epic`, `spotlog_digisac_builder_spec`, `spotlog_integrations`, `spotlog_v3_landing_cms`, `spotlog_deploy_token_accounts`, `agendai_project` (Agentop = referência do super-admin).

## QUEM É O CLIENTE + REGRAS INVIOLÁVEIS
- Dono **NÃO é dev**. Sempre instrução passo-a-passo "onde clicar". Nada de jargão.
- Padrão **WORLD-CLASS** (Netflix/OpenAI). "Não aceito construir algo inferior em uma vírgula."
- **NUNCA quebrar o que funciona.** SELECT no banco é livre; UPDATE/DELETE em dados vivos PRECISA aprovação.
- **NUNCA demos/simulações** — só features reais validadas em produção.
- **CONFERIR antes de entregar** (build limpo + deploy READY + comportamento real, verificado por agente/script). O dono sempre confere. Já me pegou entregando 5% e alegando 100% — não repita: varra TUDO e prove.
- **Discutir/planejar (spec) ANTES de construir.** Pesquisar antes. Usar agentes pra verificar.

## INFRA SPOTLOG
- Pasta: `C:\Users\user\Downloads\spotlog` · Next.js 15 (App Router) + TS + Supabase.
- Supabase: **lfvuwrpfdnyqfxjaicba** (`site_cards` é GLOBAL, sem organization_id). Dashboard SQL: `https://supabase.com/dashboard/project/lfvuwrpfdnyqfxjaicba/sql/new`.
- Vercel: projeto **spotlog-nine** (conta **onlogjf-1751**) · GitHub **onlog2026/spotlog** · produção: https://spotlog-nine.vercel.app
- **DEPLOY (NÃO via git — git push trava):** token em `spotlog\vercel-token.txt` (gitignored).
  `cd spotlog; $env:VERCEL_TOKEN=(cat vercel-token.txt).Trim(); npx vercel@54.6.1 deploy --prod --yes`
  Build local estoura memória (EXIT 134) → `NODE_OPTIONS=--max-old-space-size=8192` antes de `npm run build` (o build do deploy roda remoto, sem o limite).

## QUIRKS DO AMBIENTE (importantes)
- **Web search está OFF** nesta máquina (backend local Jan indisponível) → WebSearch/WebFetch falham. Pesquisa de mercado = conhecimento + navegador.
- **Sub-agentes:** tipo **"Plan" FUNCIONA** (ótimo p/ auditar/verificar código, read-only); tipo "Explore"/general **FALHAM**. Agentes NÃO operam o navegador (sessão única).
- **Supabase MCP e Vercel MCP apontam p/ contas ERRADAS** — não servem ao Spotlog. Para DDL: rodar SQL no **SQL editor** (dono cola). Para LER/escrever dados: script node com `SUPABASE_SERVICE_ROLE_KEY` do `.env.local` via PostgREST (`/rest/v1/...` e `/rest/v1/rpc/<fn>`).
- Navegador do dono = **"Chrome Onlog"** (Claude-in-Chrome; às vezes desconecta; a janela redimensiona e desloca coordenadas — re-tire screenshot antes de clicar).

================================================================
## PASSADO (já feito e EM PRODUÇÃO)
- Inbox WhatsApp (SAC) lendo a Digisac AO VIVO (abas Chats/Fila/Contatos, busca, nova conversa, responder). Resend 100% (domínio spotlog.com.br). Prospecção melhorada (Google Places ok; Apollo bloqueada). 6 páginas no visual v3. Cadence cron corrigido (GET+POST).
- **Pesquisa dos 2 ÉPICOS concluída e AUDITADA** (3 agentes Plan): mercado de flow-builders + arquitetura do Flow Builder no código + arquitetura Super/Seller+entitlements. Achados gravados em `spotlog_flowbuilder_superadmin_epic`. Um 2º agente auditou a veracidade: 9/11 afirmações 100% verdadeiras (ressalva: webhook digisac retorna 403 num caminho `?secret`, não "sempre 200").
- **Digisac varrida AO VIVO e mapeada 100%** (gravado em `spotlog_digisac_builder_spec`): construtor de robôs (18 blocos, 15 gatilhos, mensagem interativa Lista/Botões, condição 13 variáveis × 16 operadores, webhook/HTTP, rascunho/publicar/duplicar) + menu inteiro (Chat/atendimento, Contatos 5.696, Pessoas, Organizações, Tags, Campanhas com template+%abertura, Conexões 2 WhatsApp, 6 relatórios, 17 módulos admin). **DESCOBERTA-CHAVE:** a Digisac JÁ TEM IA (créditos: Agente inteligente, Copiloto, CSAT, Texto mágico, Resumo, Transcrição). Logo nosso "+50%" NÃO é "ter IA" — é **IA inclusa + integração NATIVA com CRM/cadência/pipeline do Spotlog + analytics de funil por nó** (a Digisac não é CRM de vendas).
- **DECISÕES do dono (aprovadas):** começar pela **base do Épico 2** (entitlements + separação super/seller); **Robô MVP já com IA + integração CRM** (não só paridade Digisac).

================================================================
## PRESENTE (estado exato AGORA)
- **Épico 2 — Passo 1 (fundação de entitlements): ✅ FEITO, RODADO e VERIFICADO.**
  Migration `supabase/migrations/20260630120000_entitlements.sql` rodada no SQL editor (2026-06-30) e verificada via service_role:
  tabelas `platform_settings` (kill-switch `entitlements_enforced=false`), `modules` (18), `plans` (5, inclui `free`), `plan_modules` (90 = 5×18), `org_modules` (0) + função `has_org_module(org,module)`.
  Estado **NEUTRO**: enforcement DESLIGADO → `has_org_module` retorna `true` p/ tudo (default-allow) → nada mudou no app. Verificado: `has_org_module(org_real, 'flow_builder') = true`; ambas orgs reais têm `plan='free'`.
  A migration passou por revisão adversarial (FAIL→corrigido): seed de `free` + dinâmico de `organizations.plan`; leitura do flag jsonb à prova de exceção.
- **Atendimento Digisac**: ~80% detalhado (cabeçalho da conversa = buscar/histórico/agendar/transferir/encerrar/⋮; barra = anexar/emoji/arquivo/⚡respostas/mensagem). Falta abrir o menu ⋮ e o painel do contato (opcional).

================================================================
## FUTURO (roadmap aprovado — ordem)

### Épico 2 — base (CONTINUAR daqui)
- **Passo 2 (PRÓXIMO):** criar `src/lib/entitlements.ts` (`orgHasModule(orgId,key)` chamando RPC `has_org_module`; `getOrgModules(orgId)` 1 query com `React.cache`; `requireOrgModule(key)`). Injetar `enabledModules` no `SessionContext` (`src/lib/auth.ts` + `src/app/app/layout.tsx`). **Fail-open** (erro de RPC → libera) p/ não quebrar. Espelha o padrão de `src/lib/permissions.ts`. Deployar — invisível (seed libera tudo).
- **Passo 3:** guard de navegação — `module?` em `Category/NavItem` e filtrar `visibleCategories` em `src/components/app/app-shell.tsx` (~:517). Nav idêntico hoje (tudo liberado), mas mecanismo existe.
- **Passo 4:** guard de rota/action — `requireOrgModule('inbox'|'flow_builder'|'prospeccao'|...)` no topo das páginas/actions dos módulos vendáveis.
- **Passo 5:** telas Super Admin — `superadmin/planos` (CRUD plans+plan_modules), `superadmin/modulos` (catálogo), aba "Plano & Módulos" em `superadmin/organizacoes/[id]` (trocar plano + ligar/desligar `org_modules`). A partir daqui o dono vende/corta módulo por org na mão.
- ⚠️ **ANTES de ligar o enforcement** (passo futuro): alinhar o catálogo `modules` (Eixo A, venda) com o check de `user_module_permissions` (Eixo B, RBAC) — hoje `flow_builder`/`inbox` não estão no check do Eixo B, e acesso final = A AND B. Fazer back-fill de `organizations.plan` antes (já blindado pelo seed dinâmico, mas conferir).
- Depois: impersonation (cookie assinado + `impersonation_sessions` + banner + auditoria) e billing (Asaas BR recomendado — ver `asaas_billing_method`).

### Épico 1 — Flow Builder / Robô (depois da base do Épico 2)
- Adicionar `@xyflow/react` (não existe ainda). Rotas `src/app/app/fluxos/**`. Tabelas `flows`(grafo jsonb)/`flow_executions`(máquina de estados: current_node_id, state, wait_until, waiting_for, step_count anti-loop, índice único parcial)/`flow_execution_logs` (RLS pelo loop `do $$` de init_schema). Gatilho = webhook Digisac (já loga em `integration_webhook_events.processed`). Motor `src/lib/fluxos/engine.ts` + worker `api/fluxos/tick` (espelha `api/cadence/tick`); webhook só enfileira (responde rápido). Nó de envio FORÇA Digisac. Reuso: `sendWhatsapp`/`sendEmail`/`twilio`/`chatComplete({orgId})`.
- MVP = 18 blocos (paridade Digisac, ver `spotlog_digisac_builder_spec`) + JÁ com nós de **IA** e **integração CRM** (criar lead, mover pipeline, inscrever em cadência). "+50%" = analytics de funil por nó, templates, simulador, multicanal.
- Plano 6 passos: 0)migration flows 1)CRUD+lista 2)canvas xyflow 3)motor MVP (inbound→envio) 4)delays+wait_reply 5)condições+tags+IA+email/SMS 6)observabilidade/+50%.

### FIXes pendentes (intercalar — ver `spotlog_audit_fixes`)
- **FIX B (maior valor):** ponte prospecção/SDR → cadência (inscrever em `sequence_enrollments`; copiar `api/prospecting/convert`). **FIX C:** Apify salvável (enum DB + card). Marketing: SMS via Twilio, botão WhatsApp+popups injetar no `(public)/layout.tsx`, dashboard sem número falso.

================================================================
## COMO VERIFICAR / DEPLOYAR (cole e use)
- **Verificar dados/RPC no Supabase** (sem MCP): script node lendo `.env.local` → `fetch('{NEXT_PUBLIC_SUPABASE_URL}/rest/v1/...')` com header `apikey`+`Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}`; RPC = POST `/rest/v1/rpc/<fn>` body JSON. (Ex.: `scratchpad/verify-entitlements.mjs` desta sessão.)
- **Rodar DDL nova:** escrever migration em `supabase/migrations/<timestamp>_nome.sql`, pedir ao dono colar no SQL editor (passo-a-passo), depois verificar via script.
- **Deploy:** `cd spotlog; $env:VERCEL_TOKEN=(cat vercel-token.txt).Trim(); npx vercel@54.6.1 deploy --prod --yes`.

PRIMEIRO PASSO desta nova sessão: **construir o Passo 2** (lib/entitlements.ts + enabledModules no SessionContext), testar build, deployar — confirmando que o app segue idêntico (tudo liberado). Depois Passos 3→5. Sem quebrar produção, cada peça testada e verificada.
