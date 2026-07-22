"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { criarDealAction } from "@/app/app/pipeline/novo/actions";

type Props = {
  pipelines: { id: string; name: string }[];
  stages: { id: string; name: string; pipeline_id: string; position: number }[];
  companies: { id: string; name: string }[];
  contacts: { id: string; full_name: string; email: string | null }[];
  members: { user_id: string; label: string; role: string }[];
  currentUserId: string;
  /** Veio do botão "+" de uma coluna do kanban — pré-seleciona pipeline+etapa. */
  initialStageId?: string;
};

export function NewDealForm({
  pipelines,
  stages,
  companies,
  contacts,
  members,
  currentUserId,
  initialStageId,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const preselected = stages.find((s) => s.id === initialStageId);

  const [pipelineId, setPipelineId] = useState(
    preselected?.pipeline_id ?? pipelines[0]?.id ?? "",
  );
  const stageOptions = useMemo(
    () => stages.filter((s) => s.pipeline_id === pipelineId),
    [stages, pipelineId],
  );

  const [stageId, setStageId] = useState(
    preselected?.id ?? stageOptions[0]?.id ?? "",
  );
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [probability, setProbability] = useState("50");
  const [currency, setCurrency] = useState("BRL");
  const [companyId, setCompanyId] = useState("");
  const [contactId, setContactId] = useState("");
  const [ownerId, setOwnerId] = useState(currentUserId);
  const [expectedClose, setExpectedClose] = useState("");
  const [source, setSource] = useState("");

  function onPipelineChange(id: string) {
    setPipelineId(id);
    const firstStage = stages.find((s) => s.pipeline_id === id);
    setStageId(firstStage?.id ?? "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pipelineId || !stageId) {
      setError("Escolha pipeline e etapa.");
      return;
    }
    start(async () => {
      const r = await criarDealAction({
        title: title.trim(),
        pipeline_id: pipelineId,
        stage_id: stageId,
        amount: amount ? Number(amount) : undefined,
        currency,
        probability: probability ? Number(probability) : undefined,
        company_id: companyId || null,
        contact_id: contactId || null,
        owner_id: ownerId || null,
        expected_close_date: expectedClose || null,
        source: source || null,
        status: "open",
      });
      if (r && !r.ok) {
        setError(r.error);
      } else {
        // sucesso → redirect já é feito pela server action
        router.refresh();
      }
    });
  }

  if (pipelines.length === 0) {
    return (
      <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-6 text-yellow-800">
        <AlertCircle className="h-5 w-5 mb-2" />
        Você ainda não tem um pipeline. Vá em <strong>/app/pipeline</strong> e
        crie o pipeline padrão antes de adicionar negociações.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white border border-navy-100 shadow-soft p-6 sm:p-8 space-y-6"
    >
      {/* Identificação */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
          Identificação
        </h2>
        <Field label="Título da negociação" required>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Implantação Spotlog na Farma X"
            className={inputClass}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Pipeline" required>
            <select
              value={pipelineId}
              onChange={(e) => onPipelineChange(e.target.value)}
              className={inputClass}
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Etapa inicial" required>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className={inputClass}
            >
              {stageOptions.length === 0 && <option value="">(sem etapas)</option>}
              {stageOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Valor */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
          Valor e probabilidade
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Valor estimado">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className={inputClass + " pl-9"}
              />
            </div>
          </Field>
          <Field label="Moeda">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputClass}
            >
              <option value="BRL">BRL (R$)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </Field>
          <Field label="Probabilidade (%)">
            <input
              type="number"
              min="0"
              max="100"
              value={probability}
              onChange={(e) => setProbability(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* Cliente */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
          Cliente
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Empresa">
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Sem empresa —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {companies.length === 0 && (
              <p className="text-xs text-ink-500 mt-1">
                Nenhuma empresa cadastrada.{" "}
                <a href="/app/empresas/nova" className="text-spotorange-600 underline">
                  Criar nova
                </a>
              </p>
            )}
          </Field>
          <Field label="Contato principal">
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Sem contato —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} {c.email ? `· ${c.email}` : ""}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Atribuição */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
          Atribuição e prazos
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Responsável">
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className={inputClass}
            >
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.label} ({m.role})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Previsão de fechamento">
            <input
              type="date"
              value={expectedClose}
              onChange={(e) => setExpectedClose(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Origem">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className={inputClass}
            >
              <option value="">— Selecione —</option>
              <option value="site">Site (formulário)</option>
              <option value="chatbot">Chatbot</option>
              <option value="indicacao">Indicação</option>
              <option value="prospecting">Prospecção ativa</option>
              <option value="enrichment">Enrichment</option>
              <option value="evento">Evento / feira</option>
              <option value="outro">Outro</option>
            </select>
          </Field>
        </div>
      </section>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-navy-100">
        <Button type="submit" variant="orange" size="xl" disabled={pending || !title}>
          {pending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Criar negociação
            </>
          )}
        </Button>
        <Button type="button" variant="outline" size="xl" asChild>
          <a href="/app/pipeline">Cancelar</a>
        </Button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-navy-900 placeholder:text-ink-400 focus:border-spotorange-500 focus:outline-none focus:ring-2 focus:ring-spotorange-500/20 transition-all";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-navy-900 mb-1.5">
        {label} {required && <span className="text-spotorange-500">*</span>}
      </span>
      {children}
    </label>
  );
}
