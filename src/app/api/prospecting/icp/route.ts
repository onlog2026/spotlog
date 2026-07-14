import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { chatComplete } from "@/lib/ai/openai-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Agente ICP Generator + Estrategista.
 * Recebe UMA frase do dono ("quero vender logística para farmácias de
 * manipulação do Brasil que faturam acima de 5 milhões") e devolve:
 *  - ICP estruturado (segmento, keywords de busca, porte, localização,
 *    cargos-alvo, dores prováveis, tecnologias);
 *  - ESTRATÉGIA de prospecção (persona do SDR, gancho, canal, nº de toques).
 * Nada é inventado como FATO sobre empresas — isso aqui é planejamento de
 * campanha (hipóteses de mercado), e o texto deixa isso claro.
 */

const schema = z.object({
  description: z.string().min(10).max(1000),
});

export type IcpAi = {
  segmento: string;
  keywords: string[];
  cidades: string[];
  ufs: string[];
  porte: string;
  faturamento_alvo: string;
  cargos_alvo: string[];
  dores_provaveis: string[];
  tecnologias: string[];
  estrategia: {
    persona: string;
    gancho: string;
    canal_primeiro_toque: "whatsapp" | "email";
    num_toques: number;
    tom: string;
  };
};

const SYS = `Você é um estrategista sênior de prospecção B2B no Brasil. O usuário descreve, em uma frase, o que quer vender e pra quem. Você devolve APENAS um JSON válido (sem markdown, sem comentários) com este formato exato:
{
  "segmento": "nome curto do segmento-alvo",
  "keywords": ["6 a 12 termos de busca que acham essas empresas no Google Maps/OSM — inclua sinônimos e variações reais em PT-BR, ex.: 'farmácia de manipulação', 'farmácia magistral'"],
  "cidades": ["até 5 cidades-alvo; se o usuário disse 'Brasil' ou não disse, use as maiores praças do segmento, começando por São Paulo"],
  "ufs": ["UFs correspondentes"],
  "porte": "faixa de funcionários alvo, ex.: '20-300'",
  "faturamento_alvo": "faixa de faturamento, ex.: 'R$5M+' (se o usuário citou)",
  "cargos_alvo": ["cargos de quem decide essa compra"],
  "dores_provaveis": ["4 a 6 dores REAIS e específicas desse segmento em relação ao que o usuário vende"],
  "tecnologias": ["tecnologias/sistemas que essas empresas costumam usar (ERP, plataformas), se relevante"],
  "estrategia": {
    "persona": "1 parágrafo: quem é o SDR (nome da empresa do usuário se ele disse), o que vende, prova de valor, tom — pronto pra usar como persona de IA",
    "gancho": "o melhor gancho de abertura pra esse segmento (1 frase)",
    "canal_primeiro_toque": "whatsapp" ou "email",
    "num_toques": 4,
    "tom": "3 adjetivos do tom de voz"
  }
}
Regras: PT-BR; keywords têm que ser termos que EXISTEM em nomes/categorias de estabelecimentos; nada de inventar dados de empresas específicas; se a frase não der pra inferir algo, use o padrão do segmento.`;

export async function POST(req: NextRequest) {
  let orgId: string;
  try {
    const ctx = await requireSession();
    orgId = ctx.org.id;
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Descreva em pelo menos 10 caracteres o que você quer vender e pra quem." },
      { status: 400 },
    );
  }

  const res = await chatComplete({
    model: "gpt-4o",
    temperature: 0.4,
    maxTokens: 1200,
    orgId,
    messages: [
      { role: "system", content: SYS },
      { role: "user", content: parsed.data.description },
    ],
  });

  if (!res.ok || !res.content?.trim()) {
    return NextResponse.json(
      { error: "A IA não respondeu agora. Tente de novo em instantes." },
      { status: 502 },
    );
  }

  // Parse robusto: tira cerca de código e acha o primeiro objeto JSON.
  let raw = res.content.trim();
  raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return NextResponse.json({ error: "Resposta da IA fora do formato. Tente de novo." }, { status: 502 });
  }
  let icp: IcpAi;
  try {
    icp = JSON.parse(raw.slice(start, end + 1)) as IcpAi;
  } catch {
    return NextResponse.json({ error: "Resposta da IA fora do formato. Tente de novo." }, { status: 502 });
  }

  // Sanidade mínima (fail-open com defaults, nunca quebra o fluxo do form)
  icp.keywords = (icp.keywords ?? []).filter(Boolean).slice(0, 12);
  icp.cidades = (icp.cidades ?? []).filter(Boolean).slice(0, 5);
  icp.ufs = (icp.ufs ?? []).filter(Boolean).slice(0, 5);
  icp.cargos_alvo = (icp.cargos_alvo ?? []).filter(Boolean).slice(0, 8);
  icp.dores_provaveis = (icp.dores_provaveis ?? []).filter(Boolean).slice(0, 6);
  icp.tecnologias = (icp.tecnologias ?? []).filter(Boolean).slice(0, 8);
  if (!icp.estrategia) {
    icp.estrategia = {
      persona: "Consultor comercial da empresa do usuário.",
      gancho: "",
      canal_primeiro_toque: "whatsapp",
      num_toques: 4,
      tom: "humano, direto, consultivo",
    };
  }

  return NextResponse.json({ icp });
}
