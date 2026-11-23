import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { NotificationsCenter } from "@/features/notificacoes/components/notifications-center";

export const metadata: Metadata = {
 title: "Notificações",
 robots: { index: false, follow: false },
};

export default async function NotificacoesPage() {
 const session = await getCurrentSession();
 if (!session) redirect("/login?next=/notificacoes");
 if (!session.profile) redirect("/sem-acesso");

 return (
  <div className="space-y-6 animate-rise">
   <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
     <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
      ON Notifications
     </p>
     <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
      Notificações
     </h1>
     <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
      Atualizações de indicações, recompensas, campanhas e comunicados.
     </p>
    </div>
   </div>
   <NotificationsCenter />
  </div>
 );
}
