import type { Metadata } from "next";
import { SdrNav } from "@/components/sdr/sdr-nav";
import { requireOrgModule } from "@/lib/entitlements";

export const metadata: Metadata = {
  title: "SDR Digital | Spotlog",
  description:
    "Prospecção LGPD-safe com IA, enriquecimento de leads e gestão de consentimento.",
};

export default async function SdrLayout({ children }: { children: React.ReactNode }) {
  await requireOrgModule("sdr"); // Eixo A — neutro enquanto enforcement OFF
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] uppercase tracking-wider text-spotorange-500 font-semibold">
          SDR Digital · LGPD-safe
        </p>
        <h1 className="text-2xl md:text-3xl font-bold">Agente de prospecção</h1>
        <p className="text-sm text-muted-foreground">
          Encontre, enriqueça, qualifique e contate leads respeitando a Lei
          13.709/2018.
        </p>
      </header>
      <SdrNav />
      <div>{children}</div>
    </div>
  );
}
