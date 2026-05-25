import { Hero } from "@/components/public/hero";
import { SocialProof } from "@/components/public/social-proof";
import { Features } from "@/components/public/features";
import { HowItWorks } from "@/components/public/how-it-works";
import { Pricing } from "@/components/public/pricing";
import { FAQ } from "@/components/public/faq";
import { CtaBanner } from "@/components/public/cta-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <SocialProof />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <CtaBanner />
    </>
  );
}
