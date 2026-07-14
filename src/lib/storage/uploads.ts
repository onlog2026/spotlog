import "server-only";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);
const VIDEO_TYPES = new Set(["video/mp4"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB (vídeo MP4)

// Compressão automática pra fotos (jpeg/png) grandes — converte pra WebP,
// mantendo o Content-Type correto (o navegador decodifica pelo header, não
// pela extensão do arquivo, então a URL/nome final não muda).
const COMPRESSIBLE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);
const COMPRESS_THRESHOLD_BYTES = 250 * 1024;
const COMPRESS_MAX_WIDTH = 1600;

async function compressIfNeeded(
  bytes: Buffer,
  contentType: string,
): Promise<{ bytes: Buffer; contentType: string }> {
  if (!COMPRESSIBLE_TYPES.has(contentType) || bytes.byteLength < COMPRESS_THRESHOLD_BYTES) {
    return { bytes, contentType };
  }
  try {
    const meta = await sharp(bytes).metadata();
    let pipeline = sharp(bytes);
    if (meta.width && meta.width > COMPRESS_MAX_WIDTH) {
      pipeline = pipeline.resize({ width: COMPRESS_MAX_WIDTH, withoutEnlargement: true });
    }
    const out = await pipeline.webp({ quality: 78 }).toBuffer();
    if (out.byteLength < bytes.byteLength) {
      return { bytes: out, contentType: "image/webp" };
    }
    return { bytes, contentType };
  } catch {
    return { bytes, contentType };
  }
}

function maxBytesFor(contentType: string): number {
  return VIDEO_TYPES.has(contentType) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

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
    if (!IMAGE_TYPES.has(contentType) && !VIDEO_TYPES.has(contentType)) {
      return {
        ok: false,
        error: `Tipo não suportado: ${contentType}. Use JPG, PNG, WebP, SVG ou MP4.`,
      };
    }
    if (size > maxBytesFor(contentType)) {
      return { ok: false, error: `Arquivo muito grande (máx ${maxBytesFor(contentType) / 1024 / 1024}MB).` };
    }
    bytes = Buffer.from(await f.arrayBuffer());
  }

  if (size > maxBytesFor(contentType)) {
    return { ok: false, error: `Arquivo muito grande (máx ${maxBytesFor(contentType) / 1024 / 1024}MB).` };
  }

  const compressed = await compressIfNeeded(bytes, contentType);
  bytes = compressed.bytes;
  contentType = compressed.contentType;
  size = bytes.byteLength;

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
