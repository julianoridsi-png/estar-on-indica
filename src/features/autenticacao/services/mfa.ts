"use server";

import { getCurrentSession } from "@/features/autenticacao/services/current";
import { createClient } from "@/services/supabase/server";
import { isSupabaseConfigured } from "@/services/supabase/config";

export type MfaEnrollResult =
  | { status: "success"; factorId: string; qrCode: string; secret: string }
  | { status: "error"; message: string };

export type MfaVerifyResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export async function enrollMfaAction(): Promise<MfaEnrollResult> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase não configurado." };
  }

  const session = await getCurrentSession();
  if (!session?.profile) {
    return { status: "error", message: "Faça login para configurar o MFA." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Estar On Indica - Authenticator",
  });

  if (error || !data) {
    console.error("Erro ao enroll MFA:", error?.message);
    return {
      status: "error",
      message: error?.message ?? "Não foi possível iniciar o MFA.",
    };
  }

  return {
    status: "success",
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export async function verifyMfaEnrollmentAction(
  factorId: string,
  code: string,
): Promise<MfaVerifyResult> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase não configurado." };
  }

  const supabase = await createClient();
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error || !challenge.data) {
    return { status: "error", message: challenge.error?.message ?? "Erro ao criar desafio." };
  }

  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  });

  if (verify.error) {
    return { status: "error", message: verify.error.message ?? "Código inválido." };
  }

  return { status: "success", message: "MFA configurado com sucesso." };
}

export async function challengeMfaAction(
  factorId: string,
): Promise<{ status: "success"; challengeId: string } | { status: "error"; message: string }> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase não configurado." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });
  if (error || !data) {
    return { status: "error", message: error?.message ?? "Erro ao criar desafio." };
  }
  return { status: "success", challengeId: data.id };
}

export async function verifyMfaChallengeAction(
  factorId: string,
  challengeId: string,
  code: string,
): Promise<MfaVerifyResult> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase não configurado." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
  if (error) {
    return { status: "error", message: error.message ?? "Código inválido." };
  }
  return { status: "success", message: "Verificação concluída." };
}

export async function listMfaFactorsAction(): Promise<
  | { status: "success"; factors: Array<{ id: string; friendlyName: string | null; status: string }> }
  | { status: "error"; message: string }
> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase não configurado." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) {
    return { status: "error", message: error.message ?? "Erro ao listar fatores." };
  }
  return {
    status: "success",
    factors: (data?.totp ?? []).map((f) => ({
      id: f.id,
      friendlyName: f.friendly_name ?? null,
      status: f.status,
    })),
  };
}
