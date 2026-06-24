"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Settings,
  Check,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  saveFormDefinition,
  saveField,
  addField,
  deleteField,
  reorderFields,
} from "@/app/app/admin/forms/actions";
import type {
  FormDefinition,
  FormField,
  FieldType,
  FieldWidth,
  FieldOption,
} from "@/lib/forms/types";
import { LEAD_COLUMNS } from "@/lib/forms/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { DynamicForm } from "@/components/public/dynamic-form";

interface Props {
  formId: string;
  initialDefinition: FormDefinition;
  initialFields: FormField[];
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Texto curto" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "textarea", label: "Texto longo" },
  { value: "select", label: "Lista (select)" },
  { value: "radio", label: "Radio" },
  { value: "checkbox", label: "Checkbox" },
  { value: "number", label: "Numero" },
  { value: "date", label: "Data" },
  { value: "url", label: "URL" },
  { value: "hidden", label: "Oculto" },
];

export function FormEditor({ formId, initialDefinition, initialFields }: Props) {
  const [definition, setDefinition] = useState(initialDefinition);
  const [fields, setFields] = useState<FormField[]>(
    initialFields.sort((a, b) => a.sort - b.sort),
  );
  const [openFieldId, setOpenFieldId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [savingDef, startSaveDef] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function patchDef(p: Partial<FormDefinition>) {
    setDefinition((d) => ({ ...d, ...p }));
  }
  function patchField(id: string, p: Partial<FormField>) {
    setFields((fs) => fs.map((f) => (f.id === id ? { ...f, ...p } : f)));
  }

  async function saveDefinition() {
    startSaveDef(async () => {
      await saveFormDefinition(formId, {
        title: definition.title,
        description: definition.description,
        submit_label: definition.submit_label,
        success_title: definition.success_title,
        success_message: definition.success_message,
        lead_source: definition.lead_source,
        lead_source_detail: definition.lead_source_detail,
        redirect_url: definition.redirect_url,
        show_consent: definition.show_consent,
        consent_text: definition.consent_text,
        active: definition.active,
      });
      setSavedAt(Date.now());
    });
  }

  async function persistField(id: string) {
    const f = fields.find((x) => x.id === id);
    if (!f) return;
    await saveField(formId, id, {
      field_key: f.field_key,
      type: f.type,
      label: f.label,
      placeholder: f.placeholder,
      help_text: f.help_text,
      required: f.required,
      options: f.options,
      validation: f.validation,
      width: f.width,
      maps_to_lead: f.maps_to_lead,
      active: f.active,
    });
    setSavedAt(Date.now());
  }

  async function handleAddField(type: FieldType) {
    const newId = await addField(formId, type);
    // refresh local state quick: append a placeholder; user can re-open page to see DB state.
    const tmp: FormField = {
      id: newId,
      form_id: formId,
      field_key: `${type}_field`,
      type,
      label: "Novo campo",
      placeholder: null,
      help_text: null,
      required: false,
      options: [],
      validation: {},
      width: "full",
      sort: fields.length + 1,
      maps_to_lead: null,
      active: true,
    };
    setFields((fs) => [...fs, tmp]);
    setOpenFieldId(newId);
  }

  async function handleDeleteField(id: string) {
    if (!confirm("Excluir este campo?")) return;
    await deleteField(formId, id);
    setFields((fs) => fs.filter((f) => f.id !== id));
    if (openFieldId === id) setOpenFieldId(null);
  }

  async function moveField(id: string, dir: -1 | 1) {
    const idx = fields.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[idx], next[target]] = [next[target], next[idx]];
    setFields(next);
    await reorderFields(formId, next.map((f) => f.id));
  }

  const previewFields = useMemo(() => fields.filter((f) => f.active), [fields]);

  return (
    <div className="grid lg:grid-cols-12 gap-4">
      {/* EDITOR */}
      <div className="lg:col-span-7 space-y-4 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto pr-1">
        {/* Status bar */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Switch
              checked={definition.active}
              onCheckedChange={(v) => {
                patchDef({ active: v });
                startSaveDef(async () => {
                  await saveFormDefinition(formId, { active: v });
                  setSavedAt(Date.now());
                });
              }}
            />
            <span className="text-muted-foreground">
              {definition.active ? "Publicado" : "Rascunho"}
            </span>
          </div>
          {savedAt && (
            <span className="text-emerald-500 inline-flex items-center gap-1">
              <Check className="h-3 w-3" />
              Salvo
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="lg:hidden"
            onClick={() => setShowPreview((s) => !s)}
          >
            {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showPreview ? "Ocultar preview" : "Ver preview"}
          </Button>
        </div>

        {/* Form config */}
        <Card className="border-white/10 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4 text-spotorange-400" />
              Configuracoes do formulario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Titulo</Label>
              <Input
                value={definition.title}
                onChange={(e) => patchDef({ title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descricao</Label>
              <Textarea
                rows={2}
                value={definition.description ?? ""}
                onChange={(e) => patchDef({ description: e.target.value })}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Texto do botao</Label>
                <Input
                  value={definition.submit_label}
                  onChange={(e) => patchDef({ submit_label: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Redirect apos envio (opcional)</Label>
                <Input
                  value={definition.redirect_url ?? ""}
                  placeholder="https://..."
                  onChange={(e) => patchDef({ redirect_url: e.target.value })}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Titulo da tela de obrigado</Label>
                <Input
                  value={definition.success_title}
                  onChange={(e) => patchDef({ success_title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mensagem de obrigado</Label>
                <Textarea
                  rows={2}
                  value={definition.success_message}
                  onChange={(e) => patchDef({ success_message: e.target.value })}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Lead source</Label>
                <Input
                  value={definition.lead_source}
                  onChange={(e) => patchDef({ lead_source: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Lead source detail</Label>
                <Input
                  value={definition.lead_source_detail ?? ""}
                  onChange={(e) => patchDef({ lead_source_detail: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <div>
                <div className="text-xs font-semibold">Pedir consentimento LGPD</div>
                <p className="text-[11px] text-muted-foreground">
                  Adiciona checkbox obrigatorio antes do envio.
                </p>
              </div>
              <Switch
                checked={definition.show_consent}
                onCheckedChange={(v) => patchDef({ show_consent: v })}
              />
            </div>
            {definition.show_consent && (
              <div className="space-y-1.5">
                <Label className="text-xs">Texto do consentimento</Label>
                <Textarea
                  rows={2}
                  value={definition.consent_text ?? ""}
                  onChange={(e) => patchDef({ consent_text: e.target.value })}
                />
              </div>
            )}
            <Button
              onClick={saveDefinition}
              variant="orange"
              size="sm"
              disabled={savingDef}
            >
              {savingDef ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar configuracoes
            </Button>
          </CardContent>
        </Card>

        {/* Fields */}
        <Card className="border-white/10 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between gap-2">
              Campos ({fields.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {fields.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Nenhum campo. Adicione abaixo.
              </p>
            )}
            {fields.map((field, idx) => (
              <FieldRow
                key={field.id}
                field={field}
                index={idx}
                total={fields.length}
                open={openFieldId === field.id}
                onToggle={() =>
                  setOpenFieldId((cur) => (cur === field.id ? null : field.id))
                }
                onPatch={(p) => patchField(field.id, p)}
                onSave={() => persistField(field.id)}
                onDelete={() => handleDeleteField(field.id)}
                onMoveUp={() => moveField(field.id, -1)}
                onMoveDown={() => moveField(field.id, 1)}
              />
            ))}

            <div className="pt-3 border-t border-white/5">
              <Label className="text-xs mb-2 block">Adicionar campo</Label>
              <div className="flex flex-wrap gap-1.5">
                {FIELD_TYPES.map((t) => (
                  <Button
                    key={t.value}
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddField(t.value)}
                  >
                    <Plus className="h-3 w-3" />
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PREVIEW */}
      <div className={`lg:col-span-5 ${showPreview ? "block" : "hidden lg:block"}`}>
        <div className="lg:sticky lg:top-4">
          <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
            Preview ao vivo
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-xl border border-navy-100 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto">
            <DynamicForm
              slug={definition.slug}
              theme="light"
              previewDefinition={definition}
              previewFields={previewFields}
              disableSubmit
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            Os envios estao desabilitados no preview.
          </p>
        </div>
      </div>
    </div>
  );
}

interface FieldRowProps {
  field: FormField;
  index: number;
  total: number;
  open: boolean;
  onToggle: () => void;
  onPatch: (p: Partial<FormField>) => void;
  onSave: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function FieldRow({
  field,
  index,
  total,
  open,
  onToggle,
  onPatch,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}: FieldRowProps) {
  const [saving, startSave] = useTransition();
  const [optionsText, setOptionsText] = useState(
    field.options.map((o) => `${o.value}|${o.label}`).join("\n"),
  );

  function persist() {
    startSave(async () => onSave());
  }

  function parseOptions(text: string): FieldOption[] {
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [value, label] = line.split("|");
        return { value: value.trim(), label: (label ?? value).trim() };
      });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-white/[0.03] transition"
      >
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{field.label || "(sem rotulo)"}</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
            <span className="font-mono">{field.field_key}</span>
            <span className="px-1.5 py-0.5 rounded bg-white/5">{field.type}</span>
            <span className="px-1.5 py-0.5 rounded bg-white/5">{field.width}</span>
            {field.required && (
              <span className="px-1.5 py-0.5 rounded bg-spotorange-500/15 text-spotorange-400">
                obrigatorio
              </span>
            )}
            {!field.active && (
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
                inativo
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-red-400 hover:text-red-300 p-1"
          title="Excluir"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </button>

      {open && (
        <div className="border-t border-white/10 p-3 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px]">Field key (interno)</Label>
              <Input
                value={field.field_key}
                onChange={(e) =>
                  onPatch({
                    field_key: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, "_")
                      .slice(0, 60),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Tipo</Label>
              <select
                value={field.type}
                onChange={(e) => onPatch({ type: e.target.value as FieldType })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px]">Label (visivel)</Label>
            <Input value={field.label} onChange={(e) => onPatch({ label: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px]">Placeholder</Label>
              <Input
                value={field.placeholder ?? ""}
                onChange={(e) => onPatch({ placeholder: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Help text</Label>
              <Input
                value={field.help_text ?? ""}
                onChange={(e) => onPatch({ help_text: e.target.value })}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-[11px]">Largura</Label>
              <select
                value={field.width}
                onChange={(e) => onPatch({ width: e.target.value as FieldWidth })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="full">Full (100%)</option>
                <option value="half">Metade (50%)</option>
                <option value="third">Terco (33%)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Mapeia para coluna do lead</Label>
              <select
                value={field.maps_to_lead ?? ""}
                onChange={(e) =>
                  onPatch({ maps_to_lead: e.target.value || null })
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— custom_fields (JSON) —</option>
                {LEAD_COLUMNS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Switch
                checked={field.required}
                onCheckedChange={(v) => onPatch({ required: v })}
              />
              Obrigatorio
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Switch
                checked={field.active}
                onCheckedChange={(v) => onPatch({ active: v })}
              />
              Ativo
            </label>
          </div>

          {(field.type === "select" ||
            field.type === "radio" ||
            field.type === "checkbox") && (
            <div className="space-y-1.5">
              <Label className="text-[11px]">
                Opcoes (1 por linha — formato:{" "}
                <span className="font-mono">value|Label</span>)
              </Label>
              <Textarea
                rows={5}
                value={optionsText}
                onChange={(e) => {
                  setOptionsText(e.target.value);
                  onPatch({ options: parseOptions(e.target.value) });
                }}
                placeholder={"opt1|Opcao 1\nopt2|Opcao 2"}
                className="font-mono text-xs"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label className="text-[11px]">Min chars</Label>
              <Input
                type="number"
                value={field.validation?.min_length ?? ""}
                onChange={(e) =>
                  onPatch({
                    validation: {
                      ...field.validation,
                      min_length: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Max chars</Label>
              <Input
                type="number"
                value={field.validation?.max_length ?? ""}
                onChange={(e) =>
                  onPatch({
                    validation: {
                      ...field.validation,
                      max_length: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Pattern (regex)</Label>
              <Input
                value={field.validation?.pattern ?? ""}
                onChange={(e) =>
                  onPatch({
                    validation: { ...field.validation, pattern: e.target.value || undefined },
                  })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="orange" onClick={persist} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Salvar campo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
