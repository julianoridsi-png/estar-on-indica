import { NextRequest } from "next/server";
import { createClient } from "@/services/supabase/server";
import { authenticateApiRequest, apiError, apiJson } from "@/shared/lib/api-auth";
import { checkRateLimit, rateLimitResponse } from "@/shared/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`indicacoes-get:${ip}`, 60, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return apiError(auth.message, auth.status);

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  const supabase = await createClient();

  let query = supabase
    .from("referrals")
    .select("id, indicado_nome, status, created_at, updated_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (auth.profile.tipo_usuario === "indicador") {
    query = query.eq("indicator_id", auth.userId);
  }

  const { data, error, count } = await query;
  if (error) return apiError("Erro ao listar indicações.", 500);

  return apiJson({ data: data ?? [], total: count ?? 0, limit, offset });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`indicacoes-post:${ip}`, 20, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return apiError(auth.message, auth.status);

  if (auth.profile.tipo_usuario !== "indicador") {
    return apiError("Apenas indicadores podem criar indicações.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Body JSON inválido.", 400);
  }

  const { indicado_nome, indicado_cpf, indicado_email } = (body ?? {}) as Record<string, unknown>;
  if (typeof indicado_nome !== "string" || !indicado_nome.trim()) {
    return apiError("Campo 'indicado_nome' é obrigatório.", 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("referrals")
    .insert({
      indicator_id: auth.userId,
      indicado_nome: indicado_nome.trim(),
      indicado_cpf_final: typeof indicado_cpf === "string" ? indicado_cpf.slice(-4) : null,
      indicado_email: typeof indicado_email === "string" ? indicado_email.trim() : null,
    })
    .select("id, indicado_nome, status, created_at")
    .single();

  if (error) return apiError("Erro ao criar indicação.", 500);

  return apiJson({ data }, 201);
}
