import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ThemeForm } from "@/components/cms/theme-form";
import { mergeTheme, type ThemeTokens } from "@/components/v3/theme";
import { salvarTema } from "./actions";

export default async function TemaPage() {
  await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_cards")
    .select("metadata")
    .eq("page", "home")
    .eq("section", "theme")
    .eq("slot", "tokens")
    .maybeSingle();

  const saved = (data as { metadata?: { tokens?: Partial<ThemeTokens> } } | null)?.metadata?.tokens;
  const initial = mergeTheme(saved);

  async function action(fd: FormData) {
    "use server";
    return salvarTema(fd);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Tema do site</h2>
        <p className="text-sm text-muted-foreground">
          Controle global de cores, fontes, tamanho e bordas. Ao salvar, muda no
          site novo (<code>/nova</code>). Vale para todas as seções v3.
        </p>
      </div>
      <ThemeForm initial={initial} action={action} />
    </div>
  );
}
