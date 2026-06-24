"use client";
import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Owner = { id: string; full_name: string | null };

export function PipelineFilters({
  owners,
  sources,
}: {
  owners: Owner[];
  sources: string[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  function set(key: string, value: string) {
    const params = new URLSearchParams(sp?.toString() ?? "");
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    start(() => router.push(`/app/pipeline?${params.toString()}`));
  }
  function clearAll() {
    start(() => router.push("/app/pipeline"));
  }

  const hasFilter =
    sp?.get("owner") ||
    sp?.get("source") ||
    sp?.get("min") ||
    sp?.get("q") ||
    sp?.get("from") ||
    sp?.get("to");

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${
        pending ? "opacity-60" : ""
      }`}
    >
      <Input
        defaultValue={sp?.get("q") ?? ""}
        placeholder="Buscar deal..."
        className="h-9 w-56"
        onChange={(e) => set("q", e.target.value)}
      />

      <Select
        value={sp?.get("owner") ?? "all"}
        onValueChange={(v) => set("owner", v)}
      >
        <SelectTrigger className="h-9 w-44">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os responsáveis</SelectItem>
          {owners.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.full_name ?? "—"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {sources.length > 0 && (
        <Select
          value={sp?.get("source") ?? "all"}
          onValueChange={(v) => set("source", v)}
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Input
        type="number"
        defaultValue={sp?.get("min") ?? ""}
        placeholder="Valor mín."
        className="h-9 w-32"
        onChange={(e) => set("min", e.target.value)}
        inputMode="numeric"
      />

      <Input
        type="date"
        defaultValue={sp?.get("from") ?? ""}
        className="h-9 w-40"
        onChange={(e) => set("from", e.target.value)}
        aria-label="De"
      />
      <Input
        type="date"
        defaultValue={sp?.get("to") ?? ""}
        className="h-9 w-40"
        onChange={(e) => set("to", e.target.value)}
        aria-label="Até"
      />

      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-9 text-xs"
        >
          <X className="h-3 w-3" />
          Limpar
        </Button>
      )}
    </div>
  );
}
