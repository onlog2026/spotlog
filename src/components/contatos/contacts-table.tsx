"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { deleteContactsBulk } from "@/app/app/contatos/actions";
import type { ContactRow } from "@/lib/queries/contatos";

type Row = ContactRow & { companies?: { name: string } | null };

export function ContactsTable({ contacts }: { contacts: Row[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const allSelected = contacts.length > 0 && selected.size === contacts.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(contacts.map((c) => c.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedCount = selected.size;
  const selectedLabel = useMemo(
    () => `${selectedCount} ${selectedCount === 1 ? "contato selecionado" : "contatos selecionados"}`,
    [selectedCount],
  );

  function handleBulkDelete() {
    if (selectedCount === 0) return;
    if (
      !window.confirm(
        `Excluir ${selectedLabel}? Essa ação não pode ser desfeita.`,
      )
    )
      return;
    startTransition(async () => {
      const result = await deleteContactsBulk(Array.from(selected));
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.count} contato(s) excluído(s).`);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div>
      {selectedCount > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
          <span className="text-sm font-medium">{selectedLabel}</span>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={handleBulkDelete}
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Excluir selecionados
          </Button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  aria-label="Selecionar todos"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-input"
                />
              </th>
              <th className="text-left p-4">Nome</th>
              <th className="text-left p-4 hidden md:table-cell">Empresa</th>
              <th className="text-left p-4 hidden md:table-cell">Cargo</th>
              <th className="text-left p-4 hidden lg:table-cell">E-mail</th>
              <th className="text-left p-4 hidden lg:table-cell">Telefone</th>
              <th className="text-left p-4 hidden xl:table-cell">Cidade/UF</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {contacts.map((ct) => (
              <tr
                key={ct.id}
                className="border-b border-border hover:bg-muted/40 transition-colors"
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    aria-label={`Selecionar ${ct.full_name}`}
                    checked={selected.has(ct.id)}
                    onChange={() => toggleOne(ct.id)}
                    className="h-4 w-4 rounded border-input"
                  />
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-navy-900 text-white">
                        {initials(ct.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/app/contatos/${ct.id}`}
                        className="font-medium hover:underline flex items-center gap-1.5"
                      >
                        {ct.full_name}
                        {ct.is_decision_maker ? (
                          <Badge variant="orange" className="text-[9px]">
                            Decisor
                          </Badge>
                        ) : null}
                        {ct.do_not_contact ? (
                          <Badge variant="destructive" className="text-[9px]">
                            DNC
                          </Badge>
                        ) : null}
                      </Link>
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
                <td className="p-4 hidden xl:table-cell text-muted-foreground text-xs">
                  {[ct.city, ct.state].filter(Boolean).join("/") || "—"}
                </td>
                <td className="p-4">
                  <Link
                    href={`/app/contatos/${ct.id}`}
                    className="text-spotorange-500 hover:underline text-xs flex items-center gap-1"
                  >
                    Abrir <ArrowRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
