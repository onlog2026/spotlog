"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function deleteProposalTemplate(templateId: string) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("proposal_templates")
    .delete()
    .eq("id", templateId)
    .eq("organization_id", ctx.org.id);
  if (error) {
    redirect(`/app/propostas/modelos/${templateId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/app/propostas/modelos");
  redirect("/app/propostas/modelos");
}
