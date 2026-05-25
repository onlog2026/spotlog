export const metadata = { title: "Política de privacidade" };

export default function PrivacidadePage() {
  return (
    <div className="pt-32 pb-24 container max-w-3xl prose prose-invert">
      <h1>Política de privacidade</h1>
      <p>
        Esta política descreve como a Spotlog coleta, usa e protege dados
        pessoais conforme a Lei Geral de Proteção de Dados (LGPD — Lei
        13.709/2018).
      </p>

      <h2>1. Dados coletados</h2>
      <ul>
        <li>Dados de cadastro: nome, e-mail, telefone, empresa, cargo.</li>
        <li>Dados de uso: páginas visitadas, ações realizadas na plataforma.</li>
        <li>
          Dados de prospecção: informações públicas de empresas e profissionais
          (Google Maps, sites empresariais, perfis públicos do LinkedIn) e
          bases B2B com licenciamento adequado (Apollo).
        </li>
      </ul>

      <h2>2. Finalidade</h2>
      <p>
        Os dados são usados exclusivamente para operar a plataforma de
        prospecção, CRM e propostas, oferecer suporte e cumprir obrigações
        legais.
      </p>

      <h2>3. Compartilhamento</h2>
      <p>
        Não vendemos dados. Compartilhamos apenas com sub-processadores
        necessários ao funcionamento (Supabase, Vercel, provedores de IA, de
        e-mail e de WhatsApp), todos com seus próprios contratos de
        confidencialidade e LGPD.
      </p>

      <h2>4. Direitos do titular</h2>
      <ul>
        <li>Confirmação de tratamento</li>
        <li>Acesso aos dados</li>
        <li>Correção de dados</li>
        <li>Anonimização, bloqueio ou eliminação</li>
        <li>Portabilidade</li>
        <li>
          Revogação do consentimento — exercida diretamente no painel ou pelo
          e-mail privacidade@spotlog.com.br
        </li>
      </ul>

      <h2>5. Segurança</h2>
      <p>
        Banco de dados com Row Level Security multi-tenant, criptografia em
        trânsito (TLS) e em repouso. Credenciais de integrações guardadas
        cifradas. Acesso por perfis (owner, admin, manager, sdr, closer,
        viewer).
      </p>

      <h2>6. Retenção</h2>
      <p>
        Dados são mantidos enquanto a conta está ativa. Após cancelamento, o
        cliente tem 30 dias para exportar. Após esse prazo os dados são
        excluídos definitivamente, exceto quando houver obrigação legal de
        retenção.
      </p>

      <h2>7. Contato</h2>
      <p>
        DPO: privacidade@spotlog.com.br · Última atualização: maio/2026.
      </p>
    </div>
  );
}
