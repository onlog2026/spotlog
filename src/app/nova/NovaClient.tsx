"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/v3/Header";
import { Hero } from "@/components/v3/Hero";
import { Beneficios } from "@/components/v3/Beneficios";
import { Processo } from "@/components/v3/Processo";
import { Focos } from "@/components/v3/Focos";
import { Integracoes } from "@/components/v3/Integracoes";
import { Showcase } from "@/components/v3/Showcase";
import { Dores } from "@/components/v3/Dores";
import { Portfolio } from "@/components/v3/Portfolio";
import { Cobertura } from "@/components/v3/Cobertura";
import { Rastreio } from "@/components/v3/Rastreio";
import { Blog } from "@/components/v3/Blog";
import { Cta } from "@/components/v3/Cta";
import { Footer } from "@/components/v3/Footer";
import { ServicePage } from "@/components/v3/ServicePage";
import { findService, type Service } from "@/components/v3/services-data";
import type { CardsBySection } from "@/components/v3/cms";

export function NovaClient({ cards }: { cards: CardsBySection }) {
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

  return (
    <>
      <Header />
      <main>
        <Hero content={cards.hero} />
        <Beneficios content={cards.beneficios} />
        <Processo content={cards.processo} />
        <Focos content={cards.focos} />
        <Integracoes content={cards.integracoes} />
        <Showcase content={cards.showcase} />
        <Dores content={cards.dores} />
        <Portfolio content={cards.portfolio} />
        <Cobertura content={cards.cobertura} />
        <Rastreio content={cards.rastreio} />
        <Blog content={cards.blog} />
        <Cta content={cards.cta} />
      </main>
      <Footer />

      {service && (
        <ServicePage
          service={service}
          onClose={() => setService(null)}
          onOpen={(id) => {
            const s = findService(id);
            if (s) setService(s);
          }}
        />
      )}
    </>
  );
}
