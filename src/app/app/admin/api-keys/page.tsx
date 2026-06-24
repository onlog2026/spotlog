import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ApiKeysClient } from "@/components/permissions/api-keys-client";

export const dynamic = "force-dynamic";

type ApiKeyRow = {
  id: string;
  name: string;
  token_prefix: string;
  scopes: string[];
  active: boolean | null;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
};

export default async function ApiKeysPage() {
  const { org } = await requireRole(["owner", "admin"]);
  const supabase = await createClient();

  const { data: keys } = await supabase
    .from("integration_api_keys")
    .select(
      "id, name, token_prefix, scopes, active, last_used_at, created_at, expires_at",
    )
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false });

  const list = (keys ?? []) as ApiKeyRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">API Keys</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tokens que sua plataforma de pedidos, ERP ou parceiros usam pra
          abrir tickets e enviar webhooks. Ao gerar uma key, o token é mostrado
          UMA única vez. Guarde em local seguro.
        </p>
      </div>

      <ApiKeysClient initial={list} orgName={org.name} />
    </div>
  );
}
