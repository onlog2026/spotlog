import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  PackageSearch,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Timeline } from "@/components/public/tracking/timeline";
import { TrackingSearchBar } from "@/components/public/tracking/tracking-search-bar";
import {
  formatDateBR,
  formatDateOnlyBR,
  getStatusConfig,
  isFinalStatus,
} from "@/components/public/tracking/status-config";
import { getPublicShipmentTracking } from "@/lib/queries/tracking-public";

interface PageProps {
  params: Promise<{ codigo: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { codigo } = await params;
  const safe = decodeURIComponent(codigo).toUpperCase();
  return {
    title: `Rastreio #${safe} | Spotlog`,
    description: `Acompanhe o status, previsão e histórico da entrega ${safe} em tempo real pela Spotlog.`,
    robots: { index: false, follow: false }, // página de rastreio não vai pra index do Google
  };
}

export default async function RastrearPage({ params }: PageProps) {
  const { codigo } = await params;
  const code = decodeURIComponent(codigo);
  const data = await getPublicShipmentTracking(code);

  if (!data) {
    return <NotFoundView code={code.toUpperCase()} />;
  }

  const statusCfg = getStatusConfig(data.status);
  const StatusIcon = statusCfg.icon;
  const final = isFinalStatus(data.status);
  const delivered = data.status === "entregue" && data.delivered_at;

  return (
    <div className="bg-gradient-soft">
      {/* Topo: branding + busca rápida */}
      <section className="border-b border-ink-200 bg-white">
        <div className="container py-6 pt-28 lg:pt-32">
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_minmax(0,420px)]">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900 hover:text-navy-700"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-spotorange-500 text-white shadow-orange-glow">
                  <PackageSearch className="h-4 w-4" />
                </span>
                Spotlog Rastreio
              </Link>
              <span className="hidden text-xs text-ink-400 sm:inline">/</span>
              <span className="hidden font-mono text-xs text-ink-500 sm:inline">
                #{data.code}
              </span>
            </div>
            <TrackingSearchBar defaultValue={data.code} size="sm" />
          </div>
        </div>
      </section>

      {/* Cabeçalho do pedido */}
      <section className="py-10 lg:py-14">
        <div className="container">
          <div
            className={`relative overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-card`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-1.5 ${statusCfg.bg}`}
              aria-hidden
            />
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:p-10">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${statusCfg.badge} ${statusCfg.badgeText}`}
                  >
                    <StatusIcon className="h-4 w-4" />
                    {statusCfg.label}
                  </span>
                  <span className="font-mono text-xs text-ink-500">
                    #{data.code}
                  </span>
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy-950 lg:text-4xl">
                  {delivered ? (
                    <>
                      Entrega <span className="text-emerald-600">concluída</span>
                    </>
                  ) : final ? (
                    <>Pedido finalizado</>
                  ) : (
                    <>
                      Sua entrega está{" "}
                      <span className={statusCfg.text}>
                        {statusCfg.short.toLowerCase()}
                      </span>
                    </>
                  )}
                </h1>
                <p className="mt-2 text-ink-600">
                  Destinatário <strong>{data.recipient_name_masked || "—"}</strong>
                  {data.destination_city && (
                    <>
                      {" "}
                      · destino{" "}
                      <strong>
                        {data.destination_city}
                        {data.destination_uf ? `/${data.destination_uf}` : ""}
                      </strong>
                    </>
                  )}
                </p>

                <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-500">
                      Postado em
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-navy-900">
                      {formatDateOnlyBR(data.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-500">
                      Previsão de entrega
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-navy-900">
                      {data.sla_deadline ? formatDateBR(data.sla_deadline) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-500">
                      Embarcador
                    </dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-navy-900">
                      {data.org_logo_url ? (
                        <Image
                          src={data.org_logo_url}
                          alt={data.org_name ?? ""}
                          width={20}
                          height={20}
                          className="h-5 w-5 rounded object-contain"
                        />
                      ) : null}
                      {data.org_name ?? "Spotlog"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="lg:w-72">
                {delivered ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="text-sm font-bold text-emerald-800">
                        Entregue
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-emerald-900">
                      {formatDateBR(data.delivered_at)}
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                      Conferência com foto e assinatura digital.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-spotorange-200 bg-spotorange-50 p-5">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-spotorange-600" />
                      <p className="text-sm font-bold text-spotorange-800">
                        Previsão
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-spotorange-900">
                      {data.sla_deadline
                        ? formatDateBR(data.sla_deadline)
                        : "Em processamento"}
                    </p>
                    <p className="mt-1 text-xs text-spotorange-700">
                      Spotlog cumpre SLA contratual. Acompanhe abaixo.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline + cards laterais */}
      <section className="pb-16 lg:pb-24">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div>
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-navy-950">
                <Truck className="h-5 w-5 text-spotorange-600" />
                Histórico de movimentações
              </h2>
              <Timeline events={data.events} currentStatus={data.status} />
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-navy-700" />
                  <p className="font-bold text-navy-900">Seus dados protegidos</p>
                </div>
                <p className="mt-2 text-sm text-ink-600">
                  Mostramos apenas as informações necessárias pra você
                  acompanhar a entrega. Endereço completo, CPF e telefone ficam
                  protegidos.
                </p>
              </div>

              <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-spotorange-600" />
                  <p className="font-bold text-navy-900">Onde a entrega vai</p>
                </div>
                <p className="mt-2 text-sm text-ink-600">
                  {data.destination_city ? (
                    <>
                      <strong>{data.destination_city}</strong>
                      {data.destination_uf ? `, ${data.destination_uf}` : ""}
                    </>
                  ) : (
                    "Destino em processamento"
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-navy-100 bg-navy-900 p-5 text-white shadow-card">
                <p className="text-sm font-bold">É a sua marca?</p>
                <p className="mt-1 text-sm text-ink-100">
                  Spotlog faz logística com transparência ponta a ponta — do
                  embarcador ao destinatário.
                </p>
                <Link href="/" className="mt-4 block">
                  <Button variant="orange" className="w-full">
                    Conheça a Spotlog
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

function NotFoundView({ code }: { code: string }) {
  return (
    <div className="bg-gradient-soft">
      <section className="border-b border-ink-200 bg-white">
        <div className="container py-6 pt-28 lg:pt-32">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-spotorange-500 text-white shadow-orange-glow">
              <PackageSearch className="h-4 w-4" />
            </span>
            Spotlog Rastreio
          </Link>
        </div>
      </section>
      <section className="py-20">
        <div className="container max-w-xl text-center">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-spotorange-100 text-spotorange-600">
            <PackageSearch className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-navy-950">
            Código não encontrado
          </h1>
          <p className="mt-3 text-ink-600">
            Não localizamos nenhuma entrega com o código{" "}
            <strong className="font-mono text-navy-900">#{code}</strong>. Confira
            se você digitou certo — atenção a letras maiúsculas/minúsculas e o
            traço.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <TrackingSearchBar defaultValue="" size="lg" />
          </div>
          <p className="mt-6 text-sm text-ink-500">
            Continua sem encontrar?{" "}
            <Link
              href="/atendimento"
              className="font-semibold text-spotorange-600 hover:underline"
            >
              Fale com o atendimento
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

// suspense fallback opcional via loading.tsx; aqui mantemos render direto (server component rápido).
// Revalidação curta pra refletir novos events sem virar SSG estático
export const revalidate = 30;
