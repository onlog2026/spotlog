import { requireSession } from "@/lib/auth";
import { listAppointmentsByMonth, getAppointmentStats } from "@/lib/queries/agenda";
import { MonthCalendar } from "@/components/agenda/month-calendar";
import Link from "next/link";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const ctx = await requireSession();
  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? Number(sp.year) : now.getFullYear();
  const month = sp.month ? Number(sp.month) : now.getMonth();

  const [appts, stats] = await Promise.all([
    listAppointmentsByMonth(ctx.org.id, year, month),
    getAppointmentStats(ctx.org.id, year, month),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy-900">Agenda</h1>
          <p className="text-sm text-ink-600 mt-1">Gerencie suas reuniões e disponibilidade</p>
        </div>
        <Link
          href="/app/agenda/configuracao"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-navy-200 text-navy-900 text-sm hover:bg-navy-50"
        >
          <Settings className="h-4 w-4" /> Configurar disponibilidade
        </Link>
      </div>

      <MonthCalendar appointments={appts} initialYear={year} initialMonth={month} stats={stats} />
    </div>
  );
}
