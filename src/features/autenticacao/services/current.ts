import "server-only";
import { cache } from "react";
import { createClient } from "@/services/supabase/server";
import { isSupabaseConfigured } from "@/services/supabase/config";
import { getSessionProfile } from "./queries";

/**
 * Uma única consulta de sessão + perfil por requisição.
 * Layout e página compartilham o mesmo resultado.
 */
export const getCurrentSession = cache(async () => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  return getSessionProfile(supabase);
});
