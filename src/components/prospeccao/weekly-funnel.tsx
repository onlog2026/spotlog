"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reengajarEnrollment } from "@/lib/sdr/reuniao-actions";

export type WeeklyFunnelData = {
  encontrados: number;
  emCadencia: number;
  responderam: number;
  reunioes: number;
  meta: number;
};

export type StalledItem = {
  enrollmentId: string;
  contactName: string;
  companyName: string | null;
  finishedAt: string | null;
};

export function WeeklyFunnel({
  data,
  stalled,
}: {
  data: WeeklyFunnelData;
  stalled: StalledItem[];
}) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const pctMeta = Math.min(100, Math.round((data.reunioes / data.meta) * 100));
  const steps = [
    { label: "Encontrados", value: data.encontrados },
    { label: "Em cadência", value: data.emCadencia },
    { label: "Responderam", value: data.responderam },
    { label: "Reuniões", value: data.reunioes },
  ];
  const max = Math.max(1, ...steps.map((s) => s.value));

  function reengajar(id: string) {
    setBusyId(id);
    startTransition(async () => {
      try {
        await reengajarEnrollment(id);
        toast.success("Cadência reiniciada — primeiro toque sai no próximo ciclo.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao reengajar");
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold">Funil desta semana</h2>
            <div className="text-xs text-muted-foreground">
              Meta: <strong>{data.reunioes}</strong> / {data.meta} reuniões
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              style={{ width: `${pctMeta}%` }}
            />
          </div>
          <div className="space-y-2 pt-1">
            {steps.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{s.label}</span>
                  <span className="text-muted-foreground">{s.value}</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-spotorange-500 to-spotred-600"
                    style={{ width: `${Math.round((s.value / max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-5 space-y-3">
          <div>
            <h2 className="font-semibold">Precisa de intervenção</h2>
            <p className="text-xs text-muted-foreground">
              Cadência terminou sem resposta e sem reunião. Reengaje pra
              recomeçar os toques.
            </p>
          </div>
          {stalled.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nada parado — a máquina está rodando. 👊
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {stalled.map((it) => (
                <div
                  key={it.enrollmentId}
                  className="flex items-center justify-between gap-2 rounded-md border border-white/10 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {it.contactName}
                      {it.companyName ? (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          · {it.companyName}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      cadência encerrada{" "}
                      {it.finishedAt
                        ? new Date(it.finishedAt).toLocaleDateString("pt-BR")
                        : ""}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending && busyId === it.enrollmentId}
                    onClick={() => reengajar(it.enrollmentId)}
                  >
                    {pending && busyId === it.enrollmentId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    )}
                    Reengajar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
