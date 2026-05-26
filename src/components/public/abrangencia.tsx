import { Button } from "@/components/ui/button";
import { MapPin, Search } from "lucide-react";
import Link from "next/link";

const regioes = [
  { name: "São Paulo Capital", ceps: "01000–05999, 08000–08499", servico: "Expressa + Programada" },
  { name: "Zona Sul", ceps: "04000–04999", servico: "Same-day disponível" },
  { name: "Zona Leste", ceps: "03000–03999, 08000–08499", servico: "Rotas dedicadas" },
  { name: "Zona Norte", ceps: "02000–02999", servico: "Programada" },
  { name: "Zona Oeste", ceps: "05000–05999", servico: "Expressa" },
  { name: "ABC Paulista", ceps: "09000–09999", servico: "B2B / Recorrente" },
  { name: "Guarulhos", ceps: "07000–07399", servico: "Programada" },
  { name: "Osasco / Barueri", ceps: "06000–06499", servico: "Rotas dedicadas" },
];

export function Abrangencia() {
  return (
    <section id="abrangencia" className="py-20 lg:py-32 bg-gradient-soft">
      <div className="container">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-3">
              Abrangência
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-navy-950 tracking-tight text-balance">
              Abrangência que{" "}
              <span className="text-gradient-spotlog">acompanha o seu negócio.</span>
            </h2>
            <p className="mt-5 text-lg text-ink-600 leading-relaxed">
              Operamos em São Paulo capital e Grande SP com diferentes
              modalidades de serviço. Consulte abaixo a região da sua operação.
            </p>

            <div className="mt-8 bg-white border border-ink-200 rounded-2xl p-6 shadow-soft">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2 block">
                Consultar CEP
              </label>
              <div className="flex gap-2">
                <input
                  placeholder="00000-000"
                  className="flex-1 h-12 px-4 rounded-lg border-2 border-ink-200 focus:border-navy-900 focus:outline-none text-sm"
                />
                <Button variant="orange" size="default" asChild>
                  <Link href="/contato?assunto=consultar-cep">
                    <Search className="h-4 w-4" />
                    Consultar
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-ink-500 mt-3">
                Se sua região não está listada, fale com a gente — podemos
                atender sob demanda.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="grid sm:grid-cols-2 gap-3">
              {regioes.map((r) => (
                <div
                  key={r.name}
                  className="bg-white border border-ink-200 rounded-xl p-5 hover:border-spotorange-300 hover:shadow-soft transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-navy-50 shrink-0">
                      <MapPin className="h-4 w-4 text-navy-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-navy-900 text-sm">{r.name}</div>
                      <div className="text-[11px] text-ink-500 mt-0.5 truncate">{r.ceps}</div>
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
