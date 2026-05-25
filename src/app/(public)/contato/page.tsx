import { ContactForm } from "@/components/public/contact-form";
import { Mail, MessageCircle, MapPin } from "lucide-react";

export const metadata = { title: "Contato" };

export default function ContatoPage() {
  return (
    <div className="pt-32 pb-24">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Vamos <span className="text-gradient">conversar?</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Conta o que você precisa. Em até 1 dia útil um especialista te
            responde com proposta personalizada.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-strong rounded-xl p-6">
              <Mail className="h-5 w-5 text-brand-400 mb-3" />
              <h3 className="font-semibold mb-1">E-mail</h3>
              <p className="text-sm text-muted-foreground">
                contato@spotlog.com.br
              </p>
            </div>
            <div className="glass-strong rounded-xl p-6">
              <MessageCircle className="h-5 w-5 text-brand-400 mb-3" />
              <h3 className="font-semibold mb-1">WhatsApp</h3>
              <p className="text-sm text-muted-foreground">
                Falamos com você no canal preferido do seu time.
              </p>
            </div>
            <div className="glass-strong rounded-xl p-6">
              <MapPin className="h-5 w-5 text-brand-400 mb-3" />
              <h3 className="font-semibold mb-1">Onde estamos</h3>
              <p className="text-sm text-muted-foreground">
                São Paulo, Brasil. Atendimento 100% remoto pra todo o país.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="glass-strong rounded-xl p-6 md:p-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
