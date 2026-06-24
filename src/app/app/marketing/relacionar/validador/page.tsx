import { requireSession } from "@/lib/auth";
import { listEmailValidations } from "@/lib/queries/marketing-rel";
import { EmailValidatorForm } from "@/components/marketing/relacionar/email-validator-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ValidadorPage() {
  const ctx = await requireSession();
  const history = await listEmailValidations(ctx.org.id, 20);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Validador de E-mail</h2>
        <p className="text-sm text-muted-foreground">
          Valide listas antes de disparar — economize créditos e proteja sua reputação de envio.
        </p>
      </div>

      <EmailValidatorForm />

      {history.length > 0 && (
        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Histórico (últimos 20)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-white/10 rounded-md overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-t border-white/5">
                      <td className="p-2 font-mono">{h.email}</td>
                      <td className="p-2 capitalize">{h.status}</td>
                      <td className="p-2 text-muted-foreground">
                        {new Date(h.validated_at).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
