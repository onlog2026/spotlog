import { notFound } from "next/navigation";
import { TemplatePreview } from "@/components/marketing/templates/template-preview";
import { findLandingTemplate } from "@/lib/marketing/templates";

export const dynamic = "force-dynamic";

export default async function LandingTemplatePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tpl = findLandingTemplate(slug);
  if (!tpl) notFound();

  const blocks = tpl.preset.body_json.blocks;
  const includes = [
    `${blocks.length} blocos pré-configurados`,
    ...blocks.map((b) => `Bloco ${b.type}`),
    tpl.preset.form_slug ? `Form: ${tpl.preset.form_slug}` : "CTA pra URL externa",
    "SEO title + description otimizados",
  ];

  const previewDesktop = (
    <div className="text-xs">
      <div
        className="text-white px-4 py-6"
        style={{
          background: `linear-gradient(180deg, rgba(1,25,96,0.7), rgba(1,25,96,0.85)), url(${tpl.preset.hero_image_url}) center/cover`,
        }}
      >
        <h2 className="font-bold text-sm">{tpl.preset.title}</h2>
        <p className="text-[10px] opacity-90 mt-1 line-clamp-2">{tpl.preset.description}</p>
        <div className="mt-2 inline-block bg-[#BA0102] text-white px-2 py-1 rounded text-[10px]">
          {tpl.preset.cta_label}
        </div>
      </div>
      <div className="p-3 space-y-2">
        {blocks.slice(1, 4).map((b, i) => (
          <div key={i} className="border border-slate-200 rounded p-2 text-[10px] text-slate-600 capitalize">
            {b.type}
          </div>
        ))}
      </div>
    </div>
  );

  const previewMobile = (
    <div className="text-[10px]">
      <div
        className="text-white px-3 py-4"
        style={{
          background: `linear-gradient(180deg, rgba(1,25,96,0.7), rgba(1,25,96,0.85)), url(${tpl.preset.hero_image_url}) center/cover`,
        }}
      >
        <h2 className="font-bold">{tpl.preset.title.slice(0, 30)}…</h2>
        <div className="mt-2 inline-block bg-[#BA0102] text-white px-2 py-1 rounded">
          {tpl.preset.cta_label}
        </div>
      </div>
      <div className="p-2 space-y-1">
        {blocks.slice(1, 3).map((b, i) => (
          <div key={i} className="border border-slate-200 rounded p-1.5 text-[9px] text-slate-600 capitalize">
            {b.type}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <TemplatePreview
      type="landing"
      slug={tpl.slug}
      title={tpl.title}
      description={tpl.description}
      category={tpl.category}
      coverUrl={tpl.cover_url}
      includes={includes}
      galleryHref="/app/marketing/converter/landing/templates"
      previewDesktop={previewDesktop}
      previewMobile={previewMobile}
    />
  );
}
