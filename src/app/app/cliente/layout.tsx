import type { Metadata } from "next";
import { ClienteNav } from "@/components/cliente/cliente-nav";
import { ClienteTicketBadge } from "@/components/cliente/ticket-badge";

export const metadata: Metadata = {
  title: "Área do Cliente | Spotlog",
  description:
    "Painel do cliente Spotlog — remessas, rastreamento, coletas, SAC, financeiro e integração.",
};

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-spotorange-500 font-semibold">
            Área do Cliente
          </p>
          <h1 className="text-2xl md:text-3xl font-bold">Painel de entregas</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe suas remessas, solicite coletas e fale com o SAC.
          </p>
        </div>
        <ClienteTicketBadge />
      </header>
      <ClienteNav />
      <div>{children}</div>
    </div>
  );
}
