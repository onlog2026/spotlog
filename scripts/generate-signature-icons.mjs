// Gera os ícones PNG (64x64, alta resolução p/ exibir pequeno sem borrar) usados
// na assinatura de e-mail (src/lib/email/signature.ts + imagem/route.tsx).
// Rode de novo só se quiser trocar o estilo: `node scripts/generate-signature-icons.mjs`.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const OUT_DIR = "public/icons";
const SIZE = 64;

const phoneSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 28 28">
  <path fill="#011960" d="M8.4 3.2c.6-.2 1.3 0 1.7.6l2 3c.4.6.3 1.4-.2 1.9l-1.6 1.5c1 2.1 2.7 3.8 4.8 4.8l1.5-1.6c.5-.5 1.3-.6 1.9-.2l3 2c.6.4.8 1.1.6 1.7l-.9 2.6c-.2.6-.8 1-1.4 1-8 0-14.5-6.5-14.5-14.5 0-.6.4-1.2 1-1.4l2.6-.9z"/>
</svg>`;

const whatsappSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 28 28">
  <circle cx="14" cy="14" r="14" fill="#25D366"/>
  <path fill="#ffffff" d="M14 6.4c-4.2 0-7.6 3.4-7.6 7.6 0 1.3.3 2.6 1 3.7l-1.1 3.9 4-1c1.1.6 2.4 1 3.7 1 4.2 0 7.6-3.4 7.6-7.6s-3.4-7.6-7.6-7.6zm4.4 10.8c-.2.5-1.1 1-1.5 1-.4.1-.9.1-1.4-.1-.3-.1-.8-.3-1.3-.6-2.3-1-3.8-3.3-3.9-3.5-.1-.2-.9-1.2-.9-2.3s.6-1.6.8-1.9c.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .5.4.2.5.7 1.7.7 1.8.1.1.1.3 0 .4-.1.2-.1.3-.3.4-.1.2-.3.4-.4.5-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.5 1.5.3.1.4.1.6-.1.2-.2.7-.8.9-1 .2-.3.4-.2.6-.1l1.7.8c.2.1.3.1.4.2.1.2.1.9-.1 1.3z"/>
</svg>`;

const emailSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 28 28">
  <rect x="2" y="5" width="24" height="18" rx="3" fill="none" stroke="#011960" stroke-width="2"/>
  <path fill="none" stroke="#011960" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3.5 7 14 15 24.5 7"/>
</svg>`;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const jobs = [
    ["signature-phone.png", phoneSvg],
    ["signature-whatsapp.png", whatsappSvg],
    ["signature-email.png", emailSvg],
  ];
  for (const [name, svg] of jobs) {
    await sharp(Buffer.from(svg)).png().toFile(`${OUT_DIR}/${name}`);
    console.log("gerado:", `${OUT_DIR}/${name}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
