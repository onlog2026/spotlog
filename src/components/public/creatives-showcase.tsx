"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";

/**
 * Mostra os criativos verticais 9:16 (vídeos + imagens) da campanha Spotlog.
 * Layout estilo "feed social / stories" — usa as peças reais da marca.
 */
const items = [
  { type: "image", src: "/creatives/spotlog-creative-1.png", title: "Controle total da coleta à entrega", tag: "Story" },
  { type: "video", src: "/videos/spotlog-creative-2.mp4", poster: "/creatives/spotlog-creative-2.png", title: "Tecnologia + suporte humano", tag: "Vídeo" },
  { type: "image", src: "/creatives/spotlog-creative-2.png", title: "Sua marca em boas mãos", tag: "Story" },
  { type: "image", src: "/creatives/spotlog-creative-3.png", title: "Logística inteligente", tag: "Foto" },
  { type: "image", src: "/creatives/spotlog-creative-4.png", title: "Spotlog na operação", tag: "Foto" },
] as const;

export function CreativesShowcase() {
  return (
    <section className="py-16 lg:py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div className="container relative">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-spotorange-50 px-4 py-1.5 mb-5 border border-spotorange-200">
            <Sparkles className="h-3.5 w-3.5 text-spotorange-500" />
            <span className="text-xs font-bold text-spotorange-700 uppercase tracking-wider">
              Spotlog na rua
            </span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold tracking-tight text-navy-950 text-balance">
            A marca que seu cliente vê na <span className="text-spotorange-500">porta de casa.</span>
          </h2>
          <p className="mt-4 text-lg text-ink-600 leading-relaxed">
            Frota padronizada, uniforme oficial, embalagem com sua identidade e atendimento humano.
            Veja como a Spotlog chega na ponta.
          </p>
        </div>

        {/* Carrossel horizontal de criativos 9:16 */}
        <div className="-mx-4 px-4 overflow-x-auto pb-4 scrollbar-thin">
          <div className="flex gap-4 lg:gap-6 min-w-min">
            {items.map((it, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative shrink-0 w-[260px] lg:w-[300px] aspect-[9/16] rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover border-2 border-transparent hover:border-spotorange-500 transition-all bg-navy-900"
              >
                {it.type === "video" ? (
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
                  />
                )}

                {/* overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-transparent to-transparent" />

                {/* tag canto superior */}
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full shadow-soft">
                  {it.type === "video" && <Play className="h-3 w-3 text-spotorange-500 fill-spotorange-500" />}
                  <span className="text-[10px] font-bold text-navy-900 uppercase tracking-wider">
                    {it.tag}
                  </span>
                </div>

                {/* título base */}
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <div className="text-white font-bold text-sm lg:text-base leading-tight drop-shadow-md">
                    {it.title}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-ink-500">
          Arraste para o lado para ver mais criativos →
        </div>
      </div>
    </section>
  );
}
