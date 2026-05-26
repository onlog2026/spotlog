import { Hero } from "@/components/public/hero";
import { QuemSomos } from "@/components/public/quem-somos";
import { SolucoesGrid } from "@/components/public/solucoes-grid";
import { Processo } from "@/components/public/processo";
import { Abrangencia } from "@/components/public/abrangencia";
import { ControleOperacional } from "@/components/public/controle-operacional";
import { Atendimento } from "@/components/public/atendimento";
import { CtaBanner } from "@/components/public/cta-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <QuemSomos />
      <SolucoesGrid />
      <Processo />
      <Abrangencia />
      <ControleOperacional />
      <Atendimento />
      <CtaBanner />
    </>
  );
}
