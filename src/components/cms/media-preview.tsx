"use client";

// Preview de mídia do CMS que reconhece vídeo (MP4) e imagem.
// Renderiza <video> quando a URL é um .mp4 (ou data:video/...), senão <img>.
// Usa as MESMAS classes do preview antigo, então o layout não muda.

export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.mp4(\?|#|$)/i.test(url) || url.startsWith("data:video/");
}

export function MediaPreview({
  src,
  alt = "preview",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className={className}
        muted
        loop
        playsInline
        controls
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}
