import { requireSuperAdmin } from "@/lib/superadmin/guard";
import { SuperAdminShell } from "@/components/superadmin/superadmin-shell";

export const metadata = {
  title: "Super Admin — Spotlog",
  robots: { index: false, follow: false },
};

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSuperAdmin();
  return <SuperAdminShell email={user.email}>{children}</SuperAdminShell>;
}
