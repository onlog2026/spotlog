import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireSession();
  return <AppShell ctx={ctx}>{children}</AppShell>;
}
