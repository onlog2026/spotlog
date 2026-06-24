import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/superadmin/guard";
import { createAdminClient } from "@/lib/superadmin/admin-client";
import { ALL_MODULES, type ModuleKey } from "@/lib/permissions";

const upsertSchema = z.object({
  user_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  module: z.string(),
  can_read: z.boolean(),
  can_write: z.boolean(),
});

const presetSchema = z.object({
  user_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  preset: z.enum([
    "cliente_externo",
    "operador_sac",
    "comercial",
    "financeiro",
    "operacoes",
    "admin_completo",
  ]),
});

const PRESETS: Record<string, Array<{ module: ModuleKey; can_read: boolean; can_write: boolean }>> = {
  cliente_externo: [
    { module: "cliente_remessas", can_read: true, can_write: false },
    { module: "cliente_chamados", can_read: true, can_write: true },
    { module: "cliente_financeiro", can_read: true, can_write: false },
  ],
  operador_sac: [
    { module: "tickets_sac", can_read: true, can_write: true },
    { module: "tickets_tecnico", can_read: true, can_write: false },
    { module: "operacao", can_read: true, can_write: false },
  ],
  comercial: [
    { module: "crm", can_read: true, can_write: true },
    { module: "pipeline", can_read: true, can_write: true },
    { module: "propostas", can_read: true, can_write: true },
    { module: "prospeccao", can_read: true, can_write: true },
    { module: "cadencias", can_read: true, can_write: true },
    { module: "tickets_comercial", can_read: true, can_write: true },
  ],
  financeiro: [
    { module: "tickets_financeiro", can_read: true, can_write: true },
    { module: "cliente_financeiro", can_read: true, can_write: false },
  ],
  operacoes: [
    { module: "operacao", can_read: true, can_write: true },
    { module: "tickets_sac", can_read: true, can_write: true },
    { module: "tickets_tecnico", can_read: true, can_write: true },
  ],
  admin_completo: ALL_MODULES.filter((m) => m.key !== "superadmin").map((m) => ({
    module: m.key,
    can_read: true,
    can_write: true,
  })),
};

export async function POST(req: NextRequest) {
  const user = await requireSuperAdmin();
  const json = await req.json();
  const admin = createAdminClient();

  // Bulk preset — aplica preset cliente_externo a TODOS os users sem permissão
  // Body: { bulk: "cliente_externo_missing" }
  if (json.bulk === "cliente_externo_missing") {
    // Lista todas as memberships com role 'client' OU 'member' que não têm
    // permissões cliente_remessas registradas.
    const { data: mems } = await admin
      .from("organization_members")
      .select("user_id, organization_id, role");

    const memberships = (mems ?? []) as Array<{
      user_id: string;
      organization_id: string;
      role: string;
    }>;

    // Pega permissões existentes
    const { data: existing } = await admin
      // @ts-expect-error tabela nova
      .from("user_module_permissions")
      .select("user_id, organization_id, module");

    const existingSet = new Set(
      ((existing ?? []) as Array<{
        user_id: string;
        organization_id: string;
        module: string;
      }>).map(
        (e) => `${e.user_id}:${e.organization_id}:${e.module}`,
      ),
    );

    const preset = PRESETS.cliente_externo;
    const rows: Array<{
      user_id: string;
      organization_id: string;
      module: string;
      can_read: boolean;
      can_write: boolean;
      granted_by: string;
      granted_at: string;
    }> = [];
    const now = new Date().toISOString();

    for (const m of memberships) {
      // Aplica só pra quem AINDA não tem nenhum cliente_*
      const hasAnyCliente = preset.some((p) =>
        existingSet.has(`${m.user_id}:${m.organization_id}:${p.module}`),
      );
      if (hasAnyCliente) continue;
      for (const p of preset) {
        rows.push({
          user_id: m.user_id,
          organization_id: m.organization_id,
          module: p.module,
          can_read: p.can_read,
          can_write: p.can_write,
          granted_by: user.id,
          granted_at: now,
        });
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, applied: 0, message: "Nada a aplicar." });
    }

    const { error } = await admin
      // @ts-expect-error tabela nova
      .from("user_module_permissions")
      .upsert(rows, { onConflict: "organization_id,user_id,module" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, applied: rows.length });
  }

  // Preset?
  if ("preset" in json) {
    const parsed = presetSchema.parse(json);
    const grants = PRESETS[parsed.preset];
    if (!grants) {
      return NextResponse.json({ error: "Preset inválido." }, { status: 400 });
    }

    const rows = grants.map((g) => ({
      user_id: parsed.user_id,
      organization_id: parsed.organization_id,
      module: g.module,
      can_read: g.can_read,
      can_write: g.can_write,
      granted_by: user.id,
      granted_at: new Date().toISOString(),
    }));

    const { error } = await admin
      // @ts-expect-error tabela nova
      .from("user_module_permissions")
      .upsert(rows, { onConflict: "organization_id,user_id,module" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, applied: rows.length });
  }

  // Upsert individual
  const parsed = upsertSchema.parse(json);
  const validModule = ALL_MODULES.find((m) => m.key === parsed.module);
  if (!validModule) {
    return NextResponse.json({ error: "Módulo desconhecido." }, { status: 400 });
  }

  // Se ambos false, deleta
  if (!parsed.can_read && !parsed.can_write) {
    const { error } = await admin
      // @ts-expect-error tabela nova
      .from("user_module_permissions")
      .delete()
      .eq("user_id", parsed.user_id)
      .eq("organization_id", parsed.organization_id)
      .eq("module", parsed.module);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "removed" });
  }

  // @ts-expect-error tabela nova
  const { error } = await admin.from("user_module_permissions").upsert(
    {
      user_id: parsed.user_id,
      organization_id: parsed.organization_id,
      module: parsed.module,
      can_read: parsed.can_read,
      can_write: parsed.can_write,
      granted_by: user.id,
      granted_at: new Date().toISOString(),
    },
    { onConflict: "organization_id,user_id,module" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
