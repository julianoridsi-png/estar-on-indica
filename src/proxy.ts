import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig, isSupabaseConfigured } from "@/services/supabase/config";
import { roleHomePath } from "@/features/autenticacao/services/queries";

const PROTECTED_PREFIXES = [
 "/painel",
 "/indicacoes",
 "/recebimentos",
 "/admin",
 "/comercial",
 "/sem-acesso",
];
const AUTH_ROUTES = ["/login", "/cadastro", "/recuperar-senha"];

function isProtectedPath(pathname: string) {
 return PROTECTED_PREFIXES.some(
 (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
 );
}

function copyCookies(from: NextResponse, to: NextResponse) {
 from.cookies.getAll().forEach((cookie) => {
 to.cookies.set(cookie.name, cookie.value, cookie);
 });
 return to;
}

function redirectTo(request: NextRequest, response: NextResponse, path: string) {
 const url = request.nextUrl.clone();
 url.pathname = path;
 url.search = "";
 return copyCookies(response, NextResponse.redirect(url));
}

export async function proxy(request: NextRequest) {
 const { pathname, search } = request.nextUrl;

 // Sem credenciais do Supabase a aplicação continua navegável e mostra
 // instruções claras de configuração nas telas de autenticação.
 if (!isSupabaseConfigured()) {
 return NextResponse.next();
 }

 const { url, anonKey } = getSupabaseConfig();
 let response = NextResponse.next({ request });

 const supabase = createServerClient(url, anonKey, {
 cookies: {
 getAll() {
 return request.cookies.getAll();
 },
 setAll(cookiesToSet) {
 cookiesToSet.forEach(({ name, value }) => {
 request.cookies.set(name, value);
 });
 response = NextResponse.next({ request });
 cookiesToSet.forEach(({ name, value, options }) => {
 response.cookies.set(name, value, options);
 });
 },
 },
 });

 // IMPORTANTE: getUser() valida o token no servidor. Não use getSession()
 // para decisões de autorização.
 const {
 data: { user },
 } = await supabase.auth.getUser();

 const isAuthRoute =
 AUTH_ROUTES.includes(pathname) || pathname.startsWith("/cadastro/");
 const isProtected = isProtectedPath(pathname);

 if (!user && isProtected) {
 const loginUrl = request.nextUrl.clone();
 loginUrl.pathname = "/login";
 loginUrl.search = "";
 loginUrl.searchParams.set("next", `${pathname}${search}`);
 return copyCookies(response, NextResponse.redirect(loginUrl));
 }

 if (!user) {
 return response;
 }

 let role: "indicador" | "comercial" | "admin" | null = null;
 let isInactive = false;

 if (isProtected || isAuthRoute) {
 const { data: profile } = await supabase
 .from("profiles")
 .select("tipo_usuario, status")
 .eq("id", user.id)
 .maybeSingle();

 role = profile?.tipo_usuario ?? null;
 isInactive = profile?.status === "inativo";
 }

 if (isInactive && pathname !== "/login") {
 await supabase.auth.signOut();
 const loginUrl = request.nextUrl.clone();
 loginUrl.pathname = "/login";
 loginUrl.search = "";
 loginUrl.searchParams.set("error", "conta_inativa");
 return copyCookies(response, NextResponse.redirect(loginUrl));
 }

 // Usuário autenticado não deve ver login/cadastro novamente.
 if (isAuthRoute && role) {
 return redirectTo(request, response, roleHomePath(role));
 }

 // /redefinir-senha exige sessão de recuperação; não redirecionar.
 if (
 user &&
 pathname.startsWith("/admin") &&
 role !== "admin" &&
 role !== "comercial"
 ) {
 return redirectTo(request, response, "/painel");
 }

 if (
 user &&
 pathname.startsWith("/comercial") &&
 role !== "admin" &&
 role !== "comercial"
 ) {
 return redirectTo(request, response, "/painel");
 }

 if (
 user &&
 (pathname.startsWith("/painel") ||
 pathname.startsWith("/indicacoes") ||
 pathname.startsWith("/recebimentos")) &&
 (role === "admin" || role === "comercial")
 ) {
 return redirectTo(request, response, "/admin");
 }

 return response;
}

export const config = {
 matcher: [
 "/painel/:path*",
 "/indicacoes/:path*",
 "/recebimentos/:path*",
 "/admin/:path*",
 "/comercial/:path*",
 "/sem-acesso",
 "/login",
 "/cadastro",
 "/cadastro/:path*",
 "/recuperar-senha",
 "/redefinir-senha",
 ],
};
