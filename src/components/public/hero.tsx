"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Bot,
  MessagesSquare,
  Target,
  FileSpreadsheet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const pills = [
  { icon: Target, label: "Prospecção com IA" },
  { icon: MessagesSquare, label: "WhatsApp + E-mail" },
  { icon: FileSpreadsheet, label: "Propostas em 1 clique" },
  { icon: Bot, label: "Agente SDR 24/7" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 md:pt-44 md:pb-32">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36rem] -translate-x-1/2 rotate-[30deg] bg-gradient-brand opacity-30" />
      </div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center max-w-4xl mx-auto"
        >
          <Link
            href="/recursos"
            className="inline-flex items-center gap-2 rounded-full glass-strong px-4 py-1.5 text-xs font-medium mb-6 hover:bg-white/15 transition"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-brand">
              <Sparkles className="h-3 w-3 text-white" />
            </span>
            Novo: agente SDR que conversa por você no WhatsApp
            <ArrowRight className="h-3 w-3" />
          </Link>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            Pare de prospectar no braço.
            <br />
            <span className="text-gradient">
              Deixe a IA encontrar e abrir conversas
            </span>{" "}
            com os decisores certos.
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
            SDR.AI encontra leads no Google, LinkedIn e bases B2B, identifica o
            decisor, escreve a abordagem certa e dispara por e-mail e WhatsApp.
            Quando o lead responde, cai direto no seu CRM com a proposta pronta
            pra fechar.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
            <Button variant="gradient" size="xl" asChild>
              <Link href="/cadastro">
                Começar agora <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <Link href="/como-funciona">
                Ver como funciona
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            14 dias grátis · Sem cartão · Cancele quando quiser
          </p>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl w-full">
            {pills.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="glass rounded-lg px-3 py-2.5 flex items-center gap-2 text-xs"
              >
                <Icon className="h-4 w-4 text-brand-400 shrink-0" />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 relative max-w-6xl mx-auto"
        >
          <DashboardMock />
        </motion.div>
      </div>
    </section>
  );
}

function DashboardMock() {
  return (
    <div className="relative rounded-2xl glass-strong overflow-hidden shadow-2xl shadow-brand-500/20">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-amber-500/70" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
        </div>
        <div className="ml-4 text-xs text-muted-foreground">
          app.spotlog.com.br/pipeline
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 p-6 bg-gradient-to-br from-slate-950 to-slate-900">
        <aside className="col-span-3 space-y-3">
          {[
            { label: "Leads novos", value: "127", trend: "+18%" },
            { label: "Conversas abertas", value: "43", trend: "+22%" },
            { label: "Propostas enviadas", value: "9", trend: "+5%" },
            { label: "Receita no pipeline", value: "R$ 412k", trend: "+31%" },
          ].map((m) => (
            <div
              key={m.label}
              className="glass rounded-lg p-3 flex flex-col gap-0.5"
            >
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {m.label}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold">{m.value}</span>
                <span className="text-[10px] text-emerald-400">{m.trend}</span>
              </div>
            </div>
          ))}
        </aside>

        <div className="col-span-9 grid grid-cols-4 gap-3">
          {[
            { name: "Novos", count: 12, color: "from-slate-500 to-slate-700" },
            { name: "Contato", count: 8, color: "from-blue-500 to-blue-700" },
            { name: "Proposta", count: 5, color: "from-purple-500 to-purple-700" },
            { name: "Negociação", count: 3, color: "from-pink-500 to-pink-700" },
          ].map((stage, i) => (
            <div key={stage.name} className="glass rounded-lg p-2 space-y-2 min-h-[200px]">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium">{stage.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">
                  {stage.count}
                </span>
              </div>
              {Array.from({ length: Math.min(stage.count, 3) }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-md bg-slate-800/60 border border-white/5 p-2 space-y-1"
                >
                  <div className={`h-1 w-full rounded bg-gradient-to-r ${stage.color}`} />
                  <div className="h-2 w-20 rounded bg-white/10" />
                  <div className="h-2 w-14 rounded bg-white/5" />
                  <div className="flex items-center justify-between pt-1">
                    <div className="h-3 w-3 rounded-full bg-gradient-brand" />
                    <span className="text-[10px] text-emerald-400 font-medium">
                      R$ {(((i + 1) * 12) + idx * 3)}k
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -top-12 -right-12 h-64 w-64 bg-gradient-brand rounded-full blur-3xl opacity-30" />
      <div className="absolute -bottom-12 -left-12 h-64 w-64 bg-cyan-500 rounded-full blur-3xl opacity-20" />
    </div>
  );
}
