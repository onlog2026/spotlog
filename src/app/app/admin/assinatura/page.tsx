import { requireSession } from "@/lib/auth";
import { AssinaturaForm } from "@/components/admin/assinatura-form";

export const dynamic = "force-dynamic";

export default async function AssinaturaPage() {
  await requireSession();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Assinatura de e-mail</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Preencha os dados, veja o resultado ao vivo e gere a assinatura em HTML (pra colar no
          Gmail/Outlook) ou em imagem PNG (pra onde HTML não funciona).
        </p>
      </div>
      <AssinaturaForm />
    </div>
  );
}
