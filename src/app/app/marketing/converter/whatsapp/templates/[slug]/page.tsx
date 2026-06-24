import { notFound } from "next/navigation";
import { TemplatePreview } from "@/components/marketing/templates/template-preview";
import { findWhatsappTemplate } from "@/lib/marketing/templates";

export const dynamic = "force-dynamic";

export default async function WhatsappTemplatePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tpl = findWhatsappTemplate(slug);
  if (!tpl) notFound();

  const includes = [
    `Posição: ${tpl.preset.position.replace("_", " ")}`,
    `Mensagem padrão pré-preenchida`,
    `Páginas: ${tpl.preset.show_on_paths.join(", ")}`,
    `Telefone exemplo (você ajusta)`,
    "Criado como inativo — você ativa depois",
  ];

  const buttonPreview = (
    <div className="relative bg-slate-100 h-48 flex items-end justify-end p-4">
      <div className="absolute inset-0 bg-[url('https://image.pollinations.ai/prompt/website%20mockup%20clean%20professional?width=400&height=200&nologo=true')] bg-cover opacity-30" />
      <div className="relative z-10 bg-emerald-500 text-white rounded-full p-3 shadow-lg flex items-center gap-2">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1s-.8.9-1 1.1c-.2.2-.4.2-.7.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.5-.3z" />
        </svg>
        <span className="text-xs font-semibold pr-2">Fale com a gente</span>
      </div>
    </div>
  );

  const mobilePreview = (
    <div className="bg-slate-100 h-48 relative">
      <div className="absolute bottom-3 right-3 bg-emerald-500 text-white rounded-full p-2.5 shadow-lg">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1s-.8.9-1 1.1c-.2.2-.4.2-.7.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.5-.3z" />
        </svg>
      </div>
      <div className="absolute bottom-16 right-3 bg-white text-slate-900 rounded-lg p-2 max-w-[180px] text-[9px] shadow">
        {tpl.preset.default_message}
      </div>
    </div>
  );

  return (
    <TemplatePreview
      type="whatsapp"
      slug={tpl.slug}
      title={tpl.title}
      description={tpl.description}
      category={tpl.category}
      coverUrl={tpl.cover_url}
      includes={includes}
      galleryHref="/app/marketing/converter/whatsapp/templates"
      previewDesktop={buttonPreview}
      previewMobile={mobilePreview}
    />
  );
}
