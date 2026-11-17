const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

/**
 * Enquanto as variáveis não estiverem preenchidas no .env.local, a aplicação
 * exibe avisos de configuração em vez de falhar com erros técnicos.
 */
export function isSupabaseConfigured(): boolean {
  if (!url || !anonKey) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function getSupabaseConfig() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase não configurado. Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) no arquivo .env.local.",
    );
  }

  return { url, anonKey };
}

export const SETUP_REQUIRED_MESSAGE =
  "A conexão com o Supabase ainda não foi configurada. Preencha o arquivo .env.local e execute as migrations do banco.";