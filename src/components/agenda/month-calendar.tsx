"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Clock, Video, Phone, MapPin } from "lucide-react";
import type { Appointment } from "@/lib/queries/agenda";

interface Props {
  appointments: Appointment[];
  initialYear: number;
  initialMonth: number; // 0-based
  stats: { total: number; realizados: number; cancelados: number; confirmados: number; showUp: number };
}

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function fmtDateKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function fmtHHMM(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

const STATUS_STYLE: Record<string, string> = {
  agendado: "bg-blue-100 text-blue-800 border-blue-200",
  confirmado: "bg-green-100 text-green-800 border-green-200",
  realizado: "bg-emerald-200 text-emerald-900 border-emerald-300",
  cancelado: "bg-red-100 text-red-700 border-red-200 line-through opacity-60",
  no_show: "bg-orange-100 text-orange-800 border-orange-200",
  reagendado: "bg-purple-100 text-purple-800 border-purple-200",
};

export function MonthCalendar({ appointments, initialYear, initialMonth, stats }: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<Appointment | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const d = new Date(a.scheduled_at);
      const k = fmtDateKey(d);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(a);
    }
    return map;
  }, [appointments]);

  const grid = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    // Start on Monday
    const startDow = (first.getDay() + 6) % 7;
    const days: { d: Date; inMonth: boolean }[] = [];
    for (let i = startDow; i > 0; i--) {
      days.push({ d: new Date(year, month, 1 - i), inMonth: false });
    }
    for (let i = 1; i <= last.getDate(); i++) {
      days.push({ d: new Date(year, month, i), inMonth: true });
    }
    while (days.length % 7 !== 0) {
      const next = new Date(days[days.length - 1].d);
      next.setDate(next.getDate() + 1);
      days.push({ d: next, inMonth: false });
    }
    return days;
  }, [year, month]);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else setMonth(month + 1);
  }
  function goToday() {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
  }

  const todayKey = fmtDateKey(new Date());
  const selectedAppts = selected ? byDate.get(selected) ?? [] : [];

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Agendamentos no mês" value={stats.total} color="text-blue-600" />
        <KpiCard label="Realizados" value={stats.realizados} color="text-emerald-600" />
        <KpiCard label="Cancelados" value={stats.cancelados} color="text-red-600" />
        <KpiCard label="Taxa de show-up" value={`${stats.showUp}%`} color="text-purple-600" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg border border-navy-200 hover:bg-navy-50"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-xl font-bold text-navy-900 min-w-[180px] text-center">
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg border border-navy-200 hover:bg-navy-50"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={goToday}
            className="ml-2 px-3 py-1.5 text-sm rounded-lg border border-navy-200 hover:bg-navy-50"
          >
            Hoje
          </button>
        </div>
        <Link
          href="/app/agenda/novo"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#011960] text-white hover:bg-[#011960]/90 font-semibold text-sm"
        >
          <Plus className="h-4 w-4" /> Novo agendamento
        </Link>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border border-navy-100 bg-white overflow-hidden">
        <div className="grid grid-cols-7 border-b border-navy-100 bg-navy-50">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-2 py-2 text-center text-xs font-bold text-navy-700">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map(({ d, inMonth }) => {
            const k = fmtDateKey(d);
            const appts = byDate.get(k) ?? [];
            const isToday = k === todayKey;
            return (
              <button
                key={k + (inMonth ? "" : "x")}
                onClick={() => setSelected(k)}
                className={`text-left min-h-[100px] md:min-h-[120px] p-1.5 border-b border-r border-navy-100 transition-colors ${
                  inMonth ? "bg-white hover:bg-navy-50/50" : "bg-navy-50/40 text-ink-400"
                } ${isToday ? "ring-2 ring-[#BA0102] ring-inset" : ""}`}
              >
                <div className={`text-xs font-bold mb-1 ${isToday ? "text-[#BA0102]" : ""}`}>
                  {d.getDate()}
                </div>
                <div className="space-y-1">
                  {appts.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDrawer(a);
                      }}
                      className={`text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer ${
                        STATUS_STYLE[a.status] ?? STATUS_STYLE.agendado
                      }`}
                      title={`${a.title} — ${fmtHHMM(a.scheduled_at)}`}
                    >
                      {fmtHHMM(a.scheduled_at)} {a.title}
                    </div>
                  ))}
                  {appts.length > 3 && (
                    <div className="text-[10px] text-ink-500 font-semibold">
                      + {appts.length - 3} mais
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day modal */}
      {selected && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-navy-100">
              <h3 className="font-bold text-navy-900 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {new Date(selected).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="text-ink-500 hover:text-navy-900 text-xl leading-none"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-2">
              {selectedAppts.length === 0 ? (
                <p className="text-sm text-ink-500 text-center py-6">Nada agendado neste dia.</p>
              ) : (
                selectedAppts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setDrawer(a);
                      setSelected(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg border ${
                      STATUS_STYLE[a.status] ?? STATUS_STYLE.agendado
                    } hover:scale-[1.01] transition-transform`}
                  >
                    <div className="font-bold text-sm flex items-center gap-2">
                      <Clock className="h-3 w-3" /> {fmtHHMM(a.scheduled_at)} — {a.title}
                    </div>
                    {a.external_name && (
                      <div className="text-xs mt-0.5">com {a.external_name}</div>
                    )}
                  </button>
                ))
              )}
              <Link
                href={`/app/agenda/novo?date=${selected}`}
                className="block w-full text-center mt-3 px-4 py-2.5 rounded-lg bg-[#011960] text-white font-semibold text-sm hover:bg-[#011960]/90"
              >
                <Plus className="inline h-4 w-4" /> Agendar neste dia
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Drawer detalhes */}
      {drawer && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-stretch justify-end"
          onClick={() => setDrawer(null)}
        >
          <div
            className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-navy-100 flex items-center justify-between">
              <h3 className="font-bold text-navy-900">Detalhes do agendamento</h3>
              <button
                onClick={() => setDrawer(null)}
                className="text-ink-500 hover:text-navy-900 text-2xl leading-none"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <span
                  className={`inline-block text-xs font-bold px-2 py-1 rounded ${
                    STATUS_STYLE[drawer.status] ?? STATUS_STYLE.agendado
                  }`}
                >
                  {drawer.status.toUpperCase()}
                </span>
              </div>
              <h4 className="text-xl font-bold text-navy-900">{drawer.title}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-ink-700">
                  <Clock className="h-4 w-4 text-[#011960]" />
                  {new Date(drawer.scheduled_at).toLocaleString("pt-BR", {
                    dateStyle: "full",
                    timeStyle: "short",
                    timeZone: "America/Sao_Paulo",
                  })}
                  {" "}({drawer.duration_minutes} min)
                </div>
                <div className="flex items-center gap-2 text-ink-700">
                  {drawer.meeting_type === "video" && <Video className="h-4 w-4 text-[#011960]" />}
                  {drawer.meeting_type === "phone" && <Phone className="h-4 w-4 text-[#011960]" />}
                  {drawer.meeting_type === "presencial" && <MapPin className="h-4 w-4 text-[#011960]" />}
                  {drawer.meeting_type}
                </div>
                {drawer.meeting_url && (
                  <a href={drawer.meeting_url} target="_blank" rel="noreferrer" className="text-[#BA0102] underline break-all">
                    {drawer.meeting_url}
                  </a>
                )}
                {drawer.meeting_location && (
                  <p className="text-ink-700">{drawer.meeting_location}</p>
                )}
                {drawer.external_name && (
                  <p className="text-ink-700"><strong>Com:</strong> {drawer.external_name}</p>
                )}
                {drawer.external_email && (
                  <p className="text-ink-700">{drawer.external_email}</p>
                )}
                {drawer.external_phone && (
                  <p className="text-ink-700">{drawer.external_phone}</p>
                )}
                {drawer.description && (
                  <p className="text-ink-600 pt-2 border-t border-navy-100">{drawer.description}</p>
                )}
              </div>
              <ActionButtons appointmentId={drawer.id} current={drawer.status} onDone={() => setDrawer(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-4">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-ink-500 mt-1">{label}</div>
    </div>
  );
}

function ActionButtons({
  appointmentId,
  current,
  onDone,
}: {
  appointmentId: string;
  current: string;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  async function setStatus(s: string) {
    setLoading(s);
    try {
      await fetch(`/api/agenda/appointment/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      onDone();
      if (typeof window !== "undefined") window.location.reload();
    } finally {
      setLoading(null);
    }
  }
  const actions = [
    { s: "confirmado", label: "Confirmar", cls: "bg-green-600 hover:bg-green-700" },
    { s: "realizado", label: "Marcar realizado", cls: "bg-emerald-700 hover:bg-emerald-800" },
    { s: "cancelado", label: "Cancelar", cls: "bg-red-600 hover:bg-red-700" },
    { s: "no_show", label: "No-show", cls: "bg-orange-600 hover:bg-orange-700" },
  ];
  return (
    <div className="pt-4 border-t border-navy-100 grid grid-cols-2 gap-2">
      {actions
        .filter((a) => a.s !== current)
        .map((a) => (
          <button
            key={a.s}
            disabled={loading !== null}
            onClick={() => setStatus(a.s)}
            className={`px-3 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 ${a.cls}`}
          >
            {loading === a.s ? "..." : a.label}
          </button>
        ))}
    </div>
  );
}
