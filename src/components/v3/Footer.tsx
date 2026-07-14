"use client";

import { Icon } from "@/components/v3/icons";
import { Logo } from "@/components/v3/logo";
import { AnvisaBadge } from "@/components/v3/Anvisa";
import { MENU_SEGMENTOS, MENU_SERVICOS } from "@/lib/landing-pages";

const COLS: { h: string; l: [string, string][] }[] = [
  { h:"Soluções", l:[
    ["Ecommerce","/ecommerce"],
    ["Fulfillment","/solucoes/ecommerce-express"],
    ["Coleta Programada","/solucoes/coletas"],
    ["Entregador Dedicado","/solucoes/moto-fixa"],
    ["Logística Reversa","/solucoes/reversa"],
  ] },
  { h:"Empresa", l:[
    ["Por que Spotlog","/sobre"],
    ["Cobertura","/abrangencia"],
    ["Blog","/blog"],
    ["Trabalhe conosco","/contato"],
    ["Contato","/contato"],
  ] },
  { h:"Legal & LGPD", l:[
    ["Política de Privacidade","/privacidade"],
    ["Termos de Uso","/termos"],
    ["Política de Cookies","/privacidade"],
    ["Encarregado de Dados (DPO)","/contato"],
  ] },
];

// Redes sociais reais da Spotlog.
const SOCIALS: [string, string][] = [
  ["Instagram","https://www.instagram.com/spotlogoficial/"],
  ["Facebook","https://www.facebook.com/spotlogoficial"],
  ["LinkedIn","https://gt.linkedin.com/company/spotlog"],
];

// Contatos diretos (WhatsApp do site + página de contato).
const CONTACTS: { ic: React.ReactNode; href: string; ext?: boolean }[] = [
  { ic: <Icon.Whatsapp/>, href: "https://wa.me/5511978348288", ext: true },
  { ic: <Icon.Mail/>, href: "/contato" },
  { ic: <Icon.Phone/>, href: "/contato" },
];

export function Footer() {
  return (
    <footer style={{ background: "var(--navy-deep)", color:"#C7CDE8", position:"relative" } as React.CSSProperties}>
      {/* Big editorial sign-off band */}
      <div className="shell" style={{ paddingTop: 72, paddingBottom: 56 }}>
        <div style={{
          display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap: 28, flexWrap:"wrap",
          paddingBottom: 48, borderBottom:"1px solid rgba(255,255,255,.12)",
        }}>
          <div style={{ flex: "1 1 360px" }}>
            <Logo size="lg"/>
            <div style={{ fontFamily:"'Bricolage Grotesque','Geist',sans-serif", fontSize:"clamp(30px,4.4vw,56px)", color:"#FFF", lineHeight:1.05, marginTop: 20 }}>
              Logística que entrega <span className="serif-italic" style={{ color:"#FF6B6F" }}>controle</span>, não só pacote.
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap: 12, alignItems:"flex-start" }}>
            <a href="/contato" className="btn btn-red btn-lg">
              Solicitar diagnóstico gratuito <Icon.Arrow size={15}/>
            </a>
            <div style={{ display:"flex", gap: 8 }}>
              {CONTACTS.map((x,i)=>(
                <a
                  key={i}
                  href={x.href}
                  target={x.ext ? "_blank" : undefined}
                  rel={x.ext ? "noopener noreferrer" : undefined}
                  className="foot-social"
                >{x.ic}</a>
              ))}
            </div>
            <div style={{ display:"flex", gap: 14, marginTop: 4 }}>
              {SOCIALS.map(([label,href])=>(
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="foot-link"
                >{label}</a>
              ))}
            </div>
          </div>
        </div>

        {/* Segmentos atendidos + Principais serviços (divididos) */}
        <div className="ft-seg" style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap: 40, marginTop: 48, paddingBottom: 44, borderBottom:"1px solid rgba(255,255,255,.12)" }}>
          <div>
            <div className="mono" style={{ fontSize: 10.5, letterSpacing:".18em", color:"#FF6B6F", marginBottom: 16, textTransform:"uppercase" }}>Segmentos atendidos</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:"9px 16px" }}>
              {MENU_SEGMENTOS.map(({ label, href }) => (
                <a key={href + label} href={href} className="foot-link">{label}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 10.5, letterSpacing:".18em", color:"#FF6B6F", marginBottom: 16, textTransform:"uppercase" }}>Principais serviços</div>
            <div style={{ display:"flex", flexDirection:"column", gap: 9 }}>
              {MENU_SERVICOS.map(({ label, href }) => (
                <a key={href + label} href={href} className="foot-link">{label}</a>
              ))}
            </div>
          </div>
        </div>

        {/* Link columns */}
        <div className="ft-cols" style={{ display:"grid", gridTemplateColumns:"1.3fr repeat(3,1fr)", gap: 36, marginTop: 48 }}>
          <div>
            <p style={{ fontSize: 14, color:"#8C95C2", maxWidth: 280, lineHeight: 1.6 }}>
              Operador logístico completo para ecommerce, farma e empresas que precisam de
              cuidado, evidência e atendimento humano. São Paulo & região metropolitana.
            </p>
            {/* Compliance/responsibility note + Anvisa badge */}
            <div style={{ marginTop: 18, padding: 16, borderRadius: 16, border:"1px dashed rgba(255,255,255,.18)", fontSize: 12, color:"#8C95C2" }}>
              <AnvisaBadge/>
              <span style={{ display:"block", marginTop: 12, lineHeight: 1.6 }}>Licenças e documentos regulatórios cadastrados e validados internamente. Não afirmamos certificações sem comprovação documental.</span>
            </div>
          </div>
          {COLS.map((c,i)=>(
            <div key={i}>
              <div className="mono" style={{ fontSize: 10.5, letterSpacing:".18em", color:"#FF6B6F", marginBottom: 14, textTransform:"uppercase" }}>{c.h}</div>
              <div style={{ display:"flex", flexDirection:"column", gap: 9 }}>
                {c.l.map(([label,href],j)=>(
                  <a key={j} href={href} className="foot-link">{label}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,.12)" }}>
        <div className="shell" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"22px 0", flexWrap:"wrap", gap: 12 }}>
          <div className="mono" style={{ fontSize: 11, color:"#8C95C2", letterSpacing:".1em" }}>
            © {new Date().getFullYear()} SPOTLOG · CNPJ 00.000.000/0001-00 · SÃO PAULO/SP
          </div>
          <div className="mono" style={{ fontSize: 11, color:"#8C95C2", letterSpacing:".1em", display:"flex", alignItems:"center", gap: 8 }}>
            <span style={{ width:7,height:7,borderRadius:"50%",background:"var(--green)",display:"inline-block" }}/>
            OPERAÇÃO ONLINE · ATENDIMENTO 24/7
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 980px){ .ft-cols{ grid-template-columns: 1fr 1fr 1fr !important; } }
        @media (max-width: 760px){ .ft-seg{ grid-template-columns: 1fr !important; gap: 28px !important; } }
        @media (max-width: 640px){ .ft-cols{ grid-template-columns: 1fr 1fr !important; gap: 28px !important; } }
      `}</style>
    </footer>
  );
}
