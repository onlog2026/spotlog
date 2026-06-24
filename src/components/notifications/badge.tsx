"use client";
import { cn } from "@/lib/utils";

export function NotificationBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (!count || count <= 0) return null;
  const label = count > 9 ? "9+" : String(count);
  return (
    <span
      aria-label={`${count} ${count === 1 ? "novidade" : "novidades"}`}
      className={cn(
        "ml-auto inline-flex min-w-[18px] h-[18px] items-center justify-center",
        "rounded-full bg-red-600 text-white text-[10px] font-bold px-1.5",
        "shadow-[0_0_0_2px_rgba(186,1,2,0.25)] notif-pulse",
        className,
      )}
    >
      {label}
      <style jsx>{`
        @keyframes notifPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(186, 1, 2, 0.55);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(186, 1, 2, 0);
          }
        }
        .notif-pulse {
          animation: notifPulse 2.2s ease-in-out infinite;
        }
      `}</style>
    </span>
  );
}
