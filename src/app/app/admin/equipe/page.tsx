import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import { Users, Mail } from "lucide-react";
import { InviteForm } from "@/components/admin/equipe/invite-form";
import { MemberActions } from "@/components/admin/equipe/member-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-spotorange-500 text-white",
  admin: "bg-navy-900 text-white",
  manager: "bg-navy-100 text-navy-900",
  sdr: "bg-success-100 text-success-700",
  closer: "bg-blue-100 text-blue-700",
  viewer: "bg-ink-100 text-ink-700",
};

export default async function EquipePage() {
  const ctx = await requireRole(["owner", "admin", "manager"]);
  const supabase = await createClient();

  // 1) Buscar members SEM join (join falha por PostgREST schema cache stale)
  const { data: rawMembers } = await supabase
    .from("organization_members")
    .select("user_id, role, joined_at")
    .eq("organization_id", ctx.org.id)
    .order("joined_at", { ascending: true });

  const baseMembers = (rawMembers ?? []) as Array<{
    user_id: string;
    role: "owner" | "admin" | "manager" | "sdr" | "closer" | "viewer";
    joined_at: string | null;
  }>;

  let memberList: Array<{
    user_id: string;
    role: "owner" | "admin" | "manager" | "sdr" | "closer" | "viewer";
    joined_at: string | null;
    profile: { full_name: string | null; email: string | null; avatar_url: string | null } | null;
  }> = baseMembers.map((m) => ({ ...m, profile: null }));

  if (baseMembers.length > 0) {
    // 2) Buscar profiles em batch
    const ids = baseMembers.map((m) => m.user_id);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", ids);
    const profMap = new Map(
      ((profilesData ?? []) as Array<{
        id: string;
        full_name: string | null;
        email: string | null;
        avatar_url: string | null;
      }>).map((p) => [p.id, p]),
    );
    memberList = memberList.map((m) => {
      const p = profMap.get(m.user_id);
      return p
        ? { ...m, profile: { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url } }
        : m;
    });

    // 3) Fallback admin: pra qualquer member sem email no profile, busca em auth.users
    const stillMissing = memberList.filter((m) => !m.profile?.email).map((m) => m.user_id);
    if (stillMissing.length > 0) {
      try {
        const admin = createAdminClient();
        const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const byId = new Map(authUsers?.users?.map((u) => [u.id, u]) ?? []);
        memberList = memberList.map((m) => {
          if (m.profile?.email) return m;
          const au = byId.get(m.user_id);
          if (!au) return m;
          return {
            ...m,
            profile: {
              full_name: m.profile?.full_name ?? (au.user_metadata?.full_name as string | undefined) ?? null,
              email: au.email ?? null,
              avatar_url: m.profile?.avatar_url ?? null,
            },
          };
        });
      } catch (e) {
        console.warn("[equipe] auth.admin.listUsers fallback failed", e);
      }
    }
  }

  const owners = memberList.filter((m) => m.role === "owner").length;
  const admins = memberList.filter((m) => m.role === "admin").length;
  const others = memberList.length - owners - admins;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-spotorange-500/15 text-spotorange-600">
            <Users className="h-5 w-5" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Equipe</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Membros da <strong>{ctx.org.name}</strong> · {memberList.length} pessoa{memberList.length === 1 ? "" : "s"} com acesso à plataforma
        </p>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-navy-100 bg-white p-4">
          <div className="text-xs text-ink-500 uppercase tracking-wider font-bold">Owners</div>
          <div className="text-2xl font-bold text-navy-950 mt-0.5">{owners}</div>
        </div>
        <div className="rounded-2xl border border-navy-100 bg-white p-4">
          <div className="text-xs text-ink-500 uppercase tracking-wider font-bold">Admins</div>
          <div className="text-2xl font-bold text-navy-950 mt-0.5">{admins}</div>
        </div>
        <div className="rounded-2xl border border-navy-100 bg-white p-4">
          <div className="text-xs text-ink-500 uppercase tracking-wider font-bold">Outros</div>
          <div className="text-2xl font-bold text-navy-950 mt-0.5">{others}</div>
        </div>
      </div>

      {/* Form de convite */}
      <InviteForm />

      {/* Lista de membros */}
      <Card className="border-navy-100 bg-white shadow-soft">
        <CardContent className="p-0">
          <div className="px-5 py-3 border-b border-navy-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-950">Membros ativos</h3>
            <span className="text-xs text-ink-500">{memberList.length} total</span>
          </div>
          {memberList.length === 0 ? (
            <div className="p-10 text-center">
              <Mail className="h-10 w-10 mx-auto text-ink-300 mb-3" />
              <p className="text-sm text-ink-600">
                Sua organização ainda não tem membros adicionais.
              </p>
              <p className="text-xs text-ink-500 mt-1">
                Use o formulário acima pra convidar pessoas por e-mail.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-navy-100">
              {memberList.map((mb) => (
                <li key={mb.user_id} className="p-4 flex items-center gap-4 hover:bg-navy-50/40 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={mb.profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-navy-900 text-white text-xs">
                      {initials(mb.profile?.full_name ?? mb.profile?.email ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy-950 truncate">
                      {mb.profile?.full_name ?? mb.profile?.email ?? "Sem nome"}
                      {mb.user_id === ctx.user.id && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider font-bold text-spotorange-600">
                          Você
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-500 truncate flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {mb.profile?.email ?? "(sem e-mail)"}
                    </div>
                    {mb.joined_at && (
                      <div className="text-[10px] text-ink-400 mt-0.5">
                        Entrou em {new Date(mb.joined_at).toLocaleDateString("pt-BR")}
                      </div>
                    )}
                  </div>
                  <Badge className={`${ROLE_COLORS[mb.role] ?? "bg-ink-100 text-ink-700"} text-[10px] uppercase tracking-wider font-bold`}>
                    {mb.role}
                  </Badge>
                  <MemberActions
                    userId={mb.user_id}
                    currentRole={mb.role}
                    isSelf={mb.user_id === ctx.user.id}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Nota informativa sobre roles */}
      <div className="rounded-2xl bg-navy-50 border border-navy-100 p-5">
        <h4 className="text-sm font-bold text-navy-950 mb-2">O que cada role pode fazer</h4>
        <div className="grid sm:grid-cols-2 gap-2 text-xs text-ink-700">
          <div>• <strong>Owner</strong> — dono da organização, acesso total inclusive billing</div>
          <div>• <strong>Admin</strong> — gerencia tudo exceto remover owners</div>
          <div>• <strong>Manager</strong> — gestor de time/dados, edita configurações</div>
          <div>• <strong>SDR</strong> — prospecção e leads</div>
          <div>• <strong>Closer</strong> — vendas, deals e propostas</div>
          <div>• <strong>Viewer</strong> — apenas leitura</div>
        </div>
      </div>
    </div>
  );
}
