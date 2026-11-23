import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { BenefitsManager } from "@/features/beneficios/components/benefits-manager";

export const metadata: Metadata = {
 title: "Benefícios",
 robots: { index: false, follow: false },
};

export default async function BeneficiosPage() {
 const session = await getCurrentSession();
 if (!session) redirect("/login?next=/admin/beneficios");
 if (!session.profile) redirect("/sem-acesso");
 if (session.profile.tipo_usuario !== "admin") redirect("/admin");

 return (
  <div className="space-y-6 animate-rise">
   <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
     <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
      ON Benefits
     </p>
     <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
      Gerenciador de benefícios
     </h1>
     <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
      Crie e gerencie benefícios exclusivos para clientes Estar On.
     </p>
    </div>
   </div>
   <BenefitsManager />
  </div>
 );
}
