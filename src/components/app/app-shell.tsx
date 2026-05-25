"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users2,
  Building2,
  Target,
  Bot,
  Send,
  Inbox,
  FileText,
  KanbanSquare,
  Settings,
  Plug,
  Menu,
  Bell,
  Search,
  ChevronDown,
  Sparkles,
  LogOut,
  CircleUser,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn, initials } from "@/lib/utils";
import type { SessionContext } from "@/lib/auth";

const navGroups = [
  {
    label: "Operação",
    items: [
      { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/app/inbox", label: "Inbox", icon: Inbox, badge: "novo" },
      { href: "/app/leads", label: "Leads", icon: Target },
      { href: "/app/pipeline", label: "Pipeline", icon: KanbanSquare },
    ],
  },
  {
    label: "CRM",
    items: [
      { href: "/app/contatos", label: "Contatos", icon: Users2 },
      { href: "/app/empresas", label: "Empresas", icon: Building2 },
    ],
  },
  {
    label: "Outbound",
    items: [
      { href: "/app/prospeccao", label: "Prospecção", icon: Bot },
      { href: "/app/cadencias", label: "Cadências", icon: Send },
      { href: "/app/propostas", label: "Propostas", icon: FileText },
    ],
  },
  {
    label: "Configurações",
    items: [
      { href: "/app/admin/integracoes", label: "Integrações", icon: Plug },
      { href: "/app/admin/equipe", label: "Equipe", icon: Users2 },
      { href: "/app/admin", label: "Organização", icon: Settings },
    ],
  },
];

export function AppShell({
  ctx,
  children,
}: {
  ctx: SessionContext;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-card/50 backdrop-blur-xl transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-5 border-b border-white/10">
            <Link href="/app" className="flex items-center gap-2 font-bold">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-gradient">Spotlog</span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
            {navGroups.map((group) => (
              <div key={group.label}>
                <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-2">
                  {group.label}
                </h4>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
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
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge variant="gradient" className="text-[9px] py-0">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-white/10">
            <div className="glass rounded-lg p-3 text-xs space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <Sparkles className="h-3 w-3 text-brand-400" />
                Plano {ctx.org.plan}
              </div>
              {ctx.org.trial_ends_at && (
                <div className="text-muted-foreground">
                  Trial até{" "}
                  {new Date(ctx.org.trial_ends_at).toLocaleDateString("pt-BR")}
                </div>
              )}
              <Button variant="gradient" size="sm" className="w-full mt-1" asChild>
                <Link href="/app/admin/billing">Upgrade</Link>
              </Button>
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

            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contato, empresa, deal..."
                className="pl-10 bg-card/50 border-white/10"
              />
            </div>

            <Button variant="ghost" size="icon" asChild>
              <Link href="/app/notificacoes">
                <Bell className="h-5 w-5" />
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
                      {ctx.org.name}
                    </div>
                  </div>
                  <ChevronDown className="hidden md:block h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{ctx.user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/app/perfil">
                    <CircleUser className="h-4 w-4 mr-2" />
                    Meu perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/admin">
                    <Settings className="h-4 w-4 mr-2" />
                    Organização
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
