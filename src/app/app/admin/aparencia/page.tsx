import { requireSession } from "@/lib/auth";
import { AparenciaClient } from "./aparencia-client";

export const metadata = {
  title: "Aparência — Spotlog",
};

export default async function AparenciaPage() {
  const ctx = await requireSession();
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Aparência
        </h1>
        <p className="text-sm text-muted-foreground">
          Escolha o tema visual do painel Spotlog. A escolha é salva no seu
          navegador e aplicada imediatamente.
        </p>
      </header>

      <AparenciaClient
        initialTheme={ctx.user.theme_preference ?? null}
      />
    </div>
  );
}
