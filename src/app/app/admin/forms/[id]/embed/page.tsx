import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getFormByIdForAdmin } from "@/lib/forms/queries";
import { EmbedSnippets } from "@/components/admin/forms/embed-snippets";

export const dynamic = "force-dynamic";

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireSession();
  const form = await getFormByIdForAdmin(id, ctx.org.id);
  if (!form) notFound();

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://spotlog-nine.vercel.app";

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/app/admin/forms"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Embed — {form.definition.title}</h1>
          <p className="text-xs text-muted-foreground font-mono">/forms/{form.definition.slug}</p>
        </div>
      </div>

      <EmbedSnippets baseUrl={baseUrl} slug={form.definition.slug} />
    </div>
  );
}
