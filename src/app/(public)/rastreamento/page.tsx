"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, MapPin, Truck, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RastreamentoPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim()) router.push(`/rastrear/${encodeURIComponent(code.trim())}`);
  }

  return (
    <div>
      <section className="relative pt-32 lg:pt-44 pb-20 lg:pb-28 bg-gradient-soft hero-pattern">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-spotorange-50 px-4 py-1.5 mb-6 border border-spotorange-200">
              <MapPin className="h-3.5 w-3.5 text-spotorange-600" />
              <span className="text-xs font-semibold text-spotorange-700">
                Acompanhe sua entrega em tempo real
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.1] text-balance">
              Onde está{" "}
              <span className="text-gradient-spotlog">sua entrega?</span>
            </h1>
            <p className="mt-5 text-lg text-ink-600">
              Digite o código de rastreio que você recebeu pra ver status,
              previsão e histórico completo.
            </p>

            <form onSubmit={go} className="mt-10 max-w-xl mx-auto">
              <div className="bg-white border-2 border-ink-200 rounded-2xl p-2 shadow-card flex items-center gap-2 focus-within:border-navy-900 transition-colors">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy-50 shrink-0">
                  <Search className="h-5 w-5 text-navy-900" />
                </div>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: SP-2046 ou seu código de pedido"
                  className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base h-12"
                />
                <Button variant="orange" size="lg" type="submit">
                  Rastrear
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-ink-500 mt-3">
                Não tem o código? Procure o e-mail/SMS/WhatsApp que recebeu da
                Spotlog ou pergunte no <a href="/contato" className="text-spotorange-600 font-semibold">atendimento</a>.
              </p>
            </form>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container max-w-5xl">
          <h2 className="text-2xl lg:text-3xl font-bold text-navy-900 mb-2 text-center">
            O que cada status significa?
          </h2>
          <p className="text-ink-500 text-center mb-12">
            A jornada típica de uma entrega Spotlog
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Package, color: "bg-navy-700", title: "Pedido criado", desc: "Recebido pela operação e em processo de separação." },
              { icon: Clock, color: "bg-navy-800", title: "Aguardando coleta", desc: "Coleta agendada com o cliente/loja." },
              { icon: Truck, color: "bg-spotorange-500", title: "Em rota", desc: "Entregador a caminho do destinatário. Acompanhe ao vivo." },
              { icon: CheckCircle2, color: "bg-success-500", title: "Entregue", desc: "Pedido confirmado, com foto e assinatura digital." },
            ].map((s) => (
              <div key={s.title} className="bg-white border border-ink-200 rounded-2xl p-6 text-center">
                <div className={`mx-auto grid h-12 w-12 place-items-center rounded-xl ${s.color} mb-4`}>
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-navy-900 mb-2">{s.title}</h3>
                <p className="text-sm text-ink-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
