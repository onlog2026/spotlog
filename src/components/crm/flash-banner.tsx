import { CheckCircle2, AlertTriangle } from "lucide-react";

type FlashBannerProps = {
  type?: "success" | "error";
  message: string;
};

export function FlashBanner({ type = "success", message }: FlashBannerProps) {
  if (!message) return null;
  if (type === "error") {
    return (
      <div
        role="alert"
        className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
      >
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        <span>{message}</span>
      </div>
    );
  }
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
    >
      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
