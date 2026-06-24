import { notFound } from "next/navigation";
import { TemplatePreview } from "@/components/marketing/templates/template-preview";
import { findFormTemplate } from "@/lib/marketing/templates";

export const dynamic = "force-dynamic";

export default async function FormTemplatePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tpl = findFormTemplate(slug);
  if (!tpl) notFound();

  const includes = [
    `${tpl.preset.fields.length} campos pré-configurados`,
    `Tipos: ${[...new Set(tpl.preset.fields.map((f) => f.type))].join(", ")}`,
    `${tpl.preset.fields.filter((f) => f.required).length} obrigatórios`,
    `Submit: "${tpl.preset.submit_label}"`,
    "Mensagem de sucesso pronta",
  ];

  const formPreview = (
    <div className="p-4 bg-slate-50">
      <h3 className="font-bold text-sm text-slate-900">{tpl.preset.title}</h3>
      <p className="text-[10px] text-slate-600 mt-1">{tpl.preset.description}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {tpl.preset.fields.slice(0, 6).map((f) => (
          <div key={f.field_key} className={f.width === "full" ? "col-span-2" : ""}>
            <label className="text-[9px] text-slate-700 font-medium">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            {f.type === "textarea" ? (
              <div className="h-10 bg-white border border-slate-300 rounded text-[9px] text-slate-400 p-1.5">
                {f.placeholder ?? ""}
              </div>
            ) : f.type === "select" ? (
              <div className="h-6 bg-white border border-slate-300 rounded text-[9px] text-slate-400 px-1.5 flex items-center">
                Selecione…
              </div>
            ) : (
              <div className="h-6 bg-white border border-slate-300 rounded text-[9px] text-slate-400 px-1.5 flex items-center">
                {f.placeholder ?? ""}
              </div>
            )}
          </div>
        ))}
      </div>
      <button className="mt-3 bg-[#BA0102] text-white text-[10px] px-3 py-1.5 rounded">
        {tpl.preset.submit_label}
      </button>
    </div>
  );

  return (
    <TemplatePreview
      type="form"
      slug={tpl.slug}
      title={tpl.title}
      description={tpl.description}
      category={tpl.category}
      coverUrl={tpl.cover_url}
      includes={includes}
      galleryHref="/app/marketing/converter/formularios/templates"
      previewDesktop={formPreview}
      previewMobile={formPreview}
    />
  );
}
