import Link from "next/link";
import { ShoppingBag, Zap, Calendar, Bell, RotateCcw, BarChart3, ArrowRight, CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CtaBanner } from "@/components/public/cta-banner";

export const metadata = { title: "E-commerce" };

const beneficios = [
  { icon: Zap, title: "Entregas expressas", desc: "Same-day onde disponível, com SLA monitorado em tempo real." },
  { icon: Calendar, title: "Coletas programadas", desc: "Equipe passa no seu CD nos horários definidos." },
  { icon: Bell, title: "Notificações automáticas", desc: "Comprador recebe atualizações por e-mail, SMS e WhatsApp." },
  { icon: RotateCcw, title: "Logística reversa", desc: "Devoluções e trocas com mesma qualidade da ida." },
  { icon: BarChart3, title: "Relatórios", desc: "SLA, taxa de sucesso, tempo médio — direto no painel." },
  { icon: Package, title: "Rastreio pro comprador", desc: "Link público de acompanhamento com sua marca." },
];

const integracoes = [
  { name: "Shopify", status: "Disponível" },
  { name: "Nuvemshop", status: "Disponível" },
  { name: "WooCommerce", status: "Disponível" },
  { name: "Tray", status: "Em implantação" },
  { name: "Bling", status: "Em implantação" },
  { name: "Tiny", status: "Sob consulta" },
  { name: "Mercado Livre", status: "Sob consulta" },
  { name: "Shopee", status: "Sob consulta" },
  { name: "API própria", status: "Disponível" },
  { name: "Webhooks", status: "Disponível" },
];

export default function EcommercePage() {
  return (
    <div>
      <section className="relative pt-32 lg:pt-44 pb-16 lg:pb-24 bg-gradient-soft hero-pattern">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="container relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-spotorange-50 px-4 py-1.5 mb-6 border border-spotorange-200">
                <ShoppingBag className="h-3.5 w-3.5 text-spotorange-600" />
                <span className="text-xs font-semibold text-spotorange-700">
                  Solução completa pra lojas online
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.1] text-balance">
                Entregas para e-commerce com mais{" "}
                <span className="text-gradient-spotlog">controle e previsibilidade.</span>
              </h1>
              <p className="mt-6 text-lg lg:text-xl text-ink-600 max-w-2xl leading-relaxed">
                Reduza chamados de pós-venda, melhore a experiência do comprador
                e tenha visibilidade total da operação — da coleta no seu CD ao
                comprovante no destino.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button variant="orange" size="xl" asChild>
                  <Link href="/contato?segment=ecommerce">
                    Quero conhecer
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link href="#integracoes">Ver integrações</Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl shadow-card border border-ink-200 p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider font-bold text-ink-500">Pedido</div>
                    <div className="text-xl font-bold text-navy-900">#EC-49281</div>
                  </div>
                  <span className="bg-success-50 text-success-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Entregue
                  </span>
                </div>
                <div className="bg-navy-50 rounded-xl p-4 mb-4">
                  <div className="text-xs text-ink-500 mb-1">Cliente</div>
                  <div className="text-sm font-bold text-navy-900">Mariana Silva</div>
                  <div className="text-xs text-ink-600 mt-1">Vila Mariana, SP</div>
                </div>
                <div className="space-y-3 mb-4">
                  {[
                    { label: "Pedido feito na loja", time: "ontem · 18:42", done: true },
                    { label: "Coletado no CD", time: "hoje · 08:14", done: true },
                    { label: "Em rota", time: "hoje · 09:22", done: true },
                    { label: "Entregue ao cliente", time: "hoje · 10:31", done: true, ok: true },
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`grid h-6 w-6 place-items-center rounded-full shrink-0 mt-0.5 ${s.ok ? "bg-success-500" : "bg-navy-900"}`}>
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-navy-900">{s.label}</div>
                        <div className="text-[10px] text-ink-500">{s.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-ink-100 flex items-center justify-between">
                  <span className="text-xs text-ink-500">Avaliação do cliente</span>
                  <div className="flex gap-0.5 text-spotorange-500">
                    {"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-3">
              Benefícios pro seu e-commerce
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-950 tracking-tight text-balance">
              Mais do que entregar.{" "}
              <span className="text-gradient-spotlog">Melhorar a experiência.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {beneficios.map((b) => (
              <div
                key={b.title}
                className="bg-white border border-ink-200 rounded-2xl p-6 hover:shadow-card transition-all group"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy-50 group-hover:bg-spotorange-500 transition-colors mb-4">
                  <b.icon className="h-6 w-6 text-navy-900 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2">{b.title}</h3>
                <p className="text-sm text-ink-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="integracoes" className="py-20 lg:py-28 bg-navy-50/40">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-3">
              Integrações
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-950 tracking-tight text-balance">
              Conecta com{" "}
              <span className="text-gradient-spotlog">a sua loja.</span>
            </h2>
            <p className="mt-4 text-ink-600">
              Trabalhamos com as principais plataformas e ERPs. Não vê o seu? Fala
              com a gente — provavelmente conseguimos integrar.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {integracoes.map((i) => (
              <div
                key={i.name}
                className="bg-white border border-ink-200 rounded-xl p-4 text-center"
              >
                <div className="font-bold text-navy-900 text-sm mb-1.5">{i.name}</div>
                <div
                  className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                    i.status === "Disponível"
                      ? "bg-success-50 text-success-700"
                      : i.status === "Em implantação"
                        ? "bg-spotorange-50 text-spotorange-700"
                        : "bg-navy-50 text-navy-700"
                  }`}
                >
                  {i.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />
    </div>
  );
}
