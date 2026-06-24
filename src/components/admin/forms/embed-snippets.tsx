"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EmbedSnippets({ baseUrl, slug }: { baseUrl: string; slug: string }) {
  const publicUrl = `${baseUrl}/forms/${slug}`;
  const submitUrl = `${baseUrl}/api/forms/${slug}/submit`;
  const definitionUrl = `${baseUrl}/api/forms/${slug}`;
  const iframeSnippet = `<iframe src="${publicUrl}" width="100%" height="780" frameborder="0" style="border:0;border-radius:24px;"></iframe>`;
  const curlSample = `curl -X POST ${submitUrl} \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "payload": { "full_name": "Maria", "email": "maria@empresa.com", "message": "Quero conhecer." },\n    "consent_given": true\n  }'`;

  return (
    <div className="space-y-4">
      <Snippet
        title="Link publico (compartilhe direto)"
        value={publicUrl}
        action={
          <Button asChild size="sm" variant="outline">
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
              Abrir
            </a>
          </Button>
        }
      />
      <Snippet
        title="Iframe (embed em qualquer site)"
        value={iframeSnippet}
        textarea
      />
      <Snippet title="GET definicao (JSON)" value={definitionUrl} />
      <Snippet title="POST submit (endpoint da API)" value={submitUrl} />
      <Snippet title="Exemplo de payload (cURL)" value={curlSample} textarea />

      <Card className="border-white/10 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Estrutura do payload</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs text-muted-foreground overflow-x-auto bg-black/30 rounded-lg p-3 font-mono">
{`POST /api/forms/${slug}/submit
{
  "payload": { "<field_key>": "<valor>", ... },
  "consent_given": true,
  "page_url": "https://meusite.com/pagina",
  "referrer": "...",
  "utm_source": "...",
  "utm_medium": "...",
  "utm_campaign": "..."
}

// Resposta sucesso
{
  "ok": true,
  "submission_id": "uuid",
  "lead_id": "uuid",
  "success_title": "...",
  "success_message": "...",
  "redirect_url": null
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function Snippet({
  title,
  value,
  textarea = false,
  action,
}: {
  title: string;
  value: string;
  textarea?: boolean;
  action?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <Card className="border-white/10 bg-card/50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {action}
          <Button size="sm" variant="outline" onClick={copy}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {textarea ? (
          <textarea
            readOnly
            value={value}
            rows={Math.min(8, value.split("\n").length + 1)}
            className="w-full bg-black/30 rounded-lg p-3 font-mono text-xs resize-none"
          />
        ) : (
          <div className="bg-black/30 rounded-lg p-3 font-mono text-xs break-all">
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
