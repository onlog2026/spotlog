import { V3Shell } from "@/components/v3/V3Shell";

/**
 * Layout das páginas públicas do grupo (public) — blog, cases, rastreamento,
 * abrangência, legais, etc. Usa a MESMA casca visual da home (V3Shell).
 *
 * O atendente (ChatWidget) agora é montado globalmente no layout RAIZ
 * (SiteChatMount) pra aparecer no site inteiro — inclusive home e páginas de
 * produto —, então NÃO é montado aqui de novo (evitaria duplicar o botão).
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <V3Shell>{children}</V3Shell>;
}
