import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LogIn, MailCheck } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ResendConfirmation } from "@/features/autenticacao/components/resend-confirmation";
import { isSupabaseConfigured } from "@/services/supabase/config";

export const metadata: Metadata = {
  title: "Confirme seu e-mail",
  robots: { index: false, follow: false },
};

export default async function ConfirmEmailPage({
  searchParams,
}: PageProps<"/cadastro/confirmar">) {
  const params = await searchParams;
  const email =
    typeof params.email === "string" ? params.email : null;

  return (
    <div className="animate-rise text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
        <MailCheck className="size-8" aria-hidden="true" />
      </div>

      <h1 className="mt-6 font-heading text-2xl font-bold text-ink">
        Confirme seu e-mail
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Enviamos um link de confirmação
        {email ? (
          <>
            {" "}
            para <strong className="text-foreground">{email}</strong>
          </>
        ) : null}
        . Abra o link para ativar sua conta e acessar o painel.
      </p>

      <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4 text-left text-xs leading-relaxed text-muted-foreground">
        <p className="font-semibold text-foreground">Não recebeu o e-mail?</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>Confira as pastas de spam, lixo eletrônico e promoções.</li>
          <li>Aguarde alguns minutos antes de solicitar um novo envio.</li>
          <li>Verifique se o endereço informado está correto.</li>
        </ul>
      </div>

      <div className="mt-6 space-y-3">
        <ResendConfirmation
          email={email ?? ""}
          configured={isSupabaseConfigured()}
        />
        <Button asChild variant="ghost" className="w-full">
          <Link href="/login">
            <LogIn className="size-4" aria-hidden="true" />
            Ir para o login
          </Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/cadastro">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Corrigir meus dados
          </Link>
        </Button>
      </div>
    </div>
  );
}
