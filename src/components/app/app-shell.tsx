"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users2,
  Building2,
  Target,
  Bot,
  Send,
  FileText,
  KanbanSquare,
  Settings,
  Menu,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  Sparkles,
  LogOut,
  CircleUser,
  Newspaper,
  Headphones,
  MessageSquareWarning,
  Megaphone,
  Truck,
  UserCheck,
  Shield,
  Crown,
  Palette,
  TrendingUp,
  KeyRound,
  ClipboardList,
  BookText,
  Briefcase,
  FileCheck2,
  Receipt,
  MapPin,
  Car,
  AlertTriangle,
  Tags,
  ListChecks,
  Mail,
  PenLine,
  type LucideIcon,
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
import { NotificationBadge } from "@/components/notifications/badge";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { cn, initials } from "@/lib/utils";
import type { SessionContext } from "@/lib/auth";
import type { NotificationCounts, NotificationModule } from "@/lib/notifications";

// ============================================================================
// MODELO: categorias coloridas com subitens (opcionalmente agrupados)
// ============================================================================

type SubGroup = {
  label: string;
  items: NavItem[];
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  notifKey?: NotificationModule;
  tourId?: string;
  /**
   * Módulo vendável (Eixo A) deste item. Se setado e a org NÃO tiver o módulo
   * (não está em ctx.enabledModules), o item é escondido. Sem `module` → sempre
   * aparece. Chave string local — NÃO importar de entitlements.ts (server-only).
   */
  module?: string;
};

type Category = {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Tailwind color tokens for header / accents */
  color: {
    bg: string; // background do header
    text: string; // texto/ícone do header (geralmente white)
    border: string; // borda lateral do item ativo
    hover: string; // fundo de hover suave
    activeBg: string; // fundo do item ativo
    activeText: string; // texto do item ativo
  };
  /** Classe de glow para o tema neon */
  neonGlow?: string;
  items: NavItem[];
  subGroups?: SubGroup[];
  /** Se true, só aparece quando ctx.user.is_super_admin */
  superAdminOnly?: boolean;
  /** Se true, a categoria fica oculta do menu (desligada manualmente). */
  hidden?: boolean;
  /**
   * Módulo vendável (Eixo A) da categoria inteira. Se setado e a org não tiver
   * o módulo, a categoria some por completo. Sem `module` → sempre aparece
   * (sujeita ainda a esconder se TODOS os itens forem filtrados).
   */
  module?: string;
  /** Estado padrão (expandido) */
  defaultOpen?: boolean;
  /** Atributo data-tour pra cabeçalho da categoria */
  tourId?: string;
};

