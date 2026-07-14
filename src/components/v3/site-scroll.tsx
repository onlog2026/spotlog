"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * (1) Ao trocar de página (sem âncora #), rola pro TOPO — corrige o "cai no
 *     rodapé" ao clicar num card da home.
 * (2) Botão flutuante fixo no canto inferior-direito pra voltar ao topo:
 *     discreto, só aparece depois de rolar um pouco.
 */
export function SiteScroll() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={{
        position: "fixed",
        // Canto inferior-ESQUERDO: o direito é do chat de atendimento (FAB).
        left: 18,
        bottom: 18,
        zIndex: 40,
        width: 42,
        height: 42,
        borderRadius: "50%",
        background: "rgba(12,22,64,.5)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,.22)",
        backdropFilter: "blur(6px)",
        display: show ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        opacity: 0.6,
        transition: "opacity .2s ease",
        boxShadow: "0 6px 18px rgba(0,0,0,.28)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
