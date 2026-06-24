"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Headphones,
  FileText,
  Megaphone,
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  CircleUser,
  Sparkles,
  PackagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, initials } from "@/lib/utils";
import type { ClientContext } from "@/lib/auth-client";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/portal/remessas", label: "Minhas Remessas", icon: Truck },
  { href: "/portal/coletas/nova", label: "Solicitar Coleta", icon: PackagePlus },
  { href: "/portal/chamados", label: "Chamados", icon: Headphones },
  { href: "/portal/documentos", label: "Documentos", icon: FileText },
  { href: "/portal/avisos", label: "Avisos da plataforma", icon: Megaphone },
  { href: "/portal/perfil", label: "Meu Perfil", icon: CircleUser },
];

export function PortalShell({
  ctx,
  unreadBroadcasts,
  children,
}: {
  ctx: ClientContext;
  unreadBroadcasts: number;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(unreadBroadcasts);
  const pathname = usePathname();

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const res = await fetch("/api/portal/broadcasts/unread-count", {
          cache: "no-store",
        });
        if (!alive || !res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (typeof data?.count === "number") setUnread(data.count);
      } catch {
        /* ignore */
      }
    }
    const id = setInterval(tick, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-card/50 backdrop-blur-xl transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-5 border-b border-white/10 shrink-0">
            <Link href="/portal" className="flex items-center gap-2 font-bold">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="leading-tight">
                <div className="text-gradient text-sm">Spotlog</div>
                <div className="text-[10px] text-muted-foreground font-normal">
                  Portal do Cliente
                </div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
            {navItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    active
                      ? "bg-gradient-brand/15 text-foreground font-medium border border-brand-500/20"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.href === "/portal/avisos" && unread > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-white/10 shrink-0">
            <div className="glass rounded-lg p-3 text-xs space-y-1">
              <div className="font-medium text-foreground truncate">
                {ctx.company.name}
              </div>
              <div className="text-muted-foreground truncate">
                Atendido por {ctx.organization.name}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 border-b border-white/10 bg-background/80 backdrop-blur-xl">
          <div className="h-full px-4 md:px-6 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="icon"
              asChild
              className="relative"
            >
              <Link href="/portal/avisos" aria-label="Avisos">
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-white/5 px-2 py-1.5 rounded-md">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={ctx.user.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-gradient-brand text-white text-xs">
                      {initials(ctx.user.full_name ?? ctx.user.email ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-medium leading-tight">
                      {ctx.user.full_name ?? ctx.user.email}
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-tight">
                      {ctx.company.name}
                    </div>
                  </div>
                  <ChevronDown className="hidden md:block h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{ctx.user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/portal/perfil">
                    <CircleUser className="h-4 w-4 mr-2" />
                    Meu perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action="/api/auth/signout" method="POST">
                    <button className="w-full flex items-center text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
