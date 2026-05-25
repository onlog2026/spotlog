import Link from "next/link";
import { ArrowRight, Plus, Building2 } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function EmpresasPage() {
  const ctx = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("id, name, domain, industry, size, city, state")
    .eq("organization_id", ctx.org.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Empresas</h1>
          <p className="text-muted-foreground mt-1">
            Contas / empresas alvo. Vinculadas aos contatos e deals.
          </p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/app/empresas/nova">
            <Plus className="h-4 w-4" />
            Nova empresa
          </Link>
        </Button>
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-0">
          {!data || data.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-brand/15 mb-4">
                <Building2 className="h-7 w-7 text-brand-400" />
              </div>
              <h3 className="font-semibold text-lg">Nenhuma empresa</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Empresas aparecem aqui quando você prospecta ou cadastra
                manualmente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left p-4">Nome</th>
                    <th className="text-left p-4 hidden md:table-cell">Domínio</th>
                    <th className="text-left p-4 hidden md:table-cell">Setor</th>
                    <th className="text-left p-4 hidden lg:table-cell">Tamanho</th>
                    <th className="text-left p-4 hidden lg:table-cell">Cidade</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.map((c) => {
                    const co = c as unknown as {
                      id: string;
                      name: string;
                      domain: string | null;
                      industry: string | null;
                      size: string | null;
                      city: string | null;
                      state: string | null;
                    };
                    return (
                      <tr key={co.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4 font-medium">{co.name}</td>
                        <td className="p-4 hidden md:table-cell text-muted-foreground text-xs">
                          {co.domain ?? "—"}
                        </td>
                        <td className="p-4 hidden md:table-cell text-muted-foreground text-xs">
                          {co.industry ?? "—"}
                        </td>
                        <td className="p-4 hidden lg:table-cell text-muted-foreground text-xs">
                          {co.size ?? "—"}
                        </td>
                        <td className="p-4 hidden lg:table-cell text-muted-foreground text-xs">
                          {[co.city, co.state].filter(Boolean).join("/")}
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/app/empresas/${co.id}`}
                            className="text-brand-400 hover:underline text-xs flex items-center gap-1"
                          >
                            Abrir <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
