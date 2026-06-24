/**
 * Helper de tipos para queries do SDR — contorna `Database` stub do projeto
 * que retorna `never` para Insert/Update e quebra typecheck.
 *
 * Os tipos reais virão do `supabase gen types` quando rodado.
 */
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseAny = any;

export async function getSdrClient(): Promise<SupabaseAny> {
  return (await createClient()) as unknown as SupabaseAny;
}
