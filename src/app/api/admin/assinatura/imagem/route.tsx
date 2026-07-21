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
  const logo = searchParams.get("logo") || `${origin}/logo-spotlog-signature.png`;

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
          padding: "56px 68px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          width={200}
          height={200}
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
          <div style={{ fontSize: 52, fontWeight: 700, color: NAVY }}>{nome}</div>
          {cargo ? (
            <div style={{ fontSize: 32, color: "#6b7280", marginTop: 8, marginBottom: 20 }}>
              {cargo}
            </div>
          ) : (
            <div style={{ height: 20 }} />
          )}
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", marginTop: 6 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.icon} width={36} height={36} style={{ marginRight: 16 }} alt="" />
              <span style={{ fontSize: 32, color: "#374151" }}>{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1280, height: 440 },
  );
}
