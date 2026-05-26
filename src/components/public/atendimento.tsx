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

export function Atendimento() {
  return (
    <section id="atendimento" className="py-20 lg:py-32">
      <div className="container">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-spotorange-500 to-spotorange-700 p-8 shadow-orange-glow relative overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-15" />
                <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full">
                  <circle cx="150" cy="120" r="48" fill="#fff5ed" />
                  <ellipse cx="150" cy="105" rx="44" ry="38" fill="#2a1a08" />
                  <ellipse cx="150" cy="125" rx="36" ry="34" fill="#f5d4b8" />
                  <ellipse cx="150" cy="175" rx="14" ry="22" fill="#f5d4b8" />
                  <path d="M 90 245 Q 150 200, 210 245 L 210 300 L 90 300 Z" fill="#1c2a83" />
                  <rect x="138" y="195" width="24" height="12" fill="#fff5ed" />
                  <rect x="105" y="190" width="40" height="8" rx="4" fill="#ff5410" />
                  <text x="125" y="197" fontSize="6" fill="white" fontWeight="bold">SPOTLOG</text>
                  <circle cx="138" cy="128" r="2" fill="#1c2a83" />
                  <circle cx="162" cy="128" r="2" fill="#1c2a83" />
                  <path d="M 138 145 Q 150 152, 162 145" stroke="#1c2a83" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <circle cx="200" cy="110" r="22" fill="white" opacity="0.95" />
                  <path d="M 192 102 L 192 116 Q 192 120, 196 120 L 200 120 L 205 124 L 205 120 L 208 120 Q 212 120, 212 116 L 212 102 Q 212 98, 208 98 L 196 98 Q 192 98, 192 102 Z" fill="#1c2a83" />
                  <circle cx="197" cy="109" r="1" fill="white" />
                  <circle cx="202" cy="109" r="1" fill="white" />
                  <circle cx="207" cy="109" r="1" fill="white" />
                </svg>
                <div className="relative h-full flex flex-col justify-end">
                  <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-soft">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full bg-success-500 animate-pulse-soft" />
                      <span className="text-[10px] uppercase tracking-wider font-bold text-ink-500">
                        Online agora
                      </span>
                    </div>
                    <div className="text-sm font-bold text-navy-900">
                      Carla, atendente Spotlog
                    </div>
                    <div className="text-xs text-ink-500 mt-1">
                      Olá! Como posso ajudar com sua operação hoje?
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-card border border-ink-100 p-3 hidden lg:flex items-center gap-2">
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
            </div>
          </div>

          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-3">
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
                <div
                  key={c.title}
                  className="bg-white border border-ink-200 rounded-xl p-4 hover:border-spotorange-300 hover:shadow-soft transition-all"
                >
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
