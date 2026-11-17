"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { friendlyDbError } from "@/shared/lib/errors";
import {
  isSupabaseConfigured,
  SETUP_REQUIRED_MESSAGE,
} from "@/services/supabase/config";
import { createClient } from "@/services/supabase/server";
import { onlyDigits } from "@/shared/lib/validation/cpf";
import {
  referralFormSchema,
  type ReferralFormValues,
} from "@/features/indicacoes/schemas/referral";
import { REFERRAL_STATUS_VALUES } from "@/features/indicacoes/services/status";

export type ReferralActionResult =
  | { status: "success"; message: string; referralId?: string }
  | { status: "error"; message: string; field?: string };

function refreshReferralViews() {
  revalidatePath("/painel");
  revalidatePath("/indicacoes");
  revalidatePath("/admin");
  revalidatePath("/admin/indicacoes");
}

export async function createReferralAction(
  input: ReferralFormValues,
): Promise<ReferralActionResult> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: SETUP_REQUIRED_MESSAGE };
  }

  const parsed = referralFormSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      status: "error",
      message: issue?.message ?? "Confira os dados da indicação.",
      field: issue?.path[0] ? String(issue.path[0]) : undefined,
    };
  }

  const session = await getCurrentSession();
  if (!session?.profile) {
    return {
      status: "error",
      message: "Sua sessão expirou. Entre novamente para cadastrar a indicação.",
    };
  }

  if (session.profile.tipo_usuario !== "indicador") {
    return {
      status: "error",
      message: "Apenas indicadores podem cadastrar novas indicações.",
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: result, error } = await supabase.rpc("criar_indicacao", {
    p_indicado_nome: data.indicado_nome.trim(),
    p_indicado_cpf: onlyDigits(data.indicado_cpf),
    p_indicado_email: data.indicado_email.trim().toLowerCase(),
    p_indicado_telefone: onlyDigits(data.indicado_telefone),
    p_cep: onlyDigits(data.cep),
    p_endereco: data.endereco.trim(),
    p_numero: data.numero.trim(),
    p_complemento: data.complemento?.trim() || null,
    p_bairro: data.bairro.trim(),
    p_cidade: data.cidade.trim(),
    p_estado: data.estado.toUpperCase(),
    p_observacoes: data.observacoes?.trim() || null,
    p_consentimento: data.consentimento,
  });

  if (error) {
    console.error("Erro ao criar indicação:", error.message);
    return {
      status: "error",
      message: friendlyDbError(
        error.message,
        "Não foi possível cadastrar a indicação. Tente novamente.",
      ),
    };
  }

  refreshReferralViews();

  const referral = result as { id?: string } | null;

  return {
    status: "success",
    message: "Indicação cadastrada com sucesso.",
    referralId: referral?.id,
  };
}

export async function updateReferralStatusAction(input: {
  referralId: string;
  status: string;
  observacao?: string;
}): Promise<ReferralActionResult> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: SETUP_REQUIRED_MESSAGE };
  }

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      input.referralId,
    )
  ) {
    return { status: "error", message: "Indicação inválida." };
  }

  if (
    !REFERRAL_STATUS_VALUES.includes(
      input.status as (typeof REFERRAL_STATUS_VALUES)[number],
    )
  ) {
    return { status: "error", message: "Selecione um status válido." };
  }

  const observacao = input.observacao?.trim() ?? "";
  if (observacao.length > 500) {
    return {
      status: "error",
      message: "A observação deve ter no máximo 500 caracteres.",
      field: "observacao",
    };
  }

  const session = await getCurrentSession();
  if (!session?.profile) {
    return {
      status: "error",
      message: "Sua sessão expirou. Entre novamente para atualizar o status.",
    };
  }

  if (
    session.profile.tipo_usuario !== "admin" &&
    session.profile.tipo_usuario !== "comercial"
  ) {
    return {
      status: "error",
      message: "Apenas a equipe Estar On pode alterar o status.",
    };
  }

  const supabase = await createClient();
  const { data: result, error } = await supabase.rpc(
    "admin_atualizar_status_indicacao",
    {
      p_referral_id: input.referralId,
      p_status: input.status,
      p_observacao: observacao || null,
    },
  );

  if (error) {
    console.error("Erro ao atualizar status da indicação:", error.message);
    return {
      status: "error",
      message: friendlyDbError(
        error.message,
        "Não foi possível atualizar o status. Tente novamente.",
      ),
    };
  }

  refreshReferralViews();
  revalidatePath(`/admin/indicacoes/${input.referralId}`);

  const updated = result as { label?: string; alterado?: boolean } | null;

  return {
    status: "success",
    message:
      updated?.alterado === false
        ? "A indicação já estava com este status."
        : `Status atualizado para ${updated?.label ?? "o novo status"}.`,
  };
}
