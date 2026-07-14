"use client";
import { usePathname } from "next/navigation";
import { ChatWidget } from "@/components/public/chat-widget";

/**
 * Monta o atendente (ChatWidget) em TODO o site público — home, páginas de
 * produto/segmento, blog, etc. — mas NUNCA no painel administrativo (/app).
 * Assim o botão de atendimento aparece pro visitante em qualquer página.
 */
export function SiteChatMount() {
  const pathname = usePathname();
  if (pathname?.startsWith("/app")) return null;
  return <ChatWidget />;
}
