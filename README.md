# Spotlog

**Plataforma SaaS de prospecção automatizada, CRM e propostas com agente SDR (IA).**

Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (Auth + Postgres + RLS) · Vercel · OpenAI/Anthropic · Resend · Evolution/Z-API · Apollo.io · Google Places.

---

## 🚀 Setup completo — passo a passo (WHERE TO CLICK)

### 1. Pré-requisitos

- **Node.js 20+** instalado (testado em 24.15.0)
- Conta na **Vercel** (gratuita) — https://vercel.com/signup
- Conta na **Supabase** (gratuita) — https://supabase.com/dashboard/sign-up
- Conta na **Resend** (opcional, pra e-mail) — https://resend.com
- Conta na **OpenAI** ou **Anthropic** (opcional, pra IA do agente)
- Conta no **Apollo.io** (opcional, pra prospecção B2B)

### 2. Instalar dependências

```bash
cd C:\Users\user\Downloads\sdr-ai
npm install
```

> ⚠️ Pode demorar 2–4 minutos. Se quebrar, rode `npm install --legacy-peer-deps`.

### 3. Criar o projeto Supabase

1. Abra https://supabase.com/dashboard/projects
2. Clique em **New project** (canto superior direito).
3. Escolha sua organização. Dê um nome (ex: `sdr-ai-prod`).
4. Defina uma senha forte do banco (anote!).
5. Região: **South America (São Paulo)** — `sa-east-1`.
6. Clique em **Create new project** e espere ~2 minutos a provisão.

### 4. Pegar as chaves do Supabase

No projeto recém-criado:

1. Menu esquerdo → **Project Settings** → **API**.
2. Copie:
   - `Project URL` → vira `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → vira `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (clique em **Reveal**) → vira `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **NUNCA** exponha a `service_role` no front. Ela só vive em `.env.local` e nas envs da Vercel.

### 5. Rodar a migration do banco

1. No Supabase, menu esquerdo → **SQL Editor**.
2. Clique em **+ New query**.
3. Abra o arquivo `supabase/migrations/20260101000000_init_schema.sql` deste projeto.
4. Cole TODO o conteúdo no editor SQL.
5. Clique em **Run** (canto inferior direito) ou Ctrl+Enter.
6. Espere ~10s. Deve aparecer "Success. No rows returned".

Isso cria: organizations, profiles, members, leads, contacts, companies, pipeline, deals, activities, sequences, cadências, mensagens, propostas, prospecção, integrações, webhooks, audit_logs — tudo com RLS e funções helper.

### 6. Configurar login com Google (opcional mas recomendado)

1. No Supabase, menu esquerdo → **Authentication** → **Providers**.
2. Clique em **Google** → ative o toggle.
3. Em outra aba, abra https://console.cloud.google.com/apis/credentials
4. **Create Credentials** → **OAuth Client ID** → **Web application**.
5. Em **Authorized redirect URIs**, cole a URL que aparece no Supabase (algo como `https://SEU_PROJETO.supabase.co/auth/v1/callback`).
6. Copie o Client ID e Client Secret de volta no Supabase, salve.

### 7. Configurar variáveis locais

1. Copie `.env.example` pra `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Edite `.env.local` com:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_aqui
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_aqui
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   WEBHOOK_SECRET=qualquer-string-aleatoria-grande-aqui
   ```

3. As demais (OPENAI_API_KEY, RESEND_API_KEY, etc.) podem ser configuradas DEPOIS pelo painel admin em **/app/admin/integracoes**.

### 8. Rodar local

```bash
npm run dev
```

Abra http://localhost:3000

- **/** — site público de alta conversão
- **/cadastro** — cria sua conta + organização
- **/app** — dashboard

### 9. Primeiro uso

1. Acesse http://localhost:3000/cadastro
2. Crie sua conta (e-mail + senha OU Google).
3. Você cai em `/app/onboarding` — informe nome da empresa.
4. Sistema cria a organização, faz seed do pipeline default e te leva pro dashboard.
5. Vá em **/app/admin/integracoes** e conecte:
   - **OpenAI ou Anthropic** (pra IA escrever as mensagens)
   - **Resend** (pra envio de e-mail)
   - **Evolution API ou Z-API** (pra WhatsApp)
   - **Apollo ou Google Places** (pra prospecção)
