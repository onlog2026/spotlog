"use client";

import { useState, useTransition } from "react";
import { Copy, Check, Plus, X, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createApiKey, revokeApiKey } from "@/app/app/admin/api-keys/actions";

type ApiKey = {
  id: string;
  name: string;
  token_prefix: string;
  scopes: string[];
  active: boolean | null;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
};

const SCOPES = [
  { value: "tickets:read", label: "Ler tickets" },
  { value: "tickets:write", label: "Criar/editar tickets" },
  { value: "orders:webhook", label: "Receber webhook de pedidos" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

export function ApiKeysClient({
  initial,
  orgName,
}: {
  initial: ApiKey[];
  orgName: string;
}) {
  const [keys, setKeys] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "tickets:read",
    "tickets:write",
    "orders:webhook",
  ]);
  const [expires, setExpires] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [newToken, setNewToken] = useState<{
    token: string;
    name: string;
    prefix: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function toggleScope(s: string) {
    setSelectedScopes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createApiKey({
        name,
        scopes: selectedScopes,
        expires_days: expires ? parseInt(expires, 10) : null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNewToken({ token: result.token, name: result.name, prefix: result.prefix });
      setKeys((prev) => [
        {
          id: result.id,
          name: result.name,
          token_prefix: result.prefix,
          scopes: selectedScopes,
          active: true,
          last_used_at: null,
          created_at: new Date().toISOString(),
          expires_at: null,
        },
        ...prev,
      ]);
      setName("");
      setShowForm(false);
    });
  }

  function copyToken() {
    if (!newToken) return;
    navigator.clipboard.writeText(newToken.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function revoke(id: string) {
    if (!confirm("Revogar esta API key? Aplicações que a usam vão parar de funcionar.")) {
      return;
    }
    startTransition(async () => {
      const result = await revokeApiKey(id);
      if (!result.ok) {
        setError(result.error ?? "Erro ao revogar.");
        return;
      }
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, active: false } : k)));
    });
  }

  return (
    <div className="space-y-4">
      {newToken && (
        <Card className="border-2 border-[#BA0102] bg-[#BA0102]/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-[#BA0102] mt-0.5" />
              <div className="flex-1">
                <div className="font-bold">
                  Token gerado: {newToken.name}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Este token será mostrado APENAS uma vez. Copie agora e salve em
                  local seguro (.env, gerenciador de segredos). Você não conseguirá
                  vê-lo novamente.
                </p>
              </div>
              <button
                onClick={() => setNewToken(null)}
                className="p-1 rounded hover:bg-white/10"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-md bg-black/30 font-mono text-sm break-all">
              <span className="flex-1">{newToken.token}</span>
              <button
                onClick={copyToken}
                className="shrink-0 inline-flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          style={{ background: "#BA0102", color: "white" }}
        >
          <Plus className="h-4 w-4" /> Gerar nova API key
        </Button>
      ) : (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-4">
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Nome da integração
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: VTEX produção, Shopify staging..."
                  required
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Escopos
                </label>
                <div className="mt-2 grid sm:grid-cols-3 gap-2">
                  {SCOPES.map((s) => (
                    <label
                      key={s.value}
                      className="flex items-center gap-2 p-2 rounded-md border border-white/10 cursor-pointer hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(s.value)}
                        onChange={() => toggleScope(s.value)}
                        className="accent-[#BA0102]"
                      />
                      <span className="text-sm">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Expirar em (dias, opcional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={expires}
                  onChange={(e) => setExpires(e.target.value)}
                  placeholder="vazio = sem expiração"
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              {error && (
                <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded p-2">
                  {error}
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                  disabled={pending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={pending}
                  style={{ background: "#011960", color: "white" }}
                >
                  {pending ? "Gerando..." : "Gerar token"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-0">
          {keys.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma API key criada ainda para {orgName}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-white/10">
                  <tr>
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-left py-3 px-4">Token</th>
                    <th className="text-left py-3 px-4">Escopos</th>
                    <th className="text-left py-3 px-4">Última uso</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 px-4 font-semibold">{k.name}</td>
                      <td className="py-3 px-4 font-mono text-xs">{k.token_prefix}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(k.scopes ?? []).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] px-2 py-0.5 rounded bg-white/10 font-mono"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {formatDate(k.last_used_at)}
                      </td>
                      <td className="py-3 px-4">
                        {k.active ? (
                          <span className="text-xs px-2 py-1 rounded bg-green-500/15 text-green-400">
                            Ativa
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded bg-white/10 text-muted-foreground">
                            Revogada
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {k.active && (
                          <button
                            onClick={() => revoke(k.id)}
                            disabled={pending}
                            className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3" /> Revogar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
