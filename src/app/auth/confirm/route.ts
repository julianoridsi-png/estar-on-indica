import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/services/supabase/server";
import { isSupabaseConfigured } from "@/services/supabase/config";

const ALLOWED_NEXT = ["/painel", "/admin", "/comercial", "/redefinir-senha"];
const ALLOWED_TYPES: EmailOtpType[] = [
 "signup",
 "invite",
 "magiclink",
 "recovery",
 "email_change",
 "email",
];

function safeNext(value: string | null): string {
 if (!value) return "/painel";
 if (!value.startsWith("/") || value.startsWith("//")) return "/painel";

 const isAllowed = ALLOWED_NEXT.some(
 (prefix) => value === prefix || value.startsWith(`${prefix}/`),
 );

 return isAllowed ? value : "/painel";
}

/**
 * Usado quando o template de e-mail do Supabase envia `token_hash`.
 * Configure os templates com a URL:
 * {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/painel
 */
export async function GET(request: NextRequest) {
 const { searchParams, origin } = new URL(request.url);
 const tokenHash = searchParams.get("token_hash");
 const type = searchParams.get("type") as EmailOtpType | null;
 const next = safeNext(searchParams.get("next"));

 if (!isSupabaseConfigured()) {
 return NextResponse.redirect(`${origin}/login?error=configuracao`);
 }

 if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
 const supabase = await createClient();
 const { error } = await supabase.auth.verifyOtp({
 type,
 token_hash: tokenHash,
 });

 if (!error) {
 return NextResponse.redirect(`${origin}${next}`);
 }
 }

 return NextResponse.redirect(`${origin}/login?error=link_invalido`);
}