6. Crie uma cadência em **/app/cadencias/nova**, adicione passos.
7. Crie uma campanha de prospecção em **/app/prospeccao/nova**, define seu ICP, escolhe a cadência. Inicie.
8. Suba sua tabela Excel em **/app/propostas/tabelas** e gere propostas em **/app/propostas/nova**.

---

## 🚢 Deploy na Vercel

### Opção A — Via interface (mais fácil)

1. Suba o código pra um repositório GitHub.
2. Abra https://vercel.com/new
3. Clique em **Import Project** → selecione o repo.
4. Em **Environment Variables**, cole TODAS as variáveis do `.env.local` (exceto as opcionais que ainda não tem).
5. **Importante**: troque `NEXT_PUBLIC_APP_URL` pra `https://SEU-DOMINIO.vercel.app`.
6. Clique em **Deploy**.
7. Quando subir, vá em **Settings** → **Domains** e adicione seu domínio custom.

### Opção B — Via CLI

```bash
npm i -g vercel
vercel login
vercel deploy --prod
```

### Cron Jobs (Vercel)

O arquivo `vercel.json` já configura 2 crons automáticos:

- **`/api/cadence/tick`** a cada 15 min → processa os passos das cadências.
- **`/api/prospecting/run`** a cada 6h → roda as campanhas ativas.

Esses endpoints exigem o header `x-internal: <WEBHOOK_SECRET>`. A Vercel injeta isso automaticamente quando chama via cron interno, mas se quiser disparar manualmente:

```bash
curl -X POST https://seu-app.vercel.app/api/cadence/tick \
  -H "x-internal: SEU_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 📂 Estrutura

```
src/
├── app/
│   ├── (public)/         # site institucional (home, recursos, preços, contato, blog)
│   ├── (auth)/           # login + cadastro
│   ├── app/              # painel autenticado (CRM, prospecção, propostas, admin)
│   ├── proposta/[token]/ # página pública de aceite da proposta
│   └── api/              # endpoints (REST)
├── components/
│   ├── ui/               # shadcn-like (button, card, dialog, etc.)
│   ├── public/           # hero, features, pricing, faq, etc.
│   ├── auth/             # login-form, signup-form
│   ├── app/              # app-shell, sidebar
│   ├── admin/            # integrations-panel
│   ├── crm/              # pipeline-board
│   ├── prospecting/      # new-campaign-form, convert-results
│   ├── sequences/        # steps-editor
│   └── proposals/        # price-table-uploader, new-proposal-form, ...
├── lib/
│   ├── supabase/         # client, server, admin, middleware
│   ├── integrations/     # ai, email, whatsapp, prospecting (adapters plugáveis)
│   ├── auth.ts           # requireSession, requireRole
│   └── utils.ts
└── middleware.ts          # protege /app e /admin
```

---

## 🔌 Como plugar mais integrações

Cada integração é um par:

1. **Adapter** em `src/lib/integrations/<provider>.ts` (faz a chamada HTTP).
2. **Card** na `IntegrationsPanel` que recebe credenciais e salva em `integrations`.

Exemplo pra adicionar HubSpot:

1. Crie `src/lib/integrations/hubspot.ts`.
2. Use `getIntegration(orgId, "hubspot")` pra carregar credenciais.
3. Adicione a entrada em `DEFS` em `components/admin/integrations-panel.tsx`.
4. Pronto: a UI já entende, salva, testa e ativa.

---

## 🛡 Segurança

- **RLS** ativo em TODAS as tabelas (`init_schema.sql`)
- Tenant isolado por `organization_id` via função `is_org_member()`
- `service_role` só usada em rotas server-side (`/api`, `requireSession`)
- Tabela `integrations` só legível por owner/admin (chaves de API não vazam pra SDR/closer)
- Token público de proposta gerado com `gen_random_bytes(16)`
- Webhooks protegidos por `WEBHOOK_SECRET`

---

## 📜 Licença

Privado — todos os direitos reservados.

---

**Construído sem placeholders, sem fake, sem demo. Tudo o que está aqui roda de verdade quando você conecta as chaves.**
