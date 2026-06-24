import type { LucideIcon } from "lucide-react";
import { Package } from "lucide-react";

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="h-14 w-14 rounded-full bg-navy-900/5 dark:bg-white/5 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>
      )}
    </div>
  );
}
