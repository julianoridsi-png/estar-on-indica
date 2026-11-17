import type { Metadata } from "next";
import { LoginForm } from "@/features/autenticacao/components/login-form";
import { isSupabaseConfigured } from "@/services/supabase/config";

export const metadata: Metadata = {
  title: "Entrar",
  description:
    "Acesse sua conta do Estar On Indica e acompanhe suas indicações e recompensas.",
  robots: { index: false, follow: false },
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const nextParam = firstParam(params.next);
  const error = firstParam(params.error);

  const nextPath =
    nextParam &&
    ["/painel", "/admin", "/comercial"].some(
      (prefix) =>
        nextParam === prefix || nextParam.startsWith(`${prefix}/`),
    )
      ? nextParam
      : undefined;

  return (
    <LoginForm
      configured={isSupabaseConfigured()}
      nextPath={nextPath}
      initialError={error}
    />
  );
}
