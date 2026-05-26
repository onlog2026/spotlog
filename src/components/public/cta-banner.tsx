import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormularioComercial } from "./formulario-comercial";

export function CtaBanner() {
  return (
    <section id="contato" className="py-20 lg:py-32 bg-navy-50/40">
      <div className="container">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-3">
              Solicite proposta
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-navy-950 tracking-tight text-balance leading-tight">
              Pronto para{" "}
              <span className="text-gradient-spotlog">otimizar sua logística?</span>
            </h2>
            <p className="mt-5 text-lg text-ink-600 leading-relaxed">
              Conta pra gente seu segmento, volume e região. Em até 1 dia útil
              um especialista da Spotlog desenha uma proposta sob medida.
            </p>

            <div className="mt-8 space-y-4">
              <div className="bg-white border border-ink-200 rounded-2xl p-5 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-spotorange-500">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider font-bold text-ink-500">
                      Prefere falar agora?
                    </div>
                    <div className="text-base font-bold text-navy-900">
                      WhatsApp comercial direto
                    </div>
                  </div>
                </div>
                <Button variant="orange" className="w-full mt-4" asChild>
                  <Link href="https://wa.me/5511000000000?text=Quero%20conhecer%20a%20Spotlog">
                    Abrir conversa no WhatsApp
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Stat value="1d útil" label="Para responder" />
                <Stat value="100%" label="Proposta sob medida" />
                <Stat value="Grátis" label="Diagnóstico inicial" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-3xl shadow-card border border-ink-200 p-8 lg:p-10">
            <FormularioComercial />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white border border-ink-200 rounded-xl p-4 text-center">
      <div className="text-lg font-bold text-navy-900">{value}</div>
      <div className="text-[10px] text-ink-500 mt-1">{label}</div>
    </div>
  );
}
