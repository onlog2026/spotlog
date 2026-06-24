import Link from "next/link";
import { ArrowLeft, Plus, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { criarTicketAction } from "../../actions";

export const dynamic = "force-dynamic";

export default function NovoTicketSacPage() {
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/app/sac/tickets">
            <ArrowLeft className="h-4 w-4" />
            Voltar para tickets
          </Link>
        </Button>
        <h2 className="text-xl font-bold mt-2">Novo ticket</h2>
        <p className="text-sm text-muted-foreground">
          Abra um chamado em nome do cliente. Protocolo é gerado automaticamente.
        </p>
      </div>

      <Card className="border-transparent bg-card/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-[#BA0102]" aria-hidden />
            Dados do ticket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={criarTicketAction}
            className="space-y-4"
            aria-label="Formulário de novo ticket"
          >
            <div>
              <Label htmlFor="subject">Assunto *</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="Resumo do problema"
                required
              />
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="department">Departamento</Label>
                <select
                  id="department"
                  name="department"
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
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  name="category"
                  defaultValue="atraso"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="atraso">Atraso</option>
                  <option value="coleta">Coleta</option>
                  <option value="extravio">Extravio/dano</option>
                  <option value="documentacao">Documentação</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue="media"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="company_id">Empresa cliente (ID, opcional)</Label>
                <Input id="company_id" name="company_id" placeholder="UUID" />
              </div>
              <div>
                <Label htmlFor="shipment_id">Remessa relacionada (ID, opcional)</Label>
                <Input id="shipment_id" name="shipment_id" placeholder="UUID" />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                rows={5}
                placeholder="Contexto, histórico e detalhes do problema."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
              <Button asChild type="button" variant="ghost">
                <Link href="/app/sac/tickets">Cancelar</Link>
              </Button>
              <Button type="submit" variant="orange">
                <Plus className="h-4 w-4" />
                Abrir ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
