"use client";
import { useEffect } from "react";

/**
 * Dispara `POST /api/notifications/seen` uma vez ao montar a page.
 * Use no topo de cada page de módulo (leads, deals, tickets, etc.) pra zerar o badge.
 */
export function MarkSeenOnMount({ module }: { module: string }) {
  useEffect(() => {
    void fetch("/api/notifications/seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module }),
    }).catch(() => {
      /* ignore */
    });
  }, [module]);
  return null;
}
