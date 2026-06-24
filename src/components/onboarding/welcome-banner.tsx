"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { hasCompletedTour, markTourCompleted, resetTour } from "@/lib/onboarding/storage";
import { OnboardingTour } from "./onboarding-tour";

export function WelcomeBanner() {
  const [show, setShow] = useState(false);
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    setShow(!hasCompletedTour());
  }, []);

  if (!show && !runTour) return null;

  return (
    <>
      <OnboardingTour
        run={runTour}
        onFinish={() => {
          setRunTour(false);
          setShow(false);
        }}
      />
      {show && !runTour && (
        <div
          className="rounded-xl p-4 md:p-5 border flex flex-col md:flex-row md:items-center gap-3 md:gap-4 text-white shadow-lg"
          style={{
            background: "linear-gradient(135deg, #011960 0%, #1e3a8a 100%)",
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="h-10 w-10 rounded-full bg-white/15 grid place-items-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-base">👋 Bem-vindo ao Spotlog!</div>
              <div className="text-sm text-white/85">
                Quer fazer um tour rápido pelas principais funções?
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                resetTour();
                setRunTour(true);
              }}
              className="px-4 py-2 rounded-lg bg-white font-medium text-sm hover:bg-white/90"
              style={{ color: "#011960" }}
            >
              Começar (2 min)
            </button>
            <button
              onClick={() => {
                markTourCompleted();
                setShow(false);
              }}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-white"
            >
              Pular
            </button>
            <button
              onClick={() => {
                markTourCompleted();
                setShow(false);
              }}
              aria-label="Fechar"
              className="p-2 rounded-lg hover:bg-white/10 text-white/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
