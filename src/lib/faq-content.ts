// Perguntas frequentes do site público — fonte única, usada tanto pelo
// componente visual (src/components/public/faq.tsx) quanto pelo schema.org
// FAQPage (src/app/page.tsx). Fica fora de um arquivo "use client" de
// propósito: dado puro não deve morar num módulo client-only.
export const faqs = [
  {
    q: "Em quais regiões a Spotlog entrega?",
    a: "Atendemos todo o estado de São Paulo e a região metropolitana (Grande SP). Veja o detalhamento por cidade em Área de Cobertura.",
  },
  {
    q: "Qual o prazo de entrega?",
    a: "Depende da solução: Same Day (mesmo dia) e Next Day (dia seguinte) pra quem precisa de velocidade, ou rotas programadas pra operações recorrentes. O prazo exato de cada faixa de CEP fica disponível na proposta comercial.",
  },
  {
    q: "Vocês transportam medicamentos e produtos farmacêuticos?",
    a: "Sim. Temos AFE (Autorização de Funcionamento da Anvisa) para transporte, farmacêutico responsável acompanhando o processo e controle de temperatura para itens termolábeis.",
  },
  {
    q: "Como funciona o rastreamento da entrega?",
    a: "Cada pedido tem um código de rastreio. O destinatário acompanha status, previsão e histórico completo em tempo real em Rastrear Entrega, sem precisar de login.",
  },
  {
    q: "Fazem logística reversa (troca e devolução)?",
    a: "Sim, com o mesmo padrão de rastreabilidade e evidência (foto, status) da entrega de ida — pra fechar o ciclo de troca ou devolução sem dor de cabeça.",
  },
  {
    q: "Atendem pequenas empresas ou só operações grandes?",
    a: "Atendemos de pequenas e médias empresas a operações com alto volume — a estrutura escala com você, sem precisar contratar frota ou galpão próprio.",
  },
  {
    q: "Como eu peço um orçamento?",
    a: "Pelo formulário em Contato ou direto pelo WhatsApp. O diagnóstico é gratuito e sem compromisso — respondemos com prazo e valores pro seu volume e região.",
  },
];
