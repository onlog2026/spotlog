"use client";

import { useEffect, useState } from "react";
import { ServicePage } from "@/components/v3/ServicePage";
import { findService, type Service } from "@/components/v3/services-data";

/** Client island: registra window.openSpotlogService e renderiza o modal de serviço. */
export function ServiceModalHost({ serviceImages }: { serviceImages?: Record<string, string> }) {
  const [service, setService] = useState<Service | null>(null);

  useEffect(() => {
    const w = window as unknown as { openSpotlogService?: (id: string) => void };
    w.openSpotlogService = (id: string) => {
      const s = findService(id);
      if (s) {
        setService(s);
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    };
    return () => {
      delete w.openSpotlogService;
    };
  }, []);

  if (!service) return null;
  return (
    <ServicePage
      service={service}
      serviceImages={serviceImages}
      onClose={() => setService(null)}
      onOpen={(id) => {
        const s = findService(id);
        if (s) setService(s);
      }}
    />
  );
}
