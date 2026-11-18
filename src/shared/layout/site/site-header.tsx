import { createClient } from "@/services/supabase/server";
import { isSupabaseConfigured } from "@/services/supabase/config";
import { getPublicSettings } from "@/shared/lib/settings";
import { SiteHeaderClient } from "./site-header-client";

export async function SiteHeader() {
 const settings = await getPublicSettings();
 let isAuthenticated = false;

 if (isSupabaseConfigured()) {
 try {
 const supabase = await createClient();
 const {
 data: { user },
 } = await supabase.auth.getUser();
 isAuthenticated = Boolean(user);
 } catch {
 isAuthenticated = false;
 }
 }

 return (
 <SiteHeaderClient
 logoUrl={settings.logo_url}
 companyName={settings.nome_empresa}
 isAuthenticated={isAuthenticated}
 />
 );
}
