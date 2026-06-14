import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AppState } from "./types";
import { SUPABASE_URL, SUPABASE_ANON_KEY, HAS_CLOUD } from "./config";

// Cliente único de Supabase, creado con la config incrustada (config.ts).
const TABLE = "app_state";

let client: SupabaseClient | null = null;

export function getClient(): SupabaseClient | null {
  if (!HAS_CLOUD) return null;
  if (client) return client;
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}

export async function pullState(c: SupabaseClient, userId: string): Promise<AppState | null> {
  const { data, error } = await c
    .from(TABLE)
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.data as AppState) ?? null;
}

export async function pushState(c: SupabaseClient, userId: string, state: AppState): Promise<void> {
  const { error } = await c
    .from(TABLE)
    .upsert(
      { user_id: userId, data: state, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) throw error;
}

// Token de la sesión actual (para autenticar el Worker de IA)
export async function getAccessToken(): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  const { data } = await c.auth.getSession();
  return data.session?.access_token ?? null;
}
