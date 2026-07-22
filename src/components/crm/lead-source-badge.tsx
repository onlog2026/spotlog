import { Badge } from "@/components/ui/badge";

type SourceCategory = "prospeccao" | "site" | "manual" | "api" | "sdr" | "outro";

const PROSPECCAO = new Set([
  "prospecting",
  "apollo",
  "google_places",
  "apify",
  "apify_instagram",
  "openstreetmap",
  "linkedin",
]);
const SITE = new Set(["site", "formulario-comercial", "chat_widget"]);
const SDR = new Set(["sdr", "sdr_conversation", "sdr_ia"]);

function categorize(raw: string | null | undefined): SourceCategory {
  const s = (raw ?? "").toLowerCase().trim();
  if (!s) return "outro";
  if (PROSPECCAO.has(s)) return "prospeccao";
  if (SITE.has(s)) return "site";
  if (s === "manual") return "manual";
  if (s === "api") return "api";
  if (SDR.has(s)) return "sdr";
  return "outro";
}

const STYLE: Record<SourceCategory, { label: string; className: string }> = {
  prospeccao: {
    label: "Prospecção",
    className: "border-transparent bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  site: {
    label: "Site",
    className: "border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  manual: {
    label: "Manual",
    className: "border-transparent bg-slate-500/15 text-slate-600 dark:text-slate-400",
  },
  api: {
    label: "API",
    className: "border-transparent bg-teal-500/15 text-teal-600 dark:text-teal-400",
  },
  sdr: {
    label: "Robô/SDR",
    className: "border-transparent bg-pink-500/15 text-pink-600 dark:text-pink-400",
  },
  outro: {
    label: "",
    className: "border-transparent bg-gray-500/15 text-gray-600 dark:text-gray-400",
  },
};

/**
 * Etiqueta colorida da origem do lead — mesma cor sempre pro mesmo tipo de
 * canal (prospecção, site, manual, API, robô), pra bater o olho na lista sem
 * precisar abrir o lead. Origem fora do mapa conhecido mostra o texto cru
 * (não esconde informação, só não tem cor dedicada ainda).
 */
export function LeadSourceBadge({ source }: { source: string | null | undefined }) {
  const cat = categorize(source);
  const style = STYLE[cat];
  const label = cat === "outro" ? source || "—" : style.label;
  return <Badge className={style.className}>{label}</Badge>;
}
