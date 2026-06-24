"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Slug util — minúsculo, hifens, sem acento
function toSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseTags(raw: FormDataEntryValue | null): string[] {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

const postSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().optional(),
  excerpt: z.string().max(500).optional().nullable(),
  content_md: z.string().default(""),
  cover_url: z.string().url().optional().or(z.literal("")).nullable(),
  author_name: z.string().max(120).optional().nullable(),
  author_avatar_url: z.string().url().optional().or(z.literal("")).nullable(),
  category: z.enum(["blog", "case", "news"]).default("blog"),
  status: z.enum(["rascunho", "publicado", "arquivado"]).default("rascunho"),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(300).optional().nullable(),
});

function fdToPost(fd: FormData) {
  const obj = {
    title: String(fd.get("title") ?? ""),
    slug: fd.get("slug") ? String(fd.get("slug")) : undefined,
    excerpt: (fd.get("excerpt") as string) || null,
    content_md: String(fd.get("content_md") ?? ""),
    cover_url: (fd.get("cover_url") as string) || null,
    author_name: (fd.get("author_name") as string) || null,
    author_avatar_url: (fd.get("author_avatar_url") as string) || null,
    category: (fd.get("category") as "blog" | "case" | "news") || "blog",
    status: (fd.get("status") as "rascunho" | "publicado" | "arquivado") || "rascunho",
    seo_title: (fd.get("seo_title") as string) || null,
    seo_description: (fd.get("seo_description") as string) || null,
  };
  return postSchema.parse(obj);
}

export async function criarPost(fd: FormData) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const data = fdToPost(fd);
  const tags = parseTags(fd.get("tags"));
  const slug = toSlug(data.slug || data.title);
  const isPublishing = data.status === "publicado";

  const payload = {
    organization_id: ctx.org.id,
    created_by: ctx.user.id,
    title: data.title,
    slug,
    excerpt: data.excerpt ?? "",
    content_md: data.content_md,
    cover_url: data.cover_url || "",
    author_name: data.author_name ?? "",
    author_avatar_url: data.author_avatar_url || "",
    category: data.category,
    tags,
    status: data.status,
    published_at: isPublishing ? new Date().toISOString() : "",
    seo_title: data.seo_title ?? "",
    seo_description: data.seo_description ?? "",
  };

  // Try cms2_ RPC first (new, contorna cache PostgREST travado)
  const { error: rpc2Error } = await supabase.rpc("cms2_create_post", { p: payload });
  if (rpc2Error) {
    // Fallback 1: RPC antigo
    const { error: rpcError } = await supabase.rpc("cms_create_post", { p_payload: payload });
    if (rpcError) {
      // Fallback 2: insert direto na tabela
      const { error } = await supabase.from("cms_posts").insert({
        organization_id: ctx.org.id,
        created_by: ctx.user.id,
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content_md: data.content_md,
        cover_url: data.cover_url || null,
        author_name: data.author_name,
        author_avatar_url: data.author_avatar_url || null,
        category: data.category,
        tags,
        status: data.status,
        published_at: isPublishing ? new Date().toISOString() : null,
        seo_title: data.seo_title,
        seo_description: data.seo_description,
      });
      if (error) {
        throw new Error(
          `CMS indisponível (PostgREST cache travado). Restart Supabase em Settings → API → Restart. Detalhe: ${error.message}`,
        );
      }
    }
  }

  revalidatePath("/app/cms");
  revalidatePath("/app/cms/posts");
  if (isPublishing) {
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
  }
  redirect("/app/cms/posts");
}

