import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getFormByIdForAdmin, getSubmissions } from "@/lib/forms/queries";
import { SubmissionsTable } from "@/components/admin/forms/submissions-table";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await requireSession();
  const form = await getFormByIdForAdmin(id, ctx.org.id);
  if (!form) notFound();

  const submissions = await getSubmissions(id, ctx.org.id, {
    limit: 100,
    search: sp.q,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/app/admin/forms"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">
            Respostas — {form.definition.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {submissions.length} submissoes mostradas
          </p>
        </div>
      </div>

      <SubmissionsTable submissions={submissions} fields={form.fields} />
    </div>
  );
}
