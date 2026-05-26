import Link from "next/link";
import { Package, CheckCircle2, Truck, MapPin } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex relative bg-navy-950 overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-10" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-spotorange-500/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-navy-700/30 rounded-full translate-y-32 -translate-x-32 blur-3xl" />

        <div className="relative z-10 p-12 flex flex-col justify-between text-white w-full">
          <Link href="/" className="inline-flex items-center gap-2.5 group w-fit">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white">
              <Package className="h-6 w-6 text-spotorange-500" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-xl tracking-tight">Spotlog</span>
              <span className="text-[10px] text-ink-300 font-medium tracking-wide uppercase">
                Logística inteligente
              </span>
            </div>
          </Link>

          <div className="space-y-8 max-w-md">
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight text-balance">
              Logística que entrega <em className="text-spotorange-400">controle</em>,
              não só pacote.
            </h2>
            <p className="text-ink-300 text-lg leading-relaxed">
              Acompanhe coletas, entregas, ocorrências, SLA e chamados em um
              único painel. Tudo conectado, do CD ao destinatário.
            </p>

            <div className="space-y-3">
              {[
                { icon: Truck, label: "Rastreamento em tempo real" },
                { icon: MapPin, label: "Cobertura em São Paulo e Grande SP" },
                { icon: CheckCircle2, label: "Atendimento humano + IA" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 backdrop-blur">
                    <f.icon className="h-5 w-5 text-spotorange-400" />
                  </div>
                  <span className="text-sm">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-ink-400">
            © {new Date().getFullYear()} Spotlog. Todos os direitos reservados.
          </p>
        </div>
      </div>

      <div className="flex flex-col px-6 py-12 lg:px-12 lg:py-16 justify-center">
        <Link
          href="/"
          className="lg:hidden flex items-center gap-2.5 mb-8 group"
        >
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-navy-900">
            <Package className="h-6 w-6 text-spotorange-500" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-xl text-navy-900 tracking-tight">
              Spotlog
            </span>
            <span className="text-[10px] text-ink-500 font-medium tracking-wide uppercase">
              Logística inteligente
            </span>
          </div>
        </Link>
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
