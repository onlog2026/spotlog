// Converte as imagens do CMS (Supabase Storage, bucket "cms") de PNG/JPG pra
// WebP, sobe o novo arquivo no mesmo bucket e imprime um JSON com o mapa
// { url_antiga: url_nova } -- pra depois atualizar site_cards via SQL.
// Não apaga nem sobrescreve o arquivo original.
import { readFileSync } from "node:fs";
import sharp from "sharp";

function loadEnv(path) {
  const text = readFileSync(path, "utf-8");
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv(new URL("../.env.local", import.meta.url));
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltando NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em .env.local");
  process.exit(1);
}

const urls = [
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1782911424316-ChatGPT-Image-1-de-jul.-de-2026-10_09_52.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1782783284619-Gemini_Generated_Image_723z5x723z5x723z.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783371937730-spotlog-octagog.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783435403813-pomelli_creative_image_9_16_0706-4-.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783435518561-pomelli_creative_image_9_16_0706-3-.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783346629529-pomelli_creative_image_9_16_0706-2-.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783372105972-pomelli_creative_image_9_16_0706-6-.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783371202686-pomelli_creative_image_9_16_0706-4-.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783440266951-spotlog-cd.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1782740591792-ChatGPT-Image-29-de-jun.-de-2026-10_29_27.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1782912573264-farma.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783443043906-market-place.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1782745498758-sameday.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1782746230321-sameday-entregaexpressa-e-tecnologia.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783006316559-fullfimetn-spotlog.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783017286915-coletas-programdas.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783025394679-cosmeticos.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783098414255-cd-spotlog.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783100516682-logistica-especializada.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783026199060-moda-spotlog.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1782930428069-entregas-motobly-sportlog.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783099613781-logistica-reversa-2.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1782745426202-sameday.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783023256548-Operacao-sob-demanda.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783207546306-aereo-spot-log.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1782950799965-Gemini_Generated_Image_mitrgamitrgamitr.png",
  "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/cards/1783376943264-spotlog-octagog.png",
];

const BUCKET = "cms";

function storagePathFromUrl(url) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return decodeURIComponent(url.slice(idx + marker.length));
}

async function main() {
  const mapping = [];
  let okCount = 0;
  let beforeTotal = 0;
  let afterTotal = 0;

  for (const url of urls) {
    const path = storagePathFromUrl(url);
    const newPath = path.replace(/\.(png|jpg|jpeg)$/i, ".webp");
    if (newPath === path) {
      console.error("SKIP (extensão não reconhecida):", path);
      continue;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`download ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const webpBuf = await sharp(buf).webp({ quality: 82 }).toBuffer();

      const uploadRes = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURI(newPath)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SERVICE_KEY}`,
            apikey: SERVICE_KEY,
            "Content-Type": "image/webp",
            "x-upsert": "true",
          },
          body: webpBuf,
        },
      );
      if (!uploadRes.ok) {
        const t = await uploadRes.text();
        throw new Error(`upload ${uploadRes.status}: ${t}`);
      }
      const newUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${newPath}`;
      mapping.push({ old: url, new: newUrl, beforeBytes: buf.length, afterBytes: webpBuf.length });
      beforeTotal += buf.length;
      afterTotal += webpBuf.length;
      okCount++;
      console.error(`OK  ${path}  ${buf.length}B -> ${webpBuf.length}B`);
    } catch (err) {
      console.error("FALHOU:", path, String(err));
    }
  }

  console.error(`\n${okCount}/${urls.length} convertidas. Total antes: ${beforeTotal}B, depois: ${afterTotal}B (${Math.round((1 - afterTotal / beforeTotal) * 100)}% menor)`);
  console.log(JSON.stringify(mapping, null, 2));
}

main();
