"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { faqs } from "@/lib/faq-content";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-16 lg:py-24" style={{ background: "var(--bg-2)", borderTop: "1px solid var(--rule)" }}>
      <div className="shell" style={{ maxWidth: 760 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="kicker" style={{ justifyContent: "center" }}>Perguntas frequentes</div>
          <h2 style={{ marginTop: 16 }}>
            Tudo o que você quer saber{" "}
            <span className="serif-italic" style={{ color: "var(--red)" }}>antes de pedir.</span>
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((f, i) => (
            <div key={i} className="card">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 16, padding: "18px 22px", textAlign: "left", background: "transparent", border: "none",
                  cursor: "pointer", font: "inherit", color: "var(--ink)",
                }}
              >
                <span style={{ fontWeight: 600 }}>{f.q}</span>
                {open === i ? (
                  <Minus className="h-4 w-4 shrink-0" style={{ color: "var(--red)" }} />
                ) : (
                  <Plus className="h-4 w-4 shrink-0" style={{ color: "var(--ink-mute)" }} />
                )}
              </button>
              {open === i && (
                <div style={{ padding: "0 22px 20px" }}>
                  <p style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.6 }}>{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
