import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { solicitarColetaAction } from "../../actions";

export const dynamic = "force-dynamic";

export default function NovaColetaPage() {
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/app/cliente">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao painel
          </Link>
        </Button>
        <h2 className="text-xl font-bold mt-2">Solicitar nova coleta</h2>
        <p className="text-sm text-muted-foreground">
          Preencha os dados e nossa equipe agendará a coleta no endereço informado.
        </p>
      </div>

      <Card className="border-transparent bg-card/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-spotorange-500" aria-hidden="true" />
            Dados da coleta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={solicitarColetaAction} className="space-y-4" aria-label="Formulário de nova coleta">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cep">CEP de coleta</Label>
                <Input id="cep" name="cep" placeholder="00000-000" required />
              </div>
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  name="endereco"
                  placeholder="Rua Exemplo, 123"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" name="cidade" placeholder="São Paulo" required />
              </div>
              <div>
                <Label htmlFor="uf">UF</Label>
                <Input id="uf" name="uf" placeholder="SP" maxLength={2} required />
              </div>
              <div>
                <Label htmlFor="data">Data preferida</Label>
                <Input id="data" name="data" type="date" required />
              </div>
              <div>
                <Label htmlFor="janela">Janela</Label>
                <select
                  id="janela"
                  name="janela"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  defaultValue="manha"
                >
                  <option value="manha">Manhã (08h às 12h)</option>
                  <option value="tarde">Tarde (13h às 17h)</option>
                  <option value="comercial">Comercial (08h às 18h)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="volumes">Quantidade de volumes</Label>
                <Input
                  id="volumes"
                  name="volumes"
                  type="number"
                  min={1}
                  defaultValue={1}
                  required
                />
              </div>
              <div>
                <Label htmlFor="peso">Peso estimado total (kg)</Label>
                <Input
                  id="peso"
                  name="peso"
                  type="number"
                  step="0.1"
                  min={0.1}
                  placeholder="1.0"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                name="obs"
                rows={3}
                placeholder="Detalhes pro motorista (acesso, horário restrito, etc.)"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="reset" variant="ghost">
                Limpar
              </Button>
              <Button type="submit" variant="orange">
                Solicitar coleta
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
