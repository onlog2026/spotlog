import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type ImageStyle =
  | "hiperrealista"
  | "explicativa"
  | "persuasiva"
  | "blog"
  | "minimalista"
  | "corporativa";

const STYLE_MODIFIERS: Record<ImageStyle, string> = {
  hiperrealista:
    "photorealistic, 8k, ultra detailed, professional photography, natural lighting, sharp focus",
  explicativa:
    "infographic, flat illustration, clean lines, modern vector style, soft colors",
  persuasiva:
    "cinematic, dramatic lighting, emotional mood, high contrast, vibrant",
  blog:
    "magazine editorial photography, warm tones, lifestyle, candid, depth of field",
  minimalista:
    "minimalist, white background, simple, geometric, modern, clean composition",
  corporativa:
    "corporate photography, business setting, professional, clean, polished",
};

/**
 * Constrói uma URL Pollinations.ai (free, sem auth) que retorna PNG direto.
 */
export function generateImageUrl(
  prompt: string,
  style: ImageStyle = "hiperrealista",
  width = 1200,
  height = 630,
): string {
  const modifier = STYLE_MODIFIERS[style] ?? STYLE_MODIFIERS.hiperrealista;
  const fullPrompt = `${prompt}, ${modifier}`;
  const encoded = encodeURIComponent(fullPrompt);
  // Modelo flux é o melhor gratuito; seed estável p/ idempotência leve
  const seed = Math.abs(hashCode(fullPrompt)) % 100000;
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&model=flux&seed=${seed}`;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

/**
 * Gera imagem via Pollinations e faz upload para o bucket cms.
 * Retorna URL pública permanente do Supabase Storage.
 *
 * Se algo falhar no upload, retorna a URL Pollinations direta (também funciona,
 * só que dependendo da disponibilidade da Pollinations).
 */
export async function generateImageAndUpload(
  prompt: string,
  style: ImageStyle = "hiperrealista",
  opts: { width?: number; height?: number; filenamePrefix?: string } = {},
): Promise<{ url: string; source: "supabase" | "pollinations"; prompt: string }> {
  const { width = 1200, height = 630, filenamePrefix = "ia" } = opts;
  const pollUrl = generateImageUrl(prompt, style, width, height);

  try {
    const res = await fetch(pollUrl, {
      // Pollinations pode demorar 5-20s
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      console.warn("[image-generator] pollinations não ok", res.status);
      return { url: pollUrl, source: "pollinations", prompt };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = "png";
    const filename = `generated/${filenamePrefix}-${Date.now()}.${ext}`;
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from("cms")
      .upload(filename, buf, {
        contentType: "image/png",
        cacheControl: "31536000",
        upsert: false,
      });
    if (error) {
      console.warn("[image-generator] upload falhou", error.message);
      return { url: pollUrl, source: "pollinations", prompt };
    }
    const { data: pub } = supabase.storage.from("cms").getPublicUrl(filename);
    return { url: pub.publicUrl, source: "supabase", prompt };
  } catch (err) {
    console.warn("[image-generator] erro generate+upload", err);
    return { url: pollUrl, source: "pollinations", prompt };
  }
}
