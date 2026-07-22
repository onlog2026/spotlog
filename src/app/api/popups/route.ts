import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Mesmo fallback usado pelo chatbot público: org fixa via env, senão a mais antiga. */
async function resolveDefaultOrgId(admin: ReturnType<typeof createAdminClient>) {
  const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID;
  if (fromEnv) return fromEnv;
  const { data } = await admin
    .from("organizations")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/**
 * Lista pop-ups ativos pra um path do site público. Sem essa rota (e o
 * componente que a consome), o construtor de pop-ups salvava config que
 * nunca aparecia pra nenhum visitante — feature 100% cosmética.
 */
export async function GET(req: NextRequest) {
  const path = new URL(req.url).searchParams.get("path") || "/";
  const admin = createAdminClient();
  const orgId = await resolveDefaultOrgId(admin);
  if (!orgId) return NextResponse.json({ popups: [] });

  const { data } = await admin
    .from("popups")
    .select(
      "id, name, trigger_type, trigger_value, title, body, cta_label, cta_url, cta_form_slug, image_url, display_on_paths, hide_after_close_hours",
    )
    .eq("organization_id", orgId)
    .eq("active", true);

  const matching = (data ?? []).filter((p: { display_on_paths: string[] }) =>
    (p.display_on_paths ?? []).some((pp) => pp === path || pp === "*"),
  );

  return NextResponse.json({ popups: matching });
}
