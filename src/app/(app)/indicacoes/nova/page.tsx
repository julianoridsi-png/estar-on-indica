import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { ReferralForm } from "@/features/indicacoes/components/referral-form";
import { getCurrentSession } from "@/features/autenticacao/services/current";

export const metadata: Metadata = {
 title: "Nova indicação",
 robots: { index: false, follow: false },
};

export default async function NewReferralPage() {
 const session = await getCurrentSession();

 if (!session) redirect("/login?next=/indicacoes/nova");
 if (!session.profile) redirect("/sem-acesso");

 if (session.profile.tipo_usuario !== "indicador") redirect("/admin");

 return (
 <div className="space-y-6">
 <div>
 <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
 <Sparkles className="size-3.5" aria-hidden="true" />
 Nova indicação
 </p>
 <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
 Indicar uma pessoa
 </h1>
 <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
 Preencha os dados com atenção. A equipe Estar On fará a análise e
 atualizará cada etapa do atendimento no painel.
 </p>
 </div>

 <ReferralForm />
 </div>
 );
}
