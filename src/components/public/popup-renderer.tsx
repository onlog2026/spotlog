"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

type Popup = {
  id: string;
  trigger_type: "time" | "scroll" | "exit_intent" | "page_visit";
  trigger_value: string | null;
  title: string;
  body: string | null;
  cta_label: string | null;
  cta_url: string | null;
  cta_form_slug: string | null;
  image_url: string | null;
  hide_after_close_hours: number;
};

function dismissKey(id: string) {
  return `spotlog_popup_dismissed_${id}`;
}

function isDismissed(p: Popup): boolean {
  try {
    const until = localStorage.getItem(dismissKey(p.id));
    return !!until && Number(until) > Date.now();
  } catch {
    return false;
  }
}

function dismiss(p: Popup) {
  try {
    const hours = p.hide_after_close_hours || 24;
    localStorage.setItem(dismissKey(p.id), String(Date.now() + hours * 60 * 60 * 1000));
  } catch {
    /* localStorage indisponível — segue sem persistir */
  }
}

function track(id: string, event: "impression" | "click" | "conversion") {
  fetch(`/api/popups/${id}/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
  }).catch(() => {});
}

/**
 * Renderiza pop-ups configurados em /app/marketing/converter/popups de
 * verdade no site público. Antes disso, o construtor salvava a config
 * mas nenhum visitante via nada — feature 100% cosmética.
 */
export function PopupRenderer() {
  const pathname = usePathname();
  const [popup, setPopup] = useState<Popup | null>(null);
  const shownRef = useRef(false);

  useEffect(() => {
    shownRef.current = false;
    setPopup(null);
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const res = await fetch(`/api/popups?path=${encodeURIComponent(pathname)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { popups: Popup[] };
        const candidate = data.popups.find((p) => !isDismissed(p));
        if (!candidate || cancelled) return;

        const show = () => {
          if (shownRef.current || cancelled) return;
          shownRef.current = true;
          setPopup(candidate);
          track(candidate.id, "impression");
        };

        if (candidate.trigger_type === "page_visit") {
          show();
        } else if (candidate.trigger_type === "time") {
          const seconds = parseFloat(candidate.trigger_value ?? "5") || 5;
          const t = setTimeout(show, seconds * 1000);
          cleanup = () => clearTimeout(t);
        } else if (candidate.trigger_type === "scroll") {
          const pct = parseFloat(candidate.trigger_value ?? "50") || 50;
          const onScroll = () => {
            const doc = document.documentElement;
            const scrolled =
              (doc.scrollTop / Math.max(1, doc.scrollHeight - doc.clientHeight)) * 100;
            if (scrolled >= pct) show();
          };
          window.addEventListener("scroll", onScroll, { passive: true });
          cleanup = () => window.removeEventListener("scroll", onScroll);
        } else if (candidate.trigger_type === "exit_intent") {
          const onLeave = (e: MouseEvent) => {
            if (e.clientY <= 0) show();
          };
          document.addEventListener("mouseleave", onLeave);
          cleanup = () => document.removeEventListener("mouseleave", onLeave);
        }
      } catch {
        /* falha ao buscar pop-ups — não quebra a navegação do site */
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [pathname]);

  if (!popup) return null;

  function close() {
    if (popup) dismiss(popup);
    setPopup(null);
  }

  function onCtaClick() {
    if (!popup) return;
    track(popup.id, "click");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={close}
          aria-label="Fechar"
          className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
        {popup.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={popup.image_url}
            alt=""
            className="mb-4 h-32 w-full rounded-lg object-cover"
          />
        ) : null}
        <h3 className="text-lg font-bold text-gray-900">{popup.title}</h3>
        {popup.body ? <p className="mt-2 text-sm text-gray-600">{popup.body}</p> : null}
        {popup.cta_label ? (
          <a
            href={
              popup.cta_url ||
              (popup.cta_form_slug ? `/forms/${popup.cta_form_slug}` : "#")
            }
            onClick={onCtaClick}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[#BA0102] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#a10002]"
          >
            {popup.cta_label}
          </a>
        ) : null}
      </div>
    </div>
  );
}
