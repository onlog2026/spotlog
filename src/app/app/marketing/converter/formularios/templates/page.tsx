import { TemplateGallery } from "@/components/marketing/templates/template-gallery";
import { FORM_TEMPLATES } from "@/lib/marketing/templates";

export const dynamic = "force-dynamic";

export default function FormTemplatesPage() {
  const items = FORM_TEMPLATES.map((t) => ({
    slug: t.slug,
    title: t.title,
    description: t.description,
    category: t.category,
    cover_url: t.cover_url,
  }));

  return (
    <TemplateGallery
      type="form"
      title="Galeria de Formulários"
      subtitle="Formulários prontos com campos pré-configurados — clone e use."
      items={items}
      categories={[
        { value: "captura", label: "Captura" },
        { value: "cotacao", label: "Cotação" },
        { value: "agenda", label: "Agenda" },
        { value: "newsletter", label: "Newsletter" },
        { value: "feedback", label: "Feedback" },
      ]}
      backHref="/app/admin/forms"
      blankHref="/app/admin/forms/novo"
    />
  );
}
