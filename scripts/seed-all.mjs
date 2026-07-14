// Semeia TODAS as seções da landing v3 no site_cards (page=home).
// Lê scripts/seed-data/*.json (gerados pelos agentes) e faz upsert.
// Run: node scripts/seed-all.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, "")];
    }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const dir = "scripts/seed-data";
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

let total = 0;
let okTotal = 0;
for (const f of files) {
  const rows = JSON.parse(readFileSync(join(dir, f), "utf-8"));
  let ok = 0;
  for (const r of rows) {
    const payload = {
      page: "home",
      section: r.section,
      slot: r.slot,
      title: r.title ?? null,
      description: r.description ?? null,
      image_url: r.image_url ?? null,
      cta_label: r.cta_label ?? null,
      cta_url: r.cta_url ?? null,
      active: r.active ?? true,
      sort: r.sort ?? 0,
      metadata: r.metadata ?? {},
    };
    const { error } = await admin
      .from("site_cards")
      .upsert(payload, { onConflict: "page,section,slot" });
    if (error) console.error(`  ✗ ${r.section}/${r.slot}:`, error.message);
    else ok++;
  }
  total += rows.length;
  okTotal += ok;
  console.log(`  ${f}: ${ok}/${rows.length}`);
}
console.log(`\nTOTAL: ${okTotal}/${total} cards semeados.`);
