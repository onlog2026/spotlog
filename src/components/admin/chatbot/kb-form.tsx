import { KB_CATEGORIES } from "@/lib/queries/chatbot";
import { saveKnowledgeAction } from "@/app/app/admin/chatbot/actions";

type KbFormProps = {
  initial?: {
    id?: string;
    category?: string;
    question?: string;
    answer?: string;
    keywords?: string[];
    priority?: number;
    active?: boolean;
  };
  fromUnansweredId?: string;
};

export function KbForm({ initial, fromUnansweredId }: KbFormProps) {
  const keywordsValue = initial?.keywords?.join(", ") ?? "";
  return (
    <form
      action={saveKnowledgeAction}
      className="space-y-4 rounded-lg border border-white/10 bg-card/40 p-5"
    >
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      {fromUnansweredId ? (
        <input type="hidden" name="from_unanswered" value={fromUnansweredId} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block md:col-span-1">
          <span className="text-xs font-medium text-muted-foreground">Categoria</span>
          <select
            name="category"
            defaultValue={initial?.category ?? "faq"}
            required
            className="mt-1 w-full rounded-md border border-white/10 bg-card/60 px-3 py-2 text-sm"
          >
            {KB_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-1">
          <span className="text-xs font-medium text-muted-foreground">Prioridade (0–1000)</span>
          <input
            type="number"
            name="priority"
            min={0}
            max={1000}
            defaultValue={initial?.priority ?? 50}
            className="mt-1 w-full rounded-md border border-white/10 bg-card/60 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex items-center gap-2 md:col-span-1 self-end">
          <input
            type="checkbox"
            name="active"
            defaultChecked={initial?.active ?? true}
            className="h-4 w-4"
          />
          <span className="text-sm">Ativo (chatbot pode usar)</span>
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-muted-foreground">Pergunta</span>
        <input
          type="text"
          name="question"
          required
          minLength={3}
          maxLength={500}
          defaultValue={initial?.question ?? ""}
          className="mt-1 w-full rounded-md border border-white/10 bg-card/60 px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-muted-foreground">Resposta</span>
        <textarea
          name="answer"
          required
          minLength={3}
          maxLength={4000}
          rows={6}
          defaultValue={initial?.answer ?? ""}
          className="mt-1 w-full rounded-md border border-white/10 bg-card/60 px-3 py-2 text-sm font-mono"
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-muted-foreground">
          Keywords (separadas por vírgula)
        </span>
        <input
          type="text"
          name="keywords"
          maxLength={800}
          defaultValue={keywordsValue}
          placeholder="ex: cotação, preço, orçamento"
          className="mt-1 w-full rounded-md border border-white/10 bg-card/60 px-3 py-2 text-sm"
        />
        <span className="mt-1 block text-[11px] text-muted-foreground">
          Quanto melhor as keywords, melhor o chatbot encontra essa resposta.
        </span>
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <a
          href="/app/admin/chatbot/knowledge"
          className="rounded-md border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
        >
          Cancelar
        </a>
        <button
          type="submit"
          className="rounded-md bg-spotorange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-spotorange-600"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
