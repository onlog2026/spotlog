import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> },
) {
  const { linkId } = await params;
  const supabase = createAdminClient();

  const { data: link } = await supabase
    .from("link_in_bio_links")
    .select("id, url, clicks")
    .eq("id", linkId)
    .maybeSingle();

  if (!link) {
    return NextResponse.redirect(new URL("/", _req.url));
  }

  await supabase
    .from("link_in_bio_links")
    .update({ clicks: (Number((link as { clicks: number }).clicks) || 0) + 1 })
    .eq("id", linkId);

  return NextResponse.redirect((link as { url: string }).url);
}
