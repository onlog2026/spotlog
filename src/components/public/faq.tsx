"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Preciso ter chave de OpenAI ou WhatsApp pra usar?",
    a: "Não pra começar. Você pode criar conta, configurar pipeline, importar contatos e usar todas as funções manuais. As funções automatizadas (mensagens com IA, disparo de WhatsApp, prospecção em massa) precisam que você conecte os provedores no painel admin. A gente recomenda OpenAI ou Anthropic pra IA, Resend pra e-mail e Evolution API ou Z-API pra WhatsApp.",
  },
  {
    q: "Como funciona a prospecção? É legal?",
    a: "Buscamos dados publicamente disponíveis (Google Maps, sites empresariais, perfis públicos do LinkedIn) e bases B2B legítimas como Apollo. Toda mensagem disparada inclui opção de opt-out, e a plataforma respeita a LGPD. Você é o responsável pelo conteúdo das mensagens — a gente dá a ferramenta.",
  },
  {
    q: "Vocês fazem o disparo em massa de spam?",
    a: "Não. Pelo contrário: a plataforma limita por dia, varia janelas de horário, personaliza cada mensagem com base no contato e pausa cadências quando o lead responde ou pede pra parar. O objetivo é abordagem qualificada, não shotgun.",
  },
  {
    q: "Como funciona a importação da tabela de preços em Excel?",
    a: "Você sobe um arquivo .xlsx no painel. A gente identifica colunas (SKU, nome, descrição, preço, unidade), você confirma o mapeamento, e o catálogo fica disponível pra montar propostas. Pode subir várias tabelas — por cliente, por categoria, por sazonalidade.",
  },
  {
    q: "O formulário do meu site cai mesmo direto no CRM?",
    a: "Sim. A gente expõe um endpoint público (e um snippet HTML pronto). Você cola no seu site, o lead que enviar entra como 'lead novo' no funil, com UTMs preservadas, IP, página de origem. Pode atribuir automaticamente a um vendedor por regra (round-robin, por região, etc.).",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, sem multa, sem fidelidade. Cancela pelo próprio painel. Os dados ficam acessíveis pra você exportar por 30 dias após o cancelamento.",
  },
  {
    q: "Funciona com meu CRM atual (HubSpot, Pipedrive, RD)?",
    a: "Sim, via webhooks e API. Plano Pro pra cima tem integração nativa em desenvolvimento. Se você quiser que entrar como cliente importe da sua ferramenta atual, o time de onboarding ajuda nos primeiros 14 dias.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-24 md:py-32">
      <div className="container max-w-3xl">
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-medium text-brand-400 mb-3">
            Perguntas frequentes
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Tudo o que você quer saber{" "}
            <span className="text-gradient">antes de assinar.</span>
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="glass rounded-xl overflow-hidden border-white/10"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-medium">{f.q}</span>
                {open === i ? (
                  <Minus className="h-4 w-4 shrink-0" />
                ) : (
                  <Plus className="h-4 w-4 shrink-0" />
                )}
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300",
                  open === i
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {f.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
