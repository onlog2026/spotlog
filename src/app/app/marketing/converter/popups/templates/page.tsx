import { TemplateGallery } from "@/components/marketing/templates/template-gallery";
import { POPUP_TEMPLATES } from "@/lib/marketing/templates";

export const dynamic = "force-dynamic";

export default function PopupTemplatesPage() {
  const items = POPUP_TEMPLATES.map((t) => ({
    slug: t.slug,
    title: t.title,
    description: t.description,
    category: t.category,
    cover_url: t.cover_url,
  }));

  return (
    <TemplateGallery
      type="popup"
      title="Galeria de Pop-ups"
      subtitle="Pop-ups prontos por gatilho — clone, ajuste a mensagem e ative."
      items={items}
      categories={[
        { value: "exit-intent", label: "Exit intent" },
        { value: "scroll", label: "Scroll" },
        { value: "time", label: "Tempo" },
        { value: "page-visit", label: "Página específica" },
      ]}
      backHref="/app/marketing/converter/popups"
      blankHref="/app/marketing/converter/popups"
    />
  );
}
