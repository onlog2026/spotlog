import { requireSession } from "@/lib/auth";
import { listAppointmentsRange, listOrgMembersBasic } from "@/lib/queries/agenda";
import { WeekAgenda } from "@/components/agenda/week-agenda";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";

export const dynamic = "force-dynamic";

function startOfWeek(d: Date) {
  const day = (d.getDay() + 6) % 7; // 0=monday
  const s = new Date(d);
  s.setDate(d.getDate() - day);
  s.setHours(0, 0, 0, 0);
  return s;
}

export default async function SdrAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; user?: string }>;
}) {
  const ctx = await requireSession();
  const sp = await searchParams;
  const ref = sp.week ? new Date(sp.week) : new Date();
  const weekStart = startOfWeek(ref);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const isAdmin = ["owner", "admin", "manager"].includes(ctx.org.role);
  const members = isAdmin ? await listOrgMembersBasic(ctx.org.id) : [];
  const userFilter = sp.user ?? ctx.user.id;

  const appts = await listAppointmentsRange(
    ctx.org.id,
    weekStart.toISOString(),
    weekEnd.toISOString(),
    userFilter,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy-900">Agenda SDR</h1>
          <p className="text-sm text-ink-600 mt-1">Visão semanal dos seus slots</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && members.length > 0 && (
            <form method="get" className="flex items-center gap-2">
              <select
                name="user"
                defaultValue={userFilter}
                className="rounded-lg border border-navy-200 px-3 py-2 text-sm"
              >
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name ?? m.email ?? m.user_id.slice(0, 8)} ({m.role})
                  </option>
                ))}
              </select>
              <button type="submit" className="px-3 py-2 rounded-lg border border-navy-200 text-sm hover:bg-navy-50">
                Filtrar
              </button>
            </form>
          )}
          <Link
            href="/app/agenda/novo"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#011960] text-white text-sm hover:bg-[#011960]/90 font-semibold"
          >
            <CalendarPlus className="h-4 w-4" /> Novo
          </Link>
          <button
            disabled
            title="Em breve"
            className="px-3 py-2 rounded-lg border border-navy-200 text-sm text-ink-500 cursor-not-allowed"
          >
            Importar Google Calendar
          </button>
        </div>
      </div>

      <WeekAgenda weekStart={weekStart.toISOString()} appointments={appts} userId={userFilter} />
    </div>
  );
}
