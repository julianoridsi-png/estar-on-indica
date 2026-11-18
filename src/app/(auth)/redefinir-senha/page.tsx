import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Link2Off } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ResetPasswordForm } from "@/features/autenticacao/components/reset-password-form";
import { SetupAlert } from "@/features/autenticacao/components/setup-alert";
import { createClient } from "@/services/supabase/server";
import { isSupabaseConfigured } from "@/services/supabase/config";

export const metadata: Metadata = {
 title: "Criar nova senha",
 robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
 if (!isSupabaseConfigured()) {
 return (
 <div className="space-y-4">
 <h1 className="font-heading text-3xl font-bold text-ink">
 Redefinir senha
 </h1>
 <SetupAlert />
 </div>
 );
 }

 const supabase = await createClient();
 const {
 data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
 return (
 <div className="animate-rise text-center">
 <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
 <Link2Off className="size-8" aria-hidden="true" />
 </div>
 <h1 className="mt-6 font-heading text-2xl font-bold text-ink">
 Link expirado ou inválido
 </h1>
 <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
 O link de recuperação só pode ser usado uma vez e tem validade
 limitada. Solicite um novo link para continuar.
 </p>
 <div className="mt-7 space-y-3">
 <Button asChild size="lg" className="w-full">
 <Link href="/recuperar-senha">Solicitar novo link</Link>
 </Button>
 <Button asChild variant="ghost" className="w-full">
 <Link href="/login">
 <ArrowLeft className="size-4" aria-hidden="true" />
 Voltar para o login
 </Link>
 </Button>
 </div>
 </div>
 );
 }

 return <ResetPasswordForm email={user.email ?? null} />;
}