export async function atualizarPost(id: string, fd: FormData) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const data = fdToPost(fd);
  const tags = parseTags(fd.get("tags"));
  const slug = toSlug(data.slug || data.title);

  const { data: current } = await supabase
    .from("cms_posts")
    .select("status, slug, published_at")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();

  const isNowPublishing =
    data.status === "publicado" && (current as { status?: string } | null)?.status !== "publicado";
  const newPublishedAt = isNowPublishing
    ? new Date().toISOString()
    : (current as { published_at?: string | null } | null)?.published_at ?? null;

  const payload = {
    title: data.title,
    slug,
    excerpt: data.excerpt ?? "",
    content_md: data.content_md,
    cover_url: data.cover_url ?? "",
    author_name: data.author_name ?? "",
    author_avatar_url: data.author_avatar_url ?? "",
    category: data.category,
    tags,
    status: data.status,
    seo_title: data.seo_title ?? "",
    seo_description: data.seo_description ?? "",
  };

  const { error: rpc2Error } = await supabase.rpc("cms2_update_post", {
    p_id: id,
    p_org: ctx.org.id,
    p: payload,
  });
  if (rpc2Error) {
    const { error } = await supabase
      .from("cms_posts")
      .update({
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content_md: data.content_md,
        cover_url: data.cover_url || null,
        author_name: data.author_name,
        author_avatar_url: data.author_avatar_url || null,
        category: data.category,
        tags,
        status: data.status,
        published_at: data.status === "publicado" ? newPublishedAt : null,
        seo_title: data.seo_title,
        seo_description: data.seo_description,
      })
      .eq("id", id)
      .eq("organization_id", ctx.org.id);
    if (error) {
      throw new Error(
        `CMS indisponível (PostgREST cache travado). Restart Supabase em Settings → API → Restart. Detalhe: ${error.message}`,
      );
    }
  }

  revalidatePath("/app/cms");
  revalidatePath("/app/cms/posts");
  revalidatePath(`/app/cms/posts/${id}/editar`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  const oldSlug = (current as { slug?: string } | null)?.slug;
  if (oldSlug && oldSlug !== slug) revalidatePath(`/blog/${oldSlug}`);
  redirect("/app/cms/posts");
}

export async function excluirPost(id: string) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("cms_posts")
    .delete()
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/cms");
  revalidatePath("/app/cms/posts");
  revalidatePath("/blog");
}

export async function publicarPost(id: string) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("cms_posts")
    .select("slug, status, published_at")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!current) throw new Error("Post não encontrado");
  const c = current as { slug: string; status: string; published_at: string | null };
  const newStatus = c.status === "publicado" ? "rascunho" : "publicado";
  const newPub = newStatus === "publicado" ? c.published_at ?? new Date().toISOString() : null;
  const { error } = await supabase
    .from("cms_posts")
    .update({ status: newStatus, published_at: newPub })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/cms");
  revalidatePath("/app/cms/posts");
  revalidatePath("/blog");
  revalidatePath(`/blog/${c.slug}`);
}

// ---------------- CASES ----------------

const caseSchema = z.object({
  client_name: z.string().min(2).max(160),
  slug: z.string().optional(),
  segment: z.enum(["ecommerce", "farma", "manipulacao", "correlatos", "dermo", "outro"]).default("outro"),
  summary: z.string().max(500).optional().nullable(),
  challenge_md: z.string().default(""),
  solution_md: z.string().default(""),
  results_md: z.string().default(""),
  kpi_json_raw: z.string().optional().nullable(),
  logo_url: z.string().url().optional().or(z.literal("")).nullable(),
  hero_url: z.string().url().optional().or(z.literal("")).nullable(),
  status: z.enum(["rascunho", "publicado", "arquivado"]).default("rascunho"),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(300).optional().nullable(),
});

