import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { CustomerIntelligence } from "@/features/integracoes/components/customer-intelligence";

export const metadata: Metadata = {
 title: "Inteligência de clientes",
 robots: { index: false, follow: false },
};

export default async function ClientesPage() {
 const session = await getCurrentSession();
 if (!session) redirect("/login?next=/admin/clientes");
 if (!session.profile) redirect("/sem-acesso");
 if (session.profile.tipo_usuario === "indicador") redirect("/painel");

 return (
  <div className="space-y-6 animate-rise">
   <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
     <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
      Customer Intelligence
     </p>
     <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
      Inteligência de clientes
     </h1>
     <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
      Histórico, segmentação e atividade dos participantes. Critérios transparentes e configuráveis.
     </p>
    </div>
   </div>
   <CustomerIntelligence />
  </div>
 );
}
