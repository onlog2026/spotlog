"use client";

export interface QuickReply {
  label: string;
  value: string;
}

export function QuickReplies({
  replies,
  onPick,
  disabled,
}: {
  replies: QuickReply[];
  onPick: (reply: QuickReply) => void;
  disabled?: boolean;
}) {
  if (!replies.length) return null;
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {replies.map((r) => (
        <button
          key={r.value}
          type="button"
          disabled={disabled}
          onClick={() => onPick(r)}
          className="rounded-full border border-[#011960]/25 bg-white px-3 py-1.5 text-xs font-medium text-[#011960] transition-colors hover:bg-[#011960]/5 hover:border-[#011960] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
