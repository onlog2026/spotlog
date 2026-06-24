import { notFound } from "next/navigation";
import { TemplatePreview } from "@/components/marketing/templates/template-preview";
import { findPopupTemplate } from "@/lib/marketing/templates";

export const dynamic = "force-dynamic";

export default async function PopupTemplatePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tpl = findPopupTemplate(slug);
  if (!tpl) notFound();

  const includes = [
    `Gatilho: ${tpl.preset.trigger_type}${tpl.preset.trigger_value ? ` (${tpl.preset.trigger_value})` : ""}`,
    `Páginas: ${tpl.preset.display_on_paths.join(", ")}`,
    `CTA: "${tpl.preset.cta_label}"`,
    tpl.preset.cta_form_slug ? `Form: ${tpl.preset.cta_form_slug}` : "URL CTA externa",
    "Criado como inativo — você ativa depois",
  ];

  const popupCard = (
    <div className="p-6">
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-4">
        <div className="text-xs text-slate-500 mb-1 capitalize">{tpl.preset.trigger_type}</div>
        <h3 className="font-bold text-slate-900 text-sm">{tpl.preset.title}</h3>
        <p className="text-[10px] text-slate-600 mt-1">{tpl.preset.body}</p>
        <button className="mt-2 bg-[#BA0102] text-white text-[10px] px-3 py-1.5 rounded">
          {tpl.preset.cta_label}
        </button>
      </div>
    </div>
  );

  return (
    <TemplatePreview
      type="popup"
      slug={tpl.slug}
      title={tpl.title}
      description={tpl.description}
      category={tpl.category}
      coverUrl={tpl.cover_url}
      includes={includes}
      galleryHref="/app/marketing/converter/popups/templates"
      previewDesktop={popupCard}
      previewMobile={popupCard}
    />
  );
}