function parseKpis(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {};
  const out: Record<string, string> = {};
  // Aceita JSON ou key:value por linha
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      for (const [k, v] of Object.entries(parsed)) out[k] = String(v);
      return out;
    } catch {
      // fallback abaixo
    }
  }
  for (const line of trimmed.split("\n")) {
    const idx = line.indexOf(":");
    if (idx < 1) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

function fdToCase(fd: FormData) {
  const obj = {
    client_name: String(fd.get("client_name") ?? ""),
    slug: fd.get("slug") ? String(fd.get("slug")) : undefined,
    segment: (fd.get("segment") as "ecommerce" | "farma" | "manipulacao" | "correlatos" | "dermo" | "outro") || "outro",
    summary: (fd.get("summary") as string) || null,
    challenge_md: String(fd.get("challenge_md") ?? ""),
    solution_md: String(fd.get("solution_md") ?? ""),
    results_md: String(fd.get("results_md") ?? ""),
    kpi_json_raw: (fd.get("kpi_json_raw") as string) || null,
    logo_url: (fd.get("logo_url") as string) || null,
    hero_url: (fd.get("hero_url") as string) || null,
    status: (fd.get("status") as "rascunho" | "publicado" | "arquivado") || "rascunho",
    seo_title: (fd.get("seo_title") as string) || null,
    seo_description: (fd.get("seo_description") as string) || null,
  };
  return caseSchema.parse(obj);
}

export async function criarCase(fd: FormData) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const data = fdToCase(fd);
  const slug = toSlug(data.slug || data.client_name);
  const kpis = parseKpis(data.kpi_json_raw);

  const payload = {
    organization_id: ctx.org.id,
    created_by: ctx.user.id,
    slug,
    client_name: data.client_name,
    segment: data.segment,
    summary: data.summary ?? "",
    challenge_md: data.challenge_md,
    solution_md: data.solution_md,
    results_md: data.results_md,
    kpi_json: kpis,
    logo_url: data.logo_url || "",
    hero_url: data.hero_url || "",
    status: data.status,
    seo_title: data.seo_title ?? "",
    seo_description: data.seo_description ?? "",
  };

  const { error: rpc2Error } = await supabase.rpc("cms2_create_case", { p: payload });
  if (rpc2Error) {
    const { error: rpcError } = await supabase.rpc("cms_create_case", { p_payload: payload });
    if (rpcError) {
      const { error } = await supabase.from("cms_cases").insert({
        organization_id: ctx.org.id,
        created_by: ctx.user.id,
        slug,
        client_name: data.client_name,
        segment: data.segment,
        summary: data.summary,
        challenge_md: data.challenge_md,
        solution_md: data.solution_md,
        results_md: data.results_md,
        kpi_json: kpis,
        logo_url: data.logo_url || null,
        hero_url: data.hero_url || null,
        status: data.status,
        published_at: data.status === "publicado" ? new Date().toISOString() : null,
        seo_title: data.seo_title,
        seo_description: data.seo_description,
      });
      if (error) {
        throw new Error(
          `CMS indisponível (PostgREST cache travado). Restart Supabase em Settings → API → Restart. Detalhe: ${error.message}`,
        );
      }
    }
  }

  revalidatePath("/app/cms");
  revalidatePath("/app/cms/cases");
  if (data.status === "publicado") {
    revalidatePath("/cases");
    revalidatePath(`/cases/${slug}`);
  }
  redirect("/app/cms/cases");
}

export async function atualizarCase(id: string, fd: FormData) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const data = fdToCase(fd);
  const slug = toSlug(data.slug || data.client_name);
  const kpis = parseKpis(data.kpi_json_raw);

  const { data: current } = await supabase
    .from("cms_cases")
    .select("status, slug, published_at")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();

  const c = current as { status?: string; slug?: string; published_at?: string | null } | null;
  const isNowPublishing = data.status === "publicado" && c?.status !== "publicado";
  const newPub = isNowPublishing ? new Date().toISOString() : c?.published_at ?? null;

  const { error } = await supabase
    .from("cms_cases")
    .update({
      slug,
      client_name: data.client_name,
      segment: data.segment,
      summary: data.summary,
      challenge_md: data.challenge_md,
      solution_md: data.solution_md,
      results_md: data.results_md,
      kpi_json: kpis,
      logo_url: data.logo_url || null,
      hero_url: data.hero_url || null,
      status: data.status,
      published_at: data.status === "publicado" ? newPub : null,
      seo_title: data.seo_title,
      seo_description: data.seo_description,
    })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) throw new Error(error.message);

  revalidatePath("/app/cms");
  revalidatePath("/app/cms/cases");
  revalidatePath(`/app/cms/cases/${id}/editar`);
  revalidatePath("/cases");
  revalidatePath(`/cases/${slug}`);
  const oldSlug = c?.slug;
  if (oldSlug && oldSlug !== slug) revalidatePath(`/cases/${oldSlug}`);
  redirect("/app/cms/cases");
}

export async function excluirCase(id: string) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("cms_cases")
    .delete()
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/cms");
  revalidatePath("/app/cms/cases");
  revalidatePath("/cases");
}

export async function publicarCase(id: string) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("cms_cases")
    .select("slug, status, published_at")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!current) throw new Error("Case não encontrado");
  const c = current as { slug: string; status: string; published_at: string | null };
  const newStatus = c.status === "publicado" ? "rascunho" : "publicado";
  const newPub = newStatus === "publicado" ? c.published_at ?? new Date().toISOString() : null;
  const { error } = await supabase
    .from("cms_cases")
    .update({ status: newStatus, published_at: newPub })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/cms");
  revalidatePath("/app/cms/cases");
  revalidatePath("/cases");
  revalidatePath(`/cases/${c.slug}`);
}
