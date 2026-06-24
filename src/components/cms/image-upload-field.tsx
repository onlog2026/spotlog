"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Trash2 } from "lucide-react";

export function ImageUploadField({
  currentUrl,
  onUploaded,
  onClear,
  folder = "uploads",
  label = "Enviar imagem",
}: {
  currentUrl?: string;
  onUploaded: (url: string) => void;
  onClear?: () => void;
  folder?: string;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/cms/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error || "Upload falhou.");
        return;
      }
      onUploaded(json.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro de rede.");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => ref.current?.click()}
          disabled={busy}
          size="sm"
        >
          {busy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {label}
            </>
          )}
        </Button>
        {currentUrl && onClear ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Remover
          </Button>
        ) : null}
      </div>
      {err ? <p className="text-xs text-red-500">{err}</p> : null}
      <p className="text-[11px] text-muted-foreground">
        JPG, PNG, WebP ou SVG. Máx 5MB.
      </p>
    </div>
  );
}
