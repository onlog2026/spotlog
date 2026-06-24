import { createLanding } from "../../../actions";
import { generateLandingCopy } from "./generate-action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingNewPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const params = await searchParams;
  const generated = params.topic ? await generateLandingCopy(params.topic) : null;

  async function submit(formData: FormData) {
    "use server";
    await createLanding({
      title: String(formData.get("title") ?? "").trim(),
      slug: String(formData.get("slug") ?? "") || undefined,
      description: String(formData.get("description") ?? "") || undefined,
      cta_label: String(formData.get("cta_label") ?? "") || undefined,
      cta_url: String(formData.get("cta_url") ?? "") || undefined,
      form_slug: String(formData.get("form_slug") ?? "") || undefined,
      hero_image_url: String(formData.get("hero_image_url") ?? "") || undefined,
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Nova landing page</h2>
        <p className="text-xs text-muted-foreground">
          Comece do zero ou use a IA pra rascunhar o conteúdo a partir de um tema.
        </p>
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#BA0102]" /> Gerar com IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2">
            <Input
              name="topic"
              placeholder="Ex: ebook gratuito de logística farmacêutica"
              required
              className="flex-1"
            />
            <Button type="submit" variant="orange">Gerar copy</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/50">
        <CardHeader><CardTitle className="text-base">Detalhes da página</CardTitle></CardHeader>
        <CardContent>
          <form action={submit} className="space-y-3">
            <Input
              name="title"
              placeholder="Título principal (H1)"
              defaultValue={generated?.title ?? ""}
              required
            />
            <Input
              name="slug"
              placeholder="URL (slug) — opcional"
              defaultValue={generated?.slug ?? ""}
            />
            <Textarea
              name="description"
              placeholder="Subtítulo / proposta de valor"
              defaultValue={generated?.description ?? ""}
              rows={3}
            />
            <Input name="hero_image_url" placeholder="URL da imagem hero" />
            <div className="grid grid-cols-2 gap-2">
              <Input
                name="cta_label"
                placeholder="Texto do botão CTA"
                defaultValue={generated?.cta_label ?? "Quero saber mais"}
              />
              <Input name="cta_url" placeholder="URL do CTA (ou form)" />
            </div>
            <Input name="form_slug" placeholder="Slug de formulário associado (opcional)" />
            <Button type="submit" className="w-full" variant="orange">Criar landing</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
