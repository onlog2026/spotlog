import { TemplateGallery } from "@/components/marketing/templates/template-gallery";
import { LANDING_TEMPLATES } from "@/lib/marketing/templates";

export const dynamic = "force-dynamic";

export default function LandingTemplatesPage() {
  const items = LANDING_TEMPLATES.map((t) => ({
    slug: t.slug,
    title: t.title,
    description: t.description,
    category: t.category,
    cover_url: t.cover_url,
  }));

  return (
    <TemplateGallery
      type="landing"
      title="Galeria de Landing Pages"
      subtitle="Templates prontos pra clonar — edite depois no editor visual."
      items={items}
      categories={[
        { value: "farma", label: "Farma" },
        { value: "ecommerce", label: "E-commerce" },
        { value: "b2b", label: "B2B" },
        { value: "lead-magnet", label: "Lead magnet" },
        { value: "captura-geral", label: "Captura geral" },
      ]}
      backHref="/app/marketing/converter/landing"
      blankHref="/app/marketing/converter/landing/nova"
    />
  );
}
