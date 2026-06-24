"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddConsentDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [legalBasis, setLegalBasis] = useState("interesse_legitimo");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email && !phone) {
      setError("Informe e-mail ou telefone.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/sdr/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "consent",
          email: email || undefined,
          phone: phone || undefined,
          legalBasis,
          consentType:
            legalBasis === "interesse_legitimo"
              ? "legitimate_interest"
              : "opt_in",
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha ao salvar.");
        return;
      }
      setOpen(false);
      setEmail("");
      setPhone("");
      setNotes("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="orange" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Registrar consentimento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar consentimento (LGPD)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contato@empresa.com.br"
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <Label htmlFor="basis">Base legal</Label>
            <Select value={legalBasis} onValueChange={setLegalBasis}>
              <SelectTrigger id="basis">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consentimento">
                  Consentimento (Art. 7º, I)
                </SelectItem>
                <SelectItem value="interesse_legitimo">
                  Interesse legítimo (Art. 7º, IX)
                </SelectItem>
                <SelectItem value="execucao_contrato">
                  Execução de contrato (Art. 7º, V)
                </SelectItem>
                <SelectItem value="obrigacao_legal">
                  Obrigação legal (Art. 7º, II)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: feira XYZ, evento ABC"
            />
          </div>
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" variant="orange" disabled={pending} className="w-full">
            {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Registrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddOptOutDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("Solicitação manual");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email && !phone) {
      setError("Informe e-mail ou telefone.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/sdr/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "opt_out",
          email: email || undefined,
          phone: phone || undefined,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha ao salvar.");
        return;
      }
      setOpen(false);
      setEmail("");
      setPhone("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="h-4 w-4 mr-1" /> Adicionar a suppression
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar à suppression list (opt-out)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="email2">E-mail</Label>
            <Input
              id="email2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="phone2">Telefone</Label>
            <Input
              id="phone2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="reason">Motivo</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="destructive"
            disabled={pending}
            className="w-full"
          >
            {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Adicionar opt-out
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
