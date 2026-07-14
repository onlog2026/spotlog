"use client";

import { useState, useEffect, useRef } from "react";
import { Icon, unsplash } from "@/components/v3/icons";
import { Photo } from "@/components/v3/photo";
import { Logo } from "@/components/v3/logo";
import { SERVICE_TREE, serviceHref, type ServiceGroup, type Service } from "@/components/v3/services-data";
import { MENU_SEGMENTOS, MENU_SERVICOS } from "@/lib/landing-pages";

// Menus Segmentos / Serviços — MESMO mega-menu de Ecommerce/Farma (lista + figura + CTA).
const LINK_MENUS: {
  id: string;
  label: string;
  tagline: string;
  items: { label: string; href: string }[];
  accent: string;
  pillar: "ecom" | "farm";
  icon: React.ReactNode;
  figSrc: string;
  figScene: string;
  figTitle: string;
  figText: string;
  twoCol: boolean;
}[] = [
  {
    id: "segmentos", label: "Segmentos", tagline: "feito pro seu negócio",
    items: MENU_SEGMENTOS, accent: "var(--red)", pillar: "ecom",
    icon: <Icon.Box size={16} />, figScene: "boxes", figSrc: "1586528116311-ad8dd3c8310d",
    figTitle: "Feito pro seu segmento.", figText: "Operação logística sob medida pro seu tipo de negócio.",
    twoCol: true,
  },
  // "Serviços" deixou de ser dropdown próprio — seus 3 itens (MENU_SERVICOS)
  // foram realocados para dentro da aba Ecommerce do mega-menu (abaixo).
];

// Portal de rastreamento externo (Octatracking) e área do cliente (sistema Spotlog).
const RASTREAR_URL =
  "https://octatracking.com.br/prerastreio?logo=aHR0cHM6Ly9zaXN0ZW1hLnNwb3Rsb2cuY29tLmJyL2ltYWdlcy9zcG90bG9nL2xvZ29zL2xvZ282MDEtNDA2LnBuZw==";
const MINHA_CONTA_URL = "https://sistema.spotlog.com.br/";

const SIMPLE_NAV: { id: string; l: string; href?: string }[] = [
  { id:"integracoes", l:"Integrações" },
  { id:"cobertura", l:"Cobertura" },
  { id:"blog",      l:"Blog" },
];

// Ícone simples de usuário (não há User no set v3) pro botão "Minha Conta".
function UserIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const GROUP_ICON: Record<string, React.ReactNode> = {
  ecommerce: <Icon.Cart size={17}/>,
  farma: <Icon.Pill size={17}/>,
};
const GROUP_COLOR: Record<string, string> = { ecommerce: "var(--red)", farma: "var(--navy)" };

/** Último segmento do href → slug do card no CMS (ex.: /solucoes/coletas → coletas). */
const slugOf = (href: string) => href.split("/").filter(Boolean).pop() ?? "";

