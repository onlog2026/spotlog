import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CmsCase } from "@/lib/queries/cms";

const segmentLabels: Record<string, string> = {
  ecommerce: "E-commerce",
  farma: "Farma",
  manipulacao: "Manipulação",
  correlatos: "Correlatos",
  dermo: "Dermo",
  outro: "Outro",
};

export function CaseCard({ item }: { item: CmsCase }) {
  const kpis = Object.entries(item.kpi_json ?? {}).slice(0, 3);
  return (
    <Link
      href={`/cases/${item.slug}`}
      className="group block bg-white border border-ink-200 rounded-2xl overflow-hidden shadow-soft hover:shadow-card hover:border-spotorange-500 transition-all"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            {item.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.logo_url}
                alt={item.client_name}
                className="h-10 object-contain mb-3"
              />
            ) : (
              <div className="h-10 mb-3" />
            )}
            <h3 className="text-lg lg:text-xl font-bold text-navy-900 group-hover:text-spotorange-600 transition-colors">
              {item.client_name}
            </h3>
          </div>
          <span className="inline-flex items-center bg-navy-50 text-navy-900 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
            {segmentLabels[item.segment] ?? item.segment}
          </span>
        </div>
        {item.summary ? (
          <p className="text-sm text-ink-600 leading-relaxed line-clamp-3">{item.summary}</p>
        ) : null}
        {kpis.length > 0 ? (
          <div className="mt-4 pt-4 border-t border-ink-100 grid grid-cols-3 gap-2">
            {kpis.map(([k, v]) => (
              <div key={k} className="text-center">
                <div className="text-base font-bold text-spotorange-600">{v}</div>
                <div className="text-[10px] uppercase tracking-wider text-ink-500 mt-0.5 truncate">{k}</div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-5 inline-flex items-center text-sm font-semibold text-spotorange-600 group-hover:gap-1.5 gap-1 transition-all">
          Ver case completo <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}
