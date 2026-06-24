import Link from "next/link";
import { ArrowLeft, MessageSquarePlus, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { abrirChamadoClienteAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NovoChamadoPage({
  searchParams,
}: {
  searchParams: Promise<{ remessa?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/app/cliente/chamados">
            <ArrowLeft className="h-4 w-4" />
            Voltar para chamados
          </Link>
        </Button>
        <h2 className="text-xl font-bold mt-2">Abrir novo chamado</h2>
        <p className="text-sm text-muted-foreground">
          Descreva o que aconteceu — nossa equipe responde em até 4h úteis.
        </p>
      </div>

      <Card className="border-transparent bg-card/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquarePlus
              className="h-4 w-4 text-[#BA0102]"
              aria-hidden="true"
            />
            Dados do chamado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={abrirChamadoClienteAction}
            className="space-y-4"
            aria-label="Formulário de novo chamado"
          >
            <div>
              <Label htmlFor="assunto">Assunto *</Label>
              <Input
                id="assunto"
                name="assunto"
                placeholder="Resumo do problema"
                required
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="departamento">Departamento</Label>
                <select
                  id="departamento"
                  name="departamento"
                  defaultValue="sac"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="sac">SAC</option>
                  <option value="comercial">Comercial</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="tecnico">Técnico</option>
                </select>
              </div>
              <div>
                <Label htmlFor="prioridade">Prioridade</Label>
                <select
                  id="prioridade"
                  name="prioridade"
                  defaultValue="media"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <select
                  id="categoria"
                  name="categoria"
                  defaultValue="atraso"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="atraso">Atraso de entrega</option>
                  <option value="coleta">Coleta</option>
                  <option value="extravio">Extravio / dano</option>
                  <option value="documentacao">Documentação / NF</option>
                  <option value="financeiro">Financeiro / fatura</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="remessa">Código da remessa (opcional)</Label>
              <Input
                id="remessa"
                name="remessa"
                placeholder="SPL00012845"
                defaultValue={sp?.remessa ?? ""}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se informar, vinculamos o chamado à remessa automaticamente.
              </p>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                name="descricao"
                rows={6}
                placeholder="Conte com detalhes o que aconteceu. Quanto mais informações, mais rápido resolvemos."
                required
              />
            </div>

            <div>
              <Label
                htmlFor="anexos"
                className="flex items-center gap-2 opacity-60"
              >
                <Paperclip className="h-4 w-4" aria-hidden="true" />
                Anexos (em breve)
              </Label>
              <Input
                id="anexos"
                name="anexos"
                type="file"
                multiple
                disabled
                className="cursor-not-allowed opacity-60"
                aria-disabled="true"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload de arquivos será liberado em breve.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <Button asChild type="button" variant="ghost">
                <Link href="/app/cliente/chamados">Cancelar</Link>
              </Button>
              <Button type="submit" variant="orange">
                Enviar chamado
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
