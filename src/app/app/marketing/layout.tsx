import Link from "next/link";
import { MarketingTabs } from "@/components/marketing/marketing-tabs";
import { requireOrgModule } from "@/lib/entitlements";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  await requireOrgModule("marketing"); // Eixo A — neutro enquanto enforcement OFF
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Marketing</h1>
          <p className="text-sm text-muted-foreground">
            Atraia, converta e relacione — tudo num lugar só. Estilo RD Station, do jeito Spotlog.
          </p>
        </div>
        <Link
          href="/app/marketing/converter/landing/nova"
          className="inline-flex items-center gap-2 rounded-md px-3 h-9 text-xs font-semibold bg-[#BA0102] hover:bg-[#a10002] text-white whitespace-nowrap"
        >
          Nova landing page
        </Link>
      </div>
      <MarketingTabs />
      <div>{children}</div>
    </div>
  );
}
