import { NextRequest } from "next/server";
import { apiError, apiJson } from "@/shared/lib/api-auth";
import { checkRateLimit, rateLimitResponse } from "@/shared/lib/rate-limit";

// Validação HMAC-SHA256 do payload (quando WEBHOOK_SECRET estiver configurado).
async function verifyHmac(request: NextRequest, rawBody: string): Promise<boolean> {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return true; // sem secret configurado, aceita (dev)

  const signature = request.headers.get("x-webhook-signature");
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return signature === `sha256=${hex}` || signature === hex;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`webhook:${ip}`, 60, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const rawBody = await request.text();

  if (!(await verifyHmac(request, rawBody))) {
    return apiError("Assinatura inválida.", 401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return apiError("Body JSON inválido.", 400);
  }

  // Registra o evento (sem executar ações — processamento real na Fase 5).
  // Em produção, este endpoint deve enfileirar o evento em uma fila (Cloudflare Queues)
  // para processamento assíncrono.
  return apiJson(
    {
      received: true,
      event_type: (payload as Record<string, unknown>)?.event_type ?? "unknown",
      timestamp: new Date().toISOString(),
      note: "Evento recebido e registrado. Processamento assíncrono pendente de configuração de fila.",
    },
    202,
  );
}

export async function GET() {
  return apiJson({ status: "ok", endpoint: "webhook-receiver", version: "4.0.0" });
}
