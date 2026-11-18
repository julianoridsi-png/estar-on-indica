"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { FormField } from "@/features/autenticacao/components/form-field";
import {
  enrollMfaAction,
  verifyMfaEnrollmentAction,
  listMfaFactorsAction,
} from "@/features/autenticacao/services/mfa";

export function MfaEnrollment() {
  const [factors, setFactors] = useState<Array<{ id: string; friendlyName: string | null; status: string }>>([]);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  const loadFactors = () => {
    startTransition(async () => {
      const result = await listMfaFactorsAction();
      if (result.status === "success") {
        setFactors(result.factors);
      }
      setLoaded(true);
    });
  };

  const handleEnroll = () => {
    startTransition(async () => {
      const result = await enrollMfaAction();
      if (result.status === "error") {
        toast.error("Não foi possível iniciar o MFA", { description: result.message });
        return;
      }
      setFactorId(result.factorId);
      setQrCode(result.qrCode);
      setSecret(result.secret);
    });
  };

  const handleVerify = () => {
    if (!factorId || !code) return;
    startTransition(async () => {
      const result = await verifyMfaEnrollmentAction(factorId, code);
      if (result.status === "error") {
        toast.error("Código inválido", { description: result.message });
        return;
      }
      toast.success("MFA configurado com sucesso");
      setQrCode(null);
      setSecret(null);
      setCode("");
      loadFactors();
    });
  };

  if (!loaded) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <Button onClick={loadFactors} disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          Verificar status do MFA
        </Button>
      </div>
    );
  }

  const hasVerified = factors.some((f) => f.status === "verified");

  return (
    <div className="space-y-4">
      {hasVerified ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <CheckCircle2 className="size-5" />
          <p className="text-sm font-semibold">MFA já está ativo na sua conta.</p>
        </div>
      ) : null}

      {!qrCode ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            {hasVerified
              ? "Você pode adicionar outro fator se desejar."
              : "Nenhum fator MFA configurado. Clique abaixo para iniciar."}
          </p>
          <Button onClick={handleEnroll} disabled={isPending} className="mt-4">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Configurar MFA (TOTP)
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <p className="text-sm font-semibold text-ink">
            1. Escaneie o QR code no seu aplicativo autenticador:
          </p>
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="QR Code MFA" className="size-48" />
          </div>
          <p className="text-xs text-muted-foreground">
            Ou digite manualmente: <code className="font-mono text-ink">{secret}</code>
          </p>
          <FormField label="Código de verificação" htmlFor="mfa-code" required>
            <Input
              id="mfa-code"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
            />
          </FormField>
          <Button onClick={handleVerify} disabled={isPending || !code}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Verificar e ativar
          </Button>
        </div>
      )}
    </div>
  );
}
