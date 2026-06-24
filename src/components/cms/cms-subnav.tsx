"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Trophy, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/app/cms", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/cms/posts", label: "Posts", icon: FileText },
  { href: "/app/cms/cases", label: "Cases", icon: Trophy },
  { href: "/app/cms/site/cards", label: "Cards do site", icon: LayoutGrid },
];

export function CmsSubnav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-white/10 -mt-2">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              active
                ? "border-spotorange-500 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
