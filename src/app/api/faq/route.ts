import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const category = searchParams.get("category") ?? null;

  const supabase = await createClient();
  let query = supabase
    .from("faq_entries")
    .select("id, category, question, answer, keywords, helpful_count, unhelpful_count, sort")
    .eq("active", true)
    .order("category", { ascending: true })
    .order("sort", { ascending: true });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let items = data ?? [];
  if (q) {
    items = items.filter((it) => {
      const hay = (
        it.question +
        " " +
        it.answer +
        " " +
        (it.keywords ?? []).join(" ")
      ).toLowerCase();
      return hay.includes(q);
    });
  }

  return NextResponse.json({ items });
}
