import { Quote } from "lucide-react";

const stats = [
  { value: "3.2x", label: "Aumento médio em reuniões agendadas" },
  { value: "47%", label: "Redução no custo por lead qualificado" },
  { value: "12h", label: "Tempo economizado por SDR / semana" },
  { value: "98%", label: "Mensagens entregues no WhatsApp" },
];

export function SocialProof() {
  return (
    <section className="py-20 border-y border-white/10 bg-gradient-to-b from-background to-brand-950/10">
      <div className="container">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-8">
          Resultados que o time comercial enxerga em 30 dias
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gradient">
                {s.value}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground mt-2">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          * Métricas calculadas a partir das contas ativas que rodam o agente
          SDR em cadência completa por pelo menos 30 dias. Resultados variam
          conforme ICP, oferta e qualidade dos dados.
        </p>
      </div>
    </section>
  );
}
