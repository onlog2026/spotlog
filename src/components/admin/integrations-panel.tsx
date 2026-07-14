"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Check,
  AlertCircle,
  Plug,
  Bot,
  Mail,
  MessageCircle,
  Building2,
  Map,
  Brain,
  Hash,
  Send,
  Smartphone,
  Calendar,
  Webhook,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type IntegrationDef = {
  provider: string;
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  desc: string;
  fields: Array<{ key: string; label: string; placeholder?: string; type?: string }>;
  docs?: string;
};

const DEFS: IntegrationDef[] = [
  {
    provider: "openai",
    name: "OpenAI",
    category: "IA",
    icon: Brain,
    color: "from-emerald-500 to-teal-500",
    desc: "Use GPT-4o ou GPT-4o-mini pra gerar mensagens, qualificar leads e classificar respostas.",
    fields: [{ key: "api_key", label: "API Key", placeholder: "sk-..." }],
    docs: "https://platform.openai.com/api-keys",
  },
  {
    provider: "anthropic",
    name: "Anthropic Claude",
    category: "IA",
    icon: Bot,
    color: "from-orange-500 to-amber-500",
    desc: "Claude 3.5 Sonnet — alternativa premium pra geração de mensagens.",
    fields: [{ key: "api_key", label: "API Key", placeholder: "sk-ant-..." }],
    docs: "https://console.anthropic.com/account/keys",
  },
  {
    provider: "resend",
    name: "Resend",
    category: "E-mail",
    icon: Mail,
    color: "from-blue-500 to-cyan-500",
    desc: "Envio transacional de e-mails. 3.000 e-mails grátis por mês.",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "re_..." },
      {
        key: "from_email",
        label: "Remetente padrão",
        placeholder: "vendas@suaempresa.com.br",
      },
    ],
    docs: "https://resend.com/api-keys",
  },
  {
    provider: "evolution",
    name: "Evolution API",
    category: "WhatsApp",
    icon: MessageCircle,
    color: "from-green-500 to-emerald-500",
    desc: "WhatsApp open-source. Você hospeda; a gente conecta.",
    fields: [
      { key: "url", label: "URL", placeholder: "https://evo.seudominio.com.br" },
      { key: "api_key", label: "API Key" },
      { key: "instance", label: "Instância", placeholder: "default" },
    ],
    docs: "https://doc.evolution-api.com/",
  },
  {
    provider: "zapi",
    name: "Z-API",
    category: "WhatsApp",
    icon: MessageCircle,
    color: "from-green-600 to-lime-500",
    desc: "WhatsApp sem servidor. Setup mais rápido.",
    fields: [
      { key: "instance_id", label: "Instance ID" },
      { key: "token", label: "Token" },
      { key: "client_token", label: "Client Token (opcional)" },
    ],
    docs: "https://developer.z-api.io/",
  },
  {
    provider: "apollo",
    name: "Apollo.io",
    category: "Prospecção",
    icon: Building2,
    color: "from-purple-500 to-pink-500",
    desc: "Base com 275M+ contatos B2B. Busca por cargo, setor, região.",
    fields: [{ key: "api_key", label: "API Key" }],
    docs: "https://app.apollo.io/#/settings/integrations/api",
  },
  {
    provider: "google_places",
    name: "Google Places",
    category: "Prospecção",
    icon: Map,
    color: "from-red-500 to-orange-500",
    desc: "Negócios locais e empresas no Google Maps.",
    fields: [{ key: "api_key", label: "API Key" }],
    docs: "https://developers.google.com/maps/documentation/places/web-service",
  },
  {
    provider: "slack",
    name: "Slack",
    category: "Comunicação",
    icon: Hash,
    color: "from-purple-600 to-fuchsia-500",
    desc: "Notifica um canal Slack quando lead/ticket/deal acontece.",
    fields: [
      {
        key: "webhook_url",
        label: "Incoming Webhook URL",
        placeholder: "https://hooks.slack.com/services/T.../B.../...",
      },
    ],
    docs: "https://api.slack.com/messaging/webhooks",
  },
  {
    provider: "discord",
    name: "Discord",
    category: "Comunicação",
    icon: MessageCircle,
    color: "from-indigo-500 to-violet-500",
    desc: "Notifica um canal Discord via webhook.",
    fields: [
      {
        key: "webhook_url",
        label: "Channel Webhook URL",
        placeholder: "https://discord.com/api/webhooks/...",
      },
    ],
    docs: "https://support.discord.com/hc/articles/228383668",
  },
  {
    provider: "telegram",
    name: "Telegram",
    category: "Comunicação",
    icon: Send,
    color: "from-sky-500 to-blue-500",
    desc: "Bot envia mensagem pra chat (pessoal ou grupo).",
    fields: [
      { key: "bot_token", label: "Bot Token (@BotFather)" },
      { key: "chat_id", label: "Chat ID", placeholder: "-100...." },
    ],
    docs: "https://core.telegram.org/bots#how-do-i-create-a-bot",
  },
  {
    provider: "twilio",
    name: "Twilio SMS",
    category: "SMS",
    icon: Smartphone,
    color: "from-rose-500 to-red-500",
    desc: "Envio de SMS transacional via Twilio.",
    fields: [
      { key: "account_sid", label: "Account SID", placeholder: "AC..." },
      { key: "auth_token", label: "Auth Token" },
      { key: "from", label: "From (E.164)", placeholder: "+15005550006" },
    ],
    docs: "https://www.twilio.com/console",
  },
  {
    provider: "google_calendar",
    name: "Google Calendar",
    category: "Agenda",
    icon: Calendar,
    color: "from-blue-500 to-indigo-500",
    desc: "Cria eventos no seu Google Agenda quando um agendamento é criado/confirmado.",
    fields: [],
    docs: "https://calendar.google.com",
  },
  {
    provider: "webhook",
    name: "Webhook genérico",
    category: "Automação",
    icon: Webhook,
    color: "from-slate-600 to-zinc-500",
    desc: "Dispara POST JSON pra qualquer URL nos eventos selecionados. HMAC-SHA256 opcional.",
    fields: [
      { key: "url", label: "URL", placeholder: "https://meusite.com/webhook" },
      { key: "secret", label: "Secret (opcional, p/ assinar payload)", placeholder: "whsec_..." },
    ],
  },
  {
    provider: "openrouter",
    name: "OpenRouter",
    category: "IA",
    icon: Brain,
    color: "from-cyan-500 to-teal-500",
    desc: "Acessa Claude, Gemini, Llama e dezenas de modelos via uma única API.",
    fields: [{ key: "api_key", label: "API Key", placeholder: "sk-or-..." }],
    docs: "https://openrouter.ai/keys",
  },
  {
    provider: "digisac",
    name: "DIGISAC",
    category: "WhatsApp",
    icon: MessageCircle,
    color: "from-green-700 to-emerald-600",
    desc: "WhatsApp multicanal via DIGISAC (envia e recebe). Só dispara com opt-in do contato.",
    fields: [
      { key: "base_url", label: "URL da conta", placeholder: "https://spotlog2.digisac.io" },
      { key: "token", label: "Token de acesso pessoal", type: "password" },
      { key: "service_id", label: "Conexão (serviceId)", placeholder: "uuid da conexão WhatsApp" },
      { key: "webhook_secret", label: "Segredo do webhook (você inventa)", type: "password" },
    ],
    docs: "https://spotlog2.digisac.io",
  },
];