const CATEGORIES: Category[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: {
      bg: "bg-slate-700",
      text: "text-white",
      border: "border-l-slate-600",
      hover: "hover:bg-slate-500/10",
      activeBg: "bg-slate-500/15",
      activeText: "text-slate-900 dark:text-slate-100",
    },
    neonGlow: "neon-glow-gray",
    defaultOpen: true,
    items: [{ href: "/app", label: "Início", icon: LayoutDashboard, exact: true }],
  },
  {
    key: "crm",
    label: "CRM",
    icon: KanbanSquare,
    color: {
      bg: "bg-blue-500",
      text: "text-white",
      border: "border-l-blue-500",
      hover: "hover:bg-blue-500/10",
      activeBg: "bg-blue-500/15",
      activeText: "text-blue-900 dark:text-blue-100",
    },
    neonGlow: "neon-glow-blue",
    defaultOpen: true,
    tourId: "cat-crm",
    module: "crm",
    items: [
      { href: "/app/leads", label: "Leads", icon: Target, notifKey: "leads", tourId: "nav-leads" },
      { href: "/app/pipeline", label: "Pipeline", icon: KanbanSquare, notifKey: "deals", tourId: "nav-pipeline", module: "pipeline" },
      { href: "/app/empresas", label: "Empresas", icon: Building2 },
      { href: "/app/contatos", label: "Contatos", icon: Users2 },
      { href: "/app/propostas", label: "Propostas", icon: FileText, module: "propostas" },
      { href: "/app/propostas/tabelas", label: "Tabelas de Preço", icon: Tags, module: "propostas" },
    ],
  },
  {
    key: "marketing",
    label: "Marketing",
    icon: Megaphone,
    color: {
      bg: "bg-orange-500",
      text: "text-white",
      border: "border-l-orange-500",
      hover: "hover:bg-orange-500/10",
      activeBg: "bg-orange-500/15",
      activeText: "text-orange-900 dark:text-orange-100",
    },
    neonGlow: "neon-glow-orange",
    tourId: "cat-marketing",
    module: "marketing",
    items: [
      { href: "/app/marketing", label: "Visão Geral", icon: Megaphone, exact: true },
    ],
    subGroups: [
      {
        label: "Atrair",
        items: [
          { href: "/app/marketing/atrair/social", label: "Posts Sociais", icon: Sparkles },
          { href: "/app/marketing/atrair/ads", label: "Lead Ads", icon: Megaphone },
          { href: "/app/marketing/atrair/publicos", label: "Públicos", icon: Users2 },
          { href: "/app/marketing/atrair/seo", label: "SEO", icon: Search },
          { href: "/app/marketing/atrair/link-bio", label: "Link Bio", icon: ListChecks },
        ],
      },
      {
        label: "Converter",
        items: [
          { href: "/app/marketing/converter/landing", label: "Landing Pages", icon: FileText },
          { href: "/app/marketing/converter/popups", label: "Pop-ups", icon: ClipboardList },
          { href: "/app/marketing/converter/whatsapp", label: "WhatsApp", icon: Send },
          { href: "/app/marketing/converter/push", label: "Web Push", icon: Bell },
          { href: "/app/marketing/converter/formularios", label: "Formulários", icon: FileCheck2 },
        ],
      },
      {
        label: "Relacionar",
        items: [
          { href: "/app/marketing/relacionar/segmentos", label: "Segmentação", icon: Users2 },
          { href: "/app/marketing/relacionar/validador", label: "Validador Email", icon: FileCheck2 },
          { href: "/app/marketing/relacionar/sms", label: "SMS", icon: Send },
          { href: "/app/marketing/relacionar/inteligentes", label: "Smart Leads", icon: Target },
          { href: "/app/cadencias", label: "Cadências", icon: Send, module: "cadencias" },
        ],
      },
      {
        label: "Analisar",
        items: [
          { href: "/app/marketing/analisar/funil", label: "Funil", icon: TrendingUp },
          { href: "/app/marketing/analisar/canais", label: "Canais", icon: TrendingUp },
          { href: "/app/marketing/analisar/midias", label: "Mídias", icon: Newspaper },
          { href: "/app/marketing/analisar/performance", label: "Performance", icon: TrendingUp },
          { href: "/app/marketing/analisar/relatorios", label: "Relatórios", icon: FileText },
          { href: "/app/marketing/analisar/dashboards", label: "Dashboards", icon: LayoutDashboard },
          { href: "/app/marketing/analisar/campanhas", label: "Campanhas", icon: Megaphone },
        ],
      },
    ],
  },
  {
    key: "sdr",
    label: "SDR / Prospecção",
    icon: Bot,
    color: {
      bg: "bg-violet-500",
      text: "text-white",
      border: "border-l-violet-500",
      hover: "hover:bg-violet-500/10",
      activeBg: "bg-violet-500/15",
      activeText: "text-violet-900 dark:text-violet-100",
    },
    neonGlow: "neon-glow-purple",
    module: "sdr",
    items: [
      { href: "/app/prospeccao", label: "Campanhas", icon: Send, module: "prospeccao" },
      { href: "/app/sdr", label: "Visão Geral", icon: Bot, exact: true },
      { href: "/app/sdr/leads", label: "Leads SDR", icon: Target },
      { href: "/app/sdr/enriquecer", label: "Enriquecer", icon: Sparkles },
      { href: "/app/sdr/lgpd", label: "LGPD", icon: Shield },
    ],
  },
  {
    key: "operacao",
    label: "Operação",
    icon: Truck,
    color: {
      bg: "bg-indigo-700",
      text: "text-white",
      border: "border-l-indigo-700",
      hover: "hover:bg-indigo-700/10",
      activeBg: "bg-indigo-700/15",
      activeText: "text-indigo-900 dark:text-indigo-100",
    },
    neonGlow: "neon-glow-navy",
    tourId: "cat-operacao",
    module: "operacao",
    hidden: true, // ocultada do menu a pedido do dono
    items: [
      { href: "/app/operacao", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/app/operacao/shipments", label: "Remessas", icon: Truck },
      { href: "/app/operacao/routes", label: "Rotas", icon: MapPin },
      { href: "/app/operacao/drivers", label: "Motoristas", icon: UserCheck },
      { href: "/app/operacao/vehicles", label: "Veículos", icon: Car },
      { href: "/app/operacao/ocorrencias", label: "Ocorrências", icon: AlertTriangle },
    ],
  },
  {
    key: "sac",
    label: "SAC / Atendimento",
    icon: Headphones,
    color: {
      bg: "bg-emerald-500",
      text: "text-white",
      border: "border-l-emerald-500",
      hover: "hover:bg-emerald-500/10",
      activeBg: "bg-emerald-500/15",
      activeText: "text-emerald-900 dark:text-emerald-100",
    },
    neonGlow: "neon-glow-green",
    items: [
      { href: "/app/inbox", label: "Atendimento WhatsApp", icon: ListChecks, module: "inbox" },
      { href: "/app/flows", label: "Robô / Fluxos", icon: Bot, module: "flow_builder" },
      {
        href: "/app/sac",
        label: "Tickets",
        icon: Headphones,
        notifKey: "tickets_sac",
        module: "tickets_sac",
      },
      {
        href: "/app/admin/chatbot",
        label: "Chatbot",
        icon: MessageSquareWarning,
        notifKey: "chatbot_unanswered",
      },
    ],
  },
  {
    key: "cliente",
    label: "Cliente",
    icon: UserCheck,
    color: {
      bg: "bg-yellow-600",
      text: "text-white",
      border: "border-l-yellow-600",
      hover: "hover:bg-yellow-600/10",
      activeBg: "bg-yellow-600/15",
      activeText: "text-yellow-900 dark:text-yellow-100",
    },
    neonGlow: "neon-glow-yellow",
    hidden: true, // ocultada do menu a pedido do dono (portal do cliente final)
    items: [
      { href: "/app/cliente", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/app/cliente/remessas", label: "Remessas", icon: Truck, module: "cliente_remessas" },
      { href: "/app/cliente/chamados", label: "Chamados", icon: Headphones, module: "cliente_chamados" },
      { href: "/app/cliente/financeiro", label: "Financeiro", icon: Receipt, module: "cliente_financeiro" },
    ],
  },
  {
    key: "compliance",
    label: "Compliance",
    icon: Shield,
    color: {
      bg: "bg-red-600",
      text: "text-white",
      border: "border-l-red-600",
      hover: "hover:bg-red-600/10",
      activeBg: "bg-red-600/15",
      activeText: "text-red-900 dark:text-red-100",
    },
    neonGlow: "neon-glow-red",
    items: [
      { href: "/app/compliance/documentos", label: "Documentos", icon: FileCheck2 },
      { href: "/app/compliance/financeiro", label: "Financeiro", icon: Receipt },
    ],
  },
  {
    key: "conteudo",
    label: "Conteúdo",
    icon: BookText,
    color: {
      bg: "bg-amber-800",
      text: "text-white",
      border: "border-l-amber-800",
      hover: "hover:bg-amber-800/10",
      activeBg: "bg-amber-800/15",
      activeText: "text-amber-900 dark:text-amber-100",
    },
    neonGlow: "neon-glow-brown",
    module: "cms",
    items: [
      { href: "/app/cms/posts", label: "Posts", icon: Newspaper },
      { href: "/app/cms/cases", label: "Cases", icon: Briefcase },
      { href: "/app/cms/site/cards", label: "Cards do Site", icon: LayoutDashboard },
    ],
  },
  {
    key: "admin",
    label: "Admin",
    icon: Settings,
    color: {
      bg: "bg-slate-600",
      text: "text-white",
      border: "border-l-slate-600",
      hover: "hover:bg-slate-600/10",
      activeBg: "bg-slate-600/15",
      activeText: "text-slate-900 dark:text-slate-100",
    },
    neonGlow: "neon-glow-gray",
    items: [
      { href: "/app/admin/equipe", label: "Equipe", icon: Users2, tourId: "nav-equipe" },
      { href: "/app/admin/integracoes", label: "Integrações", icon: Briefcase },
      { href: "/app/admin/email", label: "Layout de e-mail", icon: Mail },
      { href: "/app/admin/forms", label: "Formulários", icon: ClipboardList },
      { href: "/app/admin/api-keys", label: "API Keys", icon: KeyRound },
      { href: "/app/admin/assinatura", label: "Assinatura de e-mail", icon: PenLine },
      { href: "/app/admin/chatbot", label: "Chatbot", icon: Bot },
      { href: "/app/admin/aparencia", label: "Aparência", icon: Palette, tourId: "nav-aparencia" },
      { href: "/app/notificacoes", label: "Notificações", icon: Bell },
      { href: "/app/ajuda", label: "Ajuda", icon: Headphones },
    ],
  },
  {
    key: "superadmin",
    label: "Super Admin",
    icon: Crown,
    color: {
      bg: "bg-red-800",
      text: "text-white",
      border: "border-l-red-800",
      hover: "hover:bg-red-800/10",
      activeBg: "bg-red-800/15",
      activeText: "text-red-950 dark:text-red-100",
    },
    neonGlow: "neon-glow-red",
    superAdminOnly: true,
    items: [
      { href: "/app/superadmin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/app/superadmin/organizacoes", label: "Organizações", icon: Building2 },
      { href: "/app/superadmin/clientes", label: "Clientes", icon: UserCheck },
      { href: "/app/superadmin/usuarios", label: "Usuários", icon: Users2 },
      { href: "/app/superadmin/permissoes", label: "Permissões", icon: Shield },
      { href: "/app/superadmin/broadcast", label: "Broadcast", icon: Megaphone },
      { href: "/app/superadmin/auditoria", label: "Auditoria", icon: FileCheck2 },
      { href: "/app/superadmin/sistema", label: "Sistema", icon: Settings },
    ],
  },
];

const COLLAPSE_STORAGE_KEY = "spotlog:sidebar:collapsed";

function useCollapsedCategories(allKeys: string[]) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
      if (raw) {
        setCollapsed(JSON.parse(raw) as Record<string, boolean>);
      } else {
        // padrão: respeita defaultOpen — colapsa o que não está marcado
        const def: Record<string, boolean> = {};
        for (const c of CATEGORIES) {
          if (!allKeys.includes(c.key)) continue;
          def[c.key] = c.defaultOpen ? false : true;
        }
        setCollapsed(def);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(key: string) {
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        window.localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return { collapsed, toggle };
}

function SidebarCategoryHeader({
  category,
  open,
  onToggle,
}: {
  category: Category;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = category.icon;
  return (
    <button
      type="button"
      onClick={onToggle}
      data-tour={category.tourId}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all",
        category.color.bg,
        category.color.text,
        category.neonGlow,
        "shadow-sm",
      )}
      aria-expanded={open}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left truncate">{category.label}</span>
      {open ? (
        <ChevronDown className="h-3.5 w-3.5 opacity-90" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 opacity-90" />
      )}
    </button>
  );
}

function SidebarItem({
  item,
  category,
  pathname,
  count,
  onNavigate,
}: {
  item: NavItem;
  category: Category;
  pathname: string;
  count: number;
  onNavigate: () => void;
}) {
  const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
  const ItemIcon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      data-tour={item.tourId}
      className={cn(
        "flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-md text-sm transition-colors border-l-4 border-transparent",
        active
          ? cn(
              category.color.border,
              category.color.activeBg,
              category.color.activeText,
              "font-medium",
            )
          : cn("text-muted-foreground", category.color.hover, "hover:text-foreground"),
      )}
    >
      <ItemIcon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      <NotificationBadge count={count} />
    </Link>
  );
}

