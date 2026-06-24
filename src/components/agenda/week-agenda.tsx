"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Appointment } from "@/lib/queries/agenda";

interface Props {
  weekStart: string;
  appointments: Appointment[];
  userId: string;
}

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 8..20

const STATUS_BG: Record<string, string> = {
  agendado: "bg-blue-500",
  confirmado: "bg-green-500",
  realizado: "bg-emerald-700",
  cancelado: "bg-red-400 line-through opacity-50",
  no_show: "bg-orange-500",
  reagendado: "bg-purple-500",
};

export function WeekAgenda({ weekStart, appointments }: Props) {
  const start = useMemo(() => new Date(weekStart), [weekStart]);
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [start]);

  const [drawer, setDrawer] = useState<Appointment | null>(null);

  function shiftWeek(days: number) {
    const d = new Date(start);
    d.setDate(start.getDate() + days);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("week", d.toISOString().slice(0, 10));
      window.location.href = url.toString();
    }
  }

  function apptsForCell(dayDate: Date, hour: number) {
    return appointments.filter((a) => {
      const ad = new Date(a.scheduled_at);
      return (
        ad.getFullYear() === dayDate.getFullYear() &&
        ad.getMonth() === dayDate.getMonth() &&
        ad.getDate() === dayDate.getDate() &&
        ad.getHours() === hour
      );
    });
  }

  const weekLabel = `${days[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${days[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftWeek(-7)} className="p-2 rounded-lg border border-navy-200 hover:bg-navy-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-semibold text-navy-900">{weekLabel}</span>
          <button onClick={() => shiftWeek(7)} className="p-2 rounded-lg border border-navy-200 hover:bg-navy-50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Legend color="bg-blue-500" label="Agendado" />
          <Legend color="bg-green-500" label="Confirmado" />
          <Legend color="bg-emerald-700" label="Realizado" />
          <Legend color="bg-red-400" label="Cancelado" />
        </div>
      </div>

      <div className="rounded-2xl border border-navy-100 bg-white overflow-x-auto">
        <div className="grid min-w-[700px]" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
          <div className="border-b border-r border-navy-100 bg-navy-50" />
          {days.map((d, i) => (
            <div key={i} className="border-b border-r border-navy-100 bg-navy-50 px-2 py-2 text-center">
              <div className="text-[10px] font-bold text-navy-700">{DAY_NAMES[i]}</div>
              <div className="text-lg font-bold text-navy-900">{d.getDate()}</div>
            </div>
          ))}
          {HOURS.map((h) => (
            <div key={h} className="contents">
              <div className="border-b border-r border-navy-100 text-[10px] text-ink-500 text-right pr-1 pt-0.5 bg-navy-50/30">
                {String(h).padStart(2, "0")}:00
              </div>
              {days.map((d, di) => {
                const slot = apptsForCell(d, h);
                const isFree = slot.length === 0;
                const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                return (
                  <div
                    key={di + "-" + h}
                    className={`border-b border-r border-navy-100 min-h-[56px] p-0.5 ${
                      isFree ? "hover:bg-navy-50" : ""
                    }`}
                  >
                    {isFree ? (
                      <Link
                        href={`/app/agenda/novo?date=${dStr}`}
                        className="block h-full w-full text-[10px] text-ink-300 hover:text-[#011960] hover:bg-blue-50 rounded transition-colors flex items-center justify-center"
                      >
                        +
                      </Link>
                    ) : (
                      slot.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setDrawer(a)}
                          className={`block w-full text-left text-[10px] text-white rounded px-1 py-0.5 mb-0.5 font-semibold ${
                            STATUS_BG[a.status] ?? "bg-blue-500"
                          }`}
                          title={a.title}
                        >
                          {new Date(a.scheduled_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "America/Sao_Paulo",
                          })}
                          <br />
                          <span className="truncate block">{a.title}</span>
                        </button>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {drawer && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-stretch justify-end"
          onClick={() => setDrawer(null)}
        >
          <div className="bg-white w-full max-w-md h-full overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDrawer(null)} className="float-right text-2xl">×</button>
            <h3 className="text-lg font-bold text-navy-900 mb-3">{drawer.title}</h3>
            <p className="text-sm text-ink-700 mb-2">
              {new Date(drawer.scheduled_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
            </p>
            <p className="text-sm">Status: <strong>{drawer.status}</strong></p>
            {drawer.external_name && <p className="text-sm">Com: {drawer.external_name}</p>}
            {drawer.description && <p className="text-sm text-ink-600 mt-3">{drawer.description}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded ${color}`} />
      <span className="text-ink-600">{label}</span>
    </span>
  );
}
