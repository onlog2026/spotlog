/**
 * @deprecated Substituído por queries reais em `src/lib/queries/cliente.ts`.
 *
 * Apenas WEBHOOKS e o tipo WebhookConfig permanecem aqui porque ainda não
 * existe a tabela `webhooks` no Supabase. Quando ela for criada, mover para
 * `getClienteWebhooks(orgId)` em `src/lib/queries/cliente.ts` e remover
 * este arquivo completamente.
 */

export type WebhookConfig = {
  id: string;
  url: string;
  eventos: string[];
  ativo: boolean;
};

export const WEBHOOKS: WebhookConfig[] = [
  {
    id: "wh_01",
    url: "https://api.cliente-demo.com/spotlog/webhook",
    eventos: ["remessa.coletada", "remessa.em_rota", "remessa.entregue"],
    ativo: true,
  },
  {
    id: "wh_02",
    url: "https://hooks.cliente-demo.com/ocorrencias",
    eventos: ["remessa.ocorrencia"],
    ativo: true,
  },
];