// "n8n / Make / Zapier" usam o mesmo handler do webhook genérico (provider="webhook").
// Aparecem como cards informativos pra UX, mas guardam config no mesmo registro.

const EVENT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "lead.created", label: "Lead criado" },
  { value: "lead.converted", label: "Lead convertido" },
  { value: "ticket.created", label: "Ticket criado" },
  { value: "ticket.replied", label: "Ticket respondido" },
  { value: "appointment.created", label: "Agendamento criado" },
  { value: "appointment.confirmed", label: "Agendamento confirmado" },
  { value: "deal.won", label: "Negócio ganho" },
  { value: "deal.lost", label: "Negócio perdido" },
];

const EVENT_PROVIDERS = new Set(["slack", "discord", "telegram", "webhook"]);

export function IntegrationsPanel({
  existing,
}: {
  existing: Record<
    string,
    {
      id: string;
      is_active: boolean;
      last_test_ok: boolean | null;
      settings?: Record<string, unknown> | null;
    }
  >;
}) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("Todas");

  // Feedback do retorno do OAuth do Google Calendar (?gcal=...)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("gcal");
    if (!p) return;
    const msg: Record<string, string> = {
      connected: "Google Calendar conectado! ✅",
      denied: "Conexão cancelada no Google.",
      no_refresh: "O Google não devolveu o token. Tente reconectar.",
      missing_config: "Falta configurar GOOGLE_OAUTH_CLIENT_ID/SECRET na Vercel.",
      bad_state: "Sessão inválida — tente de novo.",
      save_error: "Conectou, mas falhou ao salvar. Tente de novo.",
      error: "Erro ao conectar o Google Calendar.",
    };
    if (p === "connected") toast.success(msg[p]);
    else toast.error(msg[p] ?? "Erro ao conectar.");
    window.history.replaceState({}, "", window.location.pathname);
  }, []);
  const groups = ["Todas", ...Array.from(new Set(DEFS.map((d) => d.category)))];
  const filtered = DEFS.filter((d) => {
    if (activeCat !== "Todas" && d.category !== activeCat) return false;
    if (query.trim() === "") return true;
    const q = query.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.desc.toLowerCase().includes(q) ||
      d.provider.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar integração (slack, twilio, webhook…)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="md:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <Button
              key={g}
              size="sm"
              variant={activeCat === g ? "gradient" : "outline"}
              onClick={() => setActiveCat(g)}
            >
              {g}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((def) => (
          <IntegrationCard
            key={def.provider}
            def={def}
            row={existing[def.provider]}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          Nenhuma integração encontrada.
        </p>
      )}

      <div className="rounded-xl border border-dashed border-white/10 p-4 bg-card/30">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-sm">n8n, Zapier, Make — use o Webhook genérico</p>
            <p className="text-xs text-muted-foreground">
              Crie um workflow nessas plataformas com trigger "Webhook" e cole a URL
              aqui no card "Webhook genérico". Eventos selecionados serão enviados
              em tempo real como POST JSON.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({
  def,
  row,
}: {
  def: IntegrationDef;
  row?: {
    id: string;
    is_active: boolean;
    last_test_ok: boolean | null;
    settings?: Record<string, unknown> | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const supportsEvents = EVENT_PROVIDERS.has(def.provider);
  const isOAuth = def.provider === "google_calendar";
  const initialEvents = Array.isArray(row?.settings?.events)
    ? (row!.settings!.events as string[])
    : [];
  const [events, setEvents] = useState<string[]>(initialEvents);

  const status = row
    ? row.is_active
      ? row.last_test_ok === false
        ? "warning"
        : "active"
      : "inactive"
    : "missing";

  function toggleEvent(ev: string) {
    setEvents((cur) =>
      cur.includes(ev) ? cur.filter((e) => e !== ev) : [...cur, ev],
    );
  }

  async function save() {
    setSaving(true);
    const payload: Record<string, unknown> = {
      provider: def.provider,
      credentials: values,
    };
    if (supportsEvents) {
      payload.settings = { events };
    }
    const res = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? "Erro ao salvar");
      return;
    }
    toast.success(`${def.name} configurado!`);
    setOpen(false);
    setValues({});
    router.refresh();
  }

  async function toggleActive(checked: boolean) {
    const res = await fetch("/api/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: def.provider, is_active: checked }),
    });
    if (!res.ok) {
      toast.error("Erro ao alterar");
      return;
    }
    toast.success(checked ? "Ativada" : "Desativada");
    router.refresh();
  }

  async function testConnection() {
    setTesting(true);
    const res = await fetch("/api/integrations/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: def.provider }),
    });
    setTesting(false);
    const data = await res.json().catch(() => ({}));
    if (data.ok) toast.success("Conexão OK");
    else toast.error(data.error ?? "Falha no teste");
    router.refresh();
  }

  return (
    <>
      <Card className="border-white/10 bg-card/50 hover:border-white/20 transition">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg bg-gradient-to-br ${def.color}`}
              >
                <def.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">{def.name}</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {def.desc}
                </CardDescription>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={row?.is_active ?? false}
              disabled={!row}
              onCheckedChange={toggleActive}
            />
            <span className="text-xs text-muted-foreground">
              {row?.is_active ? "Ativo" : "Inativo"}
            </span>
          </div>
          <div className="flex gap-2">
            {row && (
              <Button
                variant="ghost"
                size="sm"
                onClick={testConnection}
                disabled={testing}
              >
                {testing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Testar"
                )}
              </Button>
            )}
            <Button
              variant={row ? "outline" : "gradient"}
              size="sm"
              onClick={() =>
                isOAuth
                  ? (window.location.href =
                      "/api/integrations/google-calendar/connect")
                  : setOpen(true)
              }
            >
              <Plug className="h-3 w-3" />
              {isOAuth
                ? row
                  ? "Reconectar"
                  : "Conectar Google"
                : row
                  ? "Editar"
                  : "Conectar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar {def.name}</DialogTitle>
            <DialogDescription>
              {def.desc}{" "}
              {def.docs && (
                <a
                  href={def.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 underline"
                >
                  Onde pegar a chave?
                </a>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {def.fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                <Input
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) =>
                    setValues({ ...values, [f.key]: e.target.value })
                  }
                />
              </div>
            ))}

            {supportsEvents && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <Label>Disparar em:</Label>
                <p className="text-xs text-muted-foreground">
                  Selecione quais eventos enviam notificação pra essa integração.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {EVENT_OPTIONS.map((ev) => (
                    <label
                      key={ev.value}
                      className="flex items-center gap-2 text-xs cursor-pointer rounded-md border border-white/10 px-2 py-1.5 hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={events.includes(ev.value)}
                        onChange={() => toggleEvent(ev.value)}
                        className="accent-current"
                      />
                      <span>{ev.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="orange" onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              Salvar e ativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active")
    return (
      <Badge variant="success">
        <Check className="h-3 w-3 mr-1" /> Conectado
      </Badge>
    );
  if (status === "warning")
    return (
      <Badge variant="warning">
        <AlertCircle className="h-3 w-3 mr-1" /> Teste falhou
      </Badge>
    );
  if (status === "inactive")
    return <Badge variant="secondary">Inativo</Badge>;
  return <Badge variant="outline">Não configurado</Badge>;
}
