import Link from "next/link";
import { ArrowLeft, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarRemessaAction } from "../actions";

export const dynamic = "force-dynamic";

export default function NovaRemessaOperacaoPage() {
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/app/operacao/shipments">
            <ArrowLeft className="h-4 w-4" />
            Voltar para remessas
          </Link>
        </Button>
        <h2 className="text-xl font-bold mt-2">Nova remessa</h2>
        <p className="text-sm text-muted-foreground">
          Preencha os dados do destinatário e endereço. O código é gerado automaticamente.
        </p>
      </div>

      <Card className="border-transparent bg-card/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-[#BA0102]" aria-hidden />
            Dados da remessa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={criarRemessaAction}
            className="space-y-4"
            aria-label="Formulário de nova remessa"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="recipient_name">Destinatário *</Label>
                <Input
                  id="recipient_name"
                  name="recipient_name"
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="recipient_phone">Telefone</Label>
                <Input
                  id="recipient_phone"
                  name="recipient_phone"
                  placeholder="(11) 99999-0000"
                />
              </div>
              <div>
                <Label htmlFor="recipient_email">E-mail</Label>
                <Input
                  id="recipient_email"
                  name="recipient_email"
                  type="email"
                  placeholder="destinatario@email.com"
                />
              </div>
              <div>
                <Label htmlFor="company_id">Empresa cliente (ID, opcional)</Label>
                <Input id="company_id" name="company_id" placeholder="UUID" />
              </div>
              <div>
                <Label htmlFor="sla_deadline">Prazo SLA</Label>
                <Input
                  id="sla_deadline"
                  name="sla_deadline"
                  type="datetime-local"
                />
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <h3 className="text-sm font-semibold mb-3">Endereço de destino</h3>
              <div className="grid md:grid-cols-6 gap-3">
                <div className="md:col-span-3">
                  <Label htmlFor="street">Rua</Label>
                  <Input id="street" name="street" placeholder="Av. Paulista" />
                </div>
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input id="number" name="number" placeholder="1000" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" name="cep" placeholder="00000-000" />
                </div>
                <div className="md:col-span-4">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" name="city" placeholder="São Paulo" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="uf">UF</Label>
                  <Input id="uf" name="uf" maxLength={2} placeholder="SP" />
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 grid md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="weight_kg">Peso (kg)</Label>
                <Input
                  id="weight_kg"
                  name="weight_kg"
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="1.5"
                />
              </div>
              <div>
                <Label htmlFor="declared_value">Valor declarado (R$)</Label>
                <Input
                  id="declared_value"
                  name="declared_value"
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="250.00"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
              <Button asChild type="button" variant="ghost">
                <Link href="/app/operacao/shipments">Cancelar</Link>
              </Button>
              <Button type="submit" variant="orange">
                <Plus className="h-4 w-4" />
                Criar remessa
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
