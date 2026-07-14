import type { Metadata } from "next";
import "@/components/v3/spotlog-v3.css";
import { v3FontsClassName } from "@/lib/v3-fonts";

export const metadata: Metadata = {
  title: "Spotlog — Operador logístico completo para ecommerce, farma e crescimento",
  description:
    "Logística que entrega controle, não só pacote. Reduza prazos, diminua reclamações e aumente conversão com operação especializada em ecommerce, farma e produtos sensíveis em São Paulo e RMSP.",
  alternates: { canonical: "/nova" },
  openGraph: {
    title: "Spotlog — Operador logístico completo",
    description:
      "Logística que entrega controle, não só pacote. Same Day, Next Day, fulfillment, farma e distribuição em SP e RMSP.",
    type: "website",
    locale: "pt_BR",
    siteName: "Spotlog",
  },
};

export default function NovaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Fontes do design editorial v3 — self-hospedadas via next/font, sem bloquear render */}
      <span className={v3FontsClassName} style={{ display: "none" }} aria-hidden="true" />
      <div className="v3-root">{children}</div>
    </>
  );
}
