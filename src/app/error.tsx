"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/shared/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro não tratado:", error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-center shadow-lift">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-200">
          <TriangleAlert className="size-7" aria-hidden="true" />
        </div>
        <h1 className="mt-5 font-heading text-2xl font-bold text-ink">
          Algo não saiu como esperado
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Ocorreu uma falha temporária ao carregar esta página. Tente novamente.
          Se o problema continuar, fale com o suporte pelos canais oficiais.
        </p>
        <Button onClick={reset} size="lg" className="mt-6 w-full">
          <RefreshCw className="size-4" aria-hidden="true" />
          Tentar novamente
        </Button>
        {error.digest ? (
          <p className="mt-4 text-[10px] text-muted-foreground">
            Código do erro: {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}
