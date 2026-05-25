import { Features } from "@/components/public/features";
import { CtaBanner } from "@/components/public/cta-banner";

export const metadata = { title: "Recursos" };

export default function RecursosPage() {
  return (
    <div className="pt-32">
      <div className="container max-w-3xl text-center pb-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Tudo o que você precisa pra{" "}
          <span className="text-gradient">fechar mais negócios.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Sem juntar 7 ferramentas no Zapier rezando pra não quebrar.
        </p>
      </div>
      <Features />
      <CtaBanner />
    </div>
  );
}
