import {
  Bot,
  Target,
  MessagesSquare,
  KanbanSquare,
  FileSpreadsheet,
  Inbox,
  BarChart3,
  Sparkles,
  Webhook,
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Prospecção definida pelo ICP",
    desc: "Você diz o setor, cargo, região e tamanho. O agente busca leads em Apollo, Google Places e LinkedIn — sem você abrir aba nenhuma.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Bot,
    title: "Agente SDR escreve a abordagem",
    desc: "Cada mensagem é personalizada com base no cargo do decisor, no segmento da empresa e na proposta de valor que você definiu. Nada de spam.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: MessagesSquare,
    title: "Cadência multicanal real",
    desc: "Sequências combinando e-mail, WhatsApp e tarefas manuais. Quando o lead responde, a cadência pausa automaticamente e o vendedor é notificado.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Inbox,
    title: "Inbox unificada",
    desc: "Todas as respostas — e-mail, WhatsApp, formulário do site — chegam num só lugar, atribuídas ao dono certo, com histórico completo do contato.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: KanbanSquare,
    title: "Pipeline visual arrastar-e-soltar",
    desc: "Kanban de oportunidades com previsão de fechamento, valor, probabilidade. Métricas reais do funil sem precisar montar planilha.",
    color: "from-rose-500 to-red-500",
  },
  {
    icon: FileSpreadsheet,
    title: "Propostas a partir do seu Excel",
    desc: "Você sobe a tabela de preços em .xlsx, a plataforma transforma em catálogo. Em dois cliques vira proposta com link de aceite digital.",
    color: "from-indigo-500 to-violet-500",
  },
  {
    icon: BarChart3,
    title: "Dashboard com números reais",
    desc: "Leads prospectados, taxa de resposta, propostas, conversão, receita no pipeline. Tudo computado direto do banco — nada inventado.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Webhook,
    title: "Formulário do site → CRM",
    desc: "O lead que entrar pelo formulário do seu site aparece no funil em segundos, com atribuição automática e notificação pro vendedor.",
    color: "from-fuchsia-500 to-purple-500",
  },
  {
    icon: Sparkles,
    title: "IA plugável (sem lock-in)",
    desc: "Use OpenAI, Anthropic ou seu próprio provedor. Cole a chave no painel admin e o motor de IA passa a funcionar. Sem chave, fica em modo manual.",
    color: "from-yellow-500 to-amber-500",
  },
];

export function Features() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="inline-block text-sm font-medium text-brand-400 mb-3">
            Tudo o que sua operação comercial precisa
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Um SaaS, não nove ferramentas{" "}
            <span className="text-gradient">colando uma na outra.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Da prospecção ao aceite da proposta, sem trocar de aba. Sem
            integrações frágeis. Sem perder lead no caminho.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-xl border border-white/10 bg-card/40 backdrop-blur p-6 hover:border-white/20 transition-all hover:-translate-y-1"
            >
              <div
                className={`absolute inset-x-0 -top-px h-px bg-gradient-to-r ${f.color} opacity-0 group-hover:opacity-100 transition-opacity`}
              />
              <div
                className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${f.color} mb-4 shadow-lg`}
              >
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
