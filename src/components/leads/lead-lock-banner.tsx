"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserCheck, Lock, AlertTriangle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

type Member = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  avatar_url: string | null;
};

type LockInfo = {
  locked_by: string;
  locked_at: string;
  expires_at: string;
  full_name: string | null;
  avatar_url: string | null;
} | null;

type Props = {
  leadId: string;
  assignedTo: string | null;
  assignedProfile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  currentUserId: string;
  currentUserRole: string;
  members: Member[];
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min === 1) return "há 1 min";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  return `há ${h}h`;
}

export function LeadLockBanner({
  leadId,
  assignedTo,
  assignedProfile,
  currentUserId,
  currentUserRole,
  members,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lock, setLock] = useState<LockInfo>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const isAdmin = ["owner", "admin", "manager"].includes(currentUserRole);
  const isMine = assignedTo === currentUserId;
  const isUnassigned = !assignedTo;
  const otherOwner =
    assignedTo && !isMine
      ? assignedProfile?.full_name ?? assignedProfile?.email ?? "outro vendedor"
      : null;

  // Polling do lock atual
  useEffect(() => {
    let cancelled = false;
    async function fetchLock() {
      try {
        const r = await fetch(`/api/leads/${leadId}/lock`, { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (!cancelled) setLock(j.lock ?? null);
      } catch {
        // silent
      }
    }
    fetchLock();
    const t = setInterval(fetchLock, 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [leadId]);

  // Heartbeat: refresh do meu lock a cada 2min se eu sou o owner
  useEffect(() => {
    if (!isMine) return;
    let cancelled = false;
    async function refresh() {
      try {
        await fetch(`/api/leads/${leadId}/lock`, { method: "POST" });
      } catch {}
    }
    refresh();
    const t = setInterval(() => {
      if (!cancelled) refresh();
    }, 120000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [leadId, isMine]);

  // Release lock ao sair
  useEffect(() => {
    if (!isMine) return;
    function release() {
      const url = `/api/leads/${leadId}/lock`;
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, new Blob([], { type: "application/json" }));
        }
        fetch(url, { method: "DELETE", keepalive: true }).catch(() => {});
      } catch {}
    }
    window.addEventListener("beforeunload", release);
    return () => {
      window.removeEventListener("beforeunload", release);
      release();
    };
  }, [leadId, isMine]);

  async function claim() {
    startTransition(async () => {
      try {
        const r = await fetch(`/api/leads/${leadId}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error ?? "Falha ao pegar lead");
        if (j.status === "taken") {
          toast.error("Outro vendedor já pegou esse lead.");
          router.refresh();
          return;
        }
        toast.success("Lead atribuído a você!");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao pegar lead");
      }
    });
  }

  async function reassign(toUserId: string) {
    startTransition(async () => {
      try {
        const r = await fetch(`/api/leads/${leadId}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: toUserId }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error ?? "Falha ao reatribuir");
        toast.success("Lead reatribuído.");
        setPickerOpen(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao reatribuir");
      }
    });
  }

  async function requestHandoff() {
    toast.success(
      "Pedido de passagem registrado. O responsável será notificado.",
    );
    // Best-effort: cria notificação para o owner atual via endpoint genérico
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: assignedTo,
          kind: "lead_handoff_request",
          title: "Pedido de passagem de lead",
          body: "Um colega solicitou passagem deste lead.",
          link: `/app/leads/${leadId}`,
        }),
      });
    } catch {
      // silent
    }
  }

  // Mostrar lock só se for de OUTRO user (diferente do owner)
  const lockBySomeoneElse =
    lock && lock.locked_by !== currentUserId && lock.locked_by !== assignedTo;

  return (
    <div className="space-y-2">
      {isMine && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm">
          <UserCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="font-medium text-emerald-700 dark:text-emerald-300">
            Você está cuidando deste lead
          </span>
          <span className="text-xs text-emerald-700/70 dark:text-emerald-300/70 ml-auto">
            Lock ativo · expira em 5 min
          </span>
        </div>
      )}

      {!isMine && otherOwner && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border-2 px-4 py-3 text-sm"
          style={{
            borderColor: "rgba(186,1,2,0.35)",
            background: "rgba(244,196,48,0.10)",
          }}>
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#BA0102" }} />
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-6 w-6">
              {assignedProfile?.avatar_url ? (
                <AvatarImage src={assignedProfile.avatar_url} />
              ) : null}
              <AvatarFallback className="text-[10px]" style={{ background: "#011960", color: "white" }}>
                {initials(otherOwner)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium" style={{ color: "#011960" }}>
              Em atendimento por {otherOwner}
            </span>
            {lock && lock.locked_by === assignedTo ? (
              <span className="text-xs text-muted-foreground">
                · {timeAgo(lock.locked_at)}
              </span>
            ) : null}
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={requestHandoff}
              disabled={pending}
            >
              Solicitar passagem
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPickerOpen((v) => !v)}
              >
                <UserPlus className="h-3.5 w-3.5" /> Reatribuir
              </Button>
            )}
          </div>
        </div>
      )}

      {isUnassigned && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg px-4 py-3 text-sm"
          style={{
            background: "linear-gradient(90deg, rgba(1,25,96,0.08), rgba(186,1,2,0.10))",
            border: "1px solid rgba(186,1,2,0.30)",
          }}>
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#BA0102" }} />
          <span className="font-semibold" style={{ color: "#011960" }}>
            Este lead está sem responsável
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              onClick={claim}
              disabled={pending}
              style={{ background: "#BA0102", color: "white" }}
            >
              {pending ? "Pegando..." : "Pegar este lead"}
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPickerOpen((v) => !v)}
              >
                <UserPlus className="h-3.5 w-3.5" /> Atribuir a...
              </Button>
            )}
          </div>
        </div>
      )}

      {lockBySomeoneElse && (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
          <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span>
            {lock?.full_name ?? "Alguém"} está visualizando este lead agora ({timeAgo(lock!.locked_at)})
          </span>
        </div>
      )}

      {pickerOpen && isAdmin && (
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Atribuir lead para:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-auto">
            {members.map((m) => {
              const label = m.full_name ?? m.email ?? `Membro ${m.user_id.slice(0, 6)}`;
              const isCurrent = m.user_id === assignedTo;
              return (
                <button
                  key={m.user_id}
                  onClick={() => reassign(m.user_id)}
                  disabled={pending || isCurrent}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Avatar className="h-6 w-6">
                    {m.avatar_url ? <AvatarImage src={m.avatar_url} /> : null}
                    <AvatarFallback className="text-[10px]" style={{ background: "#011960", color: "white" }}>
                      {initials(label)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{label}</div>
                    <div className="text-[10px] text-muted-foreground">{m.role}</div>
                  </div>
                  {isCurrent && <span className="text-[10px] text-emerald-500">atual</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
