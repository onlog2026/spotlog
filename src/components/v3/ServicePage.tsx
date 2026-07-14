"use client";

import { useEffect } from "react";
import { Icon } from "@/components/v3/icons";
import { unsplash } from "@/components/v3/icons";
import { Photo } from "@/components/v3/photo";
import { Logo } from "@/components/v3/logo";
import { SERVICE_TREE } from "@/components/v3/services-data";
import type { Service, ServiceStep } from "@/components/v3/services-data";

export function ServicePage({
  service,
  onClose,
  onOpen,
  serviceImages,
}: {
  service: Service;
  onClose: () => void;
  onOpen: (id: string) => void;
  serviceImages?: Record<string, string>;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  useEffect(() => {
    const el = document.querySelector(".svc");
    if (el) el.scrollTop = 0;
  }, [service?.id]);

  if (!service) return null;
  const s = service;
  const related = (SERVICE_TREE.find(g => g.id === s.group)?.items || []).filter(x => x.id !== s.id);

  return (
    <div className="svc">
      {/* top bar */}
      <div className="svc-bar">
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          <Icon.Arrow size={14} style={{ transform:"rotate(180deg)" }}/> Voltar ao site
        </button>
        <div style={{ flex: 1, display:"flex", justifyContent:"center" }}><Logo size="sm"/></div>
        <a href="#" onClick={(e)=>{ e.preventDefault(); onClose(); setTimeout(()=>document.getElementById('contato')?.scrollIntoView({behavior:'smooth'}), 60); }}
          className="btn btn-red btn-sm">Diagnóstico gratuito</a>
      </div>

      {/* hero */}
      <section className="section" style={{ paddingTop: 56, paddingBottom: 56 }}>
        <div className="shell">
          <div className="svc-hero">
            <div>
              <div className="kicker">{s.eyebrow}</div>
              <h1 style={{ marginTop: 18, fontSize:"clamp(36px,5vw,64px)" }}>{s.title}</h1>
              <div style={{ marginTop: 22, paddingLeft: 18, borderLeft:"3px solid var(--red)" }}>
                <div className="serif" style={{ fontSize:"clamp(19px,2vw,24px)", color:"var(--ink)" }}>{s.trigger}</div>
              </div>
              <p className="lead" style={{ marginTop: 22 }}>{s.intro}</p>
              <div style={{ display:"flex", gap: 12, marginTop: 28, flexWrap:"wrap" }}>
                <a href="#" onClick={(e)=>{ e.preventDefault(); onClose(); setTimeout(()=>document.getElementById('contato')?.scrollIntoView({behavior:'smooth'}), 60); }}
                  className="btn btn-red btn-lg">{s.cta} <Icon.Arrow size={16}/></a>
                <button className="btn btn-ghost btn-lg" onClick={onClose}>Ver outros serviços</button>
              </div>
            </div>
            <div>
              <div className="svc-photo">
                <Photo scene={s.scene} src={serviceImages?.[s.id] || unsplash(s.src, 1100)} alt={s.name}/>
              </div>
              <div className="photo-cap" style={{ marginTop: 12 }}>IMAGEM ILUSTRATIVA · {s.name.toUpperCase()}</div>
            </div>
          </div>
        </div>
      </section>

      {/* benefits + ideal for */}
      <section className="section section-paper section-rule" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div className="shell">
          <div style={{ display:"grid", gridTemplateColumns:"1.3fr 1fr", gap: 48 }} className="svc-cols">
            <div>
              <div className="kicker">Benefícios</div>
              <h2 style={{ marginTop: 16, fontSize:"clamp(28px,3.4vw,44px)" }}>O que você ganha</h2>
              <div className="cols-2" style={{ marginTop: 24 }}>
                {s.benefits.map((b: string, i: number) => (
                  <div key={i} className="foco-benefit">
                    <span className="ic"><Icon.Check size={11} stroke={3}/></span> {b}
                  </div>
                ))}
              </div>
              {s.note && <p style={{ fontSize: 12, color:"var(--ink-mute)", marginTop: 18, maxWidth:"60ch" }}>{s.note}</p>}
            </div>
            {s.idealFor && (
              <div>
                <div className="kicker">Ideal para</div>
                <div style={{ marginTop: 18 }}>
                  {s.idealFor.map((x: string, i: number) => (
                    <div key={i} className="tickrow"><span className="ic"><Icon.Check size={11} stroke={3}/></span>{x}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* process */}
      <section className="section section-navy" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div className="shell">
          <div className="kicker" style={{ display:"inline-flex" }}>Como funciona</div>
          <h2 style={{ marginTop: 16 }}>Um processo claro, do início ao fim.</h2>
          <div style={{ marginTop: 28 }}>
            {s.steps.map((st: ServiceStep, i: number) => (
              <div key={i} className="svc-step" style={{ borderColor:"rgba(255,255,255,.16)" }}>
                <div className="sn">{String(i+1).padStart(2,"0")}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 18, color:"#FFF" }}>{st[0]}</div>
                  <p style={{ marginTop: 4, color:"#B7BFE0" }}>{st[1]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* related + CTA */}
      <section className="section section-paper" style={{ paddingTop: 64, paddingBottom: 80 }}>
        <div className="shell">
          <div className="kicker">Outros serviços de {s.group === "ecommerce" ? "Ecommerce" : "Farma"}</div>
          <div className="cols-2" style={{ marginTop: 22 }}>
            {related.map((r: Service) => (
              <div key={r.id} className="card" style={{ padding: 22, display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}
                onClick={() => onOpen(r.id)}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 18 }}>{r.name}</div>
                  <div style={{ fontSize: 13, color:"var(--ink-mute)", marginTop: 2 }}>{r.buy}</div>
                </div>
                <span style={{ width: 40, height: 40, borderRadius:"50%", border:"1px solid var(--rule-strong)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon.Arrow size={15}/>
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 40, padding:"40px clamp(24px,4vw,56px)", borderRadius: 26, textAlign:"center",
            background:"linear-gradient(135deg, var(--red), var(--red-dark))", boxShadow:"var(--shadow-red)" }}>
            <div className="serif" style={{ fontSize:"clamp(26px,3.4vw,44px)", color:"#FFF" }}>{s.trigger}</div>
            <p style={{ color:"rgba(255,255,255,.9)", marginTop: 12, maxWidth:"54ch", marginInline:"auto" }}>
              Receba um estudo operacional sem custo e descubra o modelo ideal para a sua empresa.
            </p>
            <a href="#" onClick={(e)=>{ e.preventDefault(); onClose(); setTimeout(()=>document.getElementById('contato')?.scrollIntoView({behavior:'smooth'}), 60); }}
              className="btn btn-white btn-lg" style={{ marginTop: 24 }}>{s.cta} <Icon.Arrow size={16}/></a>
          </div>
        </div>
      </section>

      <style>{`@media (max-width: 900px){ .svc-cols{ grid-template-columns: 1fr !important; gap: 32px !important; } }`}</style>
    </div>
  );
}
