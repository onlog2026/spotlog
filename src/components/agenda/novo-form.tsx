"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

interface Member {
  id: string;
  label: string;
  role: string;
}
interface Props {
  orgId: string;
  defaultOwner: string;
  defaultDate?: string;
  members: Member[];
}

interface Slot {
  iso_start: string;
  start: string;
  duration: number;
}

export function NovoAppointmentForm({ orgId, defaultOwner, defaultDate, members }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("Reunião comercial");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState(defaultOwner);
  const [date, setDate] = useState(defaultDate ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [meetingType, setMeetingType] = useState("video");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [externalName, setExternalName] = useState("");
  const [externalEmail, setExternalEmail] = useState("");
  const [externalPhone, setExternalPhone] = useState("");

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!owner || !date) return;
    setLoadingSlots(true);
    fetch(`/api/agenda/slots?date=${date}&owner=${owner}&org=${orgId}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [owner, date, orgId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!time) {
      setError("Escolha um horário disponível");
      return;
    }
    setSubmitting(true);
    try {
      const scheduledAt = new Date(`${date}T${time}:00-03:00`).toISOString();
      const res = await fetch("/api/agenda/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org: orgId,
          owner,
          scheduled_at: scheduledAt,
          duration,
          title,
          description,
          meeting_type: meetingType,
          meeting_url: meetingUrl || null,
          meeting_location: meetingLocation || null,
          external_name: externalName || null,
          external_email: externalEmail || null,
          external_phone: externalPhone || null,
          source: "internal",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao agendar");
      setSuccess(true);
      setTimeout(() => router.push("/app/agenda"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
        <h2 className="text-xl font-bold text-emerald-800">Agendamento criado!</h2>
        <p className="text-sm text-emerald-700 mt-1">Redirecionando…</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-navy-100 bg-white p-6">
      <Field label="Título" required>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputCls} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Responsável" required>
          <select value={owner} onChange={(e) => setOwner(e.target.value)} className={inputCls}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} ({m.role})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Duração (min)">
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputCls}>
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={45}>45</option>
            <option value={60}>60</option>
            <option value={90}>90</option>
          </select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Data" required>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Horários disponíveis" required>
          {loadingSlots ? (
            <div className="text-sm text-ink-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>
          ) : slots.length === 0 ? (
            <div className="text-sm text-[#BA0102]">Sem horários — configure sua disponibilidade ou escolha outro dia</div>
          ) : (
            <select value={time} onChange={(e) => setTime(e.target.value)} required className={inputCls}>
              <option value="">Escolha um horário</option>
              {slots.map((s) => {
                const t = s.start.slice(11, 16);
                return (
                  <option key={s.iso_start} value={t}>
                    {t}
                  </option>
                );
              })}
            </select>
          )}
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Tipo">
          <select value={meetingType} onChange={(e) => setMeetingType(e.target.value)} className={inputCls}>
            <option value="video">Videochamada</option>
            <option value="phone">Telefone</option>
            <option value="presencial">Presencial</option>
            <option value="other">Outro</option>
          </select>
        </Field>
        <Field label="Link da reunião">
          <input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://meet.google.com/…" className={inputCls} />
        </Field>
        <Field label="Local">
          <input value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} placeholder="Endereço ou sala" className={inputCls} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Nome do contato">
          <input value={externalName} onChange={(e) => setExternalName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="E-mail">
          <input type="email" value={externalEmail} onChange={(e) => setExternalEmail(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Telefone">
          <input value={externalPhone} onChange={(e) => setExternalPhone(e.target.value)} className={inputCls} />
        </Field>
      </div>

      <Field label="Descrição / pauta">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} />
      </Field>

      {error && <div className="text-sm text-[#BA0102] bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 rounded-lg bg-[#011960] text-white font-semibold hover:bg-[#011960]/90 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar agendamento
        </button>
      </div>
    </form>
  );
}

const inputCls = "w-full rounded-lg border border-navy-200 px-3 py-2 text-sm focus:border-[#011960] focus:outline-none focus:ring-2 focus:ring-[#011960]/20";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy-900 mb-1.5">
        {label} {required && <span className="text-[#BA0102]">*</span>}
      </span>
      {children}
    </label>
  );
}
