import type { Metadata } from "next";
import { SacNav } from "@/components/sac/sac-nav";
import { TicketBadge } from "@/components/sac/ticket-badge";
import { requireOrgModule } from "@/lib/entitlements";

export const metadata: Metadata = {
  title: "SAC | Spotlog",
  description:
    "Central de atendimento Spotlog — tickets, prioridades e respostas ao cliente.",
};

export default async function SacLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOrgModule("tickets_sac"); // Eixo A — neutro enquanto enforcement OFF
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-spotorange-500 font-semibold">
            Atendimento
          </p>
          <h1 className="text-2xl md:text-3xl font-bold">SAC</h1>
          <p className="text-sm text-muted-foreground">
            Responda chamados, controle SLAs e priorize ocorrências críticas.
          </p>
        </div>
        <TicketBadge />
      </header>
      <SacNav />
      <div>{children}</div>
    </div>
  );
}
