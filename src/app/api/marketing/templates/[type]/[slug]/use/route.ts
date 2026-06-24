import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  findLandingTemplate,
  findPopupTemplate,
  findWhatsappTemplate,
  findPushTemplate,
  findFormTemplate,
} from "@/lib/marketing/templates";

export const dynamic = "force-dynamic";

type TplType = "landing" | "popup" | "whatsapp" | "push" | "form";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ type: string; slug: string }> },
) {
  const { type, slug } = await ctx.params;
  const tplType = type as TplType;
  const session = await requireSession();
  const supabase = createAdminClient();
  const orgId = session.org.id;
  const suffix = Date.now().toString().slice(-4);

  try {
    if (tplType === "landing") {
      const tpl = findLandingTemplate(slug);
      if (!tpl) return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
      const newSlug = `${tpl.slug}-${suffix}`;
      const { data, error } = await supabase
        .from("landing_pages")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({
          organization_id: orgId,
          slug: newSlug,
          title: tpl.preset.title,
          description: tpl.preset.description,
          hero_image_url: tpl.preset.hero_image_url,
          body_json: tpl.preset.body_json,
          cta_label: tpl.preset.cta_label,
          cta_url: tpl.preset.cta_url,
          form_slug: tpl.preset.form_slug ?? null,
          seo_title: tpl.preset.seo_title,
          seo_description: tpl.preset.seo_description,
          status: "rascunho",
        } as never)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      const id = (data as { id: string }).id;
      return NextResponse.redirect(new URL(`/app/marketing/converter/landing/${id}`, req.url));
    }

    if (tplType === "popup") {
      const tpl = findPopupTemplate(slug);
      if (!tpl) return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
      const { error } = await supabase.from("popups").insert({
        organization_id: orgId,
        name: `${tpl.preset.name} (${suffix})`,
        title: tpl.preset.title,
        body: tpl.preset.body,
        cta_label: tpl.preset.cta_label,
        cta_url: tpl.preset.cta_url,
        cta_form_slug: tpl.preset.cta_form_slug ?? null,
        trigger_type: tpl.preset.trigger_type,
        trigger_value: tpl.preset.trigger_value,
        display_on_paths: tpl.preset.display_on_paths,
        active: false,
      } as never);
      if (error) throw new Error(error.message);
      return NextResponse.redirect(new URL(`/app/marketing/converter/popups`, req.url));
    }

    if (tplType === "whatsapp") {
      const tpl = findWhatsappTemplate(slug);
      if (!tpl) return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
      const { error } = await supabase.from("whatsapp_buttons").insert({
        organization_id: orgId,
        name: `${tpl.preset.name} (${suffix})`,
        phone: tpl.preset.phone,
        default_message: tpl.preset.default_message,
        position: tpl.preset.position,
        show_on_paths: tpl.preset.show_on_paths,
        active: false,
      } as never);
      if (error) throw new Error(error.message);
      return NextResponse.redirect(new URL(`/app/marketing/converter/whatsapp`, req.url));
    }

    if (tplType === "push") {
      const tpl = findPushTemplate(slug);
      if (!tpl) return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
      const { error } = await supabase.from("web_push_campaigns").insert({
        organization_id: orgId,
        title: tpl.preset.title,
        body: tpl.preset.body,
        icon_url: tpl.preset.icon_url ?? null,
        url: tpl.preset.url ?? null,
      } as never);
      if (error) throw new Error(error.message);
      return NextResponse.redirect(new URL(`/app/marketing/converter/push`, req.url));
    }

    if (tplType === "form") {
      const tpl = findFormTemplate(slug);
      if (!tpl) return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
      const newSlug = `${tpl.preset.slug}-${suffix}`;
      const { data: defRow, error: defErr } = await supabase
        .from("form_definitions")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({
          organization_id: orgId,
          slug: newSlug,
          title: tpl.preset.title,
          description: tpl.preset.description,
          submit_label: tpl.preset.submit_label,
          success_title: tpl.preset.success_title,
          success_message: tpl.preset.success_message,
          lead_source: "site",
          lead_source_detail: tpl.preset.lead_source_detail,
          active: true,
        } as never)
        .select("id")
        .single();
      if (defErr) throw new Error(defErr.message);
      const formId = (defRow as { id: string }).id;

      const fieldRows = tpl.preset.fields.map((f, idx) => ({
        form_id: formId,
        field_key: f.field_key,
        type: f.type,
        label: f.label,
        placeholder: f.placeholder ?? null,
        required: f.required ?? false,
        width: f.width ?? "full",
        sort: idx + 1,
        options: f.options ?? [],
        maps_to_lead: f.maps_to_lead ?? null,
      }));
      if (fieldRows.length > 0) {
        const { error: fErr } = await supabase.from("form_fields").insert(fieldRows as never);
        if (fErr) throw new Error(fErr.message);
      }
      return NextResponse.redirect(new URL(`/app/admin/forms`, req.url));
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro inesperado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
