import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NewProposalForm } from "@/components/proposals/new-proposal-form";

export const dynamic = "force-dynamic";

async function safeFetch<T>(fn: () => Promise<{ data: T | null }>): Promise<T[]> {
  try {
    const res = await fn();
    return (res?.data as unknown as T[]) ?? [];
  } catch {
    return [];
  }
}

export default async function NovaPropostaPage() {
  const ctx = await requireSession();
  const supabase = await createClient();

  const [tables, contacts, companies] = await Promise.all([
    safeFetch(() =>
      supabase
        .from("price_tables")
        .select("id, name, currency")
        .eq("organization_id", ctx.org.id),
    ),
    safeFetch(() =>
      supabase
        .from("contacts")
        .select("id, full_name, email")
        .eq("organization_id", ctx.org.id)
        .limit(500),
    ),
    safeFetch(() =>
      supabase
        .from("companies")
        .select("id, name")
        .eq("organization_id", ctx.org.id)
        .limit(500),
    ),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Nova proposta</h1>
        <p className="text-muted-foreground mt-1">
          Monte itens com a tabela de preços. Envie por e-mail ou WhatsApp com
          link de aceite.
        </p>
      </div>
      <NewProposalForm
        tables={tables as never}
        contacts={contacts as never}
        companies={companies as never}
      />
    </div>
  );
}
