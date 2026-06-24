import { PostForm } from "@/components/cms/post-form";
import { criarPost } from "../../actions";

export const dynamic = "force-dynamic";

export default function NovoPostPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Novo post</h2>
        <p className="text-sm text-muted-foreground">Preencha e escolha &quot;Publicado&quot; pra aparecer em /blog.</p>
      </div>
      <PostForm action={criarPost} submitLabel="Criar post" />
    </div>
  );
}
