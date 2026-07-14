"use client";

import { useEffect, useRef, useState } from "react";

/** Animate a number from `start` → `target` when the element enters the viewport. */
export function useCountUp(
  target: number,
  { duration = 1600, decimals = 0, start = 0 }: { duration?: number; decimals?: number; start?: number } = {},
): [React.RefObject<HTMLDivElement | null>, string] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [val, setVal] = useState(start);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !done.current) {
            done.current = true;
            const t0 = performance.now();
            const tick = (now: number) => {
              const p = Math.min(1, (now - t0) / duration);
              const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
              setVal(start + (target - start) * eased);
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration, start]);

  const display =
    decimals > 0
      ? val.toFixed(decimals).replace(".", ",")
      : Math.round(val).toLocaleString("pt-BR");
  return [ref, display];
}

/** Reveal-on-scroll: returns [ref, hasBeenSeen]. */
export function useInView(
  threshold = 0.2,
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setSeen(true);
        });
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen];
}
