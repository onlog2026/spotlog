import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Monitor, Smartphone } from "lucide-react";

type Props = {
  type: "landing" | "popup" | "whatsapp" | "push" | "form";
  slug: string;
  title: string;
  description: string;
  category: string;
  coverUrl: string;
  includes: string[];
  galleryHref: string;
  previewDesktop?: React.ReactNode;
  previewMobile?: React.ReactNode;
};

export function TemplatePreview({
  type,
  slug,
  title,
  description,
  category,
  coverUrl,
  includes,
  galleryHref,
  previewDesktop,
  previewMobile,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href={galleryHref} className="inline-flex items-center gap-1 hover:underline">
          <ArrowLeft className="h-3 w-3" /> Voltar pra galeria
        </Link>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-4">
          <div>
            <Badge className="bg-[#011960] text-white capitalize border-0 mb-2">{category.replace("-", " ")}</Badge>
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground mt-1">{description}</p>
          </div>

          {previewDesktop || previewMobile ? (
            <div className="grid md:grid-cols-[1fr_280px] gap-4">
              {previewDesktop && (
                <div className="border border-white/10 rounded-xl overflow-hidden bg-card/50">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 text-xs text-muted-foreground">
                    <Monitor className="h-3 w-3" /> Desktop
                  </div>
                  <div className="bg-white text-slate-900">{previewDesktop}</div>
                </div>
              )}
              {previewMobile && (
                <div className="border border-white/10 rounded-xl overflow-hidden bg-card/50 mx-auto md:mx-0 w-full max-w-[280px]">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 text-xs text-muted-foreground">
                    <Smartphone className="h-3 w-3" /> Mobile
                  </div>
                  <div className="bg-white text-slate-900">{previewMobile}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-white/10 rounded-xl overflow-hidden bg-card/50 aspect-[16/9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="border border-white/10 rounded-xl bg-card/50 p-4">
            <h3 className="font-semibold text-sm mb-3">Inclui</h3>
            <ul className="space-y-2">
              {includes.map((it) => (
                <li key={it} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-[#BA0102] mt-0.5">✓</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>

          <form action={`/api/marketing/templates/${type}/${slug}/use`} method="POST" className="space-y-2">
            <Button type="submit" variant="orange" size="lg" className="w-full text-base">
              Usar este template
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              Cria um rascunho na sua organização que você edita em seguida.
            </p>
          </form>

          <Button asChild variant="outline" className="w-full">
            <Link href={galleryHref}>Voltar pra galeria</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
