"use client";

import Image from "next/image";
import { useState, type CSSProperties, type ReactNode } from "react";

const SCENES: Record<string, string> = {
  warehouse: "linear-gradient(135deg,#C9C0A4 0%,#8E8467 100%)",
  courier: "linear-gradient(135deg,#D6B69A 0%,#A57045 100%)",
  pharmacy: "linear-gradient(135deg,#CBD8C7 0%,#7A9788 100%)",
  boxes: "linear-gradient(135deg,#D1AB7D 0%,#8C5E2D 100%)",
  van: "linear-gradient(135deg,#E8C46A 0%,#B47E1F 100%)",
  city: "linear-gradient(135deg,#A8B0C2 0%,#5C6886 100%)",
  team: "linear-gradient(135deg,#D6CCB5 0%,#928466 100%)",
  default: "linear-gradient(135deg,#DDD3BB 0%,#BFB59C 100%)",
};

export function Photo({
  src,
  alt = "",
  scene = "default",
  style,
  className = "",
  children,
  ratio,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority,
}: {
  src?: string;
  alt?: string;
  scene?: string;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const wrapStyle: CSSProperties = {
    background: SCENES[scene] || SCENES.default,
    aspectRatio: ratio,
    ...style,
  };
  return (
    <div className={`photo ${className}`} style={wrapStyle}>
      {src && !failed && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          style={{ objectFit: "cover" }}
          unoptimized={src.endsWith(".svg") || src.includes("image.pollinations.ai")}
          onError={() => setFailed(true)}
        />
      )}
      {children}
    </div>
  );
}
