import Link from "next/link";
import { ArrowLeft, Clock, Ban } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { listMyAvailability, listMyBlocks } from "@/lib/queries/agenda";
import { saveAvailability, addBlock, removeBlock } from "./actions";

export const dynamic = "force-dynamic";

const WEEKDAYS = [
  { v: 1, label: "Segunda" },
  { v: 2, label: "Terça" },
  { v: 3, label: "Quarta" },
  { v: 4, label: "Quinta" },
  { v: 5, label: "Sexta" },
  { v: 6, label: "Sábado" },
  { v: 0, label: "Domingo" },
];

export default async function ConfiguracaoPage() {
  const ctx = await requireSession();
  const [avail, blocks] = await Promise.all([
    listMyAvailability(ctx.org.id, ctx.user.id),
    listMyBlocks(ctx.org.id, ctx.user.id),
  ]);
  const byWd = new Map(avail.map((a) => [a.weekday, a]));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/app/agenda" className="p-2 rounded-lg border border-navy-200 hover:bg-navy-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy-900">Configurar disponibilidade</h1>
          <p className="text-sm text-ink-600 mt-1">Defina seus horários de atendimento e bloqueios</p>
        </div>
      </div>

      <form action={saveAvailability} className="rounded-2xl border border-navy-100 bg-white p-5 space-y-3">
        <h2 className="font-bold text-navy-900 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Horários semanais
        </h2>
        <div className="space-y-2">
          {WEEKDAYS.map(({ v, label }) => {
            const cur = byWd.get(v);
            return (
              <div key={v} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-3 rounded-lg border border-navy-100">
                <label className="sm:col-span-3 flex items-center gap-2 text-sm font-semibold text-navy-900">
                  <input
                    type="checkbox"
                    name={`active_${v}`}
                    defaultChecked={cur?.active ?? false}
                    className="accent-[#011960] h-4 w-4"
                  />
                  {label}
                </label>
                <div className="sm:col-span-3">
                  <label className="block text-[10px] uppercase font-bold text-ink-500 mb-1">Início</label>
                  <input
                    type="time"
                    name={`start_${v}`}
                    defaultValue={cur?.time_start?.slice(0, 5) ?? "09:00"}
                    className="w-full rounded-lg border border-navy-200 px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10px] uppercase font-bold text-ink-500 mb-1">Fim</label>
                  <input
                    type="time"
                    name={`end_${v}`}
                    defaultValue={cur?.time_end?.slice(0, 5) ?? "18:00"}
                    className="w-full rounded-lg border border-navy-200 px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-ink-500 mb-1">Slot (min)</label>
                  <select
                    name={`slot_${v}`}
                    defaultValue={cur?.slot_minutes ?? 30}
                    className="w-full rounded-lg border border-navy-200 px-3 py-1.5 text-sm"
                  >
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                    <option value={45}>45</option>
                    <option value={60}>60</option>
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-[10px] uppercase font-bold text-ink-500 mb-1">Buf</label>
                  <input
                    type="number"
                    name={`buffer_${v}`}
                    defaultValue={cur?.buffer_minutes ?? 10}
                    min={0}
                    max={60}
                    className="w-full rounded-lg border border-navy-200 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg bg-[#011960] text-white font-semibold text-sm hover:bg-[#011960]/90">
          Salvar disponibilidade
        </button>
      </form>

      <div className="rounded-2xl border border-navy-100 bg-white p-5 space-y-4">
        <h2 className="font-bold text-navy-900 flex items-center gap-2">
          <Ban className="h-4 w-4" /> Bloqueios pontuais
        </h2>
        <form action={addBlock} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
          <div>
            <label className="block text-xs font-semibold mb-1">Início</label>
            <input type="datetime-local" name="block_start" required className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Fim</label>
            <input type="datetime-local" name="block_end" required className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Motivo</label>
            <input type="text" name="reason" placeholder="Almoço, férias..." className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="px-3 py-2 rounded-lg bg-[#BA0102] text-white font-semibold text-sm hover:bg-[#BA0102]/90">
            Adicionar bloqueio
          </button>
        </form>

        <div className="space-y-1">
          {blocks.length === 0 ? (
            <p className="text-sm text-ink-500 py-3">Sem bloqueios cadastrados</p>
          ) : (
            blocks.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-navy-100 text-sm">
                <div>
                  <div className="font-semibold text-navy-900">
                    {new Date(b.block_start).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} →{" "}
                    {new Date(b.block_end).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  </div>
                  {b.reason && <div className="text-ink-500 text-xs">{b.reason}</div>}
                </div>
                <form action={removeBlock}>
                  <input type="hidden" name="id" value={b.id} />
                  <button type="submit" className="text-[#BA0102] text-xs font-semibold hover:underline">
                    Remover
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
