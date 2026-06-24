"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Copy, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ShareProposalActions({
  proposalId,
  publicUrl,
  contact,
}: {
  proposalId: string;
  publicUrl: string;
  contact: {
    full_name: string;
    email: string;
    whatsapp: string;
    phone: string;
  } | null;
}) {
  const [sending, setSending] = useState<null | "email" | "whatsapp">(null);

  function copyLink() {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copiado!");
  }

  async function sendByChannel(channel: "email" | "whatsapp") {
    setSending(channel);
    const res = await fetch(`/api/proposals/${proposalId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel }),
    });
    setSending(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Erro ao enviar");
      return;
    }
    toast.success(`Enviada por ${channel}!`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input value={publicUrl} readOnly />
        <Button variant="outline" size="icon" onClick={copyLink}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={() => sendByChannel("email")}
          disabled={!contact?.email || sending !== null}
        >
          {sending === "email" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          Enviar por e-mail{" "}
          {contact?.email ? `(${contact.email})` : "(sem e-mail)"}
        </Button>
        <Button
          variant="outline"
          onClick={() => sendByChannel("whatsapp")}
          disabled={!(contact?.whatsapp || contact?.phone) || sending !== null}
        >
          {sending === "whatsapp" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
          Enviar por WhatsApp
        </Button>
      </div>
    </div>
  );
}
