import { TemplateGallery } from "@/components/marketing/templates/template-gallery";
import { PUSH_TEMPLATES } from "@/lib/marketing/templates";

export const dynamic = "force-dynamic";

export default function PushTemplatesPage() {
  const items = PUSH_TEMPLATES.map((t) => ({
    slug: t.slug,
    title: t.title,
    description: t.description,
    category: t.category,
    cover_url: t.cover_url,
  }));

  return (
    <TemplateGallery
      type="push"
      title="Galeria de Web Push"
      subtitle="Campanhas Web Push prontas — clone e ajuste a mensagem."
      items={items}
      categories={[
        { value: "promo", label: "Promo" },
        { value: "conteudo", label: "Conteúdo" },
        { value: "lembrete", label: "Lembrete" },
        { value: "anuncio", label: "Anúncio" },
      ]}
      backHref="/app/marketing/converter/push"
      blankHref="/app/marketing/converter/push"
    />
  );
}
