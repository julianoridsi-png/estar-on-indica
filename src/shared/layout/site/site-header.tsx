import { createClient } from "@/services/supabase/server";
import { isSupabaseConfigured } from "@/services/supabase/config";
import { getPublicSettings } from "@/shared/lib/settings";
import { SiteHeaderClient } from "./site-header-client";

export async function SiteHeader() {
  const settings = await getPublicSettings();
  let isAuthenticated = false;
  let isAdmin = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      isAuthenticated = Boolean(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("tipo_usuario")
          .eq("id", user.id)
          .maybeSingle();
        isAdmin =
          profile?.tipo_usuario === "admin" ||
          profile?.tipo_usuario === "comercial";
      }
    } catch {
      isAuthenticated = false;
      isAdmin = false;
    }
  }

  return (
    <SiteHeaderClient
      logoUrl={settings.logo_url}
      companyName={settings.nome_empresa}
      isAuthenticated={isAuthenticated}
      isAdmin={isAdmin}
    />
  );
}
