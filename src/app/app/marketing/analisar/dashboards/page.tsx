import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listDashboards } from "@/lib/queries/marketing-ana";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Plus, Trash2 } from "lucide-react";
import { deleteDashboard } from "../actions";

export const dynamic = "force-dynamic";

export default async function DashboardsPage() {
  const ctx = await requireSession();
  const list = await listDashboards(ctx.org.id);

  async function remove(formData: FormData) {
    "use server";
    await deleteDashboard(String(formData.get("id")));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Dashboards Personalizados</h2>
          <p className="text-sm text-muted-foreground">
            Monte seus próprios painéis com widgets KPI, gráficos, tabelas e funil.
          </p>
        </div>
        <Link href="/app/marketing/analisar/dashboards/novo">
          <Button className="bg-[#BA0102] hover:bg-[#a10002] text-white">
            <Plus className="h-4 w-4 mr-1" /> Novo dashboard
          </Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-12 text-center">
            <LayoutDashboard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">Nenhum dashboard salvo</p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie um dashboard com os widgets que importam pra você.
            </p>
            <Link href="/app/marketing/analisar/dashboards/novo">
              <Button className="bg-[#BA0102] hover:bg-[#a10002] text-white">
                <Plus className="h-4 w-4 mr-1" /> Criar primeiro
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {list.map((d) => (
            <Card key={d.id} className="border-white/10 bg-card/50">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-[#011960] text-white inline-flex items-center justify-center flex-none">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Link
                      href={`/app/marketing/analisar/dashboards/${d.id}`}
                      className="font-semibold text-sm hover:underline"
                    >
                      {d.name}
                    </Link>
                    {d.is_default && (
                      <Badge className="bg-[#BA0102] text-white text-[10px]">padrão</Badge>
                    )}
                  </div>
                  {d.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                      {d.description}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {Array.isArray(d.layout_json) ? d.layout_json.length : 0} widgets ·{" "}
                    {new Date(d.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <form action={remove}>
                  <input type="hidden" name="id" value={d.id} />
                  <Button type="submit" size="icon" variant="ghost">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
