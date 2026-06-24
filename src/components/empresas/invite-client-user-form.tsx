"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InviteClientUserForm({
  companyId,
  organizationId,
}: {
  companyId: string;
  organizationId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<{
    kind: "info" | "success" | "error";
    msg: string;
  } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Informe o e-mail do convidado.");
      return;
    }
    setLoading(true);
    setHint(null);
    try {
      const res = await fetch("/api/portal/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          company_id: companyId,
          organization_id: organizationId,
          role,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const m = json?.error ?? "Erro ao convidar.";
        setHint({ kind: "error", msg: m });
        toast.error(m);
        return;
      }
      if (json.status === "user_not_found") {
        setHint({
          kind: "info",
          msg:
            json.message ??
            "Peça pro cliente criar conta primeiro em /portal-login e depois reenvie o convite.",
        });
        toast.info("Usuário ainda não tem conta no Spotlog.");
        return;
      }
      if (json.status === "reactivated") {
        setHint({ kind: "success", msg: "Usuário reativado!" });
        toast.success("Acesso reativado.");
      } else {
        setHint({ kind: "success", msg: "Usuário vinculado com sucesso!" });
        toast.success("Cliente convidado.");
      }
      setEmail("");
      router.refresh();
    } catch (err) {
      const m = (err as Error).message;
      setHint({ kind: "error", msg: m });
      toast.error(m);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {hint && (
        <div
          className={
            hint.kind === "error"
              ? "flex items-start gap-2 rounded-md border border-red-300/40 bg-red-50/70 p-3 text-sm text-red-900"
              : hint.kind === "success"
                ? "flex items-start gap-2 rounded-md border border-emerald-300/40 bg-emerald-50/70 p-3 text-sm text-emerald-900"
                : "flex items-start gap-2 rounded-md border border-amber-300/40 bg-amber-50/70 p-3 text-sm text-amber-900"
          }
        >
          {hint.kind === "success" ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <span>{hint.msg}</span>
        </div>
      )}
      <div className="grid sm:grid-cols-[1fr_140px] gap-3">
        <div className="space-y-1.5">
          <Label>E-mail</Label>
          <Input
            type="email"
            placeholder="cliente@empresa.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Função</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Membro</SelectItem>
              <SelectItem value="viewer">Visualizador</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        type="submit"
        variant="orange"
        disabled={loading}
        className="w-full sm:w-auto"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
        Convidar usuário
      </Button>
      <p className="text-xs text-muted-foreground">
        O cliente precisa ter conta no Spotlog primeiro. Se não tiver, peça pra
        ele se cadastrar em <code>/portal-login</code> e reenvie o convite depois.
      </p>
    </form>
  );
}
