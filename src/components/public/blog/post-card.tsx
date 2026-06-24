import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CmsPost } from "@/lib/queries/cms";

function fmt(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

const categoryLabels: Record<string, string> = {
  blog: "Blog",
  case: "Case",
  news: "Novidade",
};

export function PostCard({ post }: { post: CmsPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-white border border-ink-200 rounded-2xl overflow-hidden shadow-soft hover:shadow-card hover:border-spotorange-500 transition-all"
    >
      <div className="relative aspect-[16/10] bg-navy-50 overflow-hidden">
        {post.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-ink-400 text-sm">Sem capa</div>
        )}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center bg-spotorange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {categoryLabels[post.category] ?? post.category}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg lg:text-xl font-bold text-navy-900 leading-snug group-hover:text-spotorange-600 transition-colors line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="mt-2 text-sm text-ink-600 leading-relaxed line-clamp-3">{post.excerpt}</p>
        ) : null}
        <div className="mt-4 flex items-center justify-between text-xs text-ink-500">
          <span>
            {post.author_name ? `${post.author_name} · ` : ""}
            {fmt(post.published_at)}
          </span>
          <span className="inline-flex items-center text-spotorange-600 font-semibold group-hover:gap-1.5 transition-all gap-1">
            Ler <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
