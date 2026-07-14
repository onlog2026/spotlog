"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";
import type { CardContent } from "@/components/v3/cms";
import { HeadingHL } from "@/components/v3/highlight";

/**
 * Criativos verticais 9:16 (vídeos + imagens) da campanha Spotlog.
 * Conteúdo editável no painel (page=home, section=creatives, slots item-1..5):
 * título e imagem de cada peça. Vídeo/poster ficam no código.
 */
const defaults = [
  { slot: "item-1", type: "image", src: "/creatives/spotlog-creative-1.webp", title: "Controle total da coleta à entrega", tag: "Story" },
  { slot: "item-2", type: "video", src: "/videos/spotlog-creative-2.mp4", poster: "/creatives/spotlog-creative-2.webp", title: "Tecnologia + suporte humano", tag: "Vídeo" },
  { slot: "item-3", type: "image", src: "/creatives/spotlog-creative-2.webp", title: "Sua marca em boas mãos", tag: "Story" },
  { slot: "item-4", type: "image", src: "/creatives/spotlog-creative-3.webp", title: "Logística inteligente", tag: "Foto" },
  { slot: "item-5", type: "image", src: "/creatives/spotlog-creative-4.webp", title: "Spotlog na operação", tag: "Foto" },
] as const;

export function CreativesShowcaseV3({ content }: { content?: Record<string, CardContent> }) {
  const eyebrow = content?.["eyebrow"]?.title ?? "Spotlog na rua";
  const heading =
    content?.["heading"]?.title ?? "A marca que seu cliente vê na *porta de casa.*";
  const lead =
    content?.["lead"]?.description ??
    "Frota padronizada, uniforme oficial, embalagem com sua identidade e atendimento humano. Veja como a Spotlog chega na ponta.";
  const items = defaults.map((d) => {
    const o = content?.[d.slot];
    const cmsSrc = o?.image_url || null;
    const cmsIsVideo = cmsSrc ? /\.mp4(\?|#|$)/i.test(cmsSrc) : false;
    // 100% controlado pelo CARD: o que você subir manda (imagem OU vídeo mp4).
    // Só usa o padrão do código quando o card está sem mídia. Assim TODOS os 5
    // criativos (inclusive o antigo "vídeo") são editáveis pelo CMS.
    const src = cmsSrc ?? d.src;
    const isVideo = cmsSrc ? cmsIsVideo : d.type === "video";
    // Pôster só faz sentido quando o vídeo vem do código (sem mídia no card).
    const poster =
      !cmsSrc && d.type === "video" && "poster" in d ? d.poster : undefined;
    return {
      ...d,
      title: o?.title ?? d.title,
      src,
      isVideo,
      poster,
      // Se virou imagem num slot que era vídeo, mostra "Foto" (não "Vídeo").
      tag: isVideo ? "Vídeo" : d.tag === "Vídeo" ? "Foto" : d.tag,
    };
  });

  return (
    <section
      className="py-16 lg:py-24 relative overflow-hidden"
      style={{ background: "var(--bg-2)", borderTop: "1px solid var(--rule)" }}
    >
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div className="container relative">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-navy-50 px-4 py-1.5 mb-5 border border-navy-200">
            <Sparkles className="h-3.5 w-3.5 text-navy-500" />
            <span className="text-xs font-bold text-navy-700 uppercase tracking-wider">
              {eyebrow}
            </span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold tracking-tight text-[color:var(--ink)] text-balance">
            <HeadingHL text={heading} hl="text-[color:var(--red)]" />
          </h2>
          <p className="mt-4 text-lg text-[color:var(--ink-soft)] leading-relaxed">
            {lead}
          </p>
        </div>

        <div className="-mx-4 px-4 overflow-x-auto pb-4 scrollbar-thin">
          <div className="flex gap-4 lg:gap-6 min-w-min">
            {items.map((it, i) => (
              <motion.div
                key={it.slot}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative shrink-0 w-[260px] lg:w-[288px] aspect-[9/16] rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover border-2 border-transparent hover:border-[color:var(--navy)] transition-all bg-navy-900"
              >
                {it.isVideo ? (
                  <video
                    src={it.src}
                    poster={it.poster}
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <Image
                    src={it.src}
                    alt={it.title}
                    fill
                    sizes="300px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized={typeof it.src === "string" && it.src.includes("image.pollinations.ai")}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-transparent to-transparent" />

                <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full shadow-soft">
                  {it.isVideo && <Play className="h-3 w-3 text-navy-500 fill-navy-500" />}
                  <span className="text-[10px] font-bold text-navy-900 uppercase tracking-wider">
                    {it.tag}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <div className="text-white font-bold text-sm lg:text-base leading-tight drop-shadow-md">
                    {it.title}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-[color:var(--ink-soft)]">
          Arraste para o lado para ver mais criativos →
        </div>
      </div>
    </section>
  );
}
