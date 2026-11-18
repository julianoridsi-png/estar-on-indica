"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
 LayoutDashboard,
 QrCode,
 Send,
 Users,
 Wallet,
 ShieldCheck,
 type LucideIcon,
} from "lucide-react";
import type { TipoUsuario } from "@/features/autenticacao/services/queries";
import { cn } from "@/shared/lib/utils";

type NavItem = {
 label: string;
 href: string;
 icon: LucideIcon;
};

const INDICATOR_ITEMS: NavItem[] = [
 { label: "Painel", href: "/painel", icon: LayoutDashboard },
 { label: "Minhas indicações", href: "/indicacoes", icon: Send },
 { label: "Recebimentos", href: "/recebimentos", icon: QrCode },
];

const STAFF_ITEMS: NavItem[] = [
 { label: "Painel gestor", href: "/admin", icon: LayoutDashboard },
 { label: "Indicações", href: "/admin/indicacoes", icon: Send },
 { label: "Indicadores", href: "/admin/indicadores", icon: Users },
];

const ADMIN_EXTRA: NavItem[] = [
 { label: "Recompensas", href: "/admin/recompensas", icon: Wallet },
 { label: "MFA", href: "/configurar-mfa", icon: ShieldCheck },
];

export function AppNav({ tipoUsuario }: { tipoUsuario: TipoUsuario }) {
 const pathname = usePathname();

 const items =
 tipoUsuario === "indicador"
 ? INDICATOR_ITEMS
 : tipoUsuario === "admin"
 ? [...STAFF_ITEMS, ...ADMIN_EXTRA]
 : STAFF_ITEMS;

 return (
 <nav
 aria-label="Navegação da área restrita"
 className="border-b border-border/80 bg-card"
 >
 <div className="container-page flex gap-1 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
 {items.map((item) => {
 const active =
 item.href === "/admin"
 ? pathname === "/admin"
 : pathname === item.href ||
 pathname.startsWith(`${item.href}/`);
 const Icon = item.icon;

 return (
 <Link
 key={item.href}
 href={item.href}
 aria-current={active ? "page" : undefined}
 className={cn(
 "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold whitespace-nowrap transition-colors",
 active
 ? "bg-ink text-white shadow-sm"
 : "text-muted-foreground hover:bg-brand-50 hover:text-ink",
 )}
 >
 <Icon
 className={cn("size-4", active ? "text-brand-400" : "")}
 aria-hidden="true"
 />
 {item.label}
 </Link>
 );
 })}
 </div>
 </nav>
 );
}
