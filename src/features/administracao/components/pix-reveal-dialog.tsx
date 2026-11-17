"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Eye,
  KeyRound,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { revealPixAction } from "@/features/administracao/services/actions";
import {
  PIX_KEY_TYPE_LABELS,
  type PixKeyType,
  type RevealedPixKey,
} from "@/features/pagamentos-pix/services/types";

export function PixRevealButton({
  profileId,
  nome,
  tipo,
  chaveMascarada,
  size = "sm",
}: {
  profileId: string;
  nome: string;
  tipo: PixKeyType | null;
  chaveMascarada: string | null;
  size?: "sm" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RevealedPixKey | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReveal = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    setCopied(false);

    const result = await revealPixAction(profileId);
    setLoading(false);

    if (result.status === "error") {
      setError(result.message);
      return;
    }

    setData(result.data);
  };

  const handleCopy = async () => {
    if (!data) return;

    try {
      await navigator.clipboard.writeText(data.chave);
      setCopied(true);
      toast.success("Chave PIX copiada");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar a chave", {
        description: "Selecione o texto e copie manualmente.",
      });
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={handleReveal}
        className="gap-1.5"
      >
        <Eye className="size-3.5" aria-hidden="true" />
        Ver chave
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chave PIX de {nome}</DialogTitle>
            <DialogDescription>
              A consulta da chave completa fica registrada na trilha de
              auditoria com o seu usuário.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2
                className="size-6 animate-spin text-brand-600"
                aria-hidden="true"
              />
              <p className="text-xs text-muted-foreground">
                Consultando chave com segurança...
              </p>
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-900">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold">Não foi possível revelar</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">{error}</p>
              </div>
            </div>
          ) : data ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                  {PIX_KEY_TYPE_LABELS[data.tipo]}
                </p>
                <p className="mt-1 font-mono text-sm font-semibold break-all text-ink">
                  {data.chave}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Mascarada na listagem: {chaveMascarada ?? "—"}
                  {tipo ? ` • ${PIX_KEY_TYPE_LABELS[tipo]}` : ""}
                </p>
              </div>

              <dl className="space-y-1 text-[11px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Titular</dt>
                  <dd className="text-right font-semibold text-ink">
                    {data.titular}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">E-mail</dt>
                  <dd className="max-w-[220px] truncate text-right font-semibold text-ink">
                    {data.email}
                  </dd>
                </div>
              </dl>

              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950">
                <ShieldAlert
                  className="mt-0.5 size-3.5 shrink-0 text-amber-600"
                  aria-hidden="true"
                />
                <p className="text-[10px] leading-relaxed">
                  Use a chave somente para o pagamento da recompensa. Não
                  compartilhe em canais externos.
                </p>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Fechar
            </Button>
            <Button
              type="button"
              onClick={handleCopy}
              disabled={!data || loading}
              className="gap-1.5"
            >
              {copied ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
              {copied ? "Copiada" : "Copiar chave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PixStatusHint({
  configurado,
  mascarada,
}: {
  configurado: boolean | null;
  mascarada: string | null;
}) {
  if (configurado === null) {
    return <span className="text-[10px] text-muted-foreground">Restrito</span>;
  }

  return configurado ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200 ring-inset">
      <KeyRound className="size-2.5" aria-hidden="true" />
      {mascarada ?? "Cadastrada"}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-800 ring-1 ring-amber-200 ring-inset">
      Pendente
    </span>
  );
}
