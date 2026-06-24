"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Package,
  MapPin,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Activity,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32 bg-gradient-soft hero-pattern">
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="container relative">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* TEXTO — agora coluna estreita à esquerda (igual ao print) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 order-2 lg:order-1"
          >
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-spotorange-50 px-4 py-1.5 border border-spotorange-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-spotorange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-spotorange-500"></span>
                </span>
                <span className="text-xs font-semibold text-spotorange-700">
                  Operação ativa em São Paulo e Grande SP
                </span>
              </div>
              <Link
                href="/farma"
                className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-4 py-1.5 border border-navy-900 hover:bg-navy-800 transition-colors"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-white" />
                <span className="text-xs font-semibold text-white">
                  AFE Anvisa — Transporte de Medicamentos
                </span>
              </Link>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-navy-950 leading-[1.05] text-balance">
              Logística que entrega{" "}
              <span className="text-spotorange-500">controle</span>,
              <br className="hidden sm:block" /> não só pacote.
            </h1>

            <p className="mt-6 text-base lg:text-lg text-ink-600 max-w-xl leading-relaxed">
              Acompanhe coletas, entregas, ocorrências, SLA e chamados em um único painel.
              Tudo conectado, do CD ao destinatário.
            </p>

            {/* mini-features estilo print */}
            <div className="mt-7 space-y-2.5 max-w-md">
              {[
                { icon: Truck, label: "Rastreamento em tempo real" },
                { icon: MapPin, label: "Cobertura em São Paulo e Grande SP" },
                { icon: Headphones, label: "Atendimento humano + IA" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-navy-50 border border-navy-100 shrink-0">
                    <f.icon className="h-4 w-4 text-spotorange-500" />
                  </div>
                  <span className="text-sm font-semibold text-navy-900">{f.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button variant="orange" size="xl" asChild>
                <Link href="/contato">
                  Falar com especialista
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link href="/rastreamento">
                  <MapPin className="h-5 w-5" />
                  Rastrear entrega
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              <div>
                <div className="text-2xl lg:text-3xl font-bold text-navy-900">+98%</div>
                <div className="text-xs text-ink-500 mt-1">Entregas com sucesso</div>
              </div>
              <div>
                <div className="text-2xl lg:text-3xl font-bold text-navy-900">+500k</div>
                <div className="text-xs text-ink-500 mt-1">Entregas realizadas</div>
              </div>
              <div>
                <div className="text-2xl lg:text-3xl font-bold text-navy-900">24/7</div>
                <div className="text-xs text-ink-500 mt-1">Atendimento dedicado</div>
              </div>
            </div>
          </motion.div>

          {/* FOTO — coluna mais larga à direita, sem cortar logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-7 relative order-1 lg:order-2"
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
      {/* Foto do entregador SPOTLOG — logos da van/polo/caixa visíveis */}
      <div className="relative aspect-[4/3] lg:aspect-[5/4] rounded-3xl overflow-hidden shadow-card bg-navy-100">
        <Image
          src="/creatives/spotlog-creative-3.png"
          alt="Entregador Spotlog em uniforme vermelho entregando caixa com logo, com van Spotlog ao fundo"
          fill
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover object-center"
          priority
        />
        {/* Overlay sutil só na base pra cards ficarem legíveis */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy-950/60 via-navy-950/15 to-transparent" />

        {/* Card sobre a foto: última entrega */}
        <div className="absolute bottom-5 left-5 right-5 lg:right-auto lg:max-w-sm z-10">
          <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-card border border-white/40">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-success-500 shrink-0">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-ink-500 font-medium">Última entrega</div>
                <div className="text-sm font-bold text-navy-900 truncate">
                  Pedido #SP-2046 entregue
                </div>
              </div>
              <div className="text-xs font-semibold text-success-700 shrink-0">há 2 min</div>
            </div>
          </div>
        </div>

        {/* Badge selo no canto superior direito (não tampa o entregador nem a van) */}
        <div className="absolute top-5 right-5 inline-flex items-center gap-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-soft">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success-500"></span>
          </span>
          <span className="text-[10px] font-bold text-navy-900 uppercase tracking-wider">
            Em operação
          </span>
        </div>
      </div>

      {/* Card flutuante esquerda: rastreamento (não tampa o sujeito) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="absolute -left-4 lg:-left-10 top-10 bg-white rounded-2xl shadow-card border border-ink-100 p-4 w-60 hidden md:block animate-float-y"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
            Rastreamento
          </span>
          <span className="text-[10px] font-bold text-success-700 bg-success-50 px-2 py-0.5 rounded-full">
            Em rota
          </span>
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

      {/* Card flutuante direita: métricas */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="absolute -right-4 lg:-right-8 top-1/3 bg-white rounded-2xl shadow-card border border-ink-100 p-4 w-52 hidden md:block"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
            Operação hoje
          </span>
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

      {/* Selo confiança canto inferior direito */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.9, type: "spring" }}
        className="absolute -bottom-6 right-6 lg:right-12 bg-gradient-to-br from-spotorange-500 to-spotorange-600 rounded-2xl shadow-orange-glow p-4 text-white w-40 hidden md:block z-20"
      >
        <ShieldCheck className="h-6 w-6 mb-2" />
        <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
          Operação
        </div>
        <div className="text-sm font-bold leading-tight">
          Rastreável<br />ponta a ponta
        </div>
      </motion.div>
    </div>
  );
}
