"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ExistingContact = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  job_title: string | null;
  department: string | null;
  seniority: string | null;
  linkedin_url: string | null;
  company_id: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  companies?: { id: string; name: string } | null;
};

export function EmailLookup({
  value,
  onChange,
  onUseExisting,
  required,
  excludeId,
}: {
  value: string;
  onChange: (email: string) => void;
  onUseExisting: (c: ExistingContact) => void;
  required?: boolean;
  /** se editando, não sugere o próprio contato */
  excludeId?: string;
}) {
  const [match, setMatch] = useState<ExistingContact | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    setMatch(null);
    if (!value || !value.includes("@") || value.length < 5) return;
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/crm/contacts/lookup?email=${encodeURIComponent(value)}`,
        );
        if (!r.ok) return;
        const j = (await r.json()) as { contact: ExistingContact | null };
        if (j.contact && j.contact.id !== excludeId) {
          setMatch(j.contact);
          setDismissed(false);
        }
      } catch {
        // silencia
      } finally {
        setLoading(false);
      }
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, excludeId]);

  return (
    <div>
      <Label htmlFor="email" className="flex items-center gap-1">
        E-mail{required ? " *" : ""}
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin text-spotorange-500" />
        ) : null}
      </Label>
      <Input
        id="email"
        name="email"
        type="email"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value.toLowerCase().trim())}
        placeholder="joao@empresa.com"
        className="hover:border-spotorange-500 transition-colors"
      />
      {match && !dismissed ? (
        <div className="mt-2 rounded-md border border-yellow-500/40 bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-yellow-900 dark:text-yellow-200">
                Já existe um contato com esse e-mail.
              </p>
              <p className="text-xs text-yellow-800 dark:text-yellow-300 mt-0.5">
                <strong>{match.full_name}</strong>
                {match.job_title ? ` — ${match.job_title}` : ""}
                {match.companies?.name ? ` @ ${match.companies.name}` : ""}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => onUseExisting(match)}
                  className="text-xs font-medium px-3 py-1 rounded-md bg-navy-900 text-white hover:bg-navy-900/90 transition-colors"
                >
                  Usar dados existentes
                </button>
                <Link
                  href={`/app/contatos/${match.id}`}
                  className="text-xs font-medium px-3 py-1 rounded-md border border-yellow-600 text-yellow-900 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                >
                  Abrir contato
                </Link>
                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  className="text-xs text-yellow-800 dark:text-yellow-300 hover:underline"
                >
                  Ignorar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
