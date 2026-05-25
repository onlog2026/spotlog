import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  const ctx = await requireRole(["owner", "admin", "manager"]);
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, role, joined_at, profile:profiles(full_name, email, avatar_url)")
    .eq("organization_id", ctx.org.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Equipe</h1>
        <p className="text-muted-foreground mt-1">
          Membros da {ctx.org.name}
        </p>
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-0">
          <ul className="divide-y divide-white/5">
            {(members ?? []).map((m) => {
              const mb = m as unknown as {
                user_id: string;
                role: string;
                profile: {
                  full_name: string | null;
                  email: string | null;
                  avatar_url: string | null;
                } | null;
              };
              return (
                <li
                  key={mb.user_id}
                  className="p-4 flex items-center gap-4"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={mb.profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-gradient-brand text-white text-xs">
                      {initials(mb.profile?.full_name ?? mb.profile?.email ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {mb.profile?.full_name ?? "Sem nome"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {mb.profile?.email}
                    </div>
                  </div>
                  <Badge variant="outline">{mb.role}</Badge>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
