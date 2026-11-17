import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

let browserClient: SupabaseClient | undefined;

/**
 * Cliente do Supabase para componentes que rodam no navegador.
 * Usa somente a chave pública (anon), que é protegida pelas políticas RLS.
 */
export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const { url, anonKey } = getSupabaseConfig();
  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}
