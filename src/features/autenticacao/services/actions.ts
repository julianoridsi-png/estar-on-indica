"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import {
 isSupabaseConfigured,
 SETUP_REQUIRED_MESSAGE,
} from "@/services/supabase/config";
import { verifyTurnstile } from "@/shared/lib/turnstile";
import {
 forgotPasswordSchema,
 loginFormSchema,
 resetPasswordSchema,
 signupFormSchema,
 type LoginFormValues,
 type SignupFormValues,
} from "@/features/autenticacao/schemas/auth";
import { onlyDigits } from "@/shared/lib/validation/cpf";
import { roleHomePath } from "@/features/autenticacao/services/queries";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/shared/lib/legal";

export type AuthActionResult =
 | { status: "success"; redirectTo?: string; message?: string }
 | { status: "error"; message: string; field?: string };

function safeNextPath(value: unknown): string | null {
 if (typeof value !== "string" || !value.startsWith("/")) return null;
 const allowedPrefixes = [
 "/painel",
 "/indicacoes",
 "/recebimentos",
 "/admin",
 "/comercial",
 "/redefinir-senha",
 ];

 const isAllowed = allowedPrefixes.some(
 (prefix) => value === prefix || value.startsWith(`${prefix}/`),
 );

 return isAllowed ? value : null;
}

async function getSiteOrigin(): Promise<string> {
 const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
 if (configured) return configured;

 const requestHeaders = await headers();
 const host =
 requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
 const protocol =
 requestHeaders.get("x-forwarded-proto") ??
 (host?.includes("localhost") ? "http" : "https");

 return `${protocol}://${host ?? "localhost:3000"}`;
}

function mapSignupError(message: string): string {
 const normalized = message.toLowerCase();

 if (normalized.includes("user already registered")) {
 return "Já existe uma conta com este e-mail. Tente entrar ou recuperar sua senha.";
 }
 if (normalized.includes("password")) {
 return "A senha não atende aos requisitos de segurança.";
 }
 if (normalized.includes("rate limit")) {
 return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
 }
 if (normalized.includes("database error")) {
 return "Não foi possível salvar o cadastro. Verifique se as migrations e a chave de CPF do Vault foram configuradas no Supabase.";
 }
 if (normalized.includes("invalid email")) {
 return "Informe um e-mail válido.";
 }

 return "Não foi possível concluir o cadastro. Tente novamente em instantes.";
}

