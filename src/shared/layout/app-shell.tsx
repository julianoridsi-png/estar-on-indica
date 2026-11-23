import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { PageTracker } from "@/features/administracao/components/page-tracker";
import { AppNav } from "@/shared/layout/app-nav";
import { NotificationBell } from "@/shared/layout/notification-bell";
import { Logo } from "@/shared/brand/logo";
import { StaffSidebar } from "@/shared/layout/staff-sidebar";
import { signOutAction } from "@/features/autenticacao/services/actions";
import {
 getInitials,
 type ProfileSummary,
 type TipoUsuario,
} from "@/features/autenticacao/services/queries";
import { getPublicSettings } from "@/shared/lib/settings";
import { cn } from "@/shared/lib/utils";

const ROLE_LABEL: Record<TipoUsuario, string> = {
 indicador: "Área do indicador",
 comercial: "Equipe comercial",
 admin: "Administração",
};

const ROLE_BADGE: Record<TipoUsuario, string> = {
 indicador: "bg-brand-50 text-brand-700 ring-brand-200",
 comercial: "bg-cyan-50 text-cyan-700 ring-cyan-200",
 admin: "bg-violet-50 text-violet-700 ring-violet-200",
};

export async function AppShell({
 profile,
 children,
}: {
 profile: ProfileSummary;
 children: React.ReactNode;
}) {
 const isStaff = profile.tipo_usuario !== "indicador";

 if (isStaff) {
  const settings = await getPublicSettings();
  return (
   <div className="relative min-h-dvh bg-background">
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
     <div className="absolute -top-32 -right-32 size-[30rem] rounded-full bg-brand-500/6 blur-3xl animate-pulse-soft" />
     <div className="absolute -bottom-32 -left-32 size-[26rem] rounded-full bg-ink/5 blur-3xl" />
    </div>
    <StaffSidebar
     profile={profile}
     logoUrl={settings.logo_url}
     companyName={settings.nome_empresa}
    />
    <main className="relative z-10 min-h-dvh lg:ml-64">
     <PageTracker />
     <div className="container-page py-7 sm:py-9">{children}</div>
    </main>
   </div>
  );
 }

 return (
  <div className="min-h-dvh bg-background">
   <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur-xl">
    <div className="container-page flex h-16 items-center justify-between gap-3">
     <div className="flex min-w-0 items-center gap-3">
      <Logo className="scale-[0.92] origin-left" />
      <span
       className={cn(
        "hidden rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ring-1 ring-inset sm:inline-flex",
        ROLE_BADGE[profile.tipo_usuario],
       )}
      >
       {ROLE_LABEL[profile.tipo_usuario]}
      </span>
     </div>

     <div className="flex items-center gap-1.5 sm:gap-2.5">
      <Button
       asChild
       variant="ghost"
       size="sm"
       className="hidden text-muted-foreground sm:inline-flex"
      >
       <Link href="/">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Site
       </Link>
      </Button>

      <NotificationBell />

      <div className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-3 pl-1">
       <Avatar className="size-8">
        <AvatarFallback className="bg-ink text-[10px] font-bold text-white">
         {getInitials(profile.nome_completo)}
        </AvatarFallback>
       </Avatar>
       <div className="hidden leading-tight sm:block">
        <p className="max-w-[140px] truncate text-[11px] font-semibold text-ink">
         {profile.nome_completo}
        </p>
        <p className="text-[9px] text-muted-foreground">
         {profile.tipo_usuario === "indicador"
          ? "Indicador"
          : profile.tipo_usuario === "comercial"
            ? "Comercial"
            : "Administrador"}
        </p>
       </div>
      </div>

      <form action={signOutAction}>
       <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        aria-label="Sair da conta"
        title="Sair da conta"
       >
        <LogOut className="size-4" aria-hidden="true" />
       </Button>
      </form>
     </div>
    </div>
   </header>

   <AppNav tipoUsuario={profile.tipo_usuario} />

   <PageTracker />

   <main className="container-page py-7 sm:py-9">{children}</main>
  </div>
 );
}
