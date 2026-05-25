export const metadata = { title: "Termos de uso" };

export default function TermosPage() {
  return (
    <div className="pt-32 pb-24 container max-w-3xl prose prose-invert">
      <h1>Termos de uso</h1>
      <p>
        Ao usar a Spotlog você concorda com estes termos. Leia com atenção.
      </p>
      <h2>1. Serviço</h2>
      <p>
        A Spotlog é uma plataforma SaaS de prospecção, CRM e geração de
        propostas. O cliente é responsável pelo conteúdo das mensagens
        enviadas, pela aderência às leis de comunicação (LGPD, CAN-SPAM, GDPR
        quando aplicável) e pelo uso ético da ferramenta.
      </p>
      <h2>2. Plano e cobrança</h2>
      <p>
        Os planos são mensais, sem fidelidade. O cancelamento pode ser feito a
        qualquer momento pelo painel. Não há reembolso proporcional pelo mês
        já iniciado.
      </p>
      <h2>3. Limites de uso</h2>
      <p>
        O uso abusivo (spam massivo, listas compradas sem opt-in, conteúdo
        ofensivo, fraude) sujeita a conta a suspensão imediata.
      </p>
      <h2>4. Disponibilidade</h2>
      <p>
        Buscamos 99,5% de disponibilidade mensal. O serviço pode ter janelas
        de manutenção previamente comunicadas.
      </p>
      <h2>5. Limitação de responsabilidade</h2>
      <p>
        A Spotlog não se responsabiliza por danos indiretos, lucros cessantes
        ou indisponibilidade de provedores terceiros (OpenAI, WhatsApp,
        Resend, etc.).
      </p>
    </div>
  );
}
