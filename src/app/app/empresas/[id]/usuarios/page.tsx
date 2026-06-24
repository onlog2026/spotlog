import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users2 } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCompany } from "@/lib/queries/empresas";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InviteClientUserForm } from "@/components/empresas/invite-client-user-form";

export const dynamic = "force-dynamic";

export default async function EmpresaUsuariosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireSession();
  const { id } = await params;
  const company = await getCompany(ctx.org.id, id);
  if (!company) notFound();

  const supabase = await createClient();
  const { data: vinculos } = await supabase
    .from("company_users")
    .select("id, user_id, role, active, invited_at, accepted_at")
    .eq("company_id", id)
    .order("invited_at", { ascending: false });

  const userIds = (vinculos ?? []).map((v) => v.user_id);
  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds)
      : { data: [] as Array<{ id: string; full_name: string; email: string }> };

  const profileById = new Map<
    string,
    { full_name: string; email: string }
  >();
  for (const p of (profiles ?? []) as Array<{
    id: string;
    full_name: string;
    email: string;
  }>) {
    profileById.set(p.id, { full_name: p.full_name, email: p.email });
  }

  const canManage = ["owner", "admin", "manager"].includes(ctx.org.role);

  return (
    <div className="space-y-6 max-w-3xl">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/app/empresas/${id}`}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users2 className="h-6 w-6" /> Usuários do portal
        </h1>
        <p className="text-muted-foreground">
          {(company as { name: string }).name} · Quem pode acessar o portal do cliente
        </p>
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Convidar usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <InviteClientUserForm
              companyId={id}
              organizationId={ctx.org.id}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Usuários vinculados ({vinculos?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-white/5">
          {(vinculos ?? []).length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum usuário vinculado ainda.
            </div>
          ) : (
            (vinculos ?? []).map((v) => {
              const p = profileById.get(v.user_id);
              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div>
                    <div className="font-medium">
                      {p?.full_name ?? p?.email ?? v.user_id}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p?.email ?? "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {v.role}
                    </Badge>
                    <Badge variant={v.active ? "default" : "outline"}>
                      {v.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
