import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export type UploadResult =
  | { ok: true; url: string; path: string; contentType: string; size: number }
  | { ok: false; error: string };

function sanitize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/**
 * Faz upload pro bucket `cms` (público). Recebe um File (Web API) ou Buffer.
 */
export async function uploadToCms(
  file: File | Buffer,
  filename: string,
  contentTypeHint?: string,
  folder: string = "uploads",
): Promise<UploadResult> {
  let bytes: Buffer;
  let contentType: string;
  let size: number;

  if (Buffer.isBuffer(file)) {
    bytes = file;
    contentType = contentTypeHint ?? "application/octet-stream";
    size = bytes.byteLength;
  } else {
    const f = file as File;
    contentType = f.type || contentTypeHint || "application/octet-stream";
    size = f.size;
    if (size > MAX_BYTES) {
      return { ok: false, error: `Arquivo muito grande (máx ${MAX_BYTES / 1024 / 1024}MB).` };
    }
    if (!ALLOWED.has(contentType)) {
      return {
        ok: false,
        error: `Tipo não suportado: ${contentType}. Use JPG, PNG, WebP ou SVG.`,
      };
    }
    bytes = Buffer.from(await f.arrayBuffer());
  }

  if (size > MAX_BYTES) {
    return { ok: false, error: `Arquivo muito grande (máx ${MAX_BYTES / 1024 / 1024}MB).` };
  }

  const safe = sanitize(filename || `file-${Date.now()}`);
  const path = `${folder}/${Date.now()}-${safe}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from("cms").upload(path, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    return { ok: false, error: `Upload falhou: ${error.message}` };
  }
  const { data: pub } = supabase.storage.from("cms").getPublicUrl(path);
  return { ok: true, url: pub.publicUrl, path, contentType, size };
}
