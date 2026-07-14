import type { Metadata } from "next";
import { OperacaoNav } from "@/components/operacao/operacao-nav";
import { requireOrgModule } from "@/lib/entitlements";

export const metadata: Metadata = {
  title: "Operacional | Spotlog",
  description:
    "Painel operacional Spotlog — remessas, rotas, motoristas, veículos e ocorrências.",
};

export default async function OperacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOrgModule("operacao"); // Eixo A — neutro enquanto enforcement OFF
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-wider text-spotorange-500 font-semibold">
          Operacional
        </p>
        <h1 className="text-2xl md:text-3xl font-bold">Controle da operação</h1>
        <p className="text-sm text-muted-foreground">
          Visão única da frota, rotas e ocorrências do dia.
        </p>
      </header>
      <OperacaoNav />
      <div>{children}</div>
    </div>
  );
}
