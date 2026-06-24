import { Truck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireSession } from "@/lib/auth";
import { listVehicles } from "@/lib/queries/operacao";
import { VehicleBadge } from "@/components/operacao/status-badges";
import { EmptyState } from "@/components/operacao/empty-state";
import { createVehicle } from "./actions";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const ctx = await requireSession();
  const vehicles = await listVehicles(ctx.org.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Veículos</h2>
          <p className="text-sm text-muted-foreground">
            {vehicles.length} veículos cadastrados
          </p>
        </div>
      </div>

      <Card className="border-transparent bg-card/50">
        <CardContent className="p-4">
          <form
            action={createVehicle}
            className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end"
            aria-label="Cadastrar novo veículo"
          >
            <div>
              <Label htmlFor="plate">Placa</Label>
              <Input id="plate" name="plate" placeholder="ABC1D23" required />
            </div>
            <div>
              <Label htmlFor="brand">Marca</Label>
              <Input id="brand" name="brand" placeholder="Mercedes" />
            </div>
            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input id="model" name="model" placeholder="Sprinter" />
            </div>
            <div>
              <Label htmlFor="year">Ano</Label>
              <Input id="year" name="year" type="number" placeholder="2023" />
            </div>
            <div>
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                defaultValue="van"
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="moto">Moto</option>
                <option value="van">Van</option>
                <option value="utilitario">Utilitário</option>
                <option value="truck">Caminhão</option>
              </select>
            </div>
            <div>
              <Label htmlFor="capacity_kg">Capacidade (kg)</Label>
              <Input
                id="capacity_kg"
                name="capacity_kg"
                type="number"
                step="0.1"
                placeholder="1500"
              />
            </div>
            <Button type="submit" variant="orange" className="col-span-2 md:col-span-6 md:max-w-[200px]">
              <Plus className="h-4 w-4" />
              Novo veículo
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-transparent bg-card/50">
        <CardContent className="p-0">
          {vehicles.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Nenhum veículo cadastrado"
              description="Cadastre o primeiro veículo no formulário acima."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-y border-white/5">
                  <tr>
                    <th className="text-left py-2 px-4">Placa</th>
                    <th className="text-left py-2 px-4">Modelo</th>
                    <th className="text-left py-2 px-4">Tipo</th>
                    <th className="text-left py-2 px-4">Capacidade</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Motorista</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 px-4 font-mono">{v.plate}</td>
                      <td className="py-3 px-4">
                        {[v.brand, v.model].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground capitalize">{v.type ?? "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {v.capacity_kg ? `${v.capacity_kg} kg` : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <VehicleBadge status={v.status} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {v.driver_name ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
