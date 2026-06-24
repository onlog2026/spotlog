import Link from "next/link";
import { Phone, Mail, Instagram, MessageCircle, ArrowRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CtaBanner } from "@/components/public/cta-banner";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Contato — Solicitar proposta" };

async function isAdminUser(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin", "manager"])
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

const emails = [
  {
    label: "Contato Geral",
    value: "contato@spotlogoficial.com.br",
    href: "mailto:contato@spotlogoficial.com.br",
  },
  {
    label: "Comercial",
    value: "comercial@spotlogoficial.com.br",
    href: "mailto:comercial@spotlogoficial.com.br",
  },
  {
    label: "SAC",
    value: "sac@spotlogoficial.com.br",
    href: "mailto:sac@spotlogoficial.com.br",
  },
];

const PHONE = "(11) 91479-1442";
const PHONE_TEL = "tel:+5511914791442";
const WHATSAPP = "https://wa.me/5511914791442";

export default async function ContatoPage() {
  const showAdmin = await isAdminUser();
  return (
    <div>
      <section className="relative pt-32 lg:pt-44 pb-12 bg-gradient-soft hero-pattern">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-4">
              Contato comercial
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.1] text-balance">
              Vamos <span className="text-gradient-spotlog">conversar?</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-ink-600">
              Conta um pouco do seu negócio e nosso time desenha uma proposta
              sob medida pra você.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-16 lg:pb-24">
        <div className="container">
          {/* WhatsApp gigante */}
          <div className="max-w-3xl mx-auto mb-12">
            <Link
              href={WHATSAPP}
              target="_blank"
              className="block rounded-3xl bg-gradient-to-br from-[#25D366] to-[#128C7E] p-6 sm:p-8 lg:p-10 shadow-card hover:shadow-card-hover transition-shadow text-white text-center group"
            >
              <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-white/20 mb-4">
                <MessageCircle className="h-8 w-8" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                Fale agora pelo WhatsApp
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-white/90 mb-4">
                {PHONE} — resposta rápida do nosso time
              </p>
              <div className="inline-flex items-center gap-2 bg-white text-[#128C7E] font-bold px-5 sm:px-6 py-3 rounded-full group-hover:gap-3 transition-all">
                Abrir conversa
                <ArrowRight className="h-5 w-5" />
              </div>
            </Link>
          </div>

          {/* Telefone + Instagram */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-6">
            <a
              href={PHONE_TEL}
              className="card-glow p-6 text-center group"
            >
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl mb-4 bg-navy-50 group-hover:bg-navy-900 transition-colors">
                <Phone className="h-7 w-7 text-navy-900 group-hover:text-white transition-colors" />
              </div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-ink-500 mb-1">
                Telefone
              </div>
              <div className="text-base font-bold text-navy-900">
                {PHONE}
              </div>
            </a>

            <a
              href="https://instagram.com/spotlogoficial"
              target="_blank"
              rel="noopener noreferrer"
              className="card-glow p-6 text-center group"
            >
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl mb-4 bg-spotorange-50 group-hover:bg-spotorange-500 transition-colors">
                <Instagram className="h-7 w-7 text-spotorange-600 group-hover:text-white transition-colors" />
              </div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-ink-500 mb-1">
                Instagram
              </div>
              <div className="text-base font-bold text-navy-900">
                @spotlogoficial
              </div>
            </a>
          </div>

          {/* 3 e-mails — Contato Geral / Comercial / SAC */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {emails.map((e) => (
              <a
                key={e.value}
                href={e.href}
                className="card-glow p-6 text-center group"
              >
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl mb-4 bg-navy-50 group-hover:bg-navy-900 transition-colors">
                  <Mail className="h-7 w-7 text-navy-900 group-hover:text-white transition-colors" />
                </div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-ink-500 mb-1">
                  {e.label}
                </div>
                <div className="text-sm font-bold text-navy-900 break-all">
                  {e.value}
                </div>
              </a>
            ))}
          </div>

          {/* Botões secundários */}
          <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-3 justify-center max-w-3xl mx-auto">
            <Button variant="outline" size="lg" asChild>
              <a href={PHONE_TEL}>
                <Phone className="h-4 w-4" />
                Ligar agora
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="mailto:comercial@spotlogoficial.com.br">
                <Mail className="h-4 w-4" />
                Enviar e-mail
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a
                href="https://instagram.com/spotlogoficial"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-4 w-4" />
                Seguir no Instagram
              </a>
            </Button>
          </div>
        </div>
      </section>

      <CtaBanner />

      {showAdmin && (
        <div className="container pb-8">
          <Link
            href="/app/admin/forms"
            className="max-w-3xl mx-auto rounded-xl bg-navy-50 border border-navy-100 px-4 py-3 text-xs text-navy-900 hover:bg-navy-100 transition-colors flex items-center gap-2 justify-center"
          >
            <Settings className="h-3.5 w-3.5" />
            Você é admin — gerenciar formulários do site
          </Link>
        </div>
      )}
    </div>
  );
}
