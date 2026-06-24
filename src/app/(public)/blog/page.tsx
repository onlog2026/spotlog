import type { Metadata } from "next";
import { getPublicPosts } from "@/lib/queries/cms";
import { PostCard } from "@/components/public/blog/post-card";
import { CategoryFilter } from "@/components/public/blog/category-filter";

export const metadata: Metadata = {
  title: "Blog | Spotlog",
  description:
    "Conteúdo Spotlog sobre logística inteligente, última milha, e-commerce, farma e operação de alta performance.",
  openGraph: {
    title: "Blog Spotlog",
    description: "Insights, cases e novidades sobre logística que funciona.",
    type: "website",
  },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const sp = await searchParams;
  const current = sp.cat ?? "todos";
  const posts = await getPublicPosts(current === "todos" ? undefined : current);

  return (
    <div>
      <section className="relative pt-32 lg:pt-44 pb-12 bg-gradient-soft hero-pattern overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="container relative">
          <div className="max-w-3xl">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-3">Blog</div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.1] text-balance">
              Conteúdo sobre logística que <span className="text-gradient-spotlog">de fato funciona</span>.
            </h1>
            <p className="mt-5 text-lg text-ink-600 leading-relaxed">
              Cases reais, aprendizados de operação e o que está mudando em e-commerce, farma e
              dermo.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container">
          <CategoryFilter current={current} />

          <div className="mt-8">
            {posts.length === 0 ? (
              <div className="bg-white border border-ink-200 rounded-2xl p-12 text-center">
                <p className="text-ink-600">Ainda não temos posts publicados nessa categoria.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
