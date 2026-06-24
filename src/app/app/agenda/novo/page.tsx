import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { listOrgMembersBasic } from "@/lib/queries/agenda";
import { NovoAppointmentForm } from "@/components/agenda/novo-form";

export const dynamic = "force-dynamic";

export default async function NovoAgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const ctx = await requireSession();
  const sp = await searchParams;
  const members = await listOrgMembersBasic(ctx.org.id);
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/app/agenda" className="p-2 rounded-lg border border-navy-200 hover:bg-navy-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy-900">Novo agendamento</h1>
          <p className="text-sm text-ink-600 mt-1">Crie uma reunião na agenda</p>
        </div>
      </div>
      <NovoAppointmentForm
        orgId={ctx.org.id}
        defaultDate={sp.date}
        defaultOwner={ctx.user.id}
        members={members.map((m) => ({
          id: m.user_id,
          label: m.full_name ?? m.email ?? m.user_id.slice(0, 8),
          role: m.role,
        }))}
      />
    </div>
  );
}
