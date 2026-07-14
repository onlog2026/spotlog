"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Sparkles } from "lucide-react";
import { AiGeneratorPanel, type GeneratedPayload } from "./ai-generator-panel";
import { ImageUploadField } from "./image-upload-field";
import { MediaPreview } from "./media-preview";

export type PostFormInitial = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content_md?: string;
  cover_url?: string | null;
  author_name?: string | null;
  author_avatar_url?: string | null;
  category?: "blog" | "case" | "news";
  tags?: string[];
  status?: "rascunho" | "publicado" | "arquivado";
  seo_title?: string | null;
  seo_description?: string | null;
};

export function PostForm({
  initial,
  action,
  excluirAction,
  submitLabel = "Salvar",
  enableAi = true,
}: {
  initial?: PostFormInitial;
  action: (fd: FormData) => Promise<void>;
  excluirAction?: () => Promise<void>;
  submitLabel?: string;
  enableAi?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content_md ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? "");
  const [seoDesc, setSeoDesc] = useState(initial?.seo_description ?? "");
  const [category, setCategory] = useState<"blog" | "case" | "news">(initial?.category ?? "blog");
  const [status, setStatus] = useState<"rascunho" | "publicado" | "arquivado">(
    initial?.status ?? "rascunho",
  );
  const [authorName, setAuthorName] = useState(initial?.author_name ?? "");
  const [authorAvatar, setAuthorAvatar] = useState(initial?.author_avatar_url ?? "");
  const [aiBanner, setAiBanner] = useState(false);

  function applyAi(data: GeneratedPayload) {
    setTitle(data.title);
    setSlug(data.slug);
    setExcerpt(data.excerpt);
    setContent(data.content_md);
    setCoverUrl(data.cover_url);
    setTags(data.tags.join(", "));
    setSeoTitle(data.seo_title);
    setSeoDesc(data.seo_description);
    setAiBanner(true);
  }

  return (
    <div className="space-y-6">
      {enableAi ? (
        <AiGeneratorPanel
          type="post"
          defaultCategory={category}
          onGenerated={applyAi}
        />
      ) : null}

      {aiBanner ? (
        <div className="rounded-lg border border-spotorange-500/40 bg-spotorange-500/10 text-spotorange-200 px-4 py-3 text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Conteúdo gerado por IA — revise todos os campos antes de publicar.
        </div>
      ) : null}

      <form action={action} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-white/10 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">Conteúdo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Como reduzir falhas..."
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (opcional — gerado do título)</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="como-reduzir-falhas"
                  />
                </div>
                <div>
                  <Label htmlFor="excerpt">Resumo (excerpt)</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    rows={2}
                    value={excerpt ?? ""}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="1-2 linhas que aparecem na listagem"
                  />
                </div>
                <div>
                  <Label htmlFor="content_md">Conteúdo em Markdown *</Label>
                  <Textarea
                    id="content_md"
                    name="content_md"
                    rows={20}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="font-mono text-sm"
                    placeholder={`# Título\n\nTexto introdutório.\n\n## Subtítulo\n\n- Item 1\n- Item 2`}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seo_title">SEO Title (≤ 60 chars)</Label>
                  <Input
                    id="seo_title"
                    name="seo_title"
                    value={seoTitle ?? ""}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    maxLength={200}
                  />
                </div>
                <div>
                  <Label htmlFor="seo_description">SEO Description (≤ 160 chars)</Label>
                  <Textarea
                    id="seo_description"
                    name="seo_description"
                    rows={2}
                    value={seoDesc ?? ""}
                    onChange={(e) => setSeoDesc(e.target.value)}
                    maxLength={300}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-white/10 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">Publicação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as typeof status)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="rascunho">Rascunho</option>
                    <option value="publicado">Publicado</option>
                    <option value="arquivado">Arquivado</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <select
                    id="category"
                    name="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as typeof category)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="blog">Blog</option>
                    <option value="case">Case</option>
                    <option value="news">News</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="logistica, ultima-milha"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">Imagem de capa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  id="cover_url"
                  name="cover_url"
                  value={coverUrl ?? ""}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://... ou faça upload abaixo"
                />
                <ImageUploadField
                  currentUrl={coverUrl ?? undefined}
                  onUploaded={(url) => setCoverUrl(url)}
                  onClear={() => setCoverUrl("")}
                  folder="posts"
                />
                {coverUrl ? (
                  <MediaPreview
                    src={coverUrl}
                    alt="preview"
                    className="w-full h-32 object-cover rounded-md border border-white/10"
                  />
                ) : (
                  <div className="w-full h-32 grid place-items-center rounded-md border border-dashed border-white/10 text-xs text-muted-foreground">
                    Sem capa
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">Autor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="author_name">Nome do autor</Label>
                  <Input
                    id="author_name"
                    name="author_name"
                    value={authorName ?? ""}
                    onChange={(e) => setAuthorName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="author_avatar_url">URL do avatar</Label>
                  <Input
                    id="author_avatar_url"
                    name="author_avatar_url"
                    value={authorAvatar ?? ""}
                    onChange={(e) => setAuthorAvatar(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <div>
            {excluirAction ? (
              <form action={excluirAction}>
                <Button type="submit" variant="outline" className="text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Excluir post
                </Button>
              </form>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" asChild>
              <Link href="/app/cms/posts">Cancelar</Link>
            </Button>
            <Button type="submit">{submitLabel}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
