import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

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

export const metadata: Metadata = {
  metadataBase: new URL(resolveBaseUrl()),
  title: {
    default:
      "Spotlog — Logística inteligente com controle do início ao fim",
    template: "%s | Spotlog",
  },
  description:
    "Logística para e-commerce, farma, manipulação, correlatos e operações B2B com rastreabilidade, atendimento integrado, controle operacional e tecnologia de ponta.",
  keywords: [
    "Spotlog",
    "logística",
    "entregas",
    "e-commerce",
    "farma",
    "manipulação",
    "correlatos",
    "rastreamento",
    "coleta programada",
    "rota dedicada",
    "São Paulo",
    "motoboy",
    "express",
  ],
  authors: [{ name: "Spotlog" }],
  openGraph: {
    title: "Spotlog — Logística inteligente",
    description:
      "Entregas para e-commerce, farma, manipulação e correlatos com rastreabilidade ponta a ponta.",
    type: "website",
    locale: "pt_BR",
    siteName: "Spotlog",
  },
  twitter: { card: "summary_large_image", title: "Spotlog — Logística inteligente" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
