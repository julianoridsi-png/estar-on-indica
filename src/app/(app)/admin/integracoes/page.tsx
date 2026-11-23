import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Plug } from "lucide-react";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { ConnectHub } from "@/features/integracoes/components/connect-hub";

export const metadata: Metadata = {
 title: "Integrações",
 robots: { index: false, follow: false },
};

export default async function IntegracoesPage() {
 const session = await getCurrentSession();
 if (!session) redirect("/login?next=/admin/integracoes");
 if (!session.profile) redirect("/sem-acesso");
 if (session.profile.tipo_usuario === "indicador") redirect("/painel");

 return (
  <div className="space-y-6 animate-rise">
   <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
     <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
      <Plug className="size-3.5" aria-hidden="true" />
      Connect Hub
     </p>
     <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
      Integrações
     </h1>
     <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
      Conecte o Estar On Indica a outros sistemas. Uma integração só é marcada
      como conectada após um teste real bem-sucedido.
     </p>
    </div>
   </div>
   <ConnectHub />
  </div>
 );
}
