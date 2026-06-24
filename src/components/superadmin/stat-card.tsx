import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "navy",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  accent?: "navy" | "red";
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
          <div className="mt-1 text-2xl font-bold">{value}</div>
          {hint ? <div className="mt-1 text-[11px] text-white/50">{hint}</div> : null}
        </div>
        {Icon ? (
          <div
            className="rounded-lg p-2"
            style={{
              background: accent === "red" ? "rgba(186,1,2,0.2)" : "rgba(255,255,255,0.05)",
              color: accent === "red" ? "#ff6b6c" : "white",
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
