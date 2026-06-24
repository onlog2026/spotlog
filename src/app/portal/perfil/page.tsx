import { CircleUser, Building2 } from "lucide-react";
import { requireClientSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const ctx = await requireClientSession();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CircleUser className="h-6 w-6" />
          Meu perfil
        </h1>
        <p className="text-muted-foreground">
          Suas informações e da empresa cliente
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleUser className="h-4 w-4" />
            Dados pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={ctx.user.full_name ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input value={ctx.user.email ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Função</Label>
            <Input value={ctx.role} disabled className="capitalize" />
          </div>
          <p className="text-xs text-muted-foreground">
            Para alterar seu nome ou senha, contate o gerente da sua transportadora.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresa cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Razão / Nome</Label>
            <Input value={ctx.company.name} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>CNPJ</Label>
            <Input value={ctx.company.cnpj ?? "—"} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Transportadora responsável</Label>
            <Input value={ctx.organization.name} disabled />
          </div>
          <p className="text-xs text-muted-foreground">
            Estes dados são gerenciados pela transportadora. Se precisar de
            alteração, abra um chamado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
