import Link from "next/link";
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ShieldAlert,
  Building2,
  Scale,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth";
import {
  getComplianceKpis,
  hasAnvisaDocs,
} from "@/lib/queries/compliance";

export const dynamic = "force-dynamic";

export default async function ComplianceDashboardPage() {
  const { org } = await requireSession();
  const [kpis, anvisa] = await Promise.all([
    getComplianceKpis(org.id),
    hasAnvisaDocs(org.id),
  ]);

  const cards = [
    {
      label: "Documentos vigentes",
      value: kpis.vigentes,
      icon: CheckCircle2,
      tint:
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Documentos vencidos",
      value: kpis.vencidos,
      icon: ShieldAlert,
      tint: "bg-red-500/15 text-red-700 dark:text-red-300",
    },
    {
      label: "Em renovação",
      value: kpis.emRenovacao,
      icon: Clock,
      tint:
        "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    },
    {
      label: "Próx. vencimentos 30 dias",
      value: kpis.proximosVencimentos30d,
      icon: ClipboardCheck,
      tint: "bg-spotorange-500/15 text-spotorange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <section
        aria-label="Indicadores de compliance"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {cards.map((c) => (
          <Card
            key={c.label}
            className="border-transparent bg-card/50 hover:border-spotorange-500 transition"
          >
            <CardContent className="p-4">
              <div
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg mb-3 ${c.tint}`}
              >
                <c.icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="text-2xl font-bold leading-tight">{c.value}</div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {c.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <Card className="border-transparent bg-card/50 hover:border-spotorange-500 transition">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" aria-hidden="true" />
              LGPD — Lei Geral de Proteção de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Mantemos uma política pública e revisamos consentimentos
              periodicamente. Confira o checklist mínimo abaixo.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Consentimento explícito coletado em formulários públicos</li>
              <li>Opt-out disponível em e-mails e mensagens transacionais</li>
              <li>Base legal documentada por finalidade de tratamento</li>
              <li>
                Encarregado (DPO) designado quando exigido pelo porte da
                operação
              </li>
            </ul>
            <Button asChild variant="link" size="sm" className="px-0 h-auto">
              <Link href="/privacidade" aria-label="Ver política de privacidade">
                Ver política de privacidade →
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-transparent bg-card/50 hover:border-spotorange-500 transition">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Anvisa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {anvisa ? (
              <>
                <p className="text-muted-foreground">
                  Sua organização possui autorização Anvisa cadastrada. Confira
                  validade e renove antes do vencimento.
                </p>
                <Button asChild variant="link" size="sm" className="px-0 h-auto">
                  <Link
                    href="/app/compliance/documentos?docType=anvisa_aut"
                    aria-label="Ver autorizações Anvisa"
                  >
                    Ver autorizações Anvisa →
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Nenhuma autorização Anvisa cadastrada. Adicione em Documentos
                  quando obter.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href="/app/compliance/documentos"
                    aria-label="Cadastrar documento"
                  >
                    Cadastrar documento <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
