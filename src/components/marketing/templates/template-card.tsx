import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  slug: string;
  title: string;
  description: string;
  category: string;
  coverUrl: string;
  type: "landing" | "popup" | "whatsapp" | "push" | "form";
};

const CATEGORY_COLOR: Record<string, string> = {
  farma: "bg-emerald-600",
  ecommerce: "bg-amber-600",
  b2b: "bg-sky-600",
  "lead-magnet": "bg-purple-600",
  "captura-geral": "bg-slate-600",
  "exit-intent": "bg-rose-600",
  scroll: "bg-indigo-600",
  time: "bg-amber-600",
  "page-visit": "bg-teal-600",
  geral: "bg-slate-600",
  comercial: "bg-emerald-600",
  suporte: "bg-rose-600",
  promo: "bg-rose-600",
  conteudo: "bg-sky-600",
  lembrete: "bg-amber-600",
  anuncio: "bg-purple-600",
  captura: "bg-emerald-600",
  cotacao: "bg-sky-600",
  agenda: "bg-amber-600",
  newsletter: "bg-purple-600",
  feedback: "bg-rose-600",
};

export function TemplateCard({ slug, title, description, category, coverUrl, type }: Props) {
  const previewHref = `/app/marketing/converter/${typeToPath(type)}/templates/${slug}`;
  return (
    <div className="group rounded-xl border border-white/10 bg-card/50 overflow-hidden hover:border-white/30 hover:shadow-[0_8px_30px_rgba(186,1,2,0.15)] transition">
      <Link href={previewHref} className="block relative aspect-[3/2] bg-gradient-to-br from-[#011960] to-[#1a2a6c] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <Badge className={`${CATEGORY_COLOR[category] ?? "bg-slate-600"} text-white border-0 capitalize`}>
            {category.replace("-", " ")}
          </Badge>
        </div>
      </Link>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm line-clamp-1">{title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <UseTemplateForm type={type} slug={slug} />
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={previewHref}>Pré-visualizar</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function typeToPath(t: Props["type"]) {
  if (t === "landing") return "landing";
  if (t === "popup") return "popups";
  if (t === "whatsapp") return "whatsapp";
  if (t === "push") return "push";
  return "formularios";
}

// Inline server-action form to "use template"
function UseTemplateForm({ type, slug }: { type: Props["type"]; slug: string }) {
  return (
    <form action={`/api/marketing/templates/${type}/${slug}/use`} method="POST" className="flex-1">
      <Button type="submit" size="sm" variant="orange" className="w-full">
        Usar
      </Button>
    </form>
  );
}

// suppress unused import warning
export const _Image = Image;
