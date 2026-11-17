"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { FormField } from "@/features/autenticacao/components/form-field";
import { PasswordInput } from "@/features/autenticacao/components/password-input";
import { FormErrorAlert } from "@/features/autenticacao/components/form-error-alert";
import { SetupAlert } from "@/features/autenticacao/components/setup-alert";
import { signInAction } from "@/features/autenticacao/services/actions";
import {
  loginFormSchema,
  type LoginFormValues,
} from "@/features/autenticacao/schemas/auth";

const initialErrorMessages: Record<string, string> = {
  conta_inativa:
    "Sua conta está inativa. Fale com a equipe Estar On para regularizar o acesso.",
  link_invalido:
    "O link de acesso é inválido ou expirou. Solicite um novo link de recuperação.",
  configuracao:
    "A autenticação ainda não foi configurada neste ambiente. Consulte o README.md.",
};

export function LoginForm({
  configured,
  nextPath,
  initialError,
}: {
  configured: boolean;
  nextPath?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(
    initialError ? (initialErrorMessages[initialError] ?? null) : null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      senha: "",
      next: nextPath,
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await signInAction(values);

      if (result.status === "error") {
        setServerError(result.message);
        toast.error("Não foi possível entrar", {
          description: result.message,
        });
        return;
      }

      if (result.redirectTo) {
        router.replace(result.redirectTo);
        router.refresh();
      }
    });
  };

  return (
    <div className="animate-rise">
      <div className="mb-8">
        <p className="text-xs font-bold tracking-[0.2em] text-brand-600 uppercase">
          Área do indicador
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-ink">
          Bem-vindo de volta
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Entre para acompanhar suas indicações, status e recompensas.
        </p>
      </div>

      <div className="space-y-4">
        {!configured ? <SetupAlert compact /> : null}
        <FormErrorAlert message={serverError} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            label="E-mail"
            htmlFor="email"
            required
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </FormField>

          <FormField
            label="Senha"
            htmlFor="senha"
            required
            error={errors.senha?.message}
          >
            <PasswordInput
              id="senha"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              aria-invalid={Boolean(errors.senha)}
              {...register("senha")}
            />
          </FormField>

          <div className="flex items-center justify-end">
            <Link
              href="/recuperar-senha"
              className="text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!configured || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Entrando...
              </>
            ) : (
              <>
                {configured ? "Entrar no painel" : "Conexão pendente"}
                {configured ? (
                  <ArrowRight className="size-4" aria-hidden="true" />
                ) : null}
              </>
            )}
          </Button>
        </form>

        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-medium text-muted-foreground">
            Ainda não tem conta?
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full border-brand-200 bg-card text-brand-800 hover:bg-brand-50"
        >
          <Link href="/cadastro">
            Criar minha conta de indicador
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>

        <p className="flex items-center justify-center gap-1.5 pt-2 text-center text-[11px] text-muted-foreground">
          <LockKeyhole className="size-3.5" aria-hidden="true" />
          Seus dados são protegidos e usados apenas para o programa de
          indicação.
        </p>
      </div>
    </div>
  );
}
