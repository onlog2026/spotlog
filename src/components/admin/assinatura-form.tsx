"use client";

import { useMemo, useRef, useState } from "react";
import { Copy, Download, MousePointerClick, Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/cms/image-upload-field";
import { renderSignatureHtml } from "@/lib/email/signature";

const SCALE_STEP = 0.1;
const SCALE_MIN = 0.6;
const SCALE_MAX = 1.5;

function ScaleControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const dec = () => onChange(Math.max(SCALE_MIN, Math.round((value - SCALE_STEP) * 10) / 10));
  const inc = () => onChange(Math.min(SCALE_MAX, Math.round((value + SCALE_STEP) * 10) / 10));
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="mb-0">{label}</Label>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={dec}
          disabled={value <= SCALE_MIN}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-11 text-center text-xs tabular-nums text-muted-foreground">
          {Math.round(value * 100)}%
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={inc}
          disabled={value >= SCALE_MAX}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function AssinaturaForm() {
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [logoScale, setLogoScale] = useState(1);
  const [fontScale, setFontScale] = useState(1);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const signatureHtml = useMemo(
    () =>
      renderSignatureHtml(
        { nome: nome || "Seu Nome", cargo, telefone, whatsapp, email, logoUrl },
        undefined,
        { logoScale, fontScale },
      ),
    [nome, cargo, telefone, whatsapp, email, logoUrl, logoScale, fontScale],
  );

  const previewDoc = `<html><body style="margin:0;padding:16px;background:#ffffff;">${signatureHtml}</body></html>`;

  function selecionarAssinatura() {
    const doc = iframeRef.current?.contentDocument;
    const win = iframeRef.current?.contentWindow;
    if (!doc || !win) return;
    const range = doc.createRange();
    range.selectNodeContents(doc.body);
    const sel = win.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  async function copiarHtml() {
    await navigator.clipboard.writeText(signatureHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function baixarImagem() {
    const params = new URLSearchParams({
      nome: nome || "Seu Nome",
      cargo,
      telefone,
      whatsapp,
      email,
      logoScale: String(logoScale),
      fontScale: String(fontScale),
    });
    if (logoUrl) params.set("logo", logoUrl);
    window.open(`/api/admin/assinatura/imagem?${params.toString()}`, "_blank");
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4 rounded-xl border border-white/10 bg-card/50 p-4">
        <div className="space-y-2">
          <Label>Logo</Label>
          <ImageUploadField
            currentUrl={logoUrl}
            onUploaded={setLogoUrl}
            onClear={() => setLogoUrl(undefined)}
            folder="assinaturas"
            label="Enviar logo"
          />
          {!logoUrl && (
            <p className="text-[11px] text-muted-foreground">
              Sem upload, usa a logo padrão da Spotlog.
            </p>
          )}
        </div>
        <div className="space-y-2 rounded-lg border border-white/10 p-3">
          <ScaleControl label="Tamanho da logo" value={logoScale} onChange={setLogoScale} />
          <ScaleControl label="Tamanho da fonte" value={fontScale} onChange={setFontScale} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sig-nome">Nome completo</Label>
          <Input id="sig-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Maria Silva" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sig-cargo">Cargo</Label>
          <Input id="sig-cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Gerente Comercial" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sig-telefone">Telefone</Label>
          <Input id="sig-telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 3123-4567" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sig-whatsapp">WhatsApp</Label>
          <Input id="sig-whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 91234-5678" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sig-email">E-mail</Label>
          <Input id="sig-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maria@spotlog.com.br" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-white/10 overflow-hidden bg-white">
          <iframe
            ref={iframeRef}
            title="Pré-visualização da assinatura"
            srcDoc={previewDoc}
            className="w-full"
            style={{ height: "180px", border: "0" }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={selecionarAssinatura}>
            <MousePointerClick className="h-3.5 w-3.5 mr-1.5" />
            Selecionar assinatura
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={copiarHtml}>
            {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            {copied ? "Copiado!" : "Copiar código HTML"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={baixarImagem}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Baixar como imagem (PNG)
          </Button>
        </div>
        <div className="rounded-lg border border-white/10 bg-card/30 p-3 text-xs text-muted-foreground space-y-1.5">
          <p>
            <strong className="text-foreground">Modo fácil (Gmail/Outlook):</strong> clique em
            &quot;Selecionar assinatura&quot;, aperte Ctrl+C (ou Cmd+C no Mac), e cole (Ctrl+V) direto no
            campo de assinatura das configurações do seu e-mail.
          </p>
          <p>
            <strong className="text-foreground">Modo avançado:</strong> &quot;Copiar código HTML&quot; serve
            pra sistemas que pedem o código bruto (ex: alguns CRMs).
          </p>
          <p>
            <strong className="text-foreground">Imagem (PNG):</strong> use quando o campo não aceitar
            HTML — ex: perfil do WhatsApp Business ou apps que só aceitam foto. Sai em alta
            resolução (nítida); se precisar menor, redimensione ao inserir.
          </p>
        </div>
      </div>
    </div>
  );
}
