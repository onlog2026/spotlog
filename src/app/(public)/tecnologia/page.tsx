import Link from "next/link";
import { Smartphone, BarChart3, Webhook, Bot, MapPin, Bell, Database, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ControleOperacional } from "@/components/public/controle-operacional";
import { CtaBanner } from "@/components/public/cta-banner";

export const metadata = { title: "Tecnologia" };

const stack = [
  { icon: Smartphone, title: "App do entregador", desc: "Rotas, check-in/out, foto, assinatura, ocorrências." },
  { icon: BarChart3, title: "Painel do cliente", desc: "Dashboard com métricas, entregas, faturas e relatórios." },
  { icon: Webhook, title: "API e webhooks", desc: "Conecta com sua loja, ERP ou WMS — sem fricção." },
  { icon: Bot, title: "IA de apoio", desc: "Auxilia o atendimento, triagem de chamados e SAC." },
  { icon: MapPin, title: "Geolocalização", desc: "GPS em tempo real do entregador e ETA pra cada entrega." },
  { icon: Bell, title: "Notificações", desc: "E-mail, SMS e WhatsApp pro cliente final, com seu branding." },
  { icon: Database, title: "Histórico completo", desc: "Cada interação guardada por anos pra auditoria." },
  { icon: Lock, title: "Segurança & LGPD", desc: "RLS no banco, criptografia e consentimento registrado." },
];

export default function TecnologiaPage() {
  return (
    <div>
      <section className="relative pt-32 lg:pt-44 pb-16 lg:pb-24 bg-gradient-soft hero-pattern">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-4">
              Tecnologia
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.1] text-balance">
              Tecnologia que sustenta a operação —{" "}
              <span className="text-gradient-spotlog">sem complicar pra você.</span>
            </h1>
            <p className="mt-6 text-lg lg:text-xl text-ink-600 leading-relaxed max-w-3xl mx-auto">
              Plataforma própria, app do entregador, integrações com sua loja,
              painel do cliente e IA de apoio ao atendimento. Tudo construído
              pra simplificar — não pra adicionar mais ferramenta na sua mesa.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button variant="orange" size="lg" asChild>
                <Link href="/contato">
                  Quero conhecer
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-950 tracking-tight text-balance">
              Stack tecnológica da Spotlog
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stack.map((s) => (
              <div key={s.title} className="bg-white border border-ink-200 rounded-2xl p-6 hover:shadow-card hover:border-spotorange-300 transition-all">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy-50 mb-4">
                  <s.icon className="h-6 w-6 text-navy-900" />
                </div>
                <h3 className="text-base font-bold text-navy-900 mb-2">{s.title}</h3>
                <p className="text-sm text-ink-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ControleOperacional />
      <CtaBanner />
    </div>
  );
}
