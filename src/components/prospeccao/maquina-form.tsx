"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { criarMaquina } from "@/lib/prospeccao/actions";

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const QUANTIDADES = [
  { v: 30, label: "30 leads (rápido)" },
  { v: 50, label: "50 leads" },
  { v: 100, label: "100 leads" },
  { v: 200, label: "200 leads (máximo)" },
];

const EXEMPLOS = [
  "farmácia de manipulação",
  "distribuidora de cosméticos",
  "e-commerce de suplementos",
  "clínica veterinária",
  "loja de autopeças",
];

export function MaquinaForm() {
  const [pending, start] = useTransition();
  const [termos, setTermos] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      try {
        toast.info(
          "Máquina ligada! Buscando no Google Maps… você já vai ver os primeiros resultados.",
        );
        await criarMaquina(fd);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falha";
        if (!/NEXT_REDIRECT/.test(msg)) toast.error(msg);
      }
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-6 space-y-5">
          <Field label="O que buscar?" required hint="Tipo de empresa ou segmento. Pode listar mais de um, separado por vírgula.">
            <input
              name="termos"
              required
              value={termos}
              onChange={(e) => setTermos(e.target.value)}
              placeholder="Ex: farmácia de manipulação"
              className={inputClass}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {EXEMPLOS.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setTermos(ex)}
                  className="text-[11px] px-2 py-1 rounded-full border border-white/10 text-muted-foreground hover:border-brand-400 hover:text-brand-400 transition"
                >
                  {ex}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Estado" required>
              <select name="estado" required defaultValue="SP" className={inputClass}>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cidade" hint="Vazio = estado inteiro">
              <input
                name="cidade"
                placeholder="Ex: São Paulo"
                className={inputClass}
              />
            </Field>
            <Field label="Bairro / região" hint="Opcional">
              <input
                name="bairro"
                placeholder="Ex: Moema"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Cargo do decisor"
              hint="Opcional — vira termo extra da busca (ex: gerente de logística)"
            >
              <input
                name="cargo"
                placeholder="Ex: farmacêutico responsável"
                className={inputClass}
              />
            </Field>
            <Field label="Quantos leads?">
              <select name="limit" defaultValue="50" className={inputClass}>
                {QUANTIDADES.map((q) => (
                  <option key={q.v} value={q.v}>
                    {q.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-brand-400" /> O que a máquina faz sozinha:
            </p>
            <p>1. Varre o Google Maps com seus termos (busca real, ao vivo)</p>
            <p>2. Entra no site de cada empresa e extrai e-mail, telefone e WhatsApp</p>
            <p>3. Descobre Instagram, Facebook e LinkedIn da empresa</p>
            <p>4. Dá nota pra cada lead e descarta duplicados</p>
          </div>

          <Button type="submit" variant="orange" size="lg" disabled={pending} className="w-full">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Ligando a máquina…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" /> Buscar leads agora
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400/30 transition";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1.5">
        {label} {required && <span className="text-brand-400">*</span>}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px] text-muted-foreground mt-1">{hint}</span>
      )}
    </label>
  );
}
