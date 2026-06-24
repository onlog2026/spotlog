"use client";
import { cn } from "@/lib/utils";
import { useId } from "react";

/**
 * Logo oficial Spotlog
 *  Light theme (fundo claro):
 *    - S esquerda: azul #011960
 *    - S direita:  vermelho #BA0102
 *    - SPOT em azul, LOG em vermelho
 *
 *  Dark theme (fundo escuro):
 *    - S esquerda: BRANCO  (contraste com azul de fundo)
 *    - S direita:  vermelho mais claro #e23a3a
 *    - SPOT em branco, LOG em vermelho claro
 *
 *  animated (default true): aplica um shimmer/luz que percorre o mark
 *  a cada ciclo. Apenas afeta variantes que mostram o mark (full/stacked/mark).
 */
export function SpotlogLogo({
  variant = "full",
  light = false,
  animated = true,
  className,
}: {
  variant?: "full" | "stacked" | "mark" | "wordmark";
  light?: boolean;
  animated?: boolean;
  className?: string;
}) {
  // Cores do "S" — adaptam ao fundo
  const leftStroke = light ? "#ffffff" : "#011960";
  const rightStroke = light ? "#ff3a3a" : "#ba0102";
  const dashLeft = light ? "#011960" : "#ffffff";
  const dashRight = light ? "#ffffff" : "#ffffff";

  // IDs únicos para defs SVG (evita colisão quando vários logos coexistem)
  const uid = useId().replace(/:/g, "");
  const maskId = `spotlog-mask-${uid}`;
  const gradId = `spotlog-shimmer-grad-${uid}`;

  const Mark = (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <defs>
        {/* Gradiente do brilho — linha branca semi-transparente diagonal */}
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Máscara: o shimmer só aparece DENTRO dos paths do logo */}
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <path
            d="M 78 12 C 60 10, 32 12, 22 28 C 12 42, 24 54, 44 54 L 54 54 L 54 38 L 44 38 C 38 38, 36 32, 40 28 C 46 22, 64 22, 78 26 Z"
            fill="white"
          />
          <path
            d="M 22 88 C 40 90, 68 88, 78 72 C 88 58, 76 46, 56 46 L 46 46 L 46 62 L 56 62 C 62 62, 64 68, 60 72 C 54 78, 36 78, 22 74 Z"
            fill="white"
          />
        </mask>
      </defs>

      {/* Metade superior do "S" */}
      <path
        d="M 78 12 C 60 10, 32 12, 22 28 C 12 42, 24 54, 44 54 L 54 54 L 54 38 L 44 38 C 38 38, 36 32, 40 28 C 46 22, 64 22, 78 26 Z"
        fill={leftStroke}
      />
      <path
        d="M 72 18 C 56 17, 36 20, 30 30"
        stroke={dashLeft}
        strokeWidth="2.2"
        strokeDasharray="3.5 3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Metade inferior do "S" */}
      <path
        d="M 22 88 C 40 90, 68 88, 78 72 C 88 58, 76 46, 56 46 L 46 46 L 46 62 L 56 62 C 62 62, 64 68, 60 72 C 54 78, 36 78, 22 74 Z"
        fill={rightStroke}
      />
      <path
        d="M 28 82 C 44 83, 64 80, 70 70"
        stroke={dashRight}
        strokeWidth="2.2"
        strokeDasharray="3.5 3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Camada de brilho — só renderiza se animated=true */}
      {animated && (
        <g mask={`url(#${maskId})`} style={{ pointerEvents: "none" }}>
          <rect
            x="-100"
            y="0"
            width="80"
            height="100"
            fill={`url(#${gradId})`}
            className="spotlog-shimmer-rect"
            transform="rotate(20 50 50)"
          />
        </g>
      )}
    </svg>
  );

  if (variant === "mark") {
    return <div className={cn("aspect-square", className)}>{Mark}</div>;
  }

  // Tipografia adaptada
  const textColor = light ? "text-white" : "text-navy-900";
  const redText = light ? "text-[#ff3a3a]" : "text-spotorange-500";
  const taglineColor = light ? "text-white/70" : "text-ink-500";

  if (variant === "wordmark") {
    return (
      <span className={cn("font-black tracking-tight text-2xl", className)}>
        <span className={textColor}>SPOT</span>
        <span className={redText}>LOG</span>
      </span>
    );
  }

  if (variant === "stacked") {
    return (
      <div className={cn("inline-flex flex-col items-center gap-1.5", className)}>
        <div className="h-14 w-14">{Mark}</div>
        <span className="font-black tracking-tight text-xl leading-none">
          <span className={textColor}>SPOT</span>
          <span className={redText}>LOG</span>
        </span>
        <span className={cn("text-[9px] font-bold uppercase tracking-[0.18em]", taglineColor)}>
          Logística inteligente
        </span>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div className="h-11 w-11 shrink-0">{Mark}</div>
      <div className="flex flex-col leading-none">
        <span className="font-black tracking-tight text-xl">
          <span className={textColor}>SPOT</span>
          <span className={redText}>LOG</span>
        </span>
        <span className={cn("text-[9px] font-bold uppercase tracking-[0.18em] mt-0.5", taglineColor)}>
          Logística inteligente
        </span>
      </div>
    </div>
  );
}
