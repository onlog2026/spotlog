import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section className="py-24">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-purple-600 to-cyan-500 p-12 md:p-20 text-center">
          <div className="absolute inset-0 noise opacity-20" />
          <div className="absolute -top-24 -right-24 h-64 w-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-white/10 rounded-full blur-3xl" />

          <div className="relative max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Comece hoje. Tenha o agente rodando amanhã.
            </h2>
            <p className="mt-4 text-white/80 text-lg">
              Crie sua conta em 30 segundos. Conecte WhatsApp e e-mail. Defina
              um ICP. O agente cuida do resto.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="xl" variant="secondary" asChild>
                <Link href="/cadastro">
                  Testar grátis por 14 dias <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="xl"
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/contato">Falar com vendas</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
