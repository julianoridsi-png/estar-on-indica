import { createClient } from "@/services/supabase/server";
import { isSupabaseConfigured } from "@/services/supabase/config";

export type PublicSettings = {
  logo_url: string | null;
  nome_empresa: string;
  cor_primaria: string;
  cor_secundaria: string;
  whatsapp_suporte: string | null;
  site_url: string | null;
};

export const DEFAULT_SETTINGS: PublicSettings = {
  logo_url: null,
  nome_empresa: "Estar On Internet",
  cor_primaria: "#0b5cff",
  cor_secundaria: "#071a3a",
  whatsapp_suporte: null,
  site_url: null,
};

/**
 * Configurações públicas de identidade visual.
 * Se o banco ainda não estiver configurado, retorna a identidade padrão.
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("settings")
      .select(
        "logo_url, nome_empresa, cor_primaria, cor_secundaria, whatsapp_suporte, site_url",
      )
      .eq("id", 1)
      .maybeSingle();

    if (!data) return DEFAULT_SETTINGS;

    return {
      logo_url: data.logo_url ?? null,
      nome_empresa: data.nome_empresa || DEFAULT_SETTINGS.nome_empresa,
      cor_primaria: data.cor_primaria || DEFAULT_SETTINGS.cor_primaria,
      cor_secundaria: data.cor_secundaria || DEFAULT_SETTINGS.cor_secundaria,
      whatsapp_suporte: data.whatsapp_suporte ?? null,
      site_url: data.site_url ?? null,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
