"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function saveAvailability(formData: FormData) {
  const ctx = await requireSession();
  const supabase = await createClient();
  // Apaga tudo do user nessa org, recria
  await supabase
    .from("user_availability")
    .delete()
    .eq("user_id", ctx.user.id)
    .eq("organization_id", ctx.org.id);

  const rows: Array<{
    user_id: string;
    organization_id: string;
    weekday: number;
    time_start: string;
    time_end: string;
    slot_minutes: number;
    buffer_minutes: number;
    active: boolean;
  }> = [];
  for (let wd = 0; wd <= 6; wd++) {
    const active = formData.get(`active_${wd}`) === "on";
    const start = String(formData.get(`start_${wd}`) ?? "09:00");
    const end = String(formData.get(`end_${wd}`) ?? "18:00");
    const slot = Number(formData.get(`slot_${wd}`) ?? 30);
    const buf = Number(formData.get(`buffer_${wd}`) ?? 10);
    if (!active) continue;
    if (!start || !end) continue;
    rows.push({
      user_id: ctx.user.id,
      organization_id: ctx.org.id,
      weekday: wd,
      time_start: start,
      time_end: end,
      slot_minutes: slot,
      buffer_minutes: buf,
      active: true,
    });
  }
  if (rows.length) {
    const { error } = await supabase.from("user_availability").insert(rows);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/app/agenda/configuracao");
}

export async function addBlock(formData: FormData) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const start = String(formData.get("block_start") ?? "");
  const end = String(formData.get("block_end") ?? "");
  const reason = String(formData.get("reason") ?? "") || null;
  if (!start || !end) throw new Error("Datas obrigatórias");
  const { error } = await supabase.from("availability_blocks").insert({
    user_id: ctx.user.id,
    organization_id: ctx.org.id,
    block_start: new Date(start).toISOString(),
    block_end: new Date(end).toISOString(),
    reason,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/agenda/configuracao");
}

export async function removeBlock(formData: FormData) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase
    .from("availability_blocks")
    .delete()
    .eq("id", id)
    .eq("user_id", ctx.user.id)
    .eq("organization_id", ctx.org.id);
  revalidatePath("/app/agenda/configuracao");
}
