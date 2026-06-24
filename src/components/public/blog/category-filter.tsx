import Link from "next/link";
import { cn } from "@/lib/utils";

const cats = [
  { key: "todos", label: "Todos" },
  { key: "blog", label: "Blog" },
  { key: "case", label: "Cases" },
  { key: "news", label: "Novidades" },
];

export function CategoryFilter({ current }: { current: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {cats.map((c) => {
        const active = current === c.key;
        const href = c.key === "todos" ? "/blog" : `/blog?cat=${c.key}`;
        return (
          <Link
            key={c.key}
            href={href}
            className={cn(
              "inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors border",
              active
                ? "bg-navy-900 text-white border-navy-900"
                : "bg-white text-ink-700 border-ink-200 hover:border-spotorange-500 hover:text-spotorange-600",
            )}
          >
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}
