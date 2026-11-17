"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { friendlyDbError } from "@/shared/lib/errors";
import {
  isSupabaseConfigured,
  SETUP_REQUIRED_MESSAGE,
} from "@/services/supabase/config";
import { createClient } from "@/services/supabase/server";
import { REWARD_STATUS_VALUES } from "@/features/administracao/services/types";
import type { RevealedPixKey } from "@/features/pagamentos-pix/services/types";

export type AdminActionResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string; field?: string };

export type RevealPixResult =
  | { status: "success"; data: RevealedPixKey }
  | { status: "error"; message: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireAdmin() {
  const session = await getCurrentSession();

  if (!session?.profile) {
    return {
      error: "Sua sessão expirou. Entre novamente para continuar.",
      supabase: null,
    };
  }

  if (session.profile.tipo_usuario !== "admin") {
    return {
      error: "Esta ação é exclusiva do administrador.",
      supabase: null,
    };
  }

  const supabase = await createClient();
  return { error: null, supabase };
}

function refreshAdminViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/indicadores");
  revalidatePath("/admin/recompensas");
}

export async function revealPixAction(
  profileId: string,
): Promise<RevealPixResult> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: SETUP_REQUIRED_MESSAGE };
  }

  if (!UUID_PATTERN.test(profileId)) {
    return { status: "error", message: "Indicador inválido." };
  }

  const { error: authError, supabase } = await requireAdmin();
  if (authError || !supabase) {
    return { status: "error", message: authError ?? "Acesso negado." };
  }

  const { data, error } = await supabase.rpc("admin_revelar_chave_pix", {
    p_profile_id: profileId,
  });

  if (error) {
    console.error("Erro ao consultar chave PIX:", error.message);
    return {
      status: "error",
      message: friendlyDbError(
        error.message,
        "Não foi possível consultar a chave PIX.",
      ),
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/indicadores");
  revalidatePath("/admin/recompensas");

  return { status: "success", data: data as RevealedPixKey };
}

export async function updateRewardStatusAction(input: {
  rewardId: string;
  status: string;
}): Promise<AdminActionResult> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: SETUP_REQUIRED_MESSAGE };
  }

  if (!UUID_PATTERN.test(input.rewardId)) {
    return { status: "error", message: "Recompensa inválida." };
  }

  if (
    !REWARD_STATUS_VALUES.includes(
      input.status as (typeof REWARD_STATUS_VALUES)[number],
    )
  ) {
    return { status: "error", message: "Selecione um status válido." };
  }

  const { error: authError, supabase } = await requireAdmin();
  if (authError || !supabase) {
    return { status: "error", message: authError ?? "Acesso negado." };
  }

  const { error } = await supabase.rpc("admin_atualizar_status_recompensa", {
    p_reward_id: input.rewardId,
    p_status: input.status,
  });

  if (error) {
    console.error("Erro ao atualizar recompensa:", error.message);
    return {
      status: "error",
      message: friendlyDbError(
        error.message,
        "Não foi possível atualizar a recompensa. Tente novamente.",
      ),
    };
  }

  refreshAdminViews();
  revalidatePath("/recebimentos");

  const labels: Record<string, string> = {
    disponivel: "Recompensa liberada para pagamento.",
    pago: "Pagamento registrado com sucesso.",
    cancelado: "Recompensa cancelada.",
    pendente: "Recompensa reaberta como pendente.",
  };

  return {
    status: "success",
    message: labels[input.status] ?? "Recompensa atualizada.",
  };
}

export async function updateRewardSettingsAction(input: {
  valorCentavos: number;
  prazoDias: number;
}): Promise<AdminActionResult> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: SETUP_REQUIRED_MESSAGE };
  }

  if (
    !Number.isInteger(input.valorCentavos) ||
    input.valorCentavos < 0 ||
    input.valorCentavos > 100000000
  ) {
    return {
      status: "error",
      message: "Informe um valor entre R$ 0,00 e R$ 1.000.000,00.",
      field: "valor",
    };
  }

  if (
    !Number.isInteger(input.prazoDias) ||
    input.prazoDias < 0 ||
    input.prazoDias > 365
  ) {
    return {
      status: "error",
      message: "Informe um prazo entre 0 e 365 dias.",
      field: "prazo",
    };
  }

  const { error: authError, supabase } = await requireAdmin();
  if (authError || !supabase) {
    return { status: "error", message: authError ?? "Acesso negado." };
  }

  const { error } = await supabase.rpc("admin_atualizar_config_recompensa", {
    p_valor_centavos: input.valorCentavos,
    p_prazo_dias: input.prazoDias,
  });

  if (error) {
    console.error("Erro ao atualizar configuração de recompensa:", error.message);
    return {
      status: "error",
      message: friendlyDbError(
        error.message,
        "Não foi possível salvar a configuração.",
      ),
    };
  }

  refreshAdminViews();
  revalidatePath("/recebimentos");

  return { status: "success", message: "Configuração de recompensa atualizada." };
}

export async function generatePendingRewardsAction(): Promise<AdminActionResult> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: SETUP_REQUIRED_MESSAGE };
  }

  const { error: authError, supabase } = await requireAdmin();
  if (authError || !supabase) {
    return { status: "error", message: authError ?? "Acesso negado." };
  }

  const { data, error } = await supabase.rpc("admin_gerar_recompensas_pendentes");

  if (error) {
    console.error("Erro ao gerar recompensas:", error.message);
    return {
      status: "error",
      message: friendlyDbError(
        error.message,
        "Não foi possível gerar as recompensas pendentes.",
      ),
    };
  }

  refreshAdminViews();
  revalidatePath("/recebimentos");

  const result = data as { criadas?: number } | null;
  const criadas = Number(result?.criadas ?? 0);

  return {
    status: "success",
    message:
      criadas === 0
        ? "Nenhuma recompensa pendente para gerar."
        : `${criadas} ${criadas === 1 ? "recompensa gerada" : "recompensas geradas"}.`,
  };
}
