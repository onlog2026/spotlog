import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { uploadToCms } from "@/lib/storage/uploads";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }
  const folder = (form.get("folder") as string) || "uploads";

  const res = await uploadToCms(file, file.name, file.type, folder);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }
  return NextResponse.json({
    url: res.url,
    path: res.path,
    contentType: res.contentType,
    size: res.size,
  });
}
