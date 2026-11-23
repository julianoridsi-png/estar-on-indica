import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { createClient } from "@/services/supabase/server";
import { GrowthAnalytics } from "@/features/analytics/components/growth-analytics";
import type { AdminStats } from "@/features/dashboard/services/types";

export const metadata: Metadata = {
 title: "Analytics",
 robots: { index: false, follow: false },
};

export default async function AnalyticsPage() {
 const session = await getCurrentSession();
 if (!session) redirect("/login?next=/admin/analytics");
 if (!session.profile) redirect("/sem-acesso");
 if (session.profile.tipo_usuario === "indicador") redirect("/painel");

 const supabase = await createClient();
 const { data, error } = await supabase.rpc("get_admin_stats");
 const stats = error ? null : ((data as AdminStats | null) ?? null);

 return (
  <div className="space-y-6 animate-rise">
   <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
     <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
      Analytics Studio
     </p>
     <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
      Inteligência de negócios
     </h1>
     <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
      Indicadores derivados de dados reais, comparações e exportação de relatórios.
     </p>
    </div>
   </div>
   <GrowthAnalytics stats={stats} />
  </div>
 );
}
