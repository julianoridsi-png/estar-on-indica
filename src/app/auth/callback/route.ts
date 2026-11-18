import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/services/supabase/server";
import { isSupabaseConfigured } from "@/services/supabase/config";

const ALLOWED_NEXT = ["/painel", "/admin", "/comercial", "/redefinir-senha"];

function safeNext(value: string | null): string {
 if (!value) return "/painel";
 if (!value.startsWith("/") || value.startsWith("//")) return "/painel";

 const isAllowed = ALLOWED_NEXT.some(
 (prefix) => value === prefix || value.startsWith(`${prefix}/`),
 );

 return isAllowed ? value : "/painel";
}

export async function GET(request: NextRequest) {
 const { searchParams, origin } = new URL(request.url);
 const code = searchParams.get("code");
 const next = safeNext(searchParams.get("next"));

 if (!isSupabaseConfigured()) {
 return NextResponse.redirect(`${origin}/login?error=configuracao`);
 }

 if (code) {
 const supabase = await createClient();
 const { error } = await supabase.auth.exchangeCodeForSession(code);

 if (!error) {
 return NextResponse.redirect(`${origin}${next}`);
 }
 }

 return NextResponse.redirect(`${origin}/login?error=link_invalido`);
}
