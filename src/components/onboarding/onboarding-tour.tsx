"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { CallBackProps, Step } from "react-joyride";
import { markTourCompleted } from "@/lib/onboarding/storage";

const Joyride = dynamic(() => import("react-joyride"), { ssr: false });

const STEPS: Step[] = [
  {
    target: '[data-tour="cat-crm"]',
    content:
      "Aqui ficam todas as áreas do sistema, agrupadas por cor. Cada categoria abre/fecha clicando no cabeçalho.",
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[data-tour="nav-leads"]',
    content: "Aqui você gerencia leads novos que chegam pelo site, chatbot ou form.",
    placement: "right",
  },
  {
    target: '[data-tour="nav-pipeline"]',
    content:
      "Visualize suas negociações em kanban — arraste pra mudar de etapa. Quando ganha um deal, sai confete!",
    placement: "right",
  },
  {
    target: '[data-tour="cat-marketing"]',
    content: "Crie landing pages, popups, campanhas e veja análises de cada canal.",
    placement: "right",
  },
  {
    target: '[data-tour="cat-operacao"]',
    content: "Cadastre motoristas, veículos, rotas e remessas. Acompanhe ocorrências em tempo real.",
    placement: "right",
  },
  {
    target: '[data-tour="nav-equipe"]',
    content: "Convide vendedores e SDRs pelo email. Define o role na hora.",
    placement: "right",
  },
  {
    target: '[data-tour="nav-aparencia"]',
    content: "Escolha tema claro, escuro, cinza ou azul neon. Personalize o painel do seu jeito.",
    placement: "right",
  },
  {
    target: '[data-tour="btn-ajuda"]',
    content:
      "Sempre que tiver dúvida, clica aqui. Tem FAQ, refazer este tour, e contato direto com o suporte.",
    placement: "left",
  },
];

const NAVY = "#011960";
const RED = "#BA0102";

export function OnboardingTour({
  run,
  onFinish,
}: {
  run: boolean;
  onFinish: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mq.matches);
    } catch {
      // ignore
    }
  }, []);

  // Só monta Joyride QUANDO está pra rodar — react-joyride pode crashar em React 19 RC
  // se for renderizado prematuramente
  if (!mounted || !run) return null;

  return (
    <Joyride
      steps={STEPS}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling={reducedMotion}
      disableOverlayClose
      locale={{
        back: "Voltar",
        close: "Fechar",
        last: "Concluir",
        next: "Próximo",
        skip: "Pular tour",
      }}
      styles={{
        options: {
          primaryColor: NAVY,
          textColor: "#1f2937",
          backgroundColor: "#ffffff",
          arrowColor: "#ffffff",
          overlayColor: "rgba(1, 25, 96, 0.55)",
          zIndex: 9999,
        },
        buttonNext: {
          background: NAVY,
          color: "#fff",
          borderRadius: 8,
          padding: "8px 16px",
        },
        buttonBack: {
          color: NAVY,
          marginRight: 8,
        },
        buttonSkip: {
          color: RED,
        },
        tooltip: {
          borderRadius: 12,
          padding: 16,
        },
      }}
      callback={(data: CallBackProps) => {
        const { status, type } = data;
        if (
          status === "finished" ||
          status === "skipped" ||
          type === "tour:end"
        ) {
          markTourCompleted();
          onFinish();
        }
      }}
    />
  );
}
