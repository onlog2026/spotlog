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
  const nome = searchParams.get("nome") || "Seu Nome";
  const cargo = searchParams.get("cargo") || "";
  const telefone = searchParams.get("telefone") || "";
  const whatsapp = searchParams.get("whatsapp") || "";
  const email = searchParams.get("email") || "";
  const logo = searchParams.get("logo") || `${origin}/logo-spotlog.png`;

  const iconPhone = `${origin}/icons/signature-phone.png`;
  const iconWhatsapp = `${origin}/icons/signature-whatsapp.png`;
  const iconEmail = `${origin}/icons/signature-email.png`;

  const rows = [
    telefone && { icon: iconPhone, label: telefone },
    whatsapp && { icon: iconWhatsapp, label: whatsapp },
    email && { icon: iconEmail, label: email },
  ].filter(Boolean) as { icon: string; label: string }[];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          background: "#ffffff",
          padding: "28px 34px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          width={100}
          height={100}
          style={{ objectFit: "contain", marginRight: 26 }}
          alt=""
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderLeft: `3px solid ${RED}`,
            paddingLeft: 26,
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700, color: NAVY }}>{nome}</div>
          {cargo ? (
            <div style={{ fontSize: 16, color: "#6b7280", marginTop: 4, marginBottom: 10 }}>
              {cargo}
            </div>
          ) : (
            <div style={{ height: 10 }} />
          )}
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", marginTop: 3 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.icon} width={18} height={18} style={{ marginRight: 8 }} alt="" />
              <span style={{ fontSize: 16, color: "#374151" }}>{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 640, height: 220 },
  );
}
