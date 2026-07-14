import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { getOrgModules } from "@/lib/entitlements";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AppShell } from "@/components/app/app-shell";
import { getNewCounts } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { ThemeProvider } from "@/components/theme-provider";
import { HelpButton } from "@/components/onboarding/help-button";
import { getAdminFavicon } from "@/lib/site-branding";

/** Sobrescreve o favicon no /app com o do PAINEL ADMIN (o site usa o dele). */
export async function generateMetadata(): Promise<Metadata> {
  const favicon = (await getAdminFavicon()) ?? "/logo-simbolo.png";
  return { icons: { icon: favicon, apple: favicon, shortcut: favicon } };
}

/**
 * Lê o logo configurado pela org (mesmo tema do site — CMS → Tema do site).
 * Fail-safe: qualquer erro → sem logo custom (mantém a marca padrão).
 */
async function getAppLogo(): Promise<{ url: string | null; size: number | null }> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_cards")
      .select("metadata")
      .eq("page", "home")
      .eq("section", "theme")
      .eq("slot", "tokens")
      .maybeSingle();
    const tokens = (data as { metadata?: { tokens?: { logoUrl?: string; logoSize?: number } } } | null)
      ?.metadata?.tokens;
    const url = tokens?.logoUrl?.trim() ? tokens.logoUrl.trim() : null;
    const size = typeof tokens?.logoSize === "number" && tokens.logoSize > 0 ? tokens.logoSize : null;
    return { url, size };
  } catch {
    return { url: null, size: null };
  }
}

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireSession();
  // Eixo A — entitlements da org (estado neutro: libera tudo). Usado pela nav.
  ctx.enabledModules = await getOrgModules(ctx.org.id);
  const [counts, appLogo] = await Promise.all([
    getNewCounts(ctx.org.id, ctx.user.id),
    getAppLogo(),
  ]);
  return (
    <ThemeProvider initialTheme={ctx.user.theme_preference ?? null}>
      <div className={jakarta.variable}>
        <AppShell
          ctx={ctx}
          initialCounts={counts}
          logoUrl={appLogo.url}
          logoSize={appLogo.size}
        >
          {children}
        </AppShell>
        <HelpButton />
      </div>
    </ThemeProvider>
  );
}
