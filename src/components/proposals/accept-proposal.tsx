"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function AcceptProposal({
  token,
  contactName,
  contactEmail,
}: {
  token: string;
  contactName: string | null;
  contactEmail: string | null;
}) {
  const [name, setName] = useState(contactName ?? "");
  const [email, setEmail] = useState(contactEmail ?? "");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function accept() {
    if (!name || !email || !agreed) {
      toast.error("Preencha nome, e-mail e marque o aceite.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/proposals/public/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    setLoading(false);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? "Erro ao registrar aceite");
      return;
    }
    setDone(true);
    toast.success("Aceite registrado!");
  }

  if (done) {
    return (
      <div className="text-center py-6 space-y-2">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="h-7 w-7 text-emerald-400" />
        </div>
        <h3 className="font-bold text-lg">Proposta aceita ✨</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Em instantes o time entra em contato pra dar sequência. Obrigado!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <h3 className="text-center font-semibold text-lg">Aceitar proposta</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Seu nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">E-mail</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <Checkbox
          checked={agreed}
          onCheckedChange={(c) => setAgreed(c === true)}
        />
        Declaro que li e aceito os termos da proposta. Este aceite digital tem
        validade legal conforme a MP 2.200-2/2001 e a LGPD.
      </label>
      <Button
        variant="gradient"
        size="lg"
        className="w-full"
        onClick={accept}
        disabled={loading}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Aceitar proposta
      </Button>
    </div>
  );
}
