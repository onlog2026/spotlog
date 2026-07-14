"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus, X, Users, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  converterResultadoEmLead,
  converterTodosResultados,
  descartarResultado,
  informarCnpj,
} from "@/lib/prospeccao/actions";

/**
 * "Informar CNPJ" — resultado da busca de internet não tem CNPJ; o dono cola
 * o CNPJ e o sistema puxa razão social + SÓCIOS (decisores) da Receita, grátis.
 */
export function InformarCnpjButton({ resultId }: { resultId: string }) {
  const [pending, start] = useTransition();
  function onClick() {
    const cnpj = window.prompt(
      "CNPJ da empresa (só números ou com pontuação):",
    );
    if (!cnpj) return;
    start(async () => {
      try {
        const res = await informarCnpj(resultId, cnpj);
        toast.success(
          res.socios > 0
            ? `CNPJ ok — ${res.socios} sócio(s) encontrados (decisores prováveis).`
            : "CNPJ ok — dados oficiais preenchidos (sem QSA público).",
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha");
      }
    });
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={pending}
      className="h-7 px-2 text-xs"
      title="Informar CNPJ pra descobrir os sócios (decisores)"
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <IdCard className="h-3 w-3" />
      )}
      CNPJ
    </Button>
  );
}

export function ConvertOneButton({
  resultId,
  disabled,
}: {
  resultId: string;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();
  function onClick() {
    const fd = new FormData();
    fd.set("result_id", resultId);
    start(async () => {
      try {
        await converterResultadoEmLead(fd);
        toast.success("Lead criado");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha");
      }
    });
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled || pending}
      className="h-7 px-2 text-xs"
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <UserPlus className="h-3 w-3" />
      )}
      Lead
    </Button>
  );
}

export function DiscardOneButton({ resultId }: { resultId: string }) {
  const [pending, start] = useTransition();
  function onClick() {
    const fd = new FormData();
    fd.set("result_id", resultId);
    start(async () => {
      try {
        await descartarResultado(fd);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha");
      }
    });
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={pending}
      className="h-7 px-2 text-xs text-muted-foreground"
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <X className="h-3 w-3" />
      )}
    </Button>
  );
}

export function ConvertAllButton({ campaignId }: { campaignId: string }) {
  const [pending, start] = useTransition();
  function onClick() {
    if (!window.confirm("Converter TODOS os resultados novos em leads?"))
      return;
    const fd = new FormData();
    fd.set("campaign_id", campaignId);
    start(async () => {
      try {
        await converterTodosResultados(fd);
        toast.success("Todos os resultados convertidos");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha");
      }
    });
  }
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Users className="h-3 w-3" />
      )}
      Converter todos em leads
    </Button>
  );
}
