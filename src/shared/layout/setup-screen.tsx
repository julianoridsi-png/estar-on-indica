import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";
import { Logo } from "@/shared/brand/logo";
import { Button } from "@/shared/ui/button";
import { SetupAlert } from "@/features/autenticacao/components/setup-alert";

export function SetupScreen() {
  return (
    <main className="hero-glow flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
        <Logo />
        <div className="mt-8 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <Database className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-heading text-xl font-bold text-ink">
              Configuração necessária
            </h1>
            <p className="text-xs text-muted-foreground">
              A área autenticada depende do Supabase.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <SetupAlert />
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar ao site
            </Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/login">Ir para o login</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
