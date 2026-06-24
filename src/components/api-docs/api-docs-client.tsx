"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Lock, Zap } from "lucide-react";

type Endpoint = {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  title: string;
  desc: string;
  scope?: string;
  curl: string;
  response: string;
};

const NAVY = "#011960";
const RED = "#BA0102";

const BASE = "https://spotlog-nine.vercel.app";

const ENDPOINTS: Endpoint[] = [
  {
    id: "leads-list",
    method: "GET",
    path: "/api/v1/leads",
    title: "Listar leads",
    desc: "Lista paginada de leads da organização. Filtros: status, source.",
    curl: `curl ${BASE}/api/v1/leads?limit=50 \\
  -H "Authorization: Bearer spk_live_XXX"`,
    response: `{
  "data": [
    { "id": "uuid", "full_name": "João Silva", "email": "joao@x.com",
      "status": "new", "source": "site", "created_at": "2026-05-26T..." }
  ],
  "count": 124,
  "limit": 50,
  "offset": 0
}`,
  },
  {
    id: "leads-create",
    method: "POST",
    path: "/api/v1/leads",
    title: "Criar lead",
    desc: "Cria um novo lead. Dispara evento lead.created nas integrações ativas.",
    curl: `curl -X POST ${BASE}/api/v1/leads \\
  -H "Authorization: Bearer spk_live_XXX" \\
  -H "Content-Type: application/json" \\
  -d '{
    "full_name": "Maria Costa",
    "email": "maria@empresa.com.br",
    "phone": "+5511999998888",
    "company_name": "Acme Logística",
    "source": "api"
  }'`,
    response: `{ "data": { "id": "uuid", "created_at": "2026-05-26T..." } }`,
  },
  {
    id: "leads-get",
    method: "GET",
    path: "/api/v1/leads/:id",
    title: "Detalhe do lead",
    desc: "Retorna todos os campos de um lead específico.",
    curl: `curl ${BASE}/api/v1/leads/UUID \\
  -H "Authorization: Bearer spk_live_XXX"`,
    response: `{ "data": { "id": "uuid", "full_name": "...", ... } }`,
  },
  {
    id: "leads-patch",
    method: "PATCH",
    path: "/api/v1/leads/:id",
    title: "Atualizar lead",
    desc: "Atualiza campos parciais do lead (status, score, custom_fields, etc).",
    curl: `curl -X PATCH ${BASE}/api/v1/leads/UUID \\
  -H "Authorization: Bearer spk_live_XXX" \\
  -H "Content-Type: application/json" \\
  -d '{ "status": "qualified", "score": 85 }'`,
    response: `{ "data": { "id": "uuid", "status": "qualified", ... } }`,
  },
  {
    id: "contacts-list",
    method: "GET",
    path: "/api/v1/contacts",
    title: "Listar contatos",
    desc: "Filtros: search (full_name/email).",
    curl: `curl ${BASE}/api/v1/contacts \\
  -H "Authorization: Bearer spk_live_XXX"`,
    response: `{ "data": [...], "count": 0, "limit": 50, "offset": 0 }`,
  },
  {
    id: "contacts-create",
    method: "POST",
    path: "/api/v1/contacts",
    title: "Criar contato",
    desc: "",
    curl: `curl -X POST ${BASE}/api/v1/contacts \\
  -H "Authorization: Bearer spk_live_XXX" \\
  -H "Content-Type: application/json" \\
  -d '{ "full_name": "Pedro", "email": "p@x.com", "job_title": "CTO" }'`,
    response: `{ "data": { "id": "uuid", "created_at": "..." } }`,
  },
  {
    id: "contacts-get",
    method: "GET",
    path: "/api/v1/contacts/:id",
    title: "Detalhe/atualizar contato",
    desc: "GET ou PATCH no mesmo recurso.",
    curl: `curl ${BASE}/api/v1/contacts/UUID \\
  -H "Authorization: Bearer spk_live_XXX"`,
    response: `{ "data": { ... } }`,
  },
  {
    id: "companies-list",
    method: "GET",
    path: "/api/v1/companies",
    title: "Listar empresas",
    desc: "Filtros: search.",
    curl: `curl ${BASE}/api/v1/companies \\
  -H "Authorization: Bearer spk_live_XXX"`,
    response: `{ "data": [...], "count": 0 }`,
  },
  {
    id: "companies-create",
    method: "POST",
    path: "/api/v1/companies",
    title: "Criar empresa",
    desc: "",
    curl: `curl -X POST ${BASE}/api/v1/companies \\
  -H "Authorization: Bearer spk_live_XXX" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "Acme S/A", "cnpj": "00.000.000/0001-00", "industry": "Logística" }'`,
    response: `{ "data": { "id": "uuid", "created_at": "..." } }`,
  },
  {
    id: "deals-list",
    method: "GET",
    path: "/api/v1/deals",
    title: "Listar / criar deals",
    desc: "Lista deals; POST requer pipeline_id e stage_id.",
    curl: `curl ${BASE}/api/v1/deals?status=open \\
  -H "Authorization: Bearer spk_live_XXX"`,
    response: `{ "data": [...], "count": 0 }`,
  },
  {
    id: "deals-patch",
    method: "PATCH",
    path: "/api/v1/deals/:id",
    title: "Atualizar deal (ganhar/perder)",
    desc: "Mude status pra won/lost — dispara evento deal.won / deal.lost.",
    curl: `curl -X PATCH ${BASE}/api/v1/deals/UUID \\
  -H "Authorization: Bearer spk_live_XXX" \\
  -H "Content-Type: application/json" \\
  -d '{ "status": "won" }'`,
    response: `{ "data": { "id": "uuid", "status": "won", "closed_at": "..." } }`,
  },
  {
    id: "appts-list",
    method: "GET",
    path: "/api/v1/appointments",
    title: "Listar / criar agendamentos",
    desc: "Filtros: from, to (ISO 8601). POST cria + dispara appointment.created.",
    curl: `curl -X POST ${BASE}/api/v1/appointments \\
  -H "Authorization: Bearer spk_live_XXX" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Demo Spotlog",
    "scheduled_at": "2026-06-01T15:00:00Z",
    "duration_minutes": 30,
    "external_name": "Carlos",
    "external_email": "carlos@x.com"
  }'`,
    response: `{ "data": { "id": "uuid", "created_at": "..." } }`,
  },
  {
    id: "tickets",
    method: "POST",
    path: "/api/v1/tickets",
    title: "Criar ticket de suporte",
    desc: "Cria ticket com protocolo SPT-XXXX. Requer scope tickets:write.",
    scope: "tickets:write",
    curl: `curl -X POST ${BASE}/api/v1/tickets \\
  -H "Authorization: Bearer spk_live_XXX" \\
  -H "Content-Type: application/json" \\
  -d '{
    "department": "sac",
    "subject": "Pedido atrasado",
    "description": "O pedido 12345 não chegou.",
    "priority": "alta",
    "customer_name": "Ana",
    "customer_email": "ana@x.com"
  }'`,
    response: `{ "ok": true, "protocol": "SPT-XXXX-XXXX", "id": "uuid" }`,
  },
  {
    id: "tracking",
    method: "GET",
    path: "/api/v1/tracking/:code",
    title: "Rastreamento público",
    desc: "PÚBLICO — não requer bearer token. Use pra exibir status na sua loja.",
    curl: `curl ${BASE}/api/v1/tracking/SPT123456`,
    response: `{ "data": { "status": "in_transit", "events": [...] } }`,
  },
  {
    id: "wh-test",
    method: "POST",
    path: "/api/v1/webhooks/test",
    title: "Testar conexão (echo)",
    desc: "Echo do payload + meta. Ideal pra validar config no Zapier/n8n/Make.",
    curl: `curl -X POST ${BASE}/api/v1/webhooks/test \\
  -H "Authorization: Bearer spk_live_XXX" \\
  -H "Content-Type: application/json" \\
  -d '{ "ping": "hello" }'`,
    response: `{ "ok": true, "received": { "ping": "hello" }, "timestamp": "..." }`,
  },
];

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
      className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white/80 hover:bg-black/60"
      aria-label="Copiar"
    >
      {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {done ? "Copiado" : "Copiar"}
    </button>
  );
}

