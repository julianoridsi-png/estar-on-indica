import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/services/supabase/config";

export type TipoUsuario = "indicador" | "comercial" | "admin";
export type StatusUsuario = "ativo" | "inativo";

export type ProfileSummary = {
  id: string;
  nome_completo: string;
  email: string;
  cpf_final: string | null;
  cidade: string | null;
  estado: string | null;
  tipo_usuario: TipoUsuario;
  status: StatusUsuario;
  created_at: string;
};

export type AuthUser = {
  id: string;
  email: string | null;
};

export function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "cliente";
  return fullName.trim().split(/\s+/)[0] ?? "cliente";
}

export function getInitials(fullName: string | null | undefined): string {
  if (!fullName) return "EO";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "EO";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function roleHomePath(role: TipoUsuario | null | undefined): string {
  if (role === "admin" || role === "comercial") return "/admin";
  return "/painel";
}

export const isStaffRole = (role: TipoUsuario | null | undefined) =>
  role === "admin" || role === "comercial";

type ProfileQueryResult = {
  data: ProfileSummary | null;
  error: { message: string } | null;
};

/**
 * Busca o usuário autenticado e o perfil dele.
 * Retorna null quando o Supabase ainda não está configurado ou não há sessão.
 */
export async function getSessionProfile(
  supabase: SupabaseClient,
): Promise<{ user: AuthUser; profile: ProfileSummary | null } | null> {
  if (!isSupabaseConfigured()) return null;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data, error }: ProfileQueryResult = await supabase
    .from("profiles")
    .select(
      "id, nome_completo, email, cpf_final, cidade, estado, tipo_usuario, status, created_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  return {
    user: { id: user.id, email: user.email ?? null },
    profile: error ? null : data,
  };
}
