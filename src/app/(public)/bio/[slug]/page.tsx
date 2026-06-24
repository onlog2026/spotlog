import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type BioData = {
  bio: {
    id: string;
    slug: string;
    title: string;
    bio: string | null;
    avatar_url: string | null;
    theme: string;
  };
  links: { id: string; label: string; url: string; icon: string | null }[];
};

async function getBio(slug: string): Promise<BioData | null> {
  const supabase = createAdminClient();
  const { data: bio } = await supabase
    .from("link_in_bio")
    .select("id, slug, title, bio, avatar_url, theme, active")
    .eq("slug", slug)
    .maybeSingle();
  if (!bio || !(bio as { active: boolean }).active) return null;
  const { data: links } = await supabase
    .from("link_in_bio_links")
    .select("id, label, url, icon")
    .eq("bio_id", (bio as { id: string }).id)
    .eq("active", true)
    .order("sort", { ascending: true });
  return {
    bio: bio as BioData["bio"],
    links: (links ?? []) as BioData["links"],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = await getBio(slug);
  return { title: d?.bio.title ?? "Bio" };
}

export default async function PublicBioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = await getBio(slug);
  if (!d) notFound();

  const isBrand = d.bio.theme === "brand";
  const isDark = d.bio.theme === "dark";
  const bg = isBrand
    ? "bg-gradient-to-br from-[#011960] to-[#BA0102] text-white"
    : isDark
      ? "bg-zinc-950 text-white"
      : "bg-white text-navy-900";

  return (
    <main className={`min-h-screen ${bg} px-4 py-12`}>
      <div className="max-w-md mx-auto text-center space-y-6">
        {d.bio.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={d.bio.avatar_url}
            alt={d.bio.title}
            className="h-24 w-24 rounded-full mx-auto border-4 border-white/20 object-cover"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{d.bio.title}</h1>
          {d.bio.bio && <p className="text-sm opacity-80 mt-1">{d.bio.bio}</p>}
        </div>
        <div className="space-y-3">
          {d.links.map((l) => (
            <Link
              key={l.id}
              href={l.url}
              target="_blank"
              className={
                isBrand || isDark
                  ? "block rounded-lg bg-white/10 border border-white/15 hover:bg-white/15 py-3 px-4 font-medium transition"
                  : "block rounded-lg bg-navy-50 hover:bg-navy-100 border border-ink-200 py-3 px-4 font-medium transition"
              }
            >
              {l.label}
            </Link>
          ))}
          {d.links.length === 0 && (
            <p className="text-xs opacity-70">Nenhum link cadastrado ainda.</p>
          )}
        </div>
        <p className="text-[10px] opacity-60 pt-4">
          Powered by Spotlog
        </p>
      </div>
    </main>
  );
}
