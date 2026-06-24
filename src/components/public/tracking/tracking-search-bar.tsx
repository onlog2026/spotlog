"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  defaultValue?: string;
  size?: "sm" | "lg";
}

export function TrackingSearchBar({ defaultValue = "", size = "lg" }: Props) {
  const router = useRouter();
  const [code, setCode] = useState(defaultValue);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = code.trim();
    if (v) router.push(`/rastrear/${encodeURIComponent(v)}`);
  }

  const isLg = size === "lg";
  return (
    <form onSubmit={submit} className="w-full">
      <div
        className={`flex items-center gap-2 rounded-2xl border-2 border-ink-200 bg-white p-2 shadow-card transition-colors focus-within:border-navy-900 ${
          isLg ? "" : "p-1.5"
        }`}
      >
        <div
          className={`grid place-items-center rounded-xl bg-navy-50 shrink-0 ${
            isLg ? "h-12 w-12" : "h-10 w-10"
          }`}
        >
          <Search className={isLg ? "h-5 w-5 text-navy-900" : "h-4 w-4 text-navy-900"} />
        </div>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Digite seu código (ex: SP-0001)"
          aria-label="Código de rastreio"
          className={`flex-1 border-0 shadow-none focus-visible:ring-0 ${isLg ? "h-12 text-base" : "h-10 text-sm"}`}
        />
        <Button variant="orange" size={isLg ? "lg" : "default"} type="submit">
          Rastrear
          <ArrowRight className={isLg ? "h-5 w-5" : "h-4 w-4"} />
        </Button>
      </div>
    </form>
  );
}