function MethodPill({ method }: { method: Endpoint["method"] }) {
  const map: Record<Endpoint["method"], string> = {
    GET: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    POST: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    PATCH: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    DELETE: "bg-red-500/20 text-red-300 border-red-500/40",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${map[method]}`}>
      {method}
    </span>
  );
}

export function ApiDocsClient() {
  return (
    <div
      className="min-h-screen text-white"
      style={{ background: `linear-gradient(180deg, ${NAVY} 0%, #000814 100%)` }}
    >
      <header className="border-b border-white/10 bg-black/40 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span
              className="font-extrabold text-2xl tracking-tight"
              style={{ color: "white" }}
            >
              spot<span style={{ color: RED }}>log</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full border border-white/20 text-white/70">
              Public API v1
            </span>
          </Link>
          <div className="flex gap-2">
            <Link
              href="/app/admin/api-keys"
              className="text-sm rounded-md border border-white/20 px-3 py-1.5 hover:bg-white/10"
            >
              Gerar API key
            </Link>
            <Link
              href="/"
              className="text-sm rounded-md px-3 py-1.5 hover:bg-white/10"
            >
              Voltar ao site
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar */}
          <nav className="lg:sticky lg:top-24 self-start space-y-1 text-sm">
            <p className="text-xs uppercase tracking-wider text-white/40 px-2 pb-2">
              Começar
            </p>
            <a href="#intro" className="block px-2 py-1.5 rounded hover:bg-white/5">
              Introdução
            </a>
            <a href="#auth" className="block px-2 py-1.5 rounded hover:bg-white/5">
              Autenticação
            </a>
            <a href="#rate" className="block px-2 py-1.5 rounded hover:bg-white/5">
              Rate limit
            </a>
            <a href="#errors" className="block px-2 py-1.5 rounded hover:bg-white/5">
              Erros
            </a>

            <p className="text-xs uppercase tracking-wider text-white/40 px-2 pt-4 pb-2">
              Endpoints
            </p>
            {ENDPOINTS.map((e) => (
              <a
                key={e.id}
                href={`#${e.id}`}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-white/80"
              >
                <MethodPill method={e.method} />
                <span className="truncate text-xs">{e.title}</span>
              </a>
            ))}
          </nav>

          {/* Content */}
          <main className="space-y-12">
            <section id="intro" className="space-y-3">
              <h1 className="text-4xl font-extrabold">
                Spotlog Public API <span style={{ color: RED }}>v1</span>
              </h1>
              <p className="text-white/80 text-lg leading-relaxed">
                REST API oficial pra integrar seu site, ERP, app ou plataforma de
                automação (n8n, Zapier, Make) com o Spotlog. Crie leads, contatos,
                deals, agendamentos e tickets via HTTPS com bearer token.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2">
                  <p className="text-[10px] uppercase text-white/50">Base URL</p>
                  <code className="text-sm">{BASE}/api/v1</code>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2">
                  <p className="text-[10px] uppercase text-white/50">Formato</p>
                  <code className="text-sm">JSON</code>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2">
                  <p className="text-[10px] uppercase text-white/50">Auth</p>
                  <code className="text-sm">Bearer spk_live_*</code>
                </div>
              </div>
            </section>

            <section id="auth" className="space-y-3">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Lock className="h-5 w-5" /> Autenticação
              </h2>
              <p className="text-white/70">
                Toda requisição precisa do header <code className="text-amber-300">Authorization: Bearer spk_live_...</code>.
                Gere sua key em{" "}
                <Link href="/app/admin/api-keys" className="underline text-amber-300">
                  /app/admin/api-keys
                </Link>{" "}
                — o token é mostrado UMA única vez na criação. Guarde em local seguro
                (cofre, env var do seu servidor). Se vazar, revogue e gere outra.
              </p>
              <CodeBlock code={`Authorization: Bearer spk_live_a1b2c3d4e5f6...`} />
            </section>

            <section id="rate" className="space-y-3">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Zap className="h-5 w-5" /> Rate limit
              </h2>
              <p className="text-white/70">
                100 requisições por minuto por API key. Excesso retorna{" "}
                <code className="text-amber-300">429 Too Many Requests</code> com header{" "}
                <code className="text-amber-300">Retry-After</code> em segundos.
              </p>
            </section>

            <section id="errors" className="space-y-3">
              <h2 className="text-2xl font-bold">Códigos de erro</h2>
              <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Significado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-white/10"><td className="p-2"><code>200/201</code></td><td className="p-2">Sucesso</td></tr>
                  <tr className="border-t border-white/10"><td className="p-2"><code>400</code></td><td className="p-2">Payload inválido</td></tr>
                  <tr className="border-t border-white/10"><td className="p-2"><code>401</code></td><td className="p-2">Token ausente ou inválido</td></tr>
                  <tr className="border-t border-white/10"><td className="p-2"><code>403</code></td><td className="p-2">Token sem o scope necessário</td></tr>
                  <tr className="border-t border-white/10"><td className="p-2"><code>404</code></td><td className="p-2">Recurso não encontrado</td></tr>
                  <tr className="border-t border-white/10"><td className="p-2"><code>429</code></td><td className="p-2">Rate limit excedido</td></tr>
                  <tr className="border-t border-white/10"><td className="p-2"><code>500</code></td><td className="p-2">Erro interno</td></tr>
                </tbody>
              </table>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold">Eventos (webhooks de saída)</h2>
              <p className="text-white/70">
                Quando você conecta Slack/Discord/Telegram/Webhook em{" "}
                <Link className="underline text-amber-300" href="/app/admin/integracoes">
                  /app/admin/integracoes
                </Link>
                , esses eventos são disparados automaticamente:
              </p>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {[
                  "lead.created", "lead.converted",
                  "ticket.created", "ticket.replied",
                  "appointment.created", "appointment.confirmed",
                  "deal.won", "deal.lost",
                ].map((e) => (
                  <code key={e} className="rounded border border-white/10 bg-white/5 px-2 py-1.5">
                    {e}
                  </code>
                ))}
              </div>
            </section>

            {/* Endpoints */}
            <section className="space-y-8">
              <h2 className="text-2xl font-bold">Endpoints</h2>
              {ENDPOINTS.map((e) => (
                <article
                  key={e.id}
                  id={e.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3 scroll-mt-24"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <MethodPill method={e.method} />
                    <code className="text-sm font-mono text-white/90">{e.path}</code>
                    {e.scope && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        scope: {e.scope}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{e.title}</h3>
                    {e.desc && <p className="text-sm text-white/60">{e.desc}</p>}
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs uppercase text-white/50 mb-1">Request</p>
                      <CodeBlock code={e.curl} />
                    </div>
                    <div>
                      <p className="text-xs uppercase text-white/50 mb-1">Response</p>
                      <CodeBlock code={e.response} lang="json" />
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
              <h2 className="text-xl font-bold">Pronto pra integrar?</h2>
              <p className="text-white/60 text-sm mt-1">
                Gere sua API key e comece em menos de 2 minutos.
              </p>
              <Link
                href="/app/admin/api-keys"
                className="inline-flex items-center gap-2 mt-4 rounded-lg px-5 py-2.5 font-semibold"
                style={{ backgroundColor: RED, color: "white" }}
              >
                Gerar API key <ExternalLink className="h-4 w-4" />
              </Link>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <div className="relative">
      <pre className="rounded-lg border border-white/10 bg-black/60 p-3 pr-20 text-xs overflow-x-auto">
        <code className={lang ? `language-${lang}` : ""}>{code}</code>
      </pre>
      <CopyButton text={code} />
    </div>
  );
}
