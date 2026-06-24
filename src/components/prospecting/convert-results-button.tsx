"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConvertResultsButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function convert() {
    setLoading(true);
    const res = await fetch(`/api/prospecting/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: campaignId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Erro ao converter");
      return;
    }
    toast.success(`${data.converted} resultados convertidos em contatos.`);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={convert} disabled={loading}>
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <ArrowRight className="h-3 w-3" />
      )}
      Converter em contatos
    </Button>
  );
}
