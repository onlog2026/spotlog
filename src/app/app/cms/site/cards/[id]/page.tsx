import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SiteCardForm, type SiteCardInitial } from "@/components/cms/site-card-form";
import { atualizarCard, excluirCard } from "../actions";

export default async function EditarCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_cards")
    .select(
      "id, page, section, slot, title, description, image_url, cta_label, cta_url, active, sort, metadata",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const raw = data as SiteCardInitial & {
    metadata?: { image_url_mobile?: string | null; style?: SiteCardInitial["style"] };
  };
  const row: SiteCardInitial = {
    ...raw,
    image_url_mobile: raw.metadata?.image_url_mobile ?? null,
    style: raw.metadata?.style ?? null,
  };

  async function update(fd: FormData) {
    "use server";
    await atualizarCard(id, fd);
  }
  async function remove() {
    "use server";
    await excluirCard(id);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Editar card</h2>
        <p className="text-sm text-muted-foreground">
          {row.page} / {row.section} / {row.slot}
        </p>
      </div>
      <SiteCardForm initial={row} action={update} excluirAction={remove} submitLabel="Salvar alterações" />
    </div>
  );
}
