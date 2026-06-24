"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  {
    href: "/app/compliance",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/app/compliance/documentos", label: "Documentos", icon: FileText },
  { href: "/app/compliance/financeiro", label: "Financeiro", icon: Wallet },
];

export function ComplianceNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação do compliance"
      className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0"
    >
      <ul className="flex md:flex-wrap gap-2 min-w-max md:min-w-0">
        {items.map((it) => {
          const active = it.exact
            ? pathname === it.href
            : pathname?.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-spotorange-500 bg-spotorange-500/10 text-spotorange-500"
                    : "border-transparent bg-card/50 text-muted-foreground hover:border-spotorange-500 hover:text-foreground",
                )}
              >
                <it.icon className="h-4 w-4" aria-hidden="true" />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