export async function signUpAction(
 input: SignupFormValues,
): Promise<AuthActionResult> {
 if (!isSupabaseConfigured()) {
 return { status: "error", message: SETUP_REQUIRED_MESSAGE };
 }

 const parsed = signupFormSchema.safeParse(input);
 if (!parsed.success) {
 const firstIssue = parsed.error.issues[0];
 return {
 status: "error",
 message: firstIssue?.message ?? "Confira os dados informados.",
 field: firstIssue?.path[0] ? String(firstIssue.path[0]) : undefined,
 };
 }

 const data = parsed.data;
 if (!(await verifyTurnstile(data.turnstileToken))) {
    return { status: "error", message: "Verificação de segurança falhou. Tente novamente." };
  }

  const cpf = onlyDigits(data.cpf);
 const supabase = await createClient();

 // Evita criar o usuário de autenticação quando o CPF já possui perfil.
 const { data: cpfAvailable, error: cpfError } = await supabase.rpc(
 "cpf_disponivel",
 { p_cpf: cpf },
 );

 if (cpfError) {
 console.error("Erro ao verificar CPF:", cpfError.message);
 return {
 status: "error",
 message:
 "Não foi possível validar o CPF agora. Confirme se as migrations do banco foram executadas.",
 field: "cpf",
 };
 }

 if (cpfAvailable === false) {
 return {
 status: "error",
 message: "Este CPF já está cadastrado na plataforma.",
 field: "cpf",
 };
 }

 const origin = await getSiteOrigin();
 const email = data.email.toLowerCase().trim();

 const { data: authData, error } = await supabase.auth.signUp({
 email,
 password: data.senha,
 options: {
 emailRedirectTo: `${origin}/auth/callback?next=/painel`,
 data: {
 nome_completo: data.nome_completo.trim(),
 cpf,
 telefone: onlyDigits(data.telefone),
 cep: onlyDigits(data.cep),
 endereco: data.endereco.trim(),
 numero: data.numero.trim(),
 complemento: data.complemento?.trim() || null,
 bairro: data.bairro.trim(),
 cidade: data.cidade.trim(),
 estado: data.estado.toUpperCase(),
 termos_versao: TERMS_VERSION,
 privacidade_versao: PRIVACY_VERSION,
 },
 },
 });

 if (error) {
 console.error("Erro no cadastro:", error.message);
 return { status: "error", message: mapSignupError(error.message) };
 }

 // Quando a confirmação de e-mail está ativa, o Supabase devolve um usuário
 // sem identidade para e-mails já existentes (proteção contra enumeração).
 if (authData.user && authData.user.identities?.length === 0) {
 return {
 status: "error",
 message:
 "Não foi possível criar a conta com estes dados. Se você já tem cadastro, tente entrar ou recuperar a senha.",
 };
 }

 if (authData.session) {
 return { status: "success", redirectTo: "/painel" };
 }

 return {
 status: "success",
 redirectTo: `/cadastro/confirmar?email=${encodeURIComponent(email)}`,
 };
}

export async function signInAction(
 input: LoginFormValues,
): Promise<AuthActionResult> {
 if (!isSupabaseConfigured()) {
 return { status: "error", message: SETUP_REQUIRED_MESSAGE };
 }

 const parsed = loginFormSchema.safeParse(input);
 if (!parsed.success) {
 return {
 status: "error",
 message: parsed.error.issues[0]?.message ?? "Confira os dados.",
 };
 }

 if (!(await verifyTurnstile(parsed.data.turnstileToken))) {
    return { status: "error", message: "Verificação de segurança falhou. Tente novamente." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
 email: parsed.data.email.toLowerCase().trim(),
 password: parsed.data.senha,
 });

 if (error) {
 const message = error.message.toLowerCase();
 if (message.includes("invalid login credentials")) {
 return { status: "error", message: "E-mail ou senha incorretos." };
 }
 if (message.includes("email not confirmed")) {
 return {
 status: "error",
 message:
 "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.",
 };
 }
 if (message.includes("rate limit")) {
 return {
 status: "error",
 message:
 "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.",
 };
 }
 console.error("Erro no login:", error.message);
 return {
 status: "error",
 message: "Não foi possível entrar. Tente novamente em instantes.",
 };
 }

 if (!data.user) {
 return { status: "error", message: "Não foi possível iniciar a sessão." };
 }

 const { data: profile } = await supabase
 .from("profiles")
 .select("tipo_usuario, status")
 .eq("id", data.user.id)
 .maybeSingle();

 if (!profile) {
 await supabase.auth.signOut();
 return {
 status: "error",
 message:
 "Sua conta foi autenticada, mas o perfil não foi encontrado. Execute as migrations do banco e tente novamente.",
 };
 }

 if (profile.status === "inativo") {
 await supabase.auth.signOut();
 return {
 status: "error",
 message:
 "Esta conta está inativa. Fale com a equipe Estar On para mais informações.",
 };
 }

 const nextPath = safeNextPath(parsed.data.next);
 return {
 status: "success",
 redirectTo: nextPath ?? roleHomePath(profile.tipo_usuario),
 };
}

export async function signOutAction(): Promise<void> {
 if (isSupabaseConfigured()) {
 const supabase = await createClient();
 await supabase.auth.signOut();
 }

 redirect("/");
}

