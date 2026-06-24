"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, ListChecks, Building2, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { criarCampanha } from "@/lib/prospeccao/actions";

type CampaignType = "cnpj_list" | "segmento" | "domain_list";

export function NewCampaignForm() {
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<CampaignType>("cnpj_list");
  const [name, setName] = useState("");

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Dê um nome pra campanha");
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);
    startTransition(async () => {
      try {
        await criarCampanha(formData);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falha ao criar";
        // redirect throws "NEXT_REDIRECT" — silencia
        if (!/NEXT_REDIRECT/.test(msg)) toast.error(msg);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome da campanha *</Label>
            <Input
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Logística farma SP — junho"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle>Tipo de busca</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3">
          <TypeOption
            active={type === "cnpj_list"}
            onClick={() => setType("cnpj_list")}
            icon={<ListChecks className="h-4 w-4" />}
            title="Lista de CNPJs"
            subtitle="Cola CNPJs, enriquece via BrasilAPI (gratuito)"
          />
          <TypeOption
            active={type === "segmento"}
            onClick={() => setType("segmento")}
            icon={<Building2 className="h-4 w-4" />}
            title="Segmento + região"
            subtitle="Filtra empresas já cadastradas"
          />
          <TypeOption
            active={type === "domain_list"}
            onClick={() => setType("domain_list")}
            icon={<Globe className="h-4 w-4" />}
            title="Lista de domínios"
            subtitle="Cola domínios pra prospecção web"
          />
        </CardContent>
      </Card>

      {type === "cnpj_list" && (
        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle>CNPJs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              name="cnpjs_raw"
              rows={8}
              placeholder={"12.345.678/0001-99\n11.222.333/0001-44\n..."}
            />
            <p className="text-[11px] text-muted-foreground">
              Um CNPJ por linha (ou separados por vírgula). Pode ter pontuação ou
              só números. Cada um vai gerar 1 resultado enriquecido com nome
              fantasia, CNAE, endereço, telefone e sócios.
            </p>
          </CardContent>
        </Card>
      )}

      {type === "domain_list" && (
        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle>Domínios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              name="domains_raw"
              rows={8}
              placeholder={"acme.com.br\nempresa.com\n..."}
            />
            <p className="text-[11px] text-muted-foreground">
              Um domínio por linha. Cada domínio vira um resultado pronto pra
              enriquecimento manual no SDR depois.
            </p>
          </CardContent>
        </Card>
      )}

      {type === "segmento" && (
        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Setores</Label>
              <Input
                name="industries"
                placeholder="Logística, Farmacêutica, Saúde"
              />
              <p className="text-[10px] text-muted-foreground">
                Vai filtrar empresas cadastradas cujo campo industry contém o
                termo. Separe por vírgula.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Estados</Label>
                <Input name="states" placeholder="SP, RJ" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cidades</Label>
                <Input name="cities" placeholder="São Paulo, Campinas" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-400" />
            Persona do agente IA (opcional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            name="ai_persona"
            rows={3}
            placeholder='Ex: "Sou consultor da Spotlog, ajudamos times de logística farma a cortar custo de last-mile em até 22%. Tom direto."'
          />
          <p className="text-[11px] text-muted-foreground mt-2">
            Essa persona será usada pela IA pra qualificar e personalizar
            mensagens depois.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          variant="orange"
          disabled={pending || !name.trim()}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar campanha e rodar
        </Button>
      </div>
    </form>
  );
}

function TypeOption({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-md border transition ${
        active
          ? "border-brand-500 bg-brand-500/10"
          : "border-white/10 hover:border-white/20 hover:bg-white/5"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={active ? "text-brand-400" : "text-muted-foreground"}>
          {icon}
        </span>
        <div className="font-medium text-sm">{title}</div>
      </div>
      <div className="text-[11px] text-muted-foreground">{subtitle}</div>
    </button>
  );
}
