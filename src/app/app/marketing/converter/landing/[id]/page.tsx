import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LandingPage } from "@/lib/queries/marketing";
import { updateLanding } from "../../../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

async function getLanding(id: string, orgId: string): Promise<LandingPage | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .maybeSingle();
  return (data ?? null) as LandingPage | null;
}

export default async function LandingEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireSession();
  const lp = await getLanding(id, ctx.org.id);
  if (!lp) notFound();

  async function save(formData: FormData) {
    "use server";
    await updateLanding(id, {
      title: String(formData.get("title") ?? lp.title),
      description: String(formData.get("description") ?? "") || null,
      hero_image_url: String(formData.get("hero_image_url") ?? "") || null,
      cta_label: String(formData.get("cta_label") ?? "") || null,
      cta_url: String(formData.get("cta_url") ?? "") || null,
      form_slug: String(formData.get("form_slug") ?? "") || null,
      seo_title: String(formData.get("seo_title") ?? "") || null,
      seo_description: String(formData.get("seo_description") ?? "") || null,
      body_json: {
        sections: String(formData.get("body_md") ?? "")
          .split("\n\n")
          .map((p, i) => ({ type: "paragraph", id: i, md: p })),
      },
      status: String(formData.get("status") ?? lp.status),
    });
  }

  const bodyMd = Array.isArray((lp.body_json as { sections?: { md?: string }[] })?.sections)
    ? ((lp.body_json as { sections: { md?: string }[] }).sections.map((s) => s.md ?? "").join("\n\n"))
    : "";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="ghost">
            <Link href="/app/marketing/converter/landing">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{lp.title}</h2>
            <code className="text-[10px] text-muted-foreground">/lp/{lp.slug}</code>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={lp.status === "publicado" ? "default" : "secondary"}>
            {lp.status}
          </Badge>
          <Button asChild size="sm" variant="outline">
            <Link href={`/lp/${lp.slug}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" /> Abrir
            </Link>
          </Button>
        </div>
      </div>

      <form action={save} className="space-y-4">
        <Card className="border-white/10 bg-card/50">
          <CardHeader><CardTitle className="text-base">Hero</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input name="title" defaultValue={lp.title} placeholder="Título H1" required />
            <Textarea
              name="description"
              defaultValue={lp.description ?? ""}
              placeholder="Subtítulo / proposta de valor"
              rows={2}
            />
            <Input name="hero_image_url" defaultValue={lp.hero_image_url ?? ""} placeholder="URL imagem hero" />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/50">
          <CardHeader><CardTitle className="text-base">Corpo (markdown simples)</CardTitle></CardHeader>
          <CardContent>
            <Textarea name="body_md" defaultValue={bodyMd} rows={10} placeholder="Cada parágrafo separado por linha em branco" />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/50">
          <CardHeader><CardTitle className="text-base">CTA</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input name="cta_label" defaultValue={lp.cta_label ?? ""} placeholder="Texto do botão" />
              <Input name="cta_url" defaultValue={lp.cta_url ?? ""} placeholder="URL ou âncora" />
            </div>
            <Input name="form_slug" defaultValue={lp.form_slug ?? ""} placeholder="Formulário associado (slug)" />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/50">
          <CardHeader><CardTitle className="text-base">SEO</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input name="seo_title" defaultValue={lp.seo_title ?? ""} placeholder="SEO title" />
            <Textarea name="seo_description" defaultValue={lp.seo_description ?? ""} rows={2} placeholder="SEO description" />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <select
              name="status"
              defaultValue={lp.status}
              className="h-9 px-2 rounded-md bg-card/80 border border-white/10 text-sm"
            >
              <option value="rascunho">Rascunho</option>
              <option value="publicado">Publicado</option>
              <option value="arquivado">Arquivado</option>
            </select>
            <Button type="submit" variant="orange">Salvar alterações</Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