function SidebarBody({
  pathname,
  counts,
  onNavigate,
  isSuperAdmin,
  enabledModules,
}: {
  pathname: string;
  counts: NotificationCounts;
  onNavigate: () => void;
  isSuperAdmin: boolean;
  /**
   * Módulos (Eixo A) que a org tem. undefined → fail-open (mostra tudo).
   * Estado atual (enforcement OFF): vem com todos os módulos → nada é escondido.
   */
  enabledModules?: string[];
}) {
  const visibleCategories = useMemo(() => {
    // Esconde apenas o que tem `module` setado E não está nos módulos da org.
    // Sem `module`, ou enabledModules ausente (fail-open) → sempre aparece.
    const hidden = (m?: string) =>
      !!m && Array.isArray(enabledModules) && !enabledModules.includes(m);

    return CATEGORIES.filter((c) => !c.hidden)
      .filter((c) => !c.superAdminOnly || isSuperAdmin)
      .filter((c) => !hidden(c.module))
      .map((c) => ({
        ...c,
        items: c.items.filter((i) => !hidden(i.module)),
        subGroups: c.subGroups
          ?.map((sg) => ({ ...sg, items: sg.items.filter((i) => !hidden(i.module)) }))
          .filter((sg) => sg.items.length > 0),
      }))
      // remove categorias que ficaram totalmente vazias após o filtro de itens
      .filter((c) => c.items.length > 0 || (c.subGroups?.length ?? 0) > 0);
  }, [isSuperAdmin, enabledModules]);
  const { collapsed, toggle } = useCollapsedCategories(visibleCategories.map((c) => c.key));

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-3 scrollbar-thin">
      {visibleCategories.map((cat) => {
        const open = !collapsed[cat.key];
        return (
          <div key={cat.key} className="space-y-1.5">
            <SidebarCategoryHeader
              category={cat}
              open={open}
              onToggle={() => toggle(cat.key)}
            />
            {open && (
              <div className="space-y-0.5">
                {cat.items.map((item) => (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    category={cat}
                    pathname={pathname}
                    count={item.notifKey ? counts[item.notifKey] ?? 0 : 0}
                    onNavigate={onNavigate}
                  />
                ))}
                {cat.subGroups?.map((sg) => (
                  <div key={sg.label} className="pt-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold px-3 pb-1">
                      {sg.label}
                    </div>
                    <div className="space-y-0.5">
                      {sg.items.map((item) => (
                        <SidebarItem
                          key={item.href}
                          item={item}
                          category={cat}
                          pathname={pathname}
                          count={item.notifKey ? counts[item.notifKey] ?? 0 : 0}
                          onNavigate={onNavigate}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function AppShell({
  ctx,
  initialCounts,
  logoUrl,
  logoSize,
  children,
}: {
  ctx: SessionContext;
  initialCounts?: NotificationCounts;
  /** Logo custom da org (CMS → Tema do site). Vazio = marca padrão Spotlog. */
  logoUrl?: string | null;
  logoSize?: number | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [counts, setCounts] = useState<NotificationCounts>(initialCounts ?? {});
  const pathname = usePathname();
  const isSuperAdmin = ctx.user.is_super_admin === true;

  // Polling leve a cada 60s pra manter badges atualizadas sem reload
  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const res = await fetch("/api/notifications/counts", { cache: "no-store" });
        if (!alive || !res.ok) return;
        const data = (await res.json()) as { counts?: NotificationCounts };
        if (data?.counts) setCounts(data.counts);
      } catch {
        // ignore
      }
    }
    const id = setInterval(tick, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Quando muda de rota, derruba a contagem do módulo correspondente
  useEffect(() => {
    if (!pathname) return;
    const allItems = CATEGORIES.flatMap((c) => [
      ...c.items,
      ...(c.subGroups?.flatMap((sg) => sg.items) ?? []),
    ]);
    const hit = allItems.find(
      (i) => i.notifKey && pathname.startsWith(i.href),
    );
    if (hit?.notifKey && counts[hit.notifKey]) {
      setCounts((c) => ({ ...c, [hit.notifKey!]: 0 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const totalNew = Object.values(counts).reduce<number>(
    (a, b) => a + (Number(b) || 0),
    0,
  );

  return (
    <div className="mm-admin min-h-screen bg-background">
      <aside
        className={cn(
          "mm-aside fixed inset-y-0 left-0 z-40 w-72 border-r border-border bg-card transition-transform lg:translate-x-0 flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
          <Link href="/app" className="flex items-center gap-2 font-bold min-w-0">
            {logoUrl ? (
              // Logo custom da org — altura configurável no CMS → Tema do site
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={ctx.org.name}
                style={{
                  // cabeçalho do app tem 64px de altura → teto de 56px aqui
                  height: Math.min(logoSize && logoSize > 0 ? logoSize : 32, 56),
                  width: "auto",
                  maxWidth: 200,
                  objectFit: "contain",
                }}
              />
            ) : (
              <>
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-navy-900 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-gradient-spotlog">Spotlog</span>
              </>
            )}
          </Link>
          <ThemeSwitcher compact />
        </div>

        <SidebarBody
          pathname={pathname ?? "/app"}
          counts={counts}
          onNavigate={() => setMobileOpen(false)}
          isSuperAdmin={isSuperAdmin}
          enabledModules={ctx.enabledModules}
        />

        <div className="p-3 border-t border-border shrink-0">
          <div className="rounded-lg border border-border bg-card p-3 text-xs space-y-2">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Plano {ctx.org.plan}
            </div>
            {ctx.org.trial_ends_at && (
              <div className="text-muted-foreground">
                Trial até{" "}
                {new Date(ctx.org.trial_ends_at).toLocaleDateString("pt-BR")}
              </div>
            )}
            <Button variant="default" size="sm" className="w-full mt-1" asChild>
              <Link href="/app/admin/billing">Upgrade</Link>
            </Button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-card/90 backdrop-blur-xl">
          <div className="h-full px-4 md:px-6 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contato, empresa, deal..."
                className="pl-10 rounded-full bg-muted/60 border-transparent"
              />
            </div>

            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href="/app/notificacoes" aria-label="Notificações">
                <Bell className="h-5 w-5" />
                {totalNew > 0 && (
                  <span className="absolute -top-0.5 -right-0.5">
                    <NotificationBadge count={totalNew} />
                  </span>
                )}
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-muted px-2 py-1.5 rounded-md">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={ctx.user.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-navy-900 text-white text-xs">
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
                <DropdownMenuItem asChild>
                  <Link href="/app/admin/aparencia">
                    <Palette className="h-4 w-4 mr-2" />
                    Aparência
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a
                    href="/api/auth/signout"
                    className="w-full flex items-center text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </a>
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
