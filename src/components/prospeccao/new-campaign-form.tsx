"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, ListChecks, Building2, Globe, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { criarCampanha } from "@/lib/prospeccao/actions";

type CampaignType = "internet" | "cnpj_list" | "segmento" | "domain_list";

type IcpAi = {
  segmento: string;
  keywords: string[];
  cidades: string[];
  ufs: string[];
  porte: string;
  faturamento_alvo: string;
  cargos_alvo: string[];
  dores_provaveis: string[];
  tecnologias: string[];
  estrategia: {
    persona: string;
    gancho: string;
    canal_primeiro_toque: string;
    num_toques: number;
    tom: string;
  };
};

export function NewCampaignForm({
  sequences = [],
}: {
  sequences?: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<CampaignType>("internet");
  const [name, setName] = useState("");
  const [sequenceId, setSequenceId] = useState(sequences[0]?.id ?? "");
  const [autoEnroll, setAutoEnroll] = useState(true);
  // Agente ICP: uma frase → estratégia completa (preenche o form sozinho).
  const [icpText, setIcpText] = useState("");
  const [icpLoading, setIcpLoading] = useState(false);
  const [icp, setIcp] = useState<IcpAi | null>(null);
  const [keywords, setKeywords] = useState("");
  const [cities, setCities] = useState("");
  const [states, setStates] = useState("");
  const [persona, setPersona] = useState("");

  async function gerarIcp() {
    if (icpText.trim().length < 10) {
      toast.error("Descreva em uma frase o que você vende e pra quem.");
      return;
    }
    setIcpLoading(true);
    try {
      const res = await fetch("/api/prospecting/icp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: icpText.trim() }),
      });
      const data = (await res.json()) as { icp?: IcpAi; error?: string };
      if (!res.ok || !data.icp) {
        toast.error(data.error || "Falha ao gerar a estratégia.");
        return;
      }
      const g = data.icp;
      setIcp(g);
      setKeywords(g.keywords.join(", "));
      setCities(g.cidades.join(", "));
      setStates(g.ufs.join(", "));
      setPersona(
        `${g.estrategia.persona}${g.estrategia.gancho ? ` Gancho de abertura: ${g.estrategia.gancho}` : ""}`,
      );
      if (!name.trim()) setName(`${g.segmento} — estratégia IA`);
      toast.success("Estratégia pronta! Revise os campos abaixo e crie a campanha.");
    } catch {
      toast.error("Falha de rede ao gerar a estratégia.");
    } finally {
      setIcpLoading(false);
    }
  }

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
      <Card className="border-brand-500/30 bg-brand-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-400" />
            Comece por aqui: descreva pra quem você quer vender
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={icpText}
            onChange={(e) => setIcpText(e.target.value)}
            rows={2}
            placeholder='Ex.: "Quero vender logística para farmácias de manipulação do Brasil que faturam acima de 5 milhões"'
          />
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              type="button"
              variant="orange"
              size="sm"
              onClick={gerarIcp}
              disabled={icpLoading}
            >
              {icpLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Montando a estratégia…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Gerar estratégia com IA
                </>
              )}
            </Button>
            <span className="text-[11px] text-muted-foreground">
              A IA monta o perfil ideal (ICP), os termos de busca, as cidades e a
              persona — você só revisa e cria.
            </span>
          </div>

          {icp && (
            <div className="rounded-md border border-white/10 bg-background/60 p-3 space-y-2 text-xs">
              <div>
                <span className="font-semibold">Segmento:</span> {icp.segmento}
                {icp.porte ? <> · <span className="font-semibold">Porte:</span> {icp.porte}</> : null}
                {icp.faturamento_alvo ? <> · <span className="font-semibold">Faturamento:</span> {icp.faturamento_alvo}</> : null}
              </div>
              {icp.cargos_alvo.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="font-semibold">Decisores:</span>
                  {icp.cargos_alvo.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30">{c}</span>
                  ))}
                </div>
              )}
              {icp.dores_provaveis.length > 0 && (
                <div>
                  <span className="font-semibold">Dores prováveis:</span>{" "}
                  {icp.dores_provaveis.join(" · ")}
                </div>
              )}
              {icp.tecnologias.length > 0 && (
                <div>
                  <span className="font-semibold">Tecnologias comuns:</span>{" "}
                  {icp.tecnologias.join(", ")}
                </div>
              )}
            </div>
          )}
          {/* ICP completo vai junto no submit (fica salvo na campanha) */}
          <input type="hidden" name="icp_ai" value={icp ? JSON.stringify(icp) : ""} />
        </CardContent>
      </Card>

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
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <TypeOption
            active={type === "internet"}
            onClick={() => setType("internet")}
            icon={<Search className="h-4 w-4" />}
            title="Buscar na internet (grátis)"
            subtitle="Acha empresas reais por nicho + cidade (OpenStreetMap, R$0)"
          />
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

      {type === "internet" && (
        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle>Buscar leads reais na internet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Serviço / nicho *</Label>
              <Input
                name="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="transportadora, farmácia, restaurante, oficina…"
              />
              <p className="text-[10px] text-muted-foreground">
                O que você procura (separe por vírgula). Ex.: “transportadora”,
                “clínica”, “e-commerce”. Busca empresas com esse termo no nome.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Nome da empresa (opcional)</Label>
              <Input name="nome" placeholder="ex.: Rápido, Express, Log…" />
              <p className="text-[10px] text-muted-foreground">
                Se quiser achar uma empresa específica ou parte do nome.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Cidade / região *</Label>
                <Input
                  name="cities"
                  value={cities}
                  onChange={(e) => setCities(e.target.value)}
                  placeholder="São Paulo (ou “Grande SP”)"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Bairro (opcional)</Label>
                <Input name="bairro" placeholder="ex.: Moema, Tatuapé" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Estado (UF)</Label>
                <Input
                  name="states"
                  value={states}
                  onChange={(e) => setStates(e.target.value)}
                  placeholder="SP (ou SP, RJ)"
                  maxLength={30}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Quantos leads</Label>
                <Input name="limit" type="number" defaultValue={30} min={1} max={60} />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Dica: preencha ao menos <strong>serviço + cidade</strong>. O bairro
              deixa a busca mais precisa. Você pode digitar uma região (ex.:
              “Grande São Paulo”) no campo cidade.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Fonte: <strong>Google Maps</strong> (Google Places) + OpenStreetMap de
              reserva. Traz Nome, Endereço, <strong>Telefone/celular</strong>, Site — e
              o enriquecimento pega WhatsApp/e-mail do site. <strong>Dados reais, nunca
              inventados.</strong>
            </p>
          </CardContent>
        </Card>
      )}

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
          <CardTitle>Follow-up automático (cadência)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Sequência de follow-up</Label>
            <select
              name="sequence_id"
              value={sequenceId}
              onChange={(e) => setSequenceId(e.target.value)}
              className="w-full h-9 rounded-md border border-white/10 bg-background px-3 text-sm"
            >
              <option value="">Sem cadência (só busca e converte)</option>
              {sequences.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              name="auto_enroll"
              checked={autoEnroll}
              onChange={(e) => setAutoEnroll(e.target.checked)}
              disabled={!sequenceId}
              className="mt-0.5"
            />
            <span>
              Inscrever automaticamente ao converter em lead
              <span className="block text-[11px] text-muted-foreground">
                Cada lead convertido entra na cadência: WhatsApp hoje, follow-up
                em 3 dias, e-mail no 7º e último toque no 15º. Para na hora se o
                lead responder. Respeita opt-out (LGPD).
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

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
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
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
          {type === "internet" ? "Buscar leads reais" : "Criar campanha e rodar"}
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
