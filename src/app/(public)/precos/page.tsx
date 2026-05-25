import { Pricing } from "@/components/public/pricing";
import { FAQ } from "@/components/public/faq";
import { CtaBanner } from "@/components/public/cta-banner";

export const metadata = { title: "Preços" };

export default function PrecosPage() {
  return (
    <div className="pt-32">
      <div className="container max-w-3xl text-center pb-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Preços <span className="text-gradient">honestos.</span> Sem pegadinha.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Você só paga pelos usuários e volume que usa. Cancela quando quiser.
        </p>
      </div>
      <Pricing />
      <FAQ />
      <CtaBanner />
    </div>
  );
}
