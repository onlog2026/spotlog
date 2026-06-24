"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/app/admin/chatbot", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/admin/chatbot/knowledge", label: "Conhecimento", icon: BookOpen },
  { href: "/app/admin/chatbot/unanswered", label: "Não respondidas", icon: HelpCircle },
  { href: "/app/admin/chatbot/sessions", label: "Sessões", icon: MessageSquare },
];

export function ChatbotSubnav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 border-b border-white/10 -mt-2">
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
