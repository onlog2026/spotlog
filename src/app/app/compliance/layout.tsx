import type { Metadata } from "next";
import { ComplianceNav } from "@/components/compliance/compliance-nav";

export const metadata: Metadata = {
  title: "Compliance | Spotlog",
  description:
    "Documentos regulatórios, LGPD e faturamento Spotlog em um só lugar.",
};

export default function ComplianceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-wider text-spotorange-500 font-semibold">
          Governança
        </p>
        <h1 className="text-2xl md:text-3xl font-bold">Compliance</h1>
        <p className="text-sm text-muted-foreground">
          Controle documentos vigentes, prazos regulatórios e faturamento.
        </p>
      </header>
      <ComplianceNav />
      <div>{children}</div>
    </div>
  );
}
