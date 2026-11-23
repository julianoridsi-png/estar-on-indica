import { NextRequest } from "next/server";
import { createClient } from "@/services/supabase/server";
import { authenticateApiRequest, apiError, apiJson } from "@/shared/lib/api-auth";
import { checkRateLimit, rateLimitResponse } from "@/shared/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`stats:${ip}`, 30, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return apiError(auth.message, auth.status);

  if (auth.profile.tipo_usuario !== "admin" && auth.profile.tipo_usuario !== "comercial") {
    return apiError("Acesso negado.", 403);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_stats");
  if (error) return apiError("Erro ao carregar estatísticas.", 500);

  return apiJson({ data, generated_at: new Date().toISOString() });
}
