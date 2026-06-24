import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth";
import {
  listRegulatoryDocuments,
  type RegulatoryDocStatus,
  type RegulatoryDocType,
} from "@/lib/queries/compliance";
import {
  DocStatusBadge,
  DocTypeBadge,
  DOC_STATUS_OPTIONS,
  DOC_TYPE_OPTIONS,
} from "@/components/compliance/badges";
import { NovoDocumentoForm } from "@/components/compliance/novo-documento-form";

export const dynamic = "force-dynamic";

const DIAS_30_MS = 1000 * 60 * 60 * 24 * 30;

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("pt-BR");
}

function expiresClass(expiresAt: string | null) {
  if (!expiresAt) return "";
  const t = new Date(expiresAt).getTime();
  const now = Date.now();
  if (t < now) return "text-red-600 dark:text-red-400 font-semibold";
  if (t - now < DIAS_30_MS) return "text-amber-600 dark:text-amber-400 font-semibold";
  return "";
}

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ docType?: string; status?: string }>;
}) {
  const { org } = await requireSession();
  const params = await searchParams;
  const docType = (params.docType ?? "todos") as RegulatoryDocType | "todos";
  const status = (params.status ?? "todos") as RegulatoryDocStatus | "todos";

  const docs = await listRegulatoryDocuments(org.id, { docType, status });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Documentos regulatórios</h2>
          <p className="text-sm text-muted-foreground">
            {docs.length}{" "}
            {docs.length === 1 ? "documento" : "documentos"} encontrados
          </p>
        </div>
        <NovoDocumentoForm />
      </div>

      <Card className="border-transparent bg-card/50">
        <CardContent className="p-4">
          <form
            method="get"
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
            aria-label="Filtros de documentos"
          >
            <div>
              <label htmlFor="docType" className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Tipo
              </label>
              <select
                id="docType"
                name="docType"
                defaultValue={docType}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="todos">Todos os tipos</option>
                {DOC_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="todos">Todos os status</option>
                {DOC_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end justify-end">
              <Button type="submit" variant="orange" size="sm">
                Aplicar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-transparent bg-card/50">
        <CardContent className="p-0">
          {docs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum documento cadastrado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-y border-white/5">
                  <tr>
                    <th className="text-left py-2 px-4">Título</th>
                    <th className="text-left py-2 px-4">Tipo</th>
                    <th className="text-left py-2 px-4">Número</th>
                    <th className="text-left py-2 px-4">Emissor</th>
                    <th className="text-left py-2 px-4">Emitido</th>
                    <th className="text-left py-2 px-4">Validade</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Arquivo</th>
                    <th className="text-right py-2 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/5 transition"
                    >
                      <td className="py-3 px-4 font-medium">{d.title}</td>
                      <td className="py-3 px-4">
                        <DocTypeBadge type={d.doc_type} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                        {d.doc_number ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {d.issuer ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDate(d.issued_at)}
                      </td>
                      <td className={`py-3 px-4 ${expiresClass(d.expires_at)}`}>
                        {formatDate(d.expires_at)}
                      </td>
                      <td className="py-3 px-4">
                        <DocStatusBadge status={d.status} />
                      </td>
                      <td className="py-3 px-4">
                        {d.file_url ? (
                          <a
                            href={d.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-spotorange-500 hover:underline text-xs"
                            aria-label={`Abrir arquivo ${d.title}`}
                          >
                            Abrir <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link
                            href={`/app/compliance/documentos/${d.id}`}
                            aria-label={`Ver documento ${d.title}`}
                          >
                            Ver <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
