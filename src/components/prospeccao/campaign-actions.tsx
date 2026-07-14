"use client";
import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { Radar } from "lucide-react";
import {
  excluirCampanha,
  reexecutarCampanha,
  enriquecerCampanha,
  rodarTudo,
  iniciarBuscaProfunda,
  coletarBuscaProfunda,
} from "@/lib/prospeccao/actions";

/**
 * Máquina de Leads: quando a página abre com uma raspagem em andamento,
 * este componente coleta SOZINHO (polling) e enriquece — zero clique do dono.
 */
export function AutoCollect({ id }: { id: string }) {
  const router = useRouter();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let cancelled = false;
    (async () => {
      toast.info("Raspagem do Google Maps em andamento… os leads aparecem sozinhos aqui.");
      for (let i = 0; i < 20 && !cancelled; i++) {
        await new Promise((r) => setTimeout(r, 15000));
        try {
          const c = await coletarBuscaProfunda(id);
          if (c.status === "done") {
            toast.success(
              `Máquina: +${c.added ?? 0} empresa(s) encontradas e enriquecidas (e-mail/WhatsApp/redes).`,
            );
            router.refresh();
            return;
          }
          if (c.status === "error") {
            toast.error(`Raspagem falhou: ${c.error ?? "?"}`);
            return;
          }
          if (c.status === "none") return;
        } catch {
          /* tenta de novo no próximo tick */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);
  return null;
}

/**
 * Busca profunda (Apify): dispara o run e fica conferindo até baixar os leads.
 * Async pra caber em 60s do serverless — o botão faz o polling no cliente.
 */
export function DeepSearchButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  function onClick() {
    start(async () => {
      try {
        toast.info("Busca profunda iniciada (Google Maps via Apify)… ~1-2 min.");
        await iniciarBuscaProfunda(id);
        // polling client-side: confere a cada 15s por até ~3 min
        for (let i = 0; i < 12; i++) {
          await new Promise((r) => setTimeout(r, 15000));
          const c = await coletarBuscaProfunda(id);
          if (c.status === "done") {
            toast.success(`Busca profunda: +${c.added ?? 0} empresa(s) reais adicionada(s).`);
            return;
          }
          if (c.status === "error") {
            toast.error(`Busca profunda falhou: ${c.error ?? "?"}`);
            return;
          }
          if (c.status === "none") return;
        }
        toast.info("Ainda buscando — recarregue a página em instantes pra ver os novos leads.");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falha";
        if (!/NEXT_REDIRECT/.test(msg)) toast.error(msg);
      }
    });
  }
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={pending}>
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Radar className="h-3 w-3" />}
      Busca profunda
    </Button>
  );
}

export function RunAllButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  function onClick() {
    start(async () => {
      try {
        toast.info("Rodando o time de agentes… pode levar até 1 min.");
        const r = await rodarTudo(id);
        toast.success(
          `Feito: ${r.enriched} enriquecido(s), ${r.duplicates} duplicado(s), ${r.converted} vira(ram) lead, ${r.generated} abordagem(ns) IA.`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falha";
        if (!/NEXT_REDIRECT/.test(msg)) toast.error(msg);
      }
    });
  }
  return (
    <Button variant="orange" size="sm" onClick={onClick} disabled={pending}>
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Rocket className="h-3 w-3" />
      )}
      Rodar tudo
    </Button>
  );
}

export function EnrichCampaignButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  function onClick() {
    start(async () => {
      try {
        toast.info("Enriquecendo e validando… pode levar até 1 min.");
        const r = await enriquecerCampanha(id);
        toast.success(
          `Pronto: ${r.enriched} enriquecido(s), ${r.duplicates} duplicado(s) removido(s).`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falha";
        if (!/NEXT_REDIRECT/.test(msg)) toast.error(msg);
      }
    });
  }
  return (
    <Button variant="orange" size="sm" onClick={onClick} disabled={pending}>
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      Enriquecer &amp; validar
    </Button>
  );
}

export function DeleteCampaignButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  function onClick() {
    if (
      !window.confirm(
        "Excluir essa campanha apaga todos os resultados. Confirma?",
      )
    )
      return;
    const fd = new FormData();
    fd.set("id", id);
    start(async () => {
      try {
        await excluirCampanha(fd);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falha";
        if (!/NEXT_REDIRECT/.test(msg)) toast.error(msg);
      }
    });
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={pending}
      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Trash2 className="h-3 w-3" />
      )}
      Excluir
    </Button>
  );
}

export function RerunCampaignButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  function onClick() {
    const fd = new FormData();
    fd.set("id", id);
    start(async () => {
      try {
        await reexecutarCampanha(fd);
        toast.success("Reexecução iniciada");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falha";
        if (!/NEXT_REDIRECT/.test(msg)) toast.error(msg);
      }
    });
  }
  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={pending}>
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <RefreshCw className="h-3 w-3" />
      )}
      Reexecutar
    </Button>
  );
}
