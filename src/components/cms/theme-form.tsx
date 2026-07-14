"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Palette, Type, Square, Image as ImageIcon } from "lucide-react";
import { ImageUploadField } from "./image-upload-field";
import { MediaPreview } from "./media-preview";
import {
  DEFAULT_THEME,
  THEME_FONT_OPTIONS,
  type ThemeTokens,
} from "@/components/v3/theme";

const COLOR_FIELDS: { key: keyof ThemeTokens; label: string; hint: string }[] = [
  { key: "pageBg", label: "Fundo da página", hint: "cor de fundo geral" },
  { key: "cardBg", label: "Fundo dos cards", hint: "superfícies / caixas" },
  { key: "primary", label: "Cor primária (CTA)", hint: "botões de ação" },
  { key: "primaryDark", label: "Primária escura", hint: "hover do CTA" },
  { key: "secondary", label: "Azul institucional", hint: "destaques / seções escuras" },
  { key: "secondaryDeep", label: "Azul profundo", hint: "rodapé / fundos escuros" },
  { key: "textStrong", label: "Cor dos títulos", hint: "headings" },
  { key: "textBody", label: "Cor do texto", hint: "parágrafos" },
  { key: "textMuted", label: "Cor de legendas", hint: "textos secundários" },
];

// Campo de LOGO reutilizável (admin ou site). Definido no módulo (identidade
// estável) pra não remontar e perder o foco do input a cada tecla.
function LogoField({
  field,
  label,
  value,
  onSet,
}: {
  field: "logoUrl" | "logoUrlSite";
  label: string;
  value: string;
  onSet: (field: "logoUrl" | "logoUrlSite", v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <input type="hidden" name={field} value={value} />
      {value ? (
        <MediaPreview src={value} alt="logo" className="h-12 w-auto rounded bg-neutral-900 p-2 object-contain" />
      ) : (
        <p className="text-[11px] text-muted-foreground">
          {field === "logoUrlSite"
            ? "Vazio = usa o logo do painel admin. O site é escuro: prefira letras claras."
            : "Sem logo — usando o padrão. Prefira a versão com letras claras."}
        </p>
      )}
      <ImageUploadField
        currentUrl={value || undefined}
        folder="branding"
        label="Enviar logo"
        onUploaded={(url) => onSet(field, url)}
        onClear={() => onSet(field, "")}
      />
      <Input
        value={value}
        onChange={(e) => onSet(field, e.target.value)}
        placeholder="ou cole a URL de uma imagem"
        className="h-8 text-xs font-mono"
      />
    </div>
  );
}

// Campo de FAVICON reutilizável (admin ou site).
function FaviconField({
  field,
  label,
  value,
  onSet,
}: {
  field: "faviconUrl" | "faviconUrlSite";
  label: string;
  value: string;
  onSet: (field: "faviconUrl" | "faviconUrlSite", v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <input type="hidden" name={field} value={value} />
      {value ? (
        <MediaPreview src={value} alt="favicon" className="h-10 w-10 rounded bg-neutral-900 p-1.5 object-contain" />
      ) : (
        <p className="text-[11px] text-muted-foreground">
          {field === "faviconUrlSite"
            ? "Vazio = usa o favicon do painel admin. Ideal: imagem quadrada (ex. 512×512)."
            : "Sem favicon — usando o padrão. Ideal: imagem quadrada (ex. 512×512)."}
        </p>
      )}
      <ImageUploadField
        currentUrl={value || undefined}
        folder="branding"
        label="Enviar favicon"
        onUploaded={(url) => onSet(field, url)}
        onClear={() => onSet(field, "")}
      />
      <Input
        value={value}
        onChange={(e) => onSet(field, e.target.value)}
        placeholder="ou cole a URL de uma imagem"
        className="h-8 text-xs font-mono"
      />
    </div>
  );
}

export function ThemeForm({
  initial,
  action,
}: {
  initial: ThemeTokens;
  action: (fd: FormData) => Promise<{ ok: true }>;
}) {
  const [t, setT] = useState<ThemeTokens>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof ThemeTokens, v: string | number) =>
    setT((prev) => ({ ...prev, [k]: v }));

  async function onSubmit(fd: FormData) {
    setSaving(true);
    setSaved(false);
    try {
      await action(fd);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-6 max-w-4xl">
      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" /> Cores
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COLOR_FIELDS.map((f) => (
            <div key={f.key}>
              <Label className="text-xs">
                {f.label} <span className="text-muted-foreground">· {f.hint}</span>
              </Label>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="color"
                  value={String(t[f.key])}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="h-9 w-10 rounded border border-white/10 bg-transparent p-0.5 cursor-pointer"
                />
                <Input
                  name={f.key}
                  value={String(t[f.key])}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Type className="h-4 w-4" /> Fontes e tamanho
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Fonte dos títulos</Label>
              <select
                name="headingFont"
                value={t.headingFont}
                onChange={(e) => set("headingFont", e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1"
              >
                {THEME_FONT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Fonte do corpo</Label>
              <select
                name="bodyFont"
                value={t.bodyFont}
                onChange={(e) => set("bodyFont", e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1"
              >
                {THEME_FONT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Tamanho base do texto (px)</Label>
              <Input
                name="baseFontPx"
                type="number"
                min={12}
                max={22}
                value={t.baseFontPx}
                onChange={(e) => set("baseFontPx", Number(e.target.value))}
                className="h-10 mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Square className="h-4 w-4" /> Bordas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Arredondamento das bordas (px)</Label>
              <Input
                name="radius"
                type="number"
                min={0}
                max={40}
                value={t.radius}
                onChange={(e) => set("radius", Number(e.target.value))}
                className="h-10 mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                0 = quadrado, 18 = padrão, 40 = bem redondo.
              </p>
            </div>
            <div
              className="h-16 grid place-items-center text-xs text-white"
              style={{
                background: t.secondary,
                borderRadius: `${t.radius}px`,
              }}
            >
              prévia da borda
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4" /> Marca (logo e favicon)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <p className="text-xs text-muted-foreground">
            Você pode usar logos e favicons <strong>diferentes</strong> no{" "}
            <strong>Painel Admin</strong> e no <strong>Site público (home)</strong>.
            Se deixar os campos do site em branco, ele usa os do admin.
          </p>

          {/* PAINEL ADMIN */}
          <div>
            <div className="text-sm font-semibold mb-3">🛠️ Painel Admin (/app)</div>
            <div className="grid sm:grid-cols-2 gap-6">
              <LogoField field="logoUrl" label="Logo do painel admin (cabeçalho do /app)" value={t.logoUrl ?? ""} onSet={set} />
              <FaviconField field="faviconUrl" label="Favicon do painel admin (aba do /app)" value={t.faviconUrl ?? ""} onSet={set} />
            </div>

            {/* Tamanho do logo — vale para o site E o painel */}
            <input type="hidden" name="logoSize" value={t.logoSize ?? DEFAULT_THEME.logoSize} />
            <div className="pt-4 max-w-sm">
              <Label className="text-xs flex items-center justify-between">
                <span>
                  Tamanho do logo{" "}
                  <span className="text-muted-foreground">· vale para site e painel</span>
                </span>
                <span className="text-muted-foreground">{t.logoSize ?? DEFAULT_THEME.logoSize}px</span>
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  aria-label="Diminuir logo"
                  onClick={() => set("logoSize", Math.max(20, (t.logoSize ?? DEFAULT_THEME.logoSize) - 4))}
                  className="h-8 w-8 shrink-0 rounded-md border border-input bg-background text-lg leading-none hover:bg-muted"
                >
                  −
                </button>
                <input
                  type="range"
                  min={20}
                  max={120}
                  step={2}
                  value={t.logoSize ?? DEFAULT_THEME.logoSize}
                  onChange={(e) => set("logoSize", Number(e.target.value))}
                  className="flex-1 accent-[#E11B22]"
                />
                <button
                  type="button"
                  aria-label="Aumentar logo"
                  onClick={() => set("logoSize", Math.min(120, (t.logoSize ?? DEFAULT_THEME.logoSize) + 4))}
                  className="h-8 w-8 shrink-0 rounded-md border border-input bg-background text-lg leading-none hover:bg-muted"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* SITE PÚBLICO */}
          <div className="border-t border-white/10 pt-6">
            <div className="text-sm font-semibold mb-3">🌐 Site público (home)</div>
            <div className="grid sm:grid-cols-2 gap-6">
              <LogoField field="logoUrlSite" label="Logo do site (cabeçalho da home)" value={t.logoUrlSite ?? ""} onSet={set} />
              <FaviconField field="faviconUrlSite" label="Favicon do site (aba do navegador)" value={t.faviconUrlSite ?? ""} onSet={set} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar tema"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setT(DEFAULT_THEME)}
        >
          Restaurar padrão
        </Button>
        {saved && <span className="text-sm text-emerald-500">✓ Tema salvo — confira no /nova</span>}
      </div>
    </form>
  );
}
