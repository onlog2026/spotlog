import Link from "next/link";
import { ArrowRight, Plus, Users2 } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ContatosPage() {
  const ctx = await requireSession();
  const supabase = await createClient();
  const { data: contacts } = await supabase
    .from("contacts")
    .select(
      "id, full_name, email, phone, whatsapp, job_title, company_id, is_decision_maker, do_not_contact, companies(name)",
    )
    .eq("organization_id", ctx.org.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Contatos</h1>
          <p className="text-muted-foreground mt-1">
            Pessoas que você conhece. Decisores, influenciadores, parceiros.
          </p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/app/contatos/novo">
            <Plus className="h-4 w-4" />
            Novo contato
          </Link>
        </Button>
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-0">
          {!contacts || contacts.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left p-4">Nome</th>
                    <th className="text-left p-4 hidden md:table-cell">Empresa</th>
                    <th className="text-left p-4 hidden md:table-cell">Cargo</th>
                    <th className="text-left p-4 hidden lg:table-cell">E-mail</th>
                    <th className="text-left p-4 hidden lg:table-cell">Telefone</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => {
                    const ct = c as unknown as {
                      id: string;
                      full_name: string;
                      email: string | null;
                      phone: string | null;
                      whatsapp: string | null;
                      job_title: string | null;
                      is_decision_maker: boolean;
                      do_not_contact: boolean;
                      companies: { name: string } | null;
                    };
                    return (
                      <tr
                        key={ct.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-gradient-brand text-white">
                                {initials(ct.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium flex items-center gap-1.5">
                                {ct.full_name}
                                {ct.is_decision_maker && (
                                  <Badge variant="gradient" className="text-[9px]">
                                    Decisor
                                  </Badge>
                                )}
                                {ct.do_not_contact && (
                                  <Badge variant="destructive" className="text-[9px]">
                                    DNC
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell text-muted-foreground">
                          {ct.companies?.name ?? "—"}
                        </td>
                        <td className="p-4 hidden md:table-cell text-muted-foreground">
                          {ct.job_title ?? "—"}
                        </td>
                        <td className="p-4 hidden lg:table-cell text-muted-foreground text-xs">
                          {ct.email ?? "—"}
                        </td>
                        <td className="p-4 hidden lg:table-cell text-muted-foreground text-xs">
                          {ct.whatsapp ?? ct.phone ?? "—"}
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/app/contatos/${ct.id}`}
                            className="text-brand-400 hover:underline text-xs flex items-center gap-1"
                          >
                            Abrir <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Empty() {
  return (
    <div className="text-center py-16">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-brand/15 mb-4">
        <Users2 className="h-7 w-7 text-brand-400" />
      </div>
      <h3 className="font-semibold text-lg">Nenhum contato</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        Contatos aparecem aqui quando você importa, prospecta ou converte
        leads.
      </p>
      <Button variant="gradient" className="mt-6" asChild>
        <Link href="/app/contatos/novo">Adicionar contato</Link>
      </Button>
    </div>
  );
}
