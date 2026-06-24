import { requireSession } from "@/lib/auth";
import { listMarketing, type SeoPage } from "@/lib/queries/marketing";
import { upsertSeoPage } from "../../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

function scoreColor(s: number | null) {
  if (s == null) return "text-muted-foreground";
  if (s >= 80) return "text-emerald-400";
  if (s >= 50) return "text-amber-400";
  return "text-red-400";
}

export default async function SeoPagesIndex() {
  const ctx = await requireSession();
  const items = await listMarketing<SeoPage>(ctx.org.id, "seo");

  async function submit(formData: FormData) {
    "use server";
    const kw = String(formData.get("keywords") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await upsertSeoPage({
      path: String(formData.get("path") ?? "").trim(),
      title: String(formData.get("title") ?? "") || undefined,
      meta_description: String(formData.get("meta_description") ?? "") || undefined,
      keywords: kw,
      last_audit_score: String(formData.get("last_audit_score") ?? "") || undefined,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Otimização de páginas (SEO)</h2>
        {items.length === 0 ? (
          <Card className="border-white/10 bg-card/50">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Cadastre as páginas do seu site pra rastrear o SEO de cada uma.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {items.map((p) => (
              <Card key={p.id} className="border-white/10 bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <code className="text-xs bg-white/5 px-2 py-0.5 rounded">{p.path}</code>
                    <span className={`text-2xl font-bold ${scoreColor(p.last_audit_score)}`}>
                      {p.last_audit_score ?? "—"}
                    </span>
                  </div>
                  {p.title && <p className="text-sm font-medium">{p.title}</p>}
                  {p.meta_description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {p.meta_description}
                    </p>
                  )}
                  {p.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.keywords.slice(0, 8).map((k) => (
                        <span key={k} className="text-[10px] bg-white/5 px-2 py-0.5 rounded">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="border-white/10 bg-card/50 h-fit">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" /> Auditar página
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submit} className="space-y-3">
            <Input name="path" placeholder="/caminho-da-pagina" required />
            <Input name="title" placeholder="Title SEO" />
            <Textarea name="meta_description" placeholder="Meta description" rows={3} />
            <Input name="keywords" placeholder="palavras-chave, separadas, por, virgula" />
            <Input name="last_audit_score" placeholder="Score 0-100" type="number" min="0" max="100" />
            <Button type="submit" className="w-full" variant="orange">Salvar auditoria</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
