/**
 * Tipos do banco gerados a partir do schema Supabase.
 * Após rodar as migrations, gere os tipos reais com:
 *   npx supabase gen types typescript --project-id SEU_ID > src/lib/types/database.ts
 *
 * Esse arquivo é apenas um shape mínimo pra TypeScript compilar.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, Record<string, unknown>>;
  };
}
