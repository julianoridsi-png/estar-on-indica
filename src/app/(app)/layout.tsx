import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { LogOut, UserX } from "lucide-react";
import { Logo } from "@/shared/brand/logo";
import { AppShell } from "@/shared/layout/app-shell";
import { SetupScreen } from "@/shared/layout/setup-screen";
import { Button } from "@/shared/ui/button";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { signOutAction } from "@/features/autenticacao/services/actions";
import { isSupabaseConfigured } from "@/services/supabase/config";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Garante que a área autenticada seja renderizada a cada requisição,
  // mesmo quando o Supabase ainda não está configurado no build.
  await connection();

  if (!isSupabaseConfigured()) {
    return <SetupScreen />;
  }

  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?next=/painel");
  }

  if (!session.profile) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-center shadow-lift">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="mx-auto mt-7 grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
            <UserX className="size-7" aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-heading text-xl font-bold text-ink">
            Perfil não encontrado
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sua autenticação foi confirmada, mas o perfil ainda não está
            disponível. Se o ambiente acabou de ser configurado, confirme se as
            migrations do banco foram executadas. Caso contrário, fale com a
            equipe Estar On.
          </p>
          <div className="mt-6 space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Voltar ao site</Link>
            </Button>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" className="w-full">
                <LogOut className="size-4" aria-hidden="true" />
                Sair da conta
              </Button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  if (session.profile.status === "inativo") {
    redirect("/login?error=conta_inativa");
  }

  return <AppShell profile={session.profile}>{children}</AppShell>;
}
