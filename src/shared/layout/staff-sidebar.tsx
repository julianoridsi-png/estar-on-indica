"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
 ArrowLeft,
 LayoutDashboard,
 LogOut,
 Menu,
 Send,
 ShieldCheck,
 UserCog,
 Users,
 Wallet,
 X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Logo } from "@/shared/brand/logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/ui/sheet";
import { signOutAction } from "@/features/autenticacao/services/actions";
import { getInitials, type ProfileSummary, type TipoUsuario } from "@/features/autenticacao/services/queries";
import { cn } from "@/shared/lib/utils";

const ROLE_LABEL: Record<TipoUsuario, string> = {
 indicador: "Área do indicador",
 comercial: "Equipe comercial",
 admin: "Administração",
};

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; adminOnly?: boolean };

const NAV_ITEMS: NavItem[] = [
 { label: "Painel gestor", href: "/admin", icon: LayoutDashboard },
 { label: "Indicações", href: "/admin/indicacoes", icon: Send },
 { label: "Indicadores", href: "/admin/indicadores", icon: Users },
 { label: "Usuários", href: "/admin/usuarios", icon: UserCog },
 { label: "Recompensas", href: "/admin/recompensas", icon: Wallet, adminOnly: true },
 { label: "Configurar MFA", href: "/configurar-mfa", icon: ShieldCheck, adminOnly: true },
];

function isActive(pathname: string, href: string) {
 if (href === "/admin") return pathname === "/admin";
 return pathname === href || pathname.startsWith(href + "/");
}

export function StaffSidebar({
 profile,
 logoUrl,
 companyName,
}: {
 profile: ProfileSummary;
 companyName: string;
 logoUrl: string | null;
}) {
 const pathname = usePathname();
 const [open, setOpen] = useState(false);
 const isAdmin = profile.tipo_usuario === "admin";
 const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

 const navContent = (
  <nav aria-label="Navegação administrativa" className="flex flex-1 flex-col gap-1 px-3 py-4">
   {items.map((item) => {
    const Icon = item.icon;
    const active = isActive(pathname, item.href);
    return (
     <Link
      key={item.href}
      href={item.href}
      onClick={() => setOpen(false)}
      className={cn(
       "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
       active
        ? "bg-brand-500/15 text-brand-300"
        : "text-slate-300 hover:bg-white/5 hover:text-white",
      )}
     >
      <Icon className="size-4.5 shrink-0" aria-hidden />
      <span className="truncate">{item.label}</span>
     </Link>
    );
   })}
   <div className="mt-auto space-y-1 pt-4">
    <Link
     href="/"
     onClick={() => setOpen(false)}
     className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
    >
     <ArrowLeft className="size-4.5 shrink-0" aria-hidden />
     <span>Site institucional</span>
    </Link>
    <form action={signOutAction}>
     <button
      type="submit"
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
     >
      <LogOut className="size-4.5 shrink-0" aria-hidden />
      <span>Sair da conta</span>
     </button>
    </form>
   </div>
  </nav>
 );

 return (
  <>
   {/* Mobile top bar */}
   <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border/80 bg-card/90 px-4 py-3 backdrop-blur-xl lg:hidden">
    <Logo logoUrl={null} companyName={companyName} className="scale-90 origin-left" />
    <Sheet open={open} onOpenChange={setOpen}>
     <SheetTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="Abrir menu">
       <Menu className="size-5" aria-hidden />
      </Button>
     </SheetTrigger>
     <SheetContent side="left" className="w-[86vw] max-w-xs p-0 bg-ink text-slate-200 border-white/10">
      <SheetHeader className="border-b border-white/10 px-4 py-4">
       <SheetTitle className="sr-only">Menu administrativo</SheetTitle>
       <Logo variant="dark" logoUrl={logoUrl} companyName={companyName} />
      </SheetHeader>
      {navContent}
     </SheetContent>
    </Sheet>
   </header>

   {/* Desktop sidebar */}
   <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-ink text-slate-200 lg:flex">
    <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
     <Logo variant="dark" logoUrl={logoUrl} companyName={companyName} className="scale-90 origin-left" />
    </div>
    <div className="flex items-center gap-2 px-5 py-3">
     <Avatar className="size-8">
      <AvatarFallback className="bg-brand-500 text-[10px] font-bold text-ink">
       {getInitials(profile.nome_completo)}
      </AvatarFallback>
     </Avatar>
     <div className="min-w-0 leading-tight">
      <p className="truncate text-xs font-semibold text-white">{profile.nome_completo}</p>
      <p className="text-[9px] uppercase tracking-wide text-slate-400">{ROLE_LABEL[profile.tipo_usuario]}</p>
     </div>
    </div>
    {navContent}
   </aside>
  </>
 );
}
