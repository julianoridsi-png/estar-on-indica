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
 pixFormSchema,
 type PixFormValues,
} from "@/features/pagamentos-pix/schemas/pix";

export type PixActionResult =
 | { status: "success"; message: string }
 | { status: "error"; message: string; field?: string };

function refreshPayoutViews() {
 revalidatePath("/recebimentos");
 revalidatePath("/admin");
 revalidatePath("/admin/indicadores");
 revalidatePath("/admin/recompensas");
}

export async function savePixAction(
 input: PixFormValues,
): Promise<PixActionResult> {
 if (!isSupabaseConfigured()) {
 return { status: "error", message: SETUP_REQUIRED_MESSAGE };
 }

 const parsed = pixFormSchema.safeParse(input);
 if (!parsed.success) {
 const issue = parsed.error.issues[0];
 return {
 status: "error",
 message: issue?.message ?? "Confira a chave informada.",
 field: issue?.path[0] ? String(issue.path[0]) : undefined,
 };
 }

 const session = await getCurrentSession();
 if (!session?.profile) {
 return {
 status: "error",
 message: "Sua sessão expirou. Entre novamente para salvar a chave PIX.",
 };
 }

 if (session.profile.tipo_usuario !== "indicador") {
 return {
 status: "error",
 message: "A conta PIX é exclusiva do perfil de indicador.",
 };
 }

 const data = parsed.data;
 const chave =
 data.tipo === "email" || data.tipo === "aleatoria"
 ? data.chave.trim()
 : onlyDigits(data.chave);

 const supabase = await createClient();
 const { error } = await supabase.rpc("salvar_chave_pix", {
 p_tipo: data.tipo,
 p_chave: chave,
 });

 if (error) {
 console.error("Erro ao salvar chave PIX:", error.message);
 return {
 status: "error",
 message: friendlyDbError(
 error.message,
 "Não foi possível salvar a chave PIX. Tente novamente.",
 ),
 field: "chave",
 };
 }

 refreshPayoutViews();

 return {
 status: "success",
 message: "Chave PIX salva com segurança.",
 };
}

export async function removePixAction(): Promise<PixActionResult> {
 if (!isSupabaseConfigured()) {
 return { status: "error", message: SETUP_REQUIRED_MESSAGE };
 }

 const session = await getCurrentSession();
 if (!session?.profile) {
 return {
 status: "error",
 message: "Sua sessão expirou. Entre novamente para remover a chave PIX.",
 };
 }

 const supabase = await createClient();
 const { error } = await supabase.rpc("remover_chave_pix");

 if (error) {
 console.error("Erro ao remover chave PIX:", error.message);
 return {
 status: "error",
 message: friendlyDbError(
 error.message,
 "Não foi possível remover a chave PIX. Tente novamente.",
 ),
 };
 }

 refreshPayoutViews();

 return { status: "success", message: "Chave PIX removida." };
}
