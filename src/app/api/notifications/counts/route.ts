import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getNewCounts } from "@/lib/notifications";

export async function GET() {
  const ctx = await requireSession();
  const counts = await getNewCounts(ctx.org.id, ctx.user.id);
  return NextResponse.json({ counts });
}
