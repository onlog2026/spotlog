import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Truck, MapPin } from "lucide-react";
import { SpotlogLogo } from "@/components/brand/spotlog-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Painel esquerdo com FOTO REAL do entregador Spotlog */}
      <div className="hidden lg:block relative overflow-hidden bg-navy-950">
        {/* Foto de fundo */}
        <Image
          src="/images/entregador-login.webp"
          alt="Entregador Spotlog entregando pedido ao cliente"
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        {/* Overlay gradiente azul navy pra dar contraste com texto branco */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/85 to-navy-950/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/70 to-transparent" />

        <div className="relative z-10 p-12 flex flex-col justify-between text-white h-full">
          <Link href="/" className="inline-block w-fit">
            <SpotlogLogo variant="full" light />
          </Link>

          <div className="space-y-6 max-w-md">
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight text-balance drop-shadow-lg">
              Logística que entrega <em className="text-spotorange-400 not-italic">controle</em>,
              não só pacote.
            </h2>
            <p className="text-ink-100 text-lg leading-relaxed drop-shadow-md">
              Acompanhe coletas, entregas, ocorrências, SLA e chamados em um
              único painel. Tudo conectado, do CD ao destinatário.
            </p>

            {/* CAIXA BRANCA com 3 benefícios — contraste perfeito sobre a foto */}
            <div className="bg-white rounded-2xl p-5 shadow-card space-y-3 text-navy-900">
              {[
                { icon: Truck, label: "Rastreamento em tempo real" },
                { icon: MapPin, label: "Cobertura em São Paulo e Grande SP" },
                { icon: CheckCircle2, label: "Atendimento humano + IA" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-spotorange-50 shrink-0">
                    <f.icon className="h-5 w-5 text-spotorange-600" />
                  </div>
                  <span className="text-sm font-semibold">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/80 drop-shadow">
            © {new Date().getFullYear()} Spotlog. Todos os direitos reservados.
          </p>
        </div>
      </div>

      <div className="flex flex-col px-6 py-12 lg:px-12 lg:py-16 justify-center">
        <Link href="/" className="lg:hidden inline-block mb-8 w-fit">
          <SpotlogLogo variant="full" />
        </Link>
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
