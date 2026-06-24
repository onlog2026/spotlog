import { notFound } from "next/navigation";
import { TemplatePreview } from "@/components/marketing/templates/template-preview";
import { findPushTemplate } from "@/lib/marketing/templates";

export const dynamic = "force-dynamic";

export default async function PushTemplatePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tpl = findPushTemplate(slug);
  if (!tpl) notFound();

  const includes = [
    `Título: "${tpl.preset.title}"`,
    `Corpo: ${tpl.preset.body.length} caracteres`,
    tpl.preset.url ? `URL: ${tpl.preset.url}` : "Sem URL de redirect",
    tpl.preset.icon_url ? "Ícone 192x192 incluso" : "Sem ícone",
    "Você agenda data/hora depois",
  ];

  const notif = (
    <div className="p-4 bg-slate-100">
      <div className="bg-white rounded-lg shadow-lg p-3 flex gap-3 items-start max-w-md">
        {tpl.preset.icon_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tpl.preset.icon_url} alt="" className="w-10 h-10 rounded" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase">Spotlog</span>
            <span className="text-[10px] text-slate-400">agora</span>
          </div>
          <h4 className="font-semibold text-xs text-slate-900 truncate">{tpl.preset.title}</h4>
          <p className="text-[10px] text-slate-600 line-clamp-2">{tpl.preset.body}</p>
        </div>
      </div>
    </div>
  );

  return (
    <TemplatePreview
      type="push"
      slug={tpl.slug}
      title={tpl.title}
      description={tpl.description}
      category={tpl.category}
      coverUrl={tpl.cover_url}
      includes={includes}
      galleryHref="/app/marketing/converter/push/templates"
      previewDesktop={notif}
      previewMobile={notif}
    />
  );
}
