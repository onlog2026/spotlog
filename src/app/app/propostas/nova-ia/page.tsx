import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BriefingForm } from "@/components/propostas/ia/briefing-form";

export const dynamic = "force-dynamic";

export default async function NovaPropostaIaPage() {
  const ctx = await requireSession();
  const supabase = await createClient();

  const [{ data: tables }, { data: contacts }, { data: companies }] =
    await Promise.all([
      supabase
        .from("price_tables")
        .select("id, name, currency")
        .eq("organization_id", ctx.org.id),
      supabase
        .from("contacts")
        .select("id, full_name, email")
        .eq("organization_id", ctx.org.id)
        .limit(500),
      supabase
        .from("companies")
        .select("id, name")
        .eq("organization_id", ctx.org.id)
        .limit(500),
    ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href="/app/propostas"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar para propostas
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-[#BA0102]" />
          Nova proposta com IA
        </h1>
        <p className="text-muted-foreground mt-1">
          Descreva o briefing do cliente. A IA gera o rascunho da proposta em
          seções editáveis (contexto, problema, solução, escopo, próximos
          passos).
        </p>
      </div>

      <BriefingForm
        contacts={
          (contacts ?? []) as Array<{
            id: string;
            full_name: string;
            email: string | null;
          }>
        }
        companies={(companies ?? []) as Array<{ id: string; name: string }>}
        priceTables={
          (tables ?? []) as Array<{ id: string; name: string; currency: string }>
        }
      />
    </div>
  );
}
