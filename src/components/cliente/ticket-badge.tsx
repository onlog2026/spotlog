"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

const POLL_MS = 30_000;

export function ClienteTicketBadge({
  scope = "tickets_cliente",
  href = "/app/cliente/chamados",
}: {
  scope?: string;
  href?: string;
}) {
  const [count, setCount] = useState<number>(0);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch(`/api/notifications/tickets?scope=${scope}`, {
          cache: "no-store",
        });
        if (!alive) return;
        const j = (await r.json()) as { count?: number };
        setCount(Math.max(0, Number(j.count ?? 0)));
      } catch {
        /* silent */
      }
    }
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [scope]);

  async function handleClick() {
    try {
      await fetch(`/api/notifications/tickets?scope=${scope}`, {
        method: "POST",
      });
    } catch {
      /* silent */
    }
    setCount(0);
    startTransition(() => {
      router.push(href);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        count > 0
          ? `${count} atualizações novas nos seus chamados. Abrir lista.`
          : "Abrir lista de chamados"
      }
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-card/50 text-[#011960] hover:bg-card transition"
    >
      <Bell className="h-4 w-4" aria-hidden />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#BA0102] text-white text-[10px] font-bold leading-[18px] text-center px-1"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
