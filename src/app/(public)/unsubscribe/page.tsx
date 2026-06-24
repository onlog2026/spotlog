import type { Metadata } from "next";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { publicUnsubscribe } from "@/lib/sdr/lgpd";

export const metadata: Metadata = {
  title: "Cancelar inscrição | Spotlog",
  description:
    "Confirme o opt-out de comunicações da Spotlog. Conformidade LGPD garantida.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; t?: string; e?: string }>;
}) {
  const { c, t, e } = await searchParams;

  if (!c || !t) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-4 border border-white/10 rounded-xl p-8 bg-card/50">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold">Link inválido</h1>
          <p className="text-sm text-muted-foreground">
            O link de cancelamento está incompleto. Use o link original recebido
            por e-mail ou nos contate em{" "}
            <a className="underline" href="mailto:lgpd@spotlog.com.br">
              lgpd@spotlog.com.br
            </a>
            .
          </p>
        </div>
      </main>
    );
  }

  let success = false;
  let errorMessage: string | null = null;
  let resolvedEmail: string | null = null;

  try {
    const r = await publicUnsubscribe(c, t, e);
    success = true;
    resolvedEmail = r.email ?? e ?? null;
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Não foi possível processar.";
  }

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-4 border border-white/10 rounded-xl p-8 bg-card/50">
        {success ? (
          <>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-7 w-7 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold">Inscrição cancelada</h1>
            <p className="text-sm text-muted-foreground">
              {resolvedEmail ? (
                <>
                  Confirmamos o opt-out de{" "}
                  <span className="font-medium text-foreground">
                    {resolvedEmail}
                  </span>
                  . Você não receberá mais comunicações comerciais da Spotlog.
                </>
              ) : (
                <>
                  Confirmamos o seu opt-out. Você não receberá mais comunicações
                  comerciais da Spotlog.
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground pt-4 border-t border-white/10">
              Dados tratados sob a Lei Geral de Proteção de Dados (LGPD, Lei
              13.709/2018). Para mais informações, consulte nossa{" "}
              <a className="underline" href="/privacidade">
                Política de Privacidade
              </a>
              .
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold">Não foi possível processar</h1>
            <p className="text-sm text-muted-foreground">
              {errorMessage ??
                "Tente novamente ou nos escreva pra processarmos manualmente."}
            </p>
            <a
              className="inline-block text-sm underline"
              href="mailto:lgpd@spotlog.com.br"
            >
              lgpd@spotlog.com.br
            </a>
          </>
        )}
      </div>
    </main>
  );
}
