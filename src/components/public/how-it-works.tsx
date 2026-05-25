import { ArrowRight, Target, Bot, MessagesSquare, FileSpreadsheet, Trophy } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Target,
    title: "Defina seu ICP",
    text: "Setor, cargos, região, tamanho de empresa, palavras-chave. Em 2 minutos o agente sabe quem buscar.",
  },
  {
    n: "02",
    icon: Bot,
    title: "Agente prospecta sozinho",
    text: "O motor procura em Apollo, Google e LinkedIn. Acha o decisor real (nome, cargo, e-mail, telefone) e enriquece os dados.",
  },
  {
    n: "03",
    icon: MessagesSquare,
    title: "Cadências disparam",
    text: "E-mail + WhatsApp personalizados pela IA. Se o lead não responde no 1º contato, segue na cadência. Se responde, vai pro CRM.",
  },
  {
    n: "04",
    icon: FileSpreadsheet,
    title: "Proposta com 1 clique",
    text: "Você sobe sua tabela Excel uma vez. Daí em diante: monta a proposta, envia por e-mail ou WhatsApp com link de aceite.",
  },
  {
    n: "05",
    icon: Trophy,
    title: "Fecha mais negócios",
    text: "Pipeline visível, follow-ups automáticos, métricas reais. Você não perde lead, não esquece task, não joga oportunidade no lixo.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-brand-950/20 to-background" />
      <div className="container relative">
        <div className="max-w-2xl mx-auto text-center mb-20">
          <span className="inline-block text-sm font-medium text-brand-400 mb-3">
            Como funciona
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            De 0 a primeira reunião agendada{" "}
            <span className="text-gradient">em uma tarde.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Sem precisar codar, integrar Zapier, ou treinar planilha.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-500/30 to-transparent hidden md:block" />

          <div className="space-y-12 md:space-y-24">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className={`relative flex flex-col md:grid md:grid-cols-2 gap-8 items-center ${
                  i % 2 === 1 ? "md:[direction:rtl]" : ""
                }`}
              >
                <div className="md:[direction:ltr] relative">
                  <div className="glass-strong rounded-2xl p-8 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand shadow-lg shadow-brand-500/30">
                        <step.icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-5xl font-bold text-gradient">
                        {step.n}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.text}</p>
                  </div>
                </div>

                <div className="md:[direction:ltr] hidden md:block">
                  <div className="aspect-square max-w-sm mx-auto rounded-2xl bg-gradient-to-br from-brand-500/10 to-purple-500/10 border border-white/10 grid place-items-center">
                    <step.icon className="h-24 w-24 text-brand-400/30" />
                  </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-gradient-brand shadow-lg shadow-brand-500/50 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
