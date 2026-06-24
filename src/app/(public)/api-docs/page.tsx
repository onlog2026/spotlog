import type { Metadata } from "next";
import { ApiDocsClient } from "@/components/api-docs/api-docs-client";

export const metadata: Metadata = {
  title: "Spotlog Public API v1 — Documentação",
  description:
    "Documentação oficial da Spotlog Public API. Crie leads, contatos, empresas, deals, agendamentos e tickets via REST com bearer token.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-static";

export default function ApiDocsPage() {
  return <ApiDocsClient />;
}
