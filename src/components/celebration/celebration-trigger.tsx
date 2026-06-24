"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CelebrationOverlay } from "./confetti-and-fireworks";

type Props = {
  userName?: string | null;
};

/**
 * Detecta ?celebrate=1&name=... na URL e dispara o overlay por ~4s,
 * limpando a query string em seguida pra não disparar de novo.
 */
export function CelebrationTrigger({ userName }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const celebrate = sp.get("celebrate");
  const name = sp.get("name");
  const [showing, setShowing] = useState(false);

  useEffect(() => {
    if (celebrate === "1") {
      setShowing(true);
    }
  }, [celebrate]);

  function handleDone() {
    setShowing(false);
    // Limpa query string preservando outros params
    const params = new URLSearchParams(sp.toString());
    params.delete("celebrate");
    params.delete("name");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <CelebrationOverlay
      show={showing}
      leadName={name}
      userName={userName}
      onDone={handleDone}
    />
  );
}
