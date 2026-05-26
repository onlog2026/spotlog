"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Package,
  MapPin,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32 bg-gradient-soft hero-pattern">
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="container relative">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-spotorange-50 px-4 py-1.5 mb-6 border border-spotorange-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-spotorange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-spotorange-500"></span>
              </span>
              <span className="text-xs font-semibold text-spotorange-700">
                Operação ativa em São Paulo e região metropolitana
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.1] text-balance">
              Logística inteligente com{" "}
              <span className="text-gradient-spotlog">controle do início ao fim.</span>
            </h1>

            <p className="mt-6 text-lg lg:text-xl text-ink-600 max-w-2xl leading-relaxed">
              A Spotlog conecta <strong className="text-navy-900">tecnologia</strong>,{" "}
              <strong className="text-navy-900">atendimento</strong> e{" "}
              <strong className="text-navy-900">operação</strong> para empresas que precisam
              entregar com agilidade, rastreabilidade e segurança.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button variant="orange" size="xl" asChild>
                <Link href="/contato">
                  Falar com especialista
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link href="/solucoes">Ver soluções</Link>
              </Button>
              <Button variant="ghost" size="xl" asChild>
                <Link href="/rastreamento">
                  <MapPin className="h-5 w-5" />
                  Rastrear entrega
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              <div>
                <div className="text-3xl font-bold text-navy-900">+98%</div>
                <div className="text-xs text-ink-500 mt-1">Entregas com sucesso</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-navy-900">+500k</div>
                <div className="text-xs text-ink-500 mt-1">Entregas realizadas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-navy-900">24/7</div>
                <div className="text-xs text-ink-500 mt-1">Atendimento dedicado</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <HeroVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      <div className="relative aspect-[4/5] rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 overflow-hidden shadow-card">
        <div className="absolute inset-0 dot-grid opacity-20" />

        <svg
          viewBox="0 0 400 500"
          className="absolute inset-0 w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff7333" />
              <stop offset="100%" stopColor="#ff5410" />
            </linearGradient>
          </defs>

          <circle cx="280" cy="120" r="90" fill="#ff5410" opacity="0.12" />
          <circle cx="280" cy="120" r="60" fill="#ff7333" opacity="0.18" />

          <circle cx="190" cy="125" r="38" fill="#f5d4b8" />
          <path d="M 152 115 Q 152 80, 190 78 Q 228 80, 228 115 Z" fill="#ff5410" />
          <rect x="178" y="105" width="24" height="10" rx="2" fill="#1c2a83" opacity="0.4" />
          <rect x="178" y="155" width="24" height="20" fill="#f5d4b8" />

          <path
            d="M 130 175 Q 190 168, 250 175 L 260 320 L 120 320 Z"
            fill="url(#orangeGrad)"
          />
          <rect x="130" y="240" width="120" height="8" fill="white" opacity="0.5" />
          <rect x="130" y="270" width="120" height="6" fill="white" opacity="0.3" />

          <rect x="135" y="280" width="130" height="100" rx="6" fill="#fff5ed" stroke="#1c2a83" strokeWidth="2" />
          <rect x="135" y="280" width="130" height="30" rx="6" fill="#ffe7d3" />
          <rect x="170" y="325" width="60" height="6" rx="2" fill="#1c2a83" />
          <rect x="180" y="338" width="40" height="4" rx="2" fill="#1c2a83" opacity="0.5" />
          <circle cx="245" cy="295" r="10" fill="#1c2a83" />
          <text x="245" y="299" textAnchor="middle" fontSize="9" fill="#ff5410" fontWeight="bold">S</text>

          <path d="M 130 200 Q 110 250, 130 285" stroke="#1c2a83" strokeWidth="14" fill="none" strokeLinecap="round" />
          <path d="M 250 200 Q 270 250, 250 285" stroke="#1c2a83" strokeWidth="14" fill="none" strokeLinecap="round" />

          <rect x="125" y="190" width="14" height="80" rx="4" fill="#1c2a83" opacity="0.6" />
          <rect x="241" y="190" width="14" height="80" rx="4" fill="#1c2a83" opacity="0.6" />

          <circle cx="178" cy="128" r="2.5" fill="#1c2a83" />
          <circle cx="202" cy="128" r="2.5" fill="#1c2a83" />
          <path d="M 178 145 Q 190 152, 202 145" stroke="#1c2a83" strokeWidth="2" fill="none" strokeLinecap="round" />

          <path
            d="M 30 420 Q 100 380, 200 400 T 380 400"
            stroke="#ff5410" strokeWidth="2" fill="none" strokeDasharray="6 4" opacity="0.5"
          />
          <circle cx="30" cy="420" r="6" fill="#ff5410" />
          <circle cx="200" cy="400" r="8" fill="white" stroke="#ff5410" strokeWidth="3" />
          <circle cx="380" cy="420" r="6" fill="#ff5410" />

          <text x="30" y="445" fontSize="10" fill="white" opacity="0.7" fontWeight="500">Coleta</text>
          <text x="180" y="425" fontSize="10" fill="white" opacity="0.9" fontWeight="700">Em rota</text>
          <text x="345" y="445" fontSize="10" fill="white" opacity="0.7" fontWeight="500">Entrega</text>
        </svg>

        <div className="absolute bottom-6 left-6 right-6 z-10">
          <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-success-500">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-ink-500 font-medium">Última entrega</div>
                <div className="text-sm font-bold text-navy-900">
                  Pedido #SP-2046 entregue
                </div>
              </div>
              <div className="text-xs font-semibold text-success-700">há 2 min</div>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="absolute -left-4 lg:-left-12 top-12 bg-white rounded-2xl shadow-card border border-ink-100 p-4 w-64 hidden md:block animate-float-y"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-500">Rastreamento</span>
          <span className="text-[10px] font-bold text-success-700 bg-success-50 px-2 py-0.5 rounded-full">Em rota</span>
        </div>
        <div className="space-y-2.5">
          {[
            { icon: Package, label: "Pedido coletado", time: "08:14", done: true },
            { icon: Truck, label: "Em rota", time: "09:22", done: true, active: true },
            { icon: MapPin, label: "Entrega prevista", time: "10:30", done: false },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className={`grid h-7 w-7 place-items-center rounded-full shrink-0 ${s.done ? (s.active ? "bg-spotorange-500" : "bg-success-500") : "bg-ink-100"}`}>
                <s.icon className={`h-3.5 w-3.5 ${s.done ? "text-white" : "text-ink-400"}`} />
              </div>
              <div className="flex-1">
                <div className={`text-xs font-semibold ${s.done ? "text-navy-900" : "text-ink-400"}`}>{s.label}</div>
                <div className="text-[10px] text-ink-500">{s.time}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="absolute -right-4 lg:-right-12 bottom-24 bg-white rounded-2xl shadow-card border border-ink-100 p-4 w-56 hidden md:block"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-500">Operação hoje</span>
          <Activity className="h-4 w-4 text-spotorange-500" />
        </div>
        <div className="space-y-2.5">
          {[
            { label: "Coletas", value: "127", color: "text-navy-900" },
            { label: "Entregas", value: "294", color: "text-spotorange-600" },
            { label: "SLA cumprido", value: "98.4%", color: "text-success-700" },
          ].map((m, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-xs text-ink-600">{m.label}</span>
              <span className={`text-base font-bold ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.9, type: "spring" }}
        className="absolute -bottom-6 -right-2 bg-gradient-to-br from-spotorange-500 to-spotorange-600 rounded-2xl shadow-orange-glow p-4 text-white w-40 hidden md:block"
      >
        <ShieldCheck className="h-6 w-6 mb-2" />
        <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">Operação</div>
        <div className="text-sm font-bold leading-tight">Rastreável<br />ponta a ponta</div>
      </motion.div>
    </div>
  );
}
