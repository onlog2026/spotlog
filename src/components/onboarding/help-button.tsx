"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HelpCircle, BookOpen, MessageCircle, Sparkles, X } from "lucide-react";
import { resetTour } from "@/lib/onboarding/storage";
import { OnboardingTour } from "./onboarding-tour";

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const router = useRouter();

  function startTour() {
    resetTour();
    setOpen(false);
    setRunTour(true);
  }

  return (
    <>
      <OnboardingTour run={runTour} onFinish={() => setRunTour(false)} />

      <div
        className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2"
        data-tour="btn-ajuda"
      >
        {open && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-2 w-64 animate-in slide-in-from-bottom-2 fade-in">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-semibold" style={{ color: "#011960" }}>
                Precisa de ajuda?
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={startTour}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-sm"
            >
              <Sparkles className="h-4 w-4" style={{ color: "#011960" }} />
              <div className="flex-1">
                <div className="font-medium">Fazer tour</div>
                <div className="text-xs text-slate-500">2 minutos pelas principais funções</div>
              </div>
            </button>
            <Link
              href="/app/ajuda"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
            >
              <BookOpen className="h-4 w-4" style={{ color: "#011960" }} />
              <div className="flex-1">
                <div className="font-medium">Ver FAQ</div>
                <div className="text-xs text-slate-500">30+ perguntas frequentes</div>
              </div>
            </Link>
            <a
              href="https://wa.me/5511978348288?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20no%20Spotlog"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
            >
              <MessageCircle className="h-4 w-4" style={{ color: "#BA0102" }} />
              <div className="flex-1">
                <div className="font-medium">Falar com suporte</div>
                <div className="text-xs text-slate-500">WhatsApp da equipe</div>
              </div>
            </a>
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Ajuda"
          className="h-12 w-12 rounded-full shadow-xl text-white flex items-center justify-center hover:scale-105 transition-transform"
          style={{ background: "#011960" }}
        >
          <HelpCircle className="h-6 w-6" />
        </button>
      </div>
    </>
  );
}
