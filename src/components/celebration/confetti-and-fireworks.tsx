"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

type Props = {
  show: boolean;
  leadName?: string | null;
  userName?: string | null;
  durationMs?: number;
  onDone?: () => void;
};

const NAVY = "#011960";
const RED = "#BA0102";
const GOLD = "#F4C430";
const COLORS = [NAVY, RED, GOLD, "#10B981", "#7C3AED"];

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
}

/**
 * CelebrationOverlay — confetti + 3 fireworks bursts + modal congrats
 * Respeita prefers-reduced-motion (sem confetti, só modal estático).
 */
export function CelebrationOverlay({
  show,
  leadName,
  userName,
  durationMs = 4000,
  onDone,
}: Props) {
  const ranRef = useRef(false);

  useEffect(() => {
    if (!show) {
      ranRef.current = false;
      return;
    }
    if (ranRef.current) return;
    ranRef.current = true;

    const reduced = prefersReducedMotion();

    if (!reduced) {
      // Burst central inicial
      confetti({
        particleCount: 120,
        spread: 100,
        startVelocity: 45,
        origin: { x: 0.5, y: 0.5 },
        colors: COLORS,
      });

      // Fogos: 3 disparos em locais diferentes
      const shoots = [
        { delay: 250, x: 0.2, y: 0.4 },
        { delay: 600, x: 0.8, y: 0.35 },
        { delay: 1000, x: 0.5, y: 0.25 },
        { delay: 1400, x: 0.15, y: 0.55 },
        { delay: 1800, x: 0.85, y: 0.55 },
      ];
      shoots.forEach(({ delay, x, y }) => {
        setTimeout(() => {
          confetti({
            particleCount: 80,
            startVelocity: 35,
            spread: 360,
            ticks: 80,
            origin: { x, y },
            colors: COLORS,
            scalar: 1.1,
            shapes: ["circle", "square"],
          });
        }, delay);
      });

      // Chuva final
      setTimeout(() => {
        const end = Date.now() + 1200;
        const frame = () => {
          confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors: COLORS,
          });
          confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors: COLORS,
          });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
      }, 2200);
    }

    const t = setTimeout(() => {
      onDone?.();
    }, durationMs);
    return () => clearTimeout(t);
  }, [show, durationMs, onDone]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
      role="alertdialog"
      aria-live="assertive"
      aria-label="Lead convertido"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-300" />
      <div
        className="relative pointer-events-auto px-8 py-10 rounded-3xl shadow-2xl text-center max-w-md mx-4 animate-in zoom-in-95 fade-in duration-500"
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #1e3a8a 50%, ${RED} 100%)`,
          color: "white",
        }}
      >
        <div className="text-6xl mb-3 animate-bounce">🎉</div>
        <h2 className="text-3xl font-extrabold tracking-tight">LEAD CONVERTIDO!</h2>
        <p className="mt-3 text-lg opacity-95">
          {userName ? (
            <>
              Parabéns, <strong>{userName}</strong>!
            </>
          ) : (
            <>Parabéns!</>
          )}
        </p>
        {leadName ? (
          <p className="mt-1 text-sm opacity-90">
            <strong>{leadName}</strong> virou cliente.
          </p>
        ) : null}
        <div className="mt-6 text-xs opacity-75">Continue assim! 🚀</div>
      </div>
    </div>
  );
}

export default CelebrationOverlay;
