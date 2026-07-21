import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const NAVY = "#011960";
const RED = "#BA0102";

/**
 * Gera a assinatura como imagem PNG (útil pra quem não pode colar HTML —
 * ex: WhatsApp Business, ou clientes de e-mail que quebram o layout).
 * Query params: nome, cargo, telefone, whatsapp, email, logo (URL).
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const clip = (s: string, max: number) => s.slice(0, max);
  const nome = clip(searchParams.get("nome") || "Seu Nome", 60);
  const cargo = clip(searchParams.get("cargo") || "", 60);
  const telefone = clip(searchParams.get("telefone") || "", 30);
  const whatsapp = clip(searchParams.get("whatsapp") || "", 30);
  const email = clip(searchParams.get("email") || "", 60);
  const logo = searchParams.get("logo") || `${origin}/logo-spotlog-signature.png`;

  // Controles do usuário (botões -/+ no admin). 1 = tamanho padrão.
  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
  const logoScale = clamp(Number(searchParams.get("logoScale")) || 1, 0.6, 1.5);
  const fontScale = clamp(Number(searchParams.get("fontScale")) || 1, 0.6, 1.5);

  const iconPhone = `${origin}/icons/signature-phone.png`;
  const iconWhatsapp = `${origin}/icons/signature-whatsapp.png`;
  const iconEmail = `${origin}/icons/signature-email.png`;

  const rows = [
    telefone && { icon: iconPhone, label: telefone },
    whatsapp && { icon: iconWhatsapp, label: whatsapp },
    email && { icon: iconEmail, label: email },
  ].filter(Boolean) as { icon: string; label: string }[];

  const logoSize = Math.round(200 * logoScale);
  const nameSize = Math.round(52 * fontScale);
  const cargoSize = Math.round(32 * fontScale);
  const iconSize = Math.round(36 * fontScale);
  const rowSize = Math.round(32 * fontScale);

  // Largura do canvas cresce com o conteúdo (nome/cargo/contatos + escala) pra
  // nunca cortar texto — Arial larga ~0.58x o tamanho da fonte por caractere.
  const charW = (fontSize: number) => fontSize * 0.58;
  const textWidths = [
    nome.length * charW(nameSize),
    cargo.length * charW(cargoSize),
    ...rows.map((r) => iconSize + 16 + r.label.length * charW(rowSize)),
  ];
  const maxTextWidth = Math.max(0, ...textWidths);
  const leftFixed = 68 + logoSize + 52 + 6 + 52; // padding esq. + logo + margem + borda + padding interno
  const canvasWidth = Math.min(2400, Math.max(1280, Math.round(leftFixed + maxTextWidth + 68)));

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          background: "#ffffff",
          padding: "56px 68px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          width={logoSize}
          height={logoSize}
          style={{ objectFit: "contain", marginRight: 52 }}
          alt=""
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderLeft: `6px solid ${RED}`,
            paddingLeft: 52,
          }}
        >
          <div style={{ fontSize: nameSize, fontWeight: 700, color: NAVY }}>{nome}</div>
          {cargo ? (
            <div style={{ fontSize: cargoSize, color: "#6b7280", marginTop: 8, marginBottom: 20 }}>
              {cargo}
            </div>
          ) : (
            <div style={{ height: 20 }} />
          )}
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", marginTop: 6 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.icon} width={iconSize} height={iconSize} style={{ marginRight: 16 }} alt="" />
              <span style={{ fontSize: rowSize, color: "#374151" }}>{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: canvasWidth, height: 560 },
  );
}
