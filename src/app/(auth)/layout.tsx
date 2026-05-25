import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex relative overflow-hidden bg-gradient-to-br from-brand-700 via-purple-700 to-cyan-600">
        <div className="absolute inset-0 noise opacity-20" />
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative z-10 p-12 flex flex-col justify-between text-white">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 backdrop-blur">
              <Sparkles className="h-5 w-5" />
            </div>
            Spotlog
          </Link>

          <div className="space-y-6 max-w-md">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              A operação comercial que <em>não para de produzir</em>.
            </h2>
            <p className="text-white/80">
              Você define o ICP. O agente prospecta, escreve, dispara, organiza
              o funil e te avisa quando tem reunião pra fechar.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-6">
              {[
                { v: "3.2x", l: "+ reuniões" },
                { v: "47%", l: "- CAC" },
                { v: "12h", l: "economizadas / sem" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-2xl font-bold">{s.v}</div>
                  <div className="text-xs text-white/70 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} Spotlog — Feito no Brasil.
          </p>
        </div>
      </div>

      <div className="flex flex-col p-8 md:p-12 justify-center">
        <Link
          href="/"
          className="md:hidden flex items-center gap-2 font-bold mb-8"
        >
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-brand">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-gradient">Spotlog</span>
        </Link>
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
