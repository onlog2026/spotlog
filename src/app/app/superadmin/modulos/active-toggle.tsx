"use client";

import { useState, useTransition } from "react";
import { toggleModuleActive } from "./actions";

export function ActiveToggle({
  moduleKey,
  initial,
}: {
  moduleKey: string;
  initial: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  function flip() {
    const next = !on;
    setOn(next); // otimista
    startTransition(async () => {
      try {
        await toggleModuleActive(moduleKey, next);
      } catch (e) {
        setOn(!next); // reverte
        alert((e as Error).message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={flip}
      disabled={pending}
      aria-pressed={on}
      className={
        "inline-flex h-6 w-11 items-center rounded-full transition " +
        (on ? "bg-green-500/80" : "bg-white/15") +
        (pending ? " opacity-50" : "")
      }
      title={on ? "Ativo no catálogo" : "Inativo (bloqueia o módulo em todas as orgs)"}
    >
      <span
        className={
          "h-5 w-5 rounded-full bg-white transition-transform " +
          (on ? "translate-x-5" : "translate-x-0.5")
        }
      />
    </button>
  );
}