export async function requestPasswordResetAction(
 email: string,
): Promise<AuthActionResult> {
 if (!isSupabaseConfigured()) {
 return { status: "error", message: SETUP_REQUIRED_MESSAGE };
 }

 const parsed = forgotPasswordSchema.safeParse({ email });
 if (!parsed.success) {
 return {
 status: "error",
 message: parsed.error.issues[0]?.message ?? "Informe um e-mail válido.",
 };
 }

 const supabase = await createClient();
 const origin = await getSiteOrigin();

 const { error } = await supabase.auth.resetPasswordForEmail(
 parsed.data.email.toLowerCase().trim(),
 { redirectTo: `${origin}/auth/callback?next=/redefinir-senha` },
 );

 if (error) {
 const message = error.message.toLowerCase();
 if (message.includes("rate limit")) {
 return {
 status: "error",
 message:
 "Muitas solicitações em pouco tempo. Aguarde alguns minutos e tente novamente.",
 };
 }
 console.error("Erro ao solicitar recuperação:", error.message);
 }

 // Resposta genérica para não revelar se o e-mail está cadastrado.
 return {
 status: "success",
 message:
 "Se este e-mail estiver cadastrado, enviaremos um link para redefinir a senha.",
 };
}

export async function updatePasswordAction(input: {
 senha: string;
 confirmar_senha: string;
}): Promise<AuthActionResult> {
 if (!isSupabaseConfigured()) {
 return { status: "error", message: SETUP_REQUIRED_MESSAGE };
 }

 const parsed = resetPasswordSchema.safeParse(input);
 if (!parsed.success) {
 return {
 status: "error",
 message: parsed.error.issues[0]?.message ?? "Confira os dados.",
 };
 }

 const supabase = await createClient();
 const {
 data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
 return {
 status: "error",
 message:
 "O link de recuperação expirou. Solicite um novo link para redefinir a senha.",
 };
 }

 const { error } = await supabase.auth.updateUser({
 password: parsed.data.senha,
 });

 if (error) {
 const message = error.message.toLowerCase();
 if (message.includes("same password")) {
 return {
 status: "error",
 message: "A nova senha deve ser diferente da senha atual.",
 };
 }
 console.error("Erro ao atualizar senha:", error.message);
 return {
 status: "error",
 message:
 "Não foi possível atualizar a senha. Solicite um novo link e tente novamente.",
 };
 }

 await supabase.auth.signOut({ scope: "others" });

 const { data: profile } = await supabase
 .from("profiles")
 .select("tipo_usuario")
 .eq("id", user.id)
 .maybeSingle();

 return {
 status: "success",
 redirectTo: roleHomePath(profile?.tipo_usuario),
 message: "Senha alterada com sucesso.",
 };
}

export async function resendConfirmationAction(
 email: string,
): Promise<AuthActionResult> {
 if (!isSupabaseConfigured()) {
 return { status: "error", message: SETUP_REQUIRED_MESSAGE };
 }

 const parsed = forgotPasswordSchema.safeParse({ email });
 if (!parsed.success) {
 return {
 status: "error",
 message: "Informe um e-mail válido para reenviar a confirmação.",
 };
 }

 const supabase = await createClient();
 const origin = await getSiteOrigin();

 const { error } = await supabase.auth.resend({
 type: "signup",
 email: parsed.data.email.toLowerCase().trim(),
 options: {
 emailRedirectTo: `${origin}/auth/callback?next=/painel`,
 },
 });

 if (error) {
 const message = error.message.toLowerCase();
 if (message.includes("rate limit")) {
 return {
 status: "error",
 message:
 "Aguarde alguns minutos antes de solicitar um novo envio de e-mail.",
 };
 }
 console.error("Erro ao reenviar confirmação:", error.message);
 }

 return {
 status: "success",
 message:
 "Se o cadastro existir e estiver pendente, um novo e-mail de confirmação foi enviado.",
 };
}
