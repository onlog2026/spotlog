"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Search, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import Link from "next/link";

const regioes = [
  { name: "São Paulo Capital", ceps: "01000–05999, 08000–08499", servico: "Same Day + Next Day" },
  { name: "Grande SP / ABC", ceps: "09000–09999", servico: "B2B / Recorrente" },
  { name: "Guarulhos", ceps: "07000–07399", servico: "Programada" },
  { name: "Osasco / Barueri", ceps: "06000–06499", servico: "Rotas dedicadas" },
  { name: "Campinas e região", ceps: "13000–13189", servico: "Same Day / Next Day" },
  { name: "Interior SP", ceps: "13xxx–19xxx", servico: "Next Day / D+2" },
  { name: "Litoral SP", ceps: "11000–11999", servico: "Programada" },
  { name: "Datas e picos", ceps: "Sob demanda", servico: "Operação sazonal" },
];

type Resultado =
  | { atende: true; prazo: string; cidade: string; uf: string }
  | { atende: false };

function maskCep(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function Abrangencia() {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function consultar(e: FormEvent) {
    e.preventDefault();
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setErro("Digite um CEP válido com 8 números.");
      setResultado(null);
      return;
    }
    setErro(null);
    setLoading(true);
    setResultado(null);
    try {
      const res = await fetch(`/api/abrangencia?cep=${digits}`);
      const data = (await res.json()) as Resultado;
      setResultado(data);
    } catch {
      setErro("Não conseguimos consultar agora. Tente de novo em instantes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="abrangencia" className="py-20 lg:py-32 bg-gradient-soft">
      <div className="container">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-3">
              Abrangência
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-navy-950 tracking-tight text-balance">
              Sua região tem{" "}
              <span className="text-gradient-spotlog">entrega Spotlog?</span>
            </h2>
            <p className="mt-5 text-lg text-ink-600 leading-relaxed">
              Digite o CEP e descubra na hora se atendemos e em quantos dias a
              entrega chega.
            </p>

            <div className="card-glow mt-8 p-6">
              <form onSubmit={consultar}>
                <label
                  htmlFor="cep-abrangencia"
                  className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2 block"
                >
                  Consultar CEP
                </label>
                <div className="flex gap-2">
                  <input
                    id="cep-abrangencia"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => {
                      setCep(maskCep(e.target.value));
                      setErro(null);
                    }}
                    className="flex-1 h-12 px-4 rounded-lg border-2 border-ink-200 focus:border-navy-900 focus:outline-none text-sm transition-colors"
                  />
                  <Button
                    type="submit"
                    variant="orange"
                    size="default"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Consultar
                  </Button>
                </div>
              </form>

              {erro && (
                <p className="text-xs text-red-600 mt-3 font-medium">{erro}</p>
              )}

              {resultado?.atende === true && (
                <div className="mt-4 rounded-xl border-2 border-success-200 bg-success-50 p-4">
                  <div className="flex items-center gap-2 text-success-700 font-bold">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    Atendemos sua região!
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-navy-900">
                    <Clock className="h-4 w-4 text-spotorange-600 shrink-0" />
                    <span className="text-sm">
                      Prazo de entrega:{" "}
                      <span className="font-bold text-lg">
                        {resultado.prazo}
                      </span>{" "}
                      <span className="text-ink-500 text-xs">
                        (dias úteis após a coleta)
                      </span>
                    </span>
                  </div>
                  <Button
                    variant="orange"
                    size="default"
                    className="w-full mt-4"
                    asChild
                  >
                    <Link href="/contato?assunto=simulacao">
                      Solicitar uma simulação gratuita
                    </Link>
                  </Button>
                </div>
              )}

              {resultado?.atende === false && (
                <div className="mt-4 rounded-xl border-2 border-ink-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-ink-700 font-bold">
                    <XCircle className="h-5 w-5 shrink-0 text-ink-400" />
                    Ainda não temos rota fixa nessa região
                  </div>
                  <p className="text-sm text-ink-600 mt-2">
                    Mas atendemos demandas sob medida e operações sazonais. Fala
                    com a gente que montamos uma solução pro seu CEP.
                  </p>
                  <Button
                    variant="outline"
                    size="default"
                    className="w-full mt-4"
                    asChild
                  >
                    <Link href="/contato?assunto=consultar-cep">
                      Falar com um especialista
                    </Link>
                  </Button>
                </div>
              )}

              {!resultado && !erro && (
                <p className="text-xs text-ink-500 mt-3">
                  Atendemos São Paulo capital, Grande SP, Campinas, interior e
                  litoral. Consulte o seu CEP.
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="grid sm:grid-cols-2 gap-3">
              {regioes.map((r) => (
                <div key={r.name} className="card-glow p-5 group">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-navy-50 shrink-0 group-hover:bg-spotorange-500 transition-colors">
                      <MapPin className="h-4 w-4 text-navy-900 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-navy-900 text-sm">
                        {r.name}
                      </div>
                      <div className="text-[11px] text-ink-500 mt-0.5 truncate">
                        {r.ceps}
                      </div>
                      <div className="inline-block mt-2 text-[10px] font-semibold text-spotorange-700 bg-spotorange-50 px-2 py-0.5 rounded">
                        {r.servico}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
