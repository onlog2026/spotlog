import { HowItWorks } from "@/components/public/how-it-works";
import { Features } from "@/components/public/features";
import { CtaBanner } from "@/components/public/cta-banner";

export const metadata = { title: "Como funciona" };

export default function ComoFuncionaPage() {
  return (
    <div className="pt-32">
      <div className="container max-w-3xl text-center pb-8">
        <span className="inline-block text-sm font-medium text-brand-400 mb-3">
          Como funciona
        </span>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Da definição do ICP{" "}
          <span className="text-gradient">ao aceite da proposta.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Um fluxo único, contínuo, sem precisar trocar de ferramenta.
        </p>
      </div>
      <HowItWorks />
      <Features />
      <CtaBanner />
    </div>
  );
}
