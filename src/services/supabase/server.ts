import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

/**
 * Cliente do Supabase para Server Components, Server Actions e Route Handlers.
 * Mantém a sessão nos cookies HTTP-only gerenciados pelo @supabase/ssr.
 */
export async function createClient(): Promise<SupabaseClient> {
  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components não podem gravar cookies.
          // O proxy (src/proxy.ts) renova a sessão antes da renderização.
        }
      },
    },
  });
}
