import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { getSiteFavicon } from "@/lib/site-branding";
import { SiteChatMount } from "@/components/public/chat-widget/site-chat-mount";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

function resolveBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  const cleaned = raw.replace(/^﻿/, "").trim();
  try {
    return new URL(cleaned).toString();
  } catch {
    return "http://localhost:3000";
  }
}

export const viewport: Viewport = {
  themeColor: "#011960", // azul institucional Spotlog
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

// generateMetadata (não `const metadata`) para resolver o favicon do SITE do CMS.
// O layout do /app sobrescreve `icons` com o favicon do PAINEL ADMIN.
export async function generateMetadata(): Promise<Metadata> {
  const favicon = (await getSiteFavicon()) ?? "/logo-simbolo.png";
  return {
    metadataBase: new URL(resolveBaseUrl()),
    title: {
      default: "Spotlog — Logística inteligente com rastreamento total",
      template: "%s | Spotlog",
    },
    description:
      "Logística para e-commerce, farma, manipulação e operações B2B com rastreabilidade, atendimento integrado e controle operacional em tempo real.",
    keywords: [
      "Spotlog", "logística", "entregas", "e-commerce", "farma",
      "manipulação", "correlatos", "rastreamento", "coleta programada",
      "rota dedicada", "São Paulo", "motoboy", "express",
    ],
    authors: [{ name: "Spotlog" }],
    manifest: "/manifest.json",
    applicationName: "Spotlog",
    appleWebApp: {
      capable: true,
      title: "Spotlog",
      statusBarStyle: "default",
    },
    icons: { icon: favicon, apple: favicon, shortcut: favicon },
    openGraph: {
      title: "Spotlog — Logística inteligente",
      description:
        "Entregas para e-commerce, farma, manipulação e correlatos com rastreabilidade ponta a ponta.",
      type: "website",
      locale: "pt_BR",
      siteName: "Spotlog",
      url: "/",
      images: [
        { url: "/logo-spotlog.png", width: 1200, height: 630, alt: "Spotlog — Logística inteligente" },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Spotlog — Logística inteligente",
      images: ["/logo-spotlog.png"],
    },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL || "https://www.spotlog.com.br"
  ).replace(/\/$/, "");
  // Dados estruturados (JSON-LD) — ajuda Google e buscas de IA a entenderem
  // quem é a Spotlog e a habilitar rich results / caixa de busca do site.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: "Spotlog",
        url: base,
        logo: `${base}/logo-spotlog.png`,
        description:
          "Operador logístico para e-commerce, farma, manipulação e operações B2B em São Paulo e região, com rastreabilidade ponta a ponta.",
        areaServed: "São Paulo e Região Metropolitana",
        sameAs: [
          "https://www.instagram.com/spotlogoficial/",
          "https://www.facebook.com/spotlogoficial",
          "https://gt.linkedin.com/company/spotlog",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+55-11-97834-8288",
          contactType: "sales",
          areaServed: "BR",
          availableLanguage: "Portuguese",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: "Spotlog",
        publisher: { "@id": `${base}/#organization` },
        inLanguage: "pt-BR",
      },
    ],
  };
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  return (
    <html lang="pt-BR" suppressHydrationWarning className="overflow-x-hidden">
      <body className={`${inter.variable} font-sans bg-background text-foreground w-full overflow-x-hidden`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        <ThemeProvider initialTheme="light">
          {children}
          <Toaster />
          <SiteChatMount />
        </ThemeProvider>
      </body>
    </html>
  );
}
