"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TemplateCard } from "./template-card";
import { ArrowLeft, Plus } from "lucide-react";

type Item = {
  slug: string;
  title: string;
  description: string;
  category: string;
  cover_url: string;
};

type Props = {
  type: "landing" | "popup" | "whatsapp" | "push" | "form";
  title: string;
  subtitle: string;
  items: Item[];
  categories: { value: string; label: string }[];
  backHref: string;
  blankHref: string;
};

export function TemplateGallery({ type, title, subtitle, items, categories, backHref, blankHref }: Props) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("");

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter((it) => {
      const matchCat = !cat || it.category === cat;
      const matchSearch = !s ||
        it.title.toLowerCase().includes(s) ||
        it.description.toLowerCase().includes(s);
      return matchCat && matchSearch;
    });
  }, [items, search, cat]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href={backHref} className="inline-flex items-center gap-1 hover:underline">
              <ArrowLeft className="h-3 w-3" /> Voltar
            </Link>
          </div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={blankHref}>
            <Plus className="h-4 w-4 mr-1" /> Criar do zero
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <Input
          placeholder="Buscar template…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:max-w-sm"
        />
        <div className="flex gap-2 flex-wrap">
          <CatChip active={!cat} onClick={() => setCat("")}>Todos</CatChip>
          {categories.map((c) => (
            <CatChip key={c.value} active={cat === c.value} onClick={() => setCat(c.value)}>
              {c.label}
            </CatChip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground border border-dashed border-white/10 rounded-xl">
          Nenhum template encontrado para esses filtros.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((it) => (
            <TemplateCard
              key={it.slug}
              slug={it.slug}
              title={it.title}
              description={it.description}
              category={it.category}
              coverUrl={it.cover_url}
              type={type}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CatChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition ${
        active
          ? "bg-[#BA0102] border-[#BA0102] text-white"
          : "bg-card/50 border-white/10 text-muted-foreground hover:border-white/30"
      }`}
    >
      {children}
    </button>
  );
}
