import { requireClientSession } from "@/lib/auth-client";
import { PortalShell } from "@/components/portal/portal-shell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function countUnread(userId: string): Promise<number> {
  const supabase = await createClient();
  // @ts-expect-error rpc dinâmico
  const { data } = await supabase.rpc("portal_list_broadcasts", {
    p_user: userId,
  });
  const list = (data ?? []) as Array<{ read_at: string | null }>;
  return list.filter((b) => !b.read_at).length;
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireClientSession();
  const unread = await countUnread(ctx.user.id);
  return (
    <PortalShell ctx={ctx} unreadBroadcasts={unread}>
      {children}
    </PortalShell>
  );
}
