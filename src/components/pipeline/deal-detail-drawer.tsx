"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Building2,
  User,
  Calendar,
  TrendingUp,
  Tag,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

type DealDetail = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
  source: string | null;
  tags: string[] | null;
  probability: number | null;
  expected_close_date: string | null;
  created_at: string;
  stage?: { name: string; color: string | null } | null;
  company?: { name: string; cnpj: string | null } | null;
  contact?: {
    full_name: string;
    email: string | null;
    phone: string | null;
  } | null;
  owner?: { full_name: string | null } | null;
};

export function DealDetailDrawer({
  dealId,
  onClose,
  pipelineName,
}: {
  dealId: string;
  onClose: () => void;
  pipelineName: string;
}) {
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetch(`/api/deals/${dealId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
      .then((data) => {
        if (!alive) return;
        setDeal(data.deal ?? null);
      })
      .catch(() => {
        if (alive) setError("Não foi possível carregar o deal.");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [dealId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label="Detalhes do deal"
        className={cn(
          "absolute right-0 top-0 h-full w-full sm:w-[480px] bg-card",
          "border-l border-white/10 shadow-2xl overflow-y-auto",
          "animate-in slide-in-from-right duration-200",
        )}
      >
        <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl border-b border-white/10 p-4 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              {pipelineName}
            </div>
            <h2 className="text-lg font-bold truncate">
              {loading ? "Carregando..." : (deal?.title ?? "Deal")}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="p-4 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-400 text-center py-12">
              {error}
            </div>
          )}

          {!loading && !error && deal && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Metric
                  label="Valor"
                  value={formatCurrency(deal.amount, deal.currency)}
                  Icon={TrendingUp}
                />
                <Metric
                  label="Probabilidade"
                  value={`${deal.probability ?? 0}%`}
                  Icon={Tag}
                />
                {deal.expected_close_date && (
                  <Metric
                    label="Previsão fechamento"
                    value={formatDate(deal.expected_close_date)}
                    Icon={Calendar}
                  />
                )}
                <Metric
                  label="Criado em"
                  value={formatDate(deal.created_at)}
                  Icon={Calendar}
                />
              </div>

              {deal.stage && (
                <div>
                  <Label>Estágio</Label>
                  <Badge
                    style={{
                      background: `${deal.stage.color}22`,
                      color: deal.stage.color ?? undefined,
                      borderColor: `${deal.stage.color}55`,
                    }}
                    variant="outline"
                    className="text-xs"
                  >
                    {deal.stage.name}
                  </Badge>
                </div>
              )}

              {deal.company && (
                <Section title="Empresa" Icon={Building2}>
                  <div className="font-medium">{deal.company.name}</div>
                  {deal.company.cnpj && (
                    <div className="text-xs text-muted-foreground">
                      CNPJ {deal.company.cnpj}
                    </div>
                  )}
                </Section>
              )}

              {deal.contact && (
                <Section title="Contato" Icon={User}>
                  <div className="font-medium">{deal.contact.full_name}</div>
                  {deal.contact.email && (
                    <a
                      href={`mailto:${deal.contact.email}`}
                      className="text-xs text-brand-400 hover:underline block"
                    >
                      {deal.contact.email}
                    </a>
                  )}
                  {deal.contact.phone && (
                    <a
                      href={`tel:${deal.contact.phone}`}
                      className="text-xs text-brand-400 hover:underline block"
                    >
                      {deal.contact.phone}
                    </a>
                  )}
                </Section>
              )}

              {deal.owner?.full_name && (
                <Section title="Responsável" Icon={User}>
                  <div className="font-medium">{deal.owner.full_name}</div>
                </Section>
              )}

              {deal.tags && deal.tags.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {deal.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 flex flex-col gap-2">
                <Button variant="orange" asChild>
                  <Link href={`/app/pipeline/${deal.id}`}>
                    Abrir página completa
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Metric({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-card/50 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1 mb-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
      {children}
    </div>
  );
}

function Section({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-card/50 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1 mb-2">
        <Icon className="h-3 w-3" />
        {title}
      </div>
      <div className="text-sm space-y-1">{children}</div>
    </div>
  );
}
