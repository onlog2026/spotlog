import { CircleUser, Building2 } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { atualizarPerfilAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const ctx = await requireSession();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <CircleUser className="h-6 w-6" />
          Meu perfil
        </h1>
        <p className="text-muted-foreground mt-1">
          Seus dados de acesso ao Spotlog
        </p>
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CircleUser className="h-4 w-4" />
            Dados pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={atualizarPerfilAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nome</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={ctx.user.full_name ?? ""}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input value={ctx.user.email ?? ""} disabled />
              <p className="text-xs text-muted-foreground">
                Pra trocar o e-mail de login, fale com quem administra a
                equipe (Admin → Equipe).
              </p>
            </div>
            <Button type="submit" size="sm">
              Salvar nome
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Organização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <Label>Empresa</Label>
          <Input value={ctx.org.name} disabled />
          <p className="text-xs text-muted-foreground">
            Plano {ctx.org.plan}. Gerenciado em Admin → Organização.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
