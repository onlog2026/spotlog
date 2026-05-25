import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getIntegration, requireIntegration } from "./index";

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIGenerateOptions = {
  organization_id: string;
  messages: AIMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  json?: boolean;
};

/**
 * Gera texto usando o provider de IA configurado na org. Prefere Anthropic
 * se as duas estiverem ativas; cai pra OpenAI; falha clara se nenhuma.
 */
export async function aiGenerate(opts: AIGenerateOptions): Promise<string> {
  const anthro = await getIntegration(opts.organization_id, "anthropic");
  if (anthro) {
    const client = new Anthropic({ apiKey: anthro.credentials.api_key });
    const system = opts.messages.find((m) => m.role === "system")?.content;
    const others = opts.messages.filter((m) => m.role !== "system");
    const resp = await client.messages.create({
      model: opts.model ?? "claude-3-5-sonnet-latest",
      max_tokens: opts.max_tokens ?? 1024,
      temperature: opts.temperature ?? 0.7,
      system,
      messages: others.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });
    return resp.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("");
  }

  const openai = await getIntegration(opts.organization_id, "openai");
  requireIntegration(openai, "openai");
  const client = new OpenAI({ apiKey: openai.credentials.api_key });
  const resp = await client.chat.completions.create({
    model: opts.model ?? "gpt-4o-mini",
    max_tokens: opts.max_tokens ?? 1024,
    temperature: opts.temperature ?? 0.7,
    response_format: opts.json ? { type: "json_object" } : undefined,
    messages: opts.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });
  return resp.choices[0]?.message?.content ?? "";
}

export async function aiAvailable(organization_id: string): Promise<boolean> {
  const a = await getIntegration(organization_id, "anthropic");
  if (a) return true;
  const o = await getIntegration(organization_id, "openai");
  return !!o;
}
