import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicPostBySlug, getRelatedPosts } from "@/lib/queries/cms";
import { Markdown } from "@/components/public/blog/markdown";
import { PostCard } from "@/components/public/blog/post-card";

const categoryLabels: Record<string, string> = {
  blog: "Blog",
  case: "Case",
  news: "Novidade",
};

function fmt(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicPostBySlug(slug);
  if (!post) return { title: "Post não encontrado | Spotlog" };
  const title = post.seo_title ?? post.title;
  const description = post.seo_description ?? post.excerpt ?? "";
  return {
    title: `${title} | Spotlog`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: post.cover_url ? [{ url: post.cover_url }] : undefined,
      publishedTime: post.published_at ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.cover_url ? [post.cover_url] : undefined,
    },
  };
}

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublicPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.category, post.slug, 3);

  return (
    <article>
      <section className="relative pt-28 lg:pt-36 pb-12 bg-navy-950 overflow-hidden">
        {post.cover_url ? (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/40" />
          </div>
        ) : null}
        <div className="container relative">
          <div className="max-w-3xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar pro blog
            </Link>
            <span className="inline-flex items-center bg-spotorange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider mb-4">
              {categoryLabels[post.category] ?? post.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight text-balance">
              {post.title}
            </h1>
            {post.excerpt ? <p className="mt-5 text-lg text-white/80 leading-relaxed">{post.excerpt}</p> : null}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/70">
              {post.author_name ? <span>Por <strong className="text-white">{post.author_name}</strong></span> : null}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {fmt(post.published_at)}
              </span>
              {post.tags.length > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  {post.tags.join(", ")}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto bg-white">
            <Markdown>{post.content_md}</Markdown>
          </div>
        </div>
      </section>

      <section className="py-12 bg-navy-50 border-y border-ink-200">
        <div className="container max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-navy-900">
            Quer entregas com esse nível de cuidado?
          </h2>
          <p className="mt-3 text-ink-600">Fale com a gente e veja como a Spotlog pode operar pra você.</p>
          <div className="mt-6">
            <Button variant="orange" size="lg" asChild>
              <Link href="/contato">
                Solicitar proposta <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="py-12 lg:py-16">
          <div className="container">
            <h2 className="text-2xl md:text-3xl font-bold text-navy-900 mb-6">Continue lendo</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
