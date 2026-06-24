import { Key, Plug, Webhook, RefreshCcw, Plus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WEBHOOKS } from "@/components/cliente/mock-data";

export const dynamic = "force-dynamic";

export default function IntegracaoPage() {
  // TODO: substituir por SELECT * FROM api_keys / webhooks WHERE organization_id = ctx.org.id
  const tokenMascarado = "sk_live_••••••••••••••••••••••••••••a91f";
  const endpointBase = "https://api.spotlog.com.br/v1";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">API & Webhooks</h2>
        <p className="text-sm text-muted-foreground">
          Integre o Spotlog ao seu ERP ou e-commerce
        </p>
      </div>

      {/* Token API */}
      <Card className="border-transparent bg-card/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4 text-spotorange-500" aria-hidden="true" />
            Token de API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-background px-3 py-2 font-mono text-sm">
            <span className="flex-1 truncate" aria-label="Token de API mascarado">
              {tokenMascarado}
            </span>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Copiar token de API"
            >
              <Copy className="h-3 w-3" />
              Copiar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <RefreshCcw className="h-3 w-3" />
              Regenerar token
            </Button>
            <Button variant="ghost" size="sm">
              Ver tokens anteriores
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Atenção: regenerar o token invalida o atual e quebra integrações em
            produção.
          </p>
        </CardContent>
      </Card>

      {/* Endpoint base + exemplo */}
      <Card className="border-transparent bg-card/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="h-4 w-4 text-spotorange-500" aria-hidden="true" />
            Endpoint base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-background px-3 py-2 font-mono text-sm">
            {endpointBase}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Exemplo: criar remessa
            </p>
            <pre className="rounded-lg border border-white/10 bg-background p-3 text-xs overflow-x-auto">
              <code>{`POST ${endpointBase}/shipments
Authorization: Bearer ${tokenMascarado}
Content-Type: application/json

{
  "destinatario": "Maria Souza",
  "cep": "01310-100",
  "endereco": "Av. Paulista, 1000",
  "cidade": "São Paulo",
  "uf": "SP",
  "peso": 1.2,
  "volumes": 1
}`}</code>
            </pre>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Exemplo: payload de webhook
            </p>
            <pre className="rounded-lg border border-white/10 bg-background p-3 text-xs overflow-x-auto">
              <code>{`{
  "evento": "remessa.entregue",
  "remessa": {
    "codigo": "SPL00012845",
    "status": "entregue",
    "entregue_em": "2026-05-25T16:22:00Z"
  }
}`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card className="border-transparent bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Webhook className="h-4 w-4 text-spotorange-500" aria-hidden="true" />
            Webhooks cadastrados
          </CardTitle>
          <Button variant="orange" size="sm">
            <Plus className="h-3 w-3" />
            Adicionar webhook
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {WEBHOOKS.map((wh) => (
            <div
              key={wh.id}
              className="rounded-lg border border-white/10 bg-background p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <code className="text-sm font-mono break-all">{wh.url}</code>
                <Badge variant={wh.ativo ? "success" : "outline"}>
                  {wh.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {wh.eventos.map((e) => (
                  <Badge
                    key={e}
                    variant="outline"
                    className="text-[10px] font-mono"
                  >
                    {e}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
                <Button variant="ghost" size="sm">
                  Testar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
