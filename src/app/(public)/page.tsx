import { Hero } from "@/components/public/hero";
import { QuemSomos } from "@/components/public/quem-somos";
import { SolucoesGrid } from "@/components/public/solucoes-grid";
import { Processo } from "@/components/public/processo";
import { CreativesShowcase } from "@/components/public/creatives-showcase";
import { Abrangencia } from "@/components/public/abrangencia";
import { ControleOperacional } from "@/components/public/controle-operacional";
import { Atendimento } from "@/components/public/atendimento";
import { InstallApp } from "@/components/public/install-app";
import { JornadaEntrega } from "@/components/public/jornada-entrega";
import { CtaBanner } from "@/components/public/cta-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <QuemSomos />
      <SolucoesGrid />
      <Processo />
      <CreativesShowcase />
      <Abrangencia />
      <ControleOperacional />
      <Atendimento />
      <InstallApp />
      <JornadaEntrega />
      <CtaBanner />
    </>
  );
}
