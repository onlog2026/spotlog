import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";
import { getNewCounts } from "@/lib/notifications";
import { ThemeProvider } from "@/components/theme-provider";
import { HelpButton } from "@/components/onboarding/help-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireSession();
  const counts = await getNewCounts(ctx.org.id, ctx.user.id);
  return (
    <ThemeProvider initialTheme={ctx.user.theme_preference ?? null}>
      <AppShell ctx={ctx} initialCounts={counts}>
        {children}
      </AppShell>
      <HelpButton />
    </ThemeProvider>
  );
}
