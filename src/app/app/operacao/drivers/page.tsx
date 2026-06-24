import { User, Plus, Phone, Mail, IdCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireSession } from "@/lib/auth";
import { listDrivers } from "@/lib/queries/operacao";
import { DriverBadge } from "@/components/operacao/status-badges";
import { EmptyState } from "@/components/operacao/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { createDriver } from "./actions";

export const dynamic = "force-dynamic";

function cnhVencida(dateStr: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default async function DriversPage() {
  const ctx = await requireSession();
  const drivers = await listDrivers(ctx.org.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Motoristas</h2>
          <p className="text-sm text-muted-foreground">
            {drivers.length} motoristas cadastrados
          </p>
        </div>
      </div>

      {/* Form novo motorista */}
      <Card className="border-transparent bg-card/50">
        <CardContent className="p-4">
          <form
            action={createDriver}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
            aria-label="Cadastrar novo motorista"
          >
            <div className="md:col-span-2">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" name="full_name" placeholder="José Silva" required />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" placeholder="(11) 99999-0000" />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" placeholder="motorista@email.com" />
            </div>
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" name="cpf" placeholder="000.000.000-00" />
            </div>
            <div>
              <Label htmlFor="cnh_numero">Nº CNH</Label>
              <Input id="cnh_numero" name="cnh_numero" />
            </div>
            <div>
              <Label htmlFor="cnh_validade">Validade CNH</Label>
              <Input id="cnh_validade" name="cnh_validade" type="date" />
            </div>
            <Button type="submit" variant="orange" className="md:col-span-3 md:max-w-[200px]">
              <Plus className="h-4 w-4" />
              Novo motorista
            </Button>
          </form>
        </CardContent>
      </Card>

      {drivers.length === 0 ? (
        <Card className="border-transparent bg-card/50">
          <CardContent>
            <EmptyState
              icon={User}
              title="Nenhum motorista cadastrado"
              description="Cadastre o primeiro motorista usando o formulário acima."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {drivers.map((d) => {
            const vencida = cnhVencida(d.cnh_validade);
            return (
              <Card
                key={d.id}
                className="border-transparent bg-card/50 hover:border-spotorange-500 transition"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-navy-900/10 dark:bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {d.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={d.photo_url}
                          alt={d.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" aria-hidden />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{d.full_name}</div>
                      <div className="mt-1">
                        <DriverBadge status={d.status} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {d.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" aria-hidden /> {d.phone}
                      </div>
                    )}
                    {d.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="h-3 w-3 shrink-0" aria-hidden /> {d.email}
                      </div>
                    )}
                    {d.cnh_numero && (
                      <div className="flex items-center gap-2">
                        <IdCard className="h-3 w-3" aria-hidden /> CNH {d.cnh_numero}
                      </div>
                    )}
                    {d.vehicle?.plate && (
                      <div>Veículo: <span className="font-mono">{d.vehicle.plate}</span></div>
                    )}
                  </div>
                  {d.cnh_validade && (
                    <div className="flex items-center gap-2 text-xs">
                      <span>Validade CNH:</span>
                      {vencida ? (
                        <Badge variant="outline" className="border-transparent bg-red-500/15 text-red-700 dark:text-red-300 font-medium">
                          <AlertTriangle className="h-3 w-3 mr-1" aria-hidden /> {formatDate(d.cnh_validade)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{formatDate(d.cnh_validade)}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
