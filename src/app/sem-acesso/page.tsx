import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, LogOut, ShieldAlert } from "lucide-react";
import { Logo } from "@/shared/brand/logo";
import { SetupScreen } from "@/shared/layout/setup-screen";
import { Button } from "@/shared/ui/button";
import { signOutAction } from "@/features/autenticacao/services/actions";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { roleHomePath } from "@/features/autenticacao/services/queries";
import { isSupabaseConfigured } from "@/services/supabase/config";

export const metadata: Metadata = {
 title: "Acesso não liberado",
 robots: { index: false, follow: false },
};

export default async function NoAccessPage() {
 await connection();

 if (!isSupabaseConfigured()) {
 return <SetupScreen />;
 }

 const session = await getCurrentSession();

 if (!session) {
 redirect("/login?next=/sem-acesso");
 }

 const profile = session.profile;

 return (
 <main className="hero-glow flex min-h-dvh items-center justify-center px-5 py-12">
 <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
 <Logo />

 <div className="mt-8 flex items-start gap-3">
 <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
 <ShieldAlert className="size-6" aria-hidden="true" />
 </span>
 <div>
 <h1 className="font-heading text-xl font-bold text-ink">
 Acesso não liberado
 </h1>
 <p className="mt-1 text-xs text-muted-foreground">
 Sua conta foi autenticada, mas ainda não possui um perfil ativo na
 plataforma.
 </p>
 </div>
 </div>

 <div className="mt-5 rounded-xl border border-border bg-background p-4 text-xs leading-relaxed text-muted-foreground">
 {profile ? (
 <>
 <p>
 O perfil <strong className="text-foreground">{profile.email}</strong>{" "}
 está autenticado, mas a área solicitada não está disponível para
 o seu tipo de acesso.
 </p>
 <p className="mt-2">
 Volte para a sua área ou fale com a equipe Estar On caso precise
 de uma permissão adicional.
 </p>
 </>
 ) : (
 <>
 <p>
 Não encontramos o perfil vinculado a{" "}
 <strong className="text-foreground">{session.user.email}</strong>.
 Isso pode acontecer quando o ambiente acabou de ser configurado e
 as migrations do banco ainda não foram executadas.
 </p>
 <p className="mt-2">
 Se o problema continuar, fale com a equipe Estar On para liberar
 o seu acesso.
 </p>
 </>
 )}
 </div>

 <div className="mt-6 space-y-2">
 {profile ? (
 <Button asChild size="lg" className="w-full">
 <Link href={roleHomePath(profile.tipo_usuario)}>
 Ir para a minha área
 </Link>
 </Button>
 ) : null}

 <Button asChild variant="outline" size="lg" className="w-full">
 <Link href="/">
 <ArrowLeft className="size-4" aria-hidden="true" />
 Voltar ao site
 </Link>
 </Button>

 <form action={signOutAction}>
 <Button type="submit" variant="ghost" size="lg" className="w-full">
 <LogOut className="size-4" aria-hidden="true" />
 Sair da conta
 </Button>
 </form>
 </div>
 </div>
 </main>
 );
}
