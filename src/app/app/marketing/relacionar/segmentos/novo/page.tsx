import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { saveSegmentForm } from "../../actions";

export const dynamic = "force-dynamic";

const SOURCES = [
  { v: "site", l: "Site / Formulário" },
  { v: "chatbot", l: "Chatbot" },
  { v: "landing", l: "Landing Page" },
  { v: "popup", l: "Pop-up" },
  { v: "ads", l: "Anúncio pago" },
  { v: "manual", l: "Manual" },
  { v: "import", l: "Importação" },
];

const STATUSES = [
  { v: "new", l: "Novo" },
  { v: "contacted", l: "Contatado" },
  { v: "qualified", l: "Qualificado" },
  { v: "converted", l: "Convertido" },
  { v: "lost", l: "Perdido" },
  { v: "disqualified", l: "Desqualificado" },
];

export default function NovoSegmentoPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/app/marketing/relacionar/segmentos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div>
        <h2 className="text-xl font-bold">Novo segmento de leads</h2>
        <p className="text-sm text-muted-foreground">
          Defina os critérios. O segmento é dinâmico — sempre traz leads atualizados.
        </p>
      </div>

      <form action={saveSegmentForm} className="space-y-5">
        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Leads quentes do site últimos 30 dias"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                placeholder="Opcional"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Origem (source)</Label>
              <div className="flex flex-wrap gap-2">
                {SOURCES.map((s) => (
                  <label
                    key={s.v}
                    className="inline-flex items-center gap-2 px-3 h-8 rounded-md border border-white/10 bg-card/80 text-xs cursor-pointer hover:border-[#BA0102]/40"
                  >
                    <input type="checkbox" name="source" value={s.v} className="accent-[#BA0102]" />
                    {s.l}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Status</Label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <label
                    key={s.v}
                    className="inline-flex items-center gap-2 px-3 h-8 rounded-md border border-white/10 bg-card/80 text-xs cursor-pointer hover:border-[#BA0102]/40"
                  >
                    <input type="checkbox" name="status" value={s.v} className="accent-[#BA0102]" />
                    {s.l}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="score_min">Score mínimo</Label>
                <Input
                  id="score_min"
                  name="score_min"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Ex: 60"
                />
              </div>
              <div>
                <Label htmlFor="created_after">Criado depois de</Label>
                <Input id="created_after" name="created_after" type="date" />
              </div>
            </div>

            <div>
              <Label htmlFor="utm_source">UTM Source (separe por vírgula)</Label>
              <Input
                id="utm_source"
                name="utm_source"
                placeholder="google, facebook, linkedin"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-end">
          <Link href="/app/marketing/relacionar/segmentos">
            <Button type="button" variant="outline" className="border-white/20">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="bg-[#BA0102] hover:bg-[#a10002] text-white">
            Salvar segmento
          </Button>
        </div>
      </form>
    </div>
  );
}
