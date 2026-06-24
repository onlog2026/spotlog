import { TemplateGallery } from "@/components/marketing/templates/template-gallery";
import { WHATSAPP_TEMPLATES } from "@/lib/marketing/templates";

export const dynamic = "force-dynamic";

export default function WhatsappTemplatesPage() {
  const items = WHATSAPP_TEMPLATES.map((t) => ({
    slug: t.slug,
    title: t.title,
    description: t.description,
    category: t.category,
    cover_url: t.cover_url,
  }));

  return (
    <TemplateGallery
      type="whatsapp"
      title="Galeria de Botões de WhatsApp"
      subtitle="Botões prontos por contexto — clone e ajuste número/mensagem."
      items={items}
      categories={[
        { value: "geral", label: "Geral" },
        { value: "farma", label: "Farma" },
        { value: "comercial", label: "Comercial" },
        { value: "suporte", label: "Suporte" },
      ]}
      backHref="/app/marketing/converter/whatsapp"
      blankHref="/app/marketing/converter/whatsapp"
    />
  );
}
