require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const sharp = require("sharp");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const BUCKET = "cms";
const THRESHOLD_BYTES = 250 * 1024; // recomprime tudo acima de 250KB
const MAX_WIDTH = 1600;

async function processFolder(folder) {
  const { data: files, error } = await supabase.storage
    .from(BUCKET)
    .list(folder, { limit: 500 });
  if (error) {
    console.error(`Erro listando ${folder}:`, error.message);
    return;
  }

  for (const file of files) {
    const mime = file.metadata?.mimetype || "";
    const size = file.metadata?.size || 0;
    if (!mime.startsWith("image/")) continue; // pula vídeos
    if (mime === "image/svg+xml") continue; // svg não precisa
    if (size < THRESHOLD_BYTES) continue; // já está ok

    const path = `${folder}/${file.name}`;
    try {
      const { data: blob, error: dlErr } = await supabase.storage
        .from(BUCKET)
        .download(path);
      if (dlErr || !blob) {
        console.log(`  ${path} — ERRO download: ${dlErr?.message}`);
        continue;
      }
      const buffer = Buffer.from(await blob.arrayBuffer());

      const meta = await sharp(buffer).metadata();
      let pipeline = sharp(buffer);
      if (meta.width && meta.width > MAX_WIDTH) {
        pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
      }
      const outBuffer = await pipeline.webp({ quality: 78 }).toBuffer();

      if (outBuffer.length >= buffer.length) {
        console.log(`  ${path} — já otimizado, pulando (${(buffer.length/1024).toFixed(0)}KB)`);
        continue;
      }

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .update(path, outBuffer, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: true,
        });
      if (upErr) {
        console.log(`  ${path} — ERRO upload: ${upErr.message}`);
        continue;
      }
      console.log(
        `  ${path} — ${(buffer.length / 1024).toFixed(0)}KB -> ${(outBuffer.length / 1024).toFixed(0)}KB`,
      );
    } catch (e) {
      console.log(`  ${path} — EXCEPTION: ${e.message}`);
    }
  }
}

(async () => {
  for (const folder of ["cards", "branding"]) {
    console.log(`\n=== ${folder} ===`);
    await processFolder(folder);
  }
  console.log("\nConcluído.");
})();
