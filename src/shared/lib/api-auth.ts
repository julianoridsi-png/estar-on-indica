import { createClient } from "@/services/supabase/server";
import { isSupabaseConfigured } from "@/services/supabase/config";

export type ApiAuthResult =
  | { ok: true; userId: string; profile: { id: string; tipo_usuario: string; status: string } }
  | { ok: false; status: number; message: string };

export async function authenticateApiRequest(
  request: Request,
): Promise<ApiAuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, status: 503, message: "Supabase não configurado." };
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  const supabase = await createClient();

  // If a Bearer token is provided, validate it directly.
  let user = null;
  if (token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return { ok: false, status: 401, message: "Token inválido ou expirado." };
    }
    user = data.user;
  } else {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (!user) {
    return { ok: false, status: 401, message: "Autenticação necessária." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, tipo_usuario, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, status: 403, message: "Perfil não encontrado." };
  }

  if (profile.status === "inativo") {
    return { ok: false, status: 403, message: "Conta inativa." };
  }

  return { ok: true, userId: user.id, profile };
}

export function apiJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function apiError(message: string, status = 400): Response {
  return apiJson({ error: message }, status);
}
