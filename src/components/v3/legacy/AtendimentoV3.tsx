import Image from "next/image";
import { MessageCircle, Headphones, FileText, Clock, Sparkles, RefreshCcw, Users, History } from "lucide-react";

const cards = [
  { icon: MessageCircle, title: "SAC integrado", desc: "Tudo num só painel, sem cliente perdido entre e-mails." },
  { icon: Headphones, title: "Chat online", desc: "Atendimento humano + IA pra triagem instantânea." },
  { icon: FileText, title: "Chamados", desc: "Cada solicitação vira ticket com status, SLA e responsável." },
  { icon: Clock, title: "Resposta rápida", desc: "Tempo médio de primeira resposta abaixo de 5 minutos." },
  { icon: Sparkles, title: "IA de apoio", desc: "Sugere resposta, classifica urgência e resume contexto." },
  { icon: RefreshCcw, title: "Devolutiva", desc: "Cliente recebe atualização proativa em cada movimento." },
  { icon: Users, title: "Equipe dedicada", desc: "Para contratos maiores, atendente fixo conhece sua operação." },
  { icon: History, title: "Histórico por cliente", desc: "Todo contexto numa única ficha — sem precisar repetir." },
];

export function AtendimentoV3() {
  return (
    <section id="atendimento" className="py-20 lg:py-32">
      <div className="container">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Foto real de atendente */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-card bg-navy-100 relative">
                <Image
                  src="https://images.unsplash.com/photo-1573497019418-b400bb3ab074?auto=format&fit=crop&w=800&q=85"
                  alt="Atendente Spotlog com headset"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover img-zoom"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent" />

                {/* Card sobre foto: chat ativo */}
                <div className="absolute bottom-6 left-6 right-6 z-10">
                  <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-card border border-white/40">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full bg-success-500 animate-pulse-soft" />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-ink-500">
                        Online agora
                      </span>
                    </div>
                    <div className="text-sm font-bold text-navy-900 mb-1">
                      Atendimento Spotlog
                    </div>
                    <div className="text-xs text-ink-500">
                      Olá! Como posso ajudar com sua operação hoje?
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge tempo de resposta */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-card border border-ink-100 p-3 hidden lg:flex items-center gap-2 z-20">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-success-500">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-ink-500">
                    Tempo médio
                  </div>
                  <div className="text-sm font-bold text-navy-900">{"<"} 5 min</div>
                </div>
              </div>

              {/* Badge SLA */}
              <div className="absolute -bottom-5 left-6 bg-gradient-to-br from-navy-500 to-navy-600 rounded-2xl shadow-orange-glow p-3 text-white hidden lg:block z-20">
                <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
                  Satisfação
                </div>
                <div className="text-lg font-bold leading-tight">97%</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="text-sm font-semibold text-navy-600 uppercase tracking-wider mb-3">
              Atendimento
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-navy-950 tracking-tight text-balance mb-5">
              Atendimento orientado por{" "}
              <span className="text-gradient-spotlog">qualidade, clareza e agilidade.</span>
            </h2>
            <p className="text-lg text-ink-600 leading-relaxed mb-8">
              No SAC da Spotlog, cada solicitação é registrada, acompanhada e
              tratada com prioridade. O cliente não fica perdido entre mensagens,
              e-mails e planilhas.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {cards.map((c) => (
                <div key={c.title} className="card-glow p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-navy-50 shrink-0">
                      <c.icon className="h-4 w-4 text-navy-900" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-navy-900 mb-1">{c.title}</h3>
                      <p className="text-xs text-ink-600 leading-relaxed">{c.desc}</p>
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
