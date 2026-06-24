import {
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Search,
  type LucideIcon,
} from "lucide-react";

export type StatusKey =
  | "criada"
  | "coletada"
  | "triagem"
  | "em_rota"
  | "saiu_entrega"
  | "entregue"
  | "devolvida"
  | "extraviada";

type Cfg = {
  label: string;
  short: string;
  icon: LucideIcon;
  bg: string; // tailwind background
  text: string; // tailwind text color
  badge: string; // badge bg
  badgeText: string;
};

export const STATUS_CONFIG: Record<string, Cfg> = {
  criada: {
    label: "Pedido criado",
    short: "Criado",
    icon: Package,
    bg: "bg-navy-700",
    text: "text-navy-700",
    badge: "bg-navy-100",
    badgeText: "text-navy-800",
  },
  coletada: {
    label: "Coletada",
    short: "Coletada",
    icon: Package,
    bg: "bg-navy-800",
    text: "text-navy-800",
    badge: "bg-navy-100",
    badgeText: "text-navy-800",
  },
  triagem: {
    label: "Em triagem",
    short: "Triagem",
    icon: Search,
    bg: "bg-indigo-600",
    text: "text-indigo-600",
    badge: "bg-indigo-100",
    badgeText: "text-indigo-800",
  },
  em_rota: {
    label: "Em rota",
    short: "Em rota",
    icon: Truck,
    bg: "bg-spotorange-500",
    text: "text-spotorange-600",
    badge: "bg-spotorange-100",
    badgeText: "text-spotorange-800",
  },
  saiu_entrega: {
    label: "Saiu para entrega",
    short: "Saiu p/ entrega",
    icon: MapPin,
    bg: "bg-spotorange-600",
    text: "text-spotorange-700",
    badge: "bg-spotorange-100",
    badgeText: "text-spotorange-800",
  },
  entregue: {
    label: "Entregue",
    short: "Entregue",
    icon: CheckCircle2,
    bg: "bg-emerald-600",
    text: "text-emerald-700",
    badge: "bg-emerald-100",
    badgeText: "text-emerald-800",
  },
  devolvida: {
    label: "Devolvida",
    short: "Devolvida",
    icon: RotateCcw,
    bg: "bg-amber-600",
    text: "text-amber-700",
    badge: "bg-amber-100",
    badgeText: "text-amber-800",
  },
  extraviada: {
    label: "Extraviada",
    short: "Extraviada",
    icon: AlertTriangle,
    bg: "bg-red-600",
    text: "text-red-700",
    badge: "bg-red-100",
    badgeText: "text-red-800",
  },
};

export const FALLBACK_STATUS: Cfg = {
  label: "Atualização",
  short: "Atualização",
  icon: Clock,
  bg: "bg-ink-500",
  text: "text-ink-700",
  badge: "bg-ink-100",
  badgeText: "text-ink-800",
};

export function getStatusConfig(key: string | null | undefined): Cfg {
  if (!key) return FALLBACK_STATUS;
  return STATUS_CONFIG[key] ?? FALLBACK_STATUS;
}

// ordem cronológica esperada da jornada
export const STATUS_ORDER: string[] = [
  "criada",
  "coletada",
  "triagem",
  "em_rota",
  "saiu_entrega",
  "entregue",
];

export function isFinalStatus(s: string): boolean {
  return ["entregue", "devolvida", "extraviada"].includes(s);
}

export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function formatDateOnlyBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}
