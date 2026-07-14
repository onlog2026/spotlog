"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Plug,
  ScrollText,
  Server,
  AlertTriangle,
  Menu,
  X,
  ShieldAlert,
  Lock,
  Briefcase,
  Megaphone,
  CreditCard,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/app/superadmin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/superadmin/organizacoes", label: "Organizações", icon: Building2 },
  { href: "/app/superadmin/planos", label: "Planos & Módulos", icon: CreditCard },
  { href: "/app/superadmin/modulos", label: "Catálogo de Módulos", icon: Boxes },
  { href: "/app/superadmin/clientes", label: "Clientes (Todos)", icon: Briefcase },
  { href: "/app/superadmin/broadcast", label: "Broadcast", icon: Megaphone },
  { href: "/app/superadmin/usuarios", label: "Usuários", icon: Users },
  { href: "/app/superadmin/permissoes", label: "Permissões", icon: Lock },
  { href: "/app/superadmin/integracoes", label: "Integrações", icon: Plug },
  { href: "/app/superadmin/auditoria", label: "Auditoria", icon: ScrollText },
  { href: "/app/superadmin/sistema", label: "Sistema", icon: Server },
];

export function SuperAdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const active = (item: (typeof nav)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-screen bg-[#011960] text-white">
      {/* Banner Super Admin */}
      <div
        className="w-full border-b border-white/10 px-4 py-2 flex items-center gap-2 text-sm font-semibold"
        style={{ background: "#BA0102" }}
      >
        <ShieldAlert className="h-4 w-4" />
        <span className="hidden sm:inline">
          SUPER ADMIN GLOBAL — acesso irrestrito a todas as organizações
        </span>
        <span className="sm:hidden">SUPER ADMIN</span>
        <span className="ml-auto opacity-90 truncate max-w-[200px] text-xs">{email}</span>
        <Link
          href="/app"
          className="ml-2 rounded bg-black/30 hover:bg-black/50 px-2 py-1 text-xs"
        >
          Sair do modo
        </Link>
      </div>

      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex w-60 shrink-0 border-r border-white/10 bg-[#010f3d] min-h-[calc(100vh-37px)] flex-col">
          <div className="px-4 py-5 border-b border-white/10">
            <div className="text-xs uppercase tracking-wider opacity-70">Spotlog</div>
            <div className="font-bold text-lg">Super Admin</div>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const isActive = active(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition",
                    isActive
                      ? "bg-[#BA0102] text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-white/10 text-[11px] text-white/50 flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            Ações destrutivas pedem confirmação dupla.
          </div>
        </aside>

        {/* Sidebar mobile */}
        {open ? (
          <div className="md:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setOpen(false)}>
            <aside
              className="absolute left-0 top-0 bottom-0 w-64 bg-[#010f3d] p-3 border-r border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="font-bold">Super Admin</div>
                <button onClick={() => setOpen(false)} className="p-2 rounded hover:bg-white/10">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="space-y-1">
                {nav.map((item) => {
                  const Icon = item.icon;
                  const isActive = active(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                        isActive
                          ? "bg-[#BA0102] text-white"
                          : "text-white/80 hover:bg-white/10",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        ) : null}

        {/* Conteúdo */}
        <main className="flex-1 min-w-0">
          <div className="md:hidden flex items-center gap-2 border-b border-white/10 px-3 py-2 bg-[#010f3d]">
            <button onClick={() => setOpen(true)} className="p-2 rounded hover:bg-white/10">
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-semibold">Super Admin</span>
          </div>
          <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
