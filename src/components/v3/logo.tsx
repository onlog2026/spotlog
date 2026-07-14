export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="v3lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E11B22" />
          <stop offset="100%" stopColor="#B3141A" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.5c6 0 11 4.6 11 10.6 0 6.3-7.9 14.2-10.4 16.4-.34.3-.86.3-1.2 0C12.9 27.3 5 19.4 5 13.1 5 7.1 10 2.5 16 2.5z"
        fill="url(#v3lg)"
      />
      <circle cx="16" cy="13" r="4.6" fill="#FFF" />
      <path d="M16 10.6v4.8M13.6 13h4.8" stroke="#E11B22" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  size = "md",
  mark = true,
  logoUrl,
  logoSize,
}: {
  size?: "sm" | "md" | "lg";
  mark?: boolean;
  logoUrl?: string;
  logoSize?: number;
}) {
  const fs = size === "lg" ? 34 : size === "sm" ? 22 : 27;
  void mark;
  const src = logoUrl || "/logo-spotlog.png";
  // Tamanho configurável (px). Se não vier, mantém o comportamento antigo.
  const height =
    logoSize && logoSize > 0 ? logoSize : fs + 16;
  return (
    <div className="logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Spotlog"
        style={{ height, width: "auto", maxWidth: 320, objectFit: "contain", display: "block" }}
      />
    </div>
  );
}
