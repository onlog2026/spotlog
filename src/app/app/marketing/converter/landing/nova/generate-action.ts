"use server";

import { chatComplete, safeParseJson } from "@/lib/ai/openai-client";

export type GeneratedCopy = {
  title: string;
  slug: string;
  description: string;
  cta_label: string;
};

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function generateLandingCopy(topic: string): Promise<GeneratedCopy> {
  const fallback: GeneratedCopy = {
    title: topic.slice(0, 80),
    slug: slugify(topic),
    description: `Página dedicada a ${topic}. Edite a copy abaixo.`,
    cta_label: "Quero saber mais",
  };

  try {
    const resp = await chatComplete({
      jsonMode: true,
      maxTokens: 400,
      messages: [
        {
          role: "system",
          content:
            "Você é copywriter de landing page B2B. Retorne JSON estrito {title, description, cta_label} — sem comentários.",
        },
        {
          role: "user",
          content: `Crie copy para uma landing sobre: ${topic}. Title curto (até 80 chars), description 2 frases, cta_label objetivo.`,
        },
      ],
    });

    if (!resp.ok) return fallback;
    const parsed = safeParseJson<Partial<GeneratedCopy>>(resp.content);
    if (parsed?.title) {
      return {
        title: parsed.title.slice(0, 80),
        slug: slugify(parsed.title),
        description: parsed.description ?? fallback.description,
        cta_label: parsed.cta_label ?? fallback.cta_label,
      };
    }
  } catch (e) {
    console.warn("[landing copy] AI fallback", e);
  }

  return fallback;
}
