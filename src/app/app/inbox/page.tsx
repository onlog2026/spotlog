import { requireOrgModule } from "@/lib/entitlements";
import { InboxClient } from "@/components/app/inbox-client";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  await requireOrgModule("inbox"); // Eixo A — neutro enquanto enforcement OFF
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Atendimento WhatsApp</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          As conversas da Digisac ao vivo — receba e responda por aqui, sem entrar no painel da Digisac.
        </p>
      </div>
      <InboxClient />
    </div>
  );
}
