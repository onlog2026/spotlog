import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { DynamicForm } from "@/components/public/dynamic-form";
import { getFormBySlug } from "@/lib/forms/queries";

export const dynamic = "force-dynamic";

export default async function StandaloneFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const form = await getFormBySlug(slug);
  if (!form) notFound();

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <Image src="/spotlog.png" alt="Spotlog" width={120} height={32} priority />
        </Link>
        <div className="bg-white rounded-3xl shadow-card border border-navy-100 p-6 md:p-10">
          <DynamicForm slug={slug} theme="light" />
        </div>
        <p className="text-center text-xs text-ink-500 mt-6">
          Formulario seguro Spotlog — seus dados sao tratados conforme a LGPD.
        </p>
      </div>
    </main>
  );
}
