import { createClient } from "@/lib/supabase/server";

export type CmsPost = {
  id: string;
  organization_id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string;
  cover_url: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  category: "blog" | "case" | "news";
  tags: string[];
  status: "rascunho" | "publicado" | "arquivado";
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type CmsCase = {
  id: string;
  organization_id: string;
  slug: string;
  client_name: string;
  segment: "ecommerce" | "farma" | "manipulacao" | "correlatos" | "dermo" | "outro";
  summary: string | null;
  challenge_md: string;
  solution_md: string;
  results_md: string;
  kpi_json: Record<string, string>;
  logo_url: string | null;
  hero_url: string | null;
  status: "rascunho" | "publicado" | "arquivado";
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

// ---------- ADMIN (todos da org) ----------

export async function getPostsAdmin(orgId: string): Promise<CmsPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_posts")
    .select("*")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false });
  return (data ?? []) as unknown as CmsPost[];
}

export async function getPostAdmin(orgId: string, id: string): Promise<CmsPost | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_posts")
    .select("*")
    .eq("organization_id", orgId)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as CmsPost) ?? null;
}

export async function getCasesAdmin(orgId: string): Promise<CmsCase[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_cases")
    .select("*")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false });
  return (data ?? []) as unknown as CmsCase[];
}

export async function getCaseAdmin(orgId: string, id: string): Promise<CmsCase | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_cases")
    .select("*")
    .eq("organization_id", orgId)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as CmsCase) ?? null;
}

export async function getCmsDashboardKpis(orgId: string) {
  const supabase = await createClient();
  const [postsPub, postsRas, casesPub, casesRas] = await Promise.all([
    supabase.from("cms_posts").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "publicado"),
    supabase.from("cms_posts").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "rascunho"),
    supabase.from("cms_cases").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "publicado"),
    supabase.from("cms_cases").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "rascunho"),
  ]);
  return {
    postsPublicados: postsPub.count ?? 0,
    postsRascunho: postsRas.count ?? 0,
    casesPublicados: casesPub.count ?? 0,
    casesRascunho: casesRas.count ?? 0,
    viewsMock: 0,
  };
}

export async function getRecentPosts(orgId: string, limit = 5): Promise<CmsPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_posts")
    .select("*")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as CmsPost[];
}

// ---------- PUBLIC (anon, só publicados via RLS) ----------

export async function getPublicPosts(filterCategory?: string): Promise<CmsPost[]> {
  const supabase = await createClient();
  let q = supabase
    .from("cms_posts")
    .select("*")
    .eq("status", "publicado")
    .order("published_at", { ascending: false });
  if (filterCategory && filterCategory !== "todos") q = q.eq("category", filterCategory);
  const { data } = await q;
  return (data ?? []) as unknown as CmsPost[];
}

export async function getPublicPostBySlug(slug: string): Promise<CmsPost | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_posts")
    .select("*")
    .eq("status", "publicado")
    .eq("slug", slug)
    .maybeSingle();
  return (data as unknown as CmsPost) ?? null;
}

export async function getRelatedPosts(category: string, excludeSlug: string, limit = 3): Promise<CmsPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_posts")
    .select("*")
    .eq("status", "publicado")
    .eq("category", category)
    .neq("slug", excludeSlug)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as CmsPost[];
}

export async function getPublicCases(): Promise<CmsCase[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_cases")
    .select("*")
    .eq("status", "publicado")
    .order("published_at", { ascending: false });
  return (data ?? []) as unknown as CmsCase[];
}

export async function getPublicCaseBySlug(slug: string): Promise<CmsCase | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_cases")
    .select("*")
    .eq("status", "publicado")
    .eq("slug", slug)
    .maybeSingle();
  return (data as unknown as CmsCase) ?? null;
}
