"use client";
import { useState } from "react";
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
];

export function IntegrationsPanel({
  existing,
}: {
  existing: Record<string, { id: string; is_active: boolean; last_test_ok: boolean | null }>;
}) {
  const groups = Array.from(new Set(DEFS.map((d) => d.category)));
  return (
    <div className="space-y-8">
      {groups.map((cat) => (
        <section key={cat}>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            {cat}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {DEFS.filter((d) => d.category === cat).map((def) => (
              <IntegrationCard
                key={def.provider}
                def={def}
                row={existing[def.provider]}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function IntegrationCard({
  def,
  row,
}: {
  def: IntegrationDef;
  row?: { id: string; is_active: boolean; last_test_ok: boolean | null };
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const status = row
    ? row.is_active
      ? row.last_test_ok === false
        ? "warning"
        : "active"
      : "inactive"
    : "missing";

  async function save() {
    setSaving(true);
    const res = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: def.provider, credentials: values }),
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
              onClick={() => setOpen(true)}
            >
              <Plug className="h-3 w-3" />
              {row ? "Editar" : "Conectar"}
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
          <div className="space-y-3 py-2">
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
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gradient" onClick={save} disabled={saving}>
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
