import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { PostForm } from "@/components/cms/post-form";
import { getPostAdmin } from "@/lib/queries/cms";
import { atualizarPost, excluirPost } from "../../../actions";

export default async function EditarPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireSession();
  const post = await getPostAdmin(ctx.org.id, id);
  if (!post) notFound();

  const updateAction = atualizarPost.bind(null, post.id);
  const deleteAction = excluirPost.bind(null, post.id);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Editar post</h2>
        <p className="text-sm text-muted-foreground">
          /{post.slug} · atualizado em {new Date(post.updated_at).toLocaleString("pt-BR")}
        </p>
      </div>
      <PostForm initial={post} action={updateAction} excluirAction={deleteAction} submitLabel="Salvar alterações" />
    </div>
  );
}