export function Header({ logoUrl, logoSize, megaImages, menuLabels = {} }: { logoUrl?: string; logoSize?: number; megaImages?: Record<string, string>; menuLabels?: Record<string, string> }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState<string | null>(null);    // 'ecommerce' | 'farma' | null
  const [linkMenu, setLinkMenu] = useState<string | null>(null); // 'segmentos' | 'servicos' | null
  const [mobAcc, setMobAcc] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const linkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => (e: React.MouseEvent) => {
    setOpen(false); setMega(null); setLinkMenu(null);
    const el = typeof document !== "undefined" ? document.getElementById(id) : null;
    if (el) {
      // Seção existe nesta página → rola suave (evita a navegação).
      e?.preventDefault?.();
      window.scrollTo({ top: el.offsetTop - 64, behavior: "smooth" });
    }
    // Senão (subpágina): deixa o href="/#id" navegar pra home e ancorar lá.
  };

  const enterGroup = (id: string) => { if (closeTimer.current) clearTimeout(closeTimer.current); setMega(id); };
  const leaveGroup = () => { closeTimer.current = setTimeout(() => setMega(null), 160); };

  const enterLink = (id: string) => { if (linkTimer.current) clearTimeout(linkTimer.current); setLinkMenu(id); };
  const leaveLink = () => { linkTimer.current = setTimeout(() => setLinkMenu(null), 160); };

  return (
    <header className={`header ${scrolled ? "scrolled" : ""}`}>
      <div className="shell header-row">
        <a href="/"><Logo logoUrl={logoUrl} logoSize={logoSize}/></a>

        <nav className="h-nav" style={{ display:"flex", gap: 20, marginLeft: 16, flex: 1, justifyContent:"center", alignItems:"center" }}>
          {/* Mega groups */}
          {SERVICE_TREE.map((group: ServiceGroup) => (
            <div key={group.id}
              className={`nav-group ${mega === group.id ? "open" : ""}`}
              onMouseEnter={() => enterGroup(group.id)}
              onMouseLeave={leaveGroup}>
              <button className="nav-link" aria-current={mega === group.id ? "true" : undefined}
                style={{ background:"transparent", border:"none" }}>
                {group.label}
                <span className="nav-caret"><Icon.Arrow size={11} style={{ transform:"rotate(90deg)" }}/></span>
              </button>

              <div className={`mega ${mega === group.id ? "show" : ""}`}
                onMouseEnter={() => enterGroup(group.id)}
                onMouseLeave={leaveGroup}>
                <div className="mega-grid">
                  {/* services list */}
                  <div className={`mega-pillar ${group.id === "ecommerce" ? "ecom" : "farm"}`}>
                    <div className="kicker no-rule" style={{ color: GROUP_COLOR[group.id], marginBottom: 8 }}>
                      {group.label} · {group.tagline}
                    </div>
                    {group.items.map((s: Service) => (
                      <a key={s.id} className="mega-link" href={serviceHref(s.id)}>
                        <span className="mi" style={{ background: GROUP_COLOR[group.id] }}>
                          {GROUP_ICON[group.id]}
                        </span>
                        <div>
                          <div className="mt">{menuLabels[slugOf(serviceHref(s.id))] ?? s.name}</div>
                          <div className="md">{s.buy}</div>
                        </div>
                      </a>
                    ))}
                    {/* Itens realocados do antigo menu "Serviços" — só na aba Ecommerce. */}
                    {group.id === "ecommerce" && MENU_SERVICOS.map((it) => (
                      <a key={it.href} className="mega-link" href={it.href}>
                        <span className="mi" style={{ background: GROUP_COLOR[group.id] }}>
                          {GROUP_ICON[group.id]}
                        </span>
                        <div>
                          <div className="mt">{menuLabels[slugOf(it.href)] ?? it.label}</div>
                          {it.sub && <div className="md">{it.sub}</div>}
                        </div>
                      </a>
                    ))}
                  </div>
                  {/* feature side */}
                  <div className={`mega-pillar ${group.id === "ecommerce" ? "ecom" : "farm"}`} style={{ display:"flex", flexDirection:"column", justifyContent:"space-between", overflow:"hidden" }}>
                    <div>
                      <div className="mega-figure">
                        <Photo
                          scene={group.id === "ecommerce" ? "boxes" : "pharmacy"}
                          src={megaImages?.[group.id] || unsplash(group.id === "ecommerce" ? "1607082348824-0a96f2a4b9da" : "1576091160550-2173dba999ef", 600)}
                          alt={group.label}/>
                      </div>
                      <div className="serif" style={{ fontSize: 22, lineHeight: 1.1, marginTop: 12 }}>
                        {group.id === "ecommerce" ? "Venda hoje, entregue hoje." : "Quando o produto é sensível."}
                      </div>
                      <p style={{ fontSize: 12.5, color:"var(--ink-mute)", marginTop: 8 }}>
                        {group.id === "ecommerce"
                          ? "Same Day, Next Day, fulfillment e reversa em uma só operação."
                          : "Logística farmacêutica orientada à conformidade, com SLA dedicado."}
                      </p>
                    </div>
                    <a href="/#contato" onClick={go("contato")} className="btn btn-red btn-sm" style={{ marginTop: 14, alignSelf:"flex-start" }}>
                      Diagnóstico gratuito <Icon.Arrow size={13}/>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Segmentos / Serviços — MESMO mega de Ecommerce/Farma */}
          {LINK_MENUS.map((m) => (
            <div key={m.id}
              className={`nav-group ${linkMenu === m.id ? "open" : ""}`}
              onMouseEnter={() => enterLink(m.id)}
              onMouseLeave={leaveLink}>
              <button className="nav-link" aria-current={linkMenu === m.id ? "true" : undefined}
                style={{ background:"transparent", border:"none" }}>
                {m.label}
                <span className="nav-caret"><Icon.Arrow size={11} style={{ transform:"rotate(90deg)" }}/></span>
              </button>
              <div className={`mega ${linkMenu === m.id ? "show" : ""}`}
                onMouseEnter={() => enterLink(m.id)}
                onMouseLeave={leaveLink}>
                <div className="mega-grid">
                  <div className={`mega-pillar ${m.pillar}`}>
                    <div className="kicker no-rule" style={{ color: m.accent, marginBottom: 8 }}>
                      {m.label} · {m.tagline}
                    </div>
                    <div style={m.twoCol ? { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px 6px" } : undefined}>
                      {m.items.map((it) => (
                        <a key={it.href + it.label} href={it.href} className="mega-link">
                          <span className="mi" style={{ background: m.accent }}>{m.icon}</span>
                          <div><div className="mt">{menuLabels[slugOf(it.href)] ?? it.label}</div></div>
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className={`mega-pillar ${m.pillar}`} style={{ display:"flex", flexDirection:"column", justifyContent:"space-between", overflow:"hidden" }}>
                    <div>
                      <div className="mega-figure">
                        <Photo scene={m.figScene} src={unsplash(m.figSrc, 600)} alt={m.label}/>
                      </div>
                      <div className="serif" style={{ fontSize: 22, lineHeight: 1.1, marginTop: 12 }}>
                        {m.figTitle}
                      </div>
                      <p style={{ fontSize: 12.5, color:"var(--ink-mute)", marginTop: 8 }}>
                        {m.figText}
                      </p>
                    </div>
                    <a href="/contato" className="btn btn-red btn-sm" style={{ marginTop: 14, alignSelf:"flex-start" }}>
                      Diagnóstico gratuito <Icon.Arrow size={13}/>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {SIMPLE_NAV.map(n => (
            n.href ? (
              <a key={n.id} href={n.href} target="_blank" rel="noopener noreferrer" className="nav-link">{n.l}</a>
            ) : (
              <a key={n.id} href={`/#${n.id}`} onClick={go(n.id)} className="nav-link">{n.l}</a>
            )
          ))}
        </nav>

        <div className="h-cta" style={{ display:"flex", gap: 10, alignItems:"center" }}>
          <a href={RASTREAR_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            <Icon.Search size={14}/> Rastrear
          </a>
          <a href={MINHA_CONTA_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            <UserIcon size={14}/> Minha Conta
          </a>
          <a href="/#contato" onClick={go("contato")} className="btn btn-red btn-sm">
            Diagnóstico gratuito
          </a>
        </div>

        <button className="h-burger btn btn-ghost btn-sm" aria-label="Menu" onClick={()=>setOpen(o=>!o)}>
          {open ? <Icon.Close size={16}/> : <Icon.Plus size={16}/>}
        </button>
      </div>

      {open && (
        <div className="h-mob" style={{ padding:"8px 18px 22px", background:"rgba(255,255,255,.98)", backdropFilter:"blur(10px)", borderTop:"1px solid var(--rule)", maxHeight:"calc(100vh - 74px)", overflowY:"auto" }}>
          {SERVICE_TREE.map((group: ServiceGroup) => (
            <div key={group.id}>
              <div className="mob-acc-head" onClick={()=>setMobAcc(mobAcc === group.id ? null : group.id)}>
                <span style={{ fontWeight: 600, display:"flex", alignItems:"center", gap: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 8, background: GROUP_COLOR[group.id], color:"#FFF", display:"flex", alignItems:"center", justifyContent:"center" }}>{GROUP_ICON[group.id]}</span>
                  {group.label}
                </span>
                <Icon.Plus size={15} style={{ transform: mobAcc === group.id ? "rotate(45deg)" : "none", transition:"transform .2s ease" }}/>
              </div>
              {mobAcc === group.id && (
                <div className="mob-acc-body">
                  {group.items.map((s: Service) => (
                    <a key={s.id} href={serviceHref(s.id)}>{menuLabels[slugOf(serviceHref(s.id))] ?? s.name} <span style={{ color:"var(--ink-faint)", fontSize: 12 }}>· {s.buy}</span></a>
                  ))}
                  {group.id === "ecommerce" && MENU_SERVICOS.map((it) => (
                    <a key={it.href} href={it.href}>{menuLabels[slugOf(it.href)] ?? it.label}{it.sub ? <span style={{ color:"var(--ink-faint)", fontSize: 12 }}> · {it.sub}</span> : null}</a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {LINK_MENUS.map((m) => (
            <div key={m.id}>
              <div className="mob-acc-head" onClick={()=>setMobAcc(mobAcc === m.id ? null : m.id)}>
                <span style={{ fontWeight: 600 }}>{m.label}</span>
                <Icon.Plus size={15} style={{ transform: mobAcc === m.id ? "rotate(45deg)" : "none", transition:"transform .2s ease" }}/>
              </div>
              {mobAcc === m.id && (
                <div className="mob-acc-body">
                  {m.items.map((it) => (
                    <a key={it.href + it.label} href={it.href}>{menuLabels[slugOf(it.href)] ?? it.label}</a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {SIMPLE_NAV.map(n => (
            n.href ? (
              <a key={n.id} href={n.href} target="_blank" rel="noopener noreferrer" style={{ display:"block", padding:"12px 0", borderBottom:"1px solid var(--rule)" }}>{n.l}</a>
            ) : (
              <a key={n.id} href={`/#${n.id}`} onClick={go(n.id)} style={{ display:"block", padding:"12px 0", borderBottom:"1px solid var(--rule)" }}>{n.l}</a>
            )
          ))}
          <a href={MINHA_CONTA_URL} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap: 8, padding:"12px 0", borderBottom:"1px solid var(--rule)" }}>
            <UserIcon size={15}/> Minha Conta
          </a>
          <div style={{ display:"flex", gap: 10, marginTop: 14 }}>
            <a href={RASTREAR_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ flex:1 }}>Rastrear</a>
            <a href="/#contato" onClick={go("contato")} className="btn btn-red" style={{ flex:1 }}>Diagnóstico</a>
          </div>
        </div>
      )}

      <style>{`
        .h-nav, .h-cta{ display:flex; }
        .h-burger{ display:none; margin-left:auto; }
        .h-mob{ display:block; }
        @media (max-width: 1140px){ .h-nav,.h-cta{ display:none !important; } .h-burger{ display:inline-flex !important; } }
        @media (min-width: 1141px){ .h-mob{ display:none; } }
      `}</style>
    </header>
  );
}
