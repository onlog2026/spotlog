import { Clock } from "lucide-react";
import {
  STATUS_ORDER,
  formatDateBR,
  getStatusConfig,
} from "./status-config";
import type { PublicTrackingEvent } from "@/lib/queries/tracking-public";

interface TimelineProps {
  events: PublicTrackingEvent[];
  currentStatus: string;
}

/**
 * Timeline vertical de eventos de rastreio.
 * - Cada evento usa cor/ícone do status correspondente.
 * - O último evento (mais recente) fica destacado/pulsando.
 * - Eventos futuros (status na jornada que ainda não aconteceram) aparecem em cinza.
 */
export function Timeline({ events, currentStatus }: TimelineProps) {
  // ordena cronológico crescente (mais antigo primeiro) — backend já manda assim, mas defensivo
  const sorted = [...events].sort(
    (a, b) =>
      new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime(),
  );

  // se zerado, mostra placeholder
  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-300 bg-ink-50 p-8 text-center">
        <Clock className="mx-auto mb-3 h-8 w-8 text-ink-400" />
        <p className="text-sm text-ink-600">
          Ainda não há atualizações para este pedido.
        </p>
        <p className="mt-1 text-xs text-ink-500">
          Volte em alguns minutos — a primeira movimentação aparece aqui assim
          que o pacote for processado.
        </p>
      </div>
    );
  }

  // calcula próximos passos da jornada (que ainda não aconteceram)
  const seen = new Set(sorted.map((e) => e.event_type));
  const futureSteps = STATUS_ORDER.filter(
    (s) => !seen.has(s) && s !== currentStatus,
  );

  return (
    <ol className="relative space-y-6 border-l-2 border-ink-200 pl-6">
      {sorted.map((event, idx) => {
        const cfg = getStatusConfig(event.event_type);
        const Icon = cfg.icon;
        const isLast = idx === sorted.length - 1;
        return (
          <li key={`${event.event_type}-${event.occurred_at}-${idx}`} className="relative">
            {/* node */}
            <span
              className={`absolute -left-[34px] grid h-8 w-8 place-items-center rounded-full ring-4 ring-white ${cfg.bg}`}
              aria-hidden
            >
              <Icon className="h-4 w-4 text-white" />
              {isLast && (
                <span className={`absolute inline-flex h-8 w-8 animate-ping rounded-full ${cfg.bg} opacity-60`} />
              )}
            </span>
            {/* card */}
            <div
              className={`rounded-xl border bg-white p-4 shadow-sm transition ${
                isLast
                  ? "border-navy-900/20 ring-1 ring-navy-900/10"
                  : "border-ink-200"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.badge} ${cfg.badgeText}`}
                >
                  {cfg.label}
                </span>
                {isLast && (
                  <span className="text-xs font-semibold text-spotorange-600">
                    Atual
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-navy-950">
                {event.description ?? cfg.label}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {formatDateBR(event.occurred_at)}
              </p>
            </div>
          </li>
        );
      })}

      {/* passos futuros previstos da jornada */}
      {futureSteps.map((step) => {
        const cfg = getStatusConfig(step);
        const Icon = cfg.icon;
        return (
          <li key={`future-${step}`} className="relative opacity-50">
            <span
              className="absolute -left-[34px] grid h-8 w-8 place-items-center rounded-full bg-ink-200 ring-4 ring-white"
              aria-hidden
            >
              <Icon className="h-4 w-4 text-ink-500" />
            </span>
            <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50 p-4">
              <p className="text-sm font-medium text-ink-600">{cfg.label}</p>
              <p className="mt-1 text-xs text-ink-500">Em breve</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
