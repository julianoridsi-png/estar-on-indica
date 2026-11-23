"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
 ArrowRight,
 LayoutDashboard,
 Menu,
 ShieldCheck,
 Sparkles,
} from "lucide-react";
import { Logo } from "@/shared/brand/logo";
import { Button } from "@/shared/ui/button";
import {
 Sheet,
 SheetClose,
 SheetContent,
 SheetHeader,
 SheetTitle,
 SheetTrigger,
} from "@/shared/ui/sheet";

const NAV_ITEMS = [
 { label: "Como funciona", href: "/#como-funciona" },
 { label: "Acompanhamento", href: "/#acompanhamento" },
 { label: "Recompensas", href: "/#recompensas" },
 { label: "Dúvidas", href: "/#duvidas" },
];

export function SiteHeaderClient({
 logoUrl,
 companyName,
 isAuthenticated,
 isAdmin = false,
}: {
 logoUrl: string | null;
 companyName: string;
 isAuthenticated: boolean;
 isAdmin?: boolean;
}) {
 const [open, setOpen] = useState(false);
 const [scrolled, setScrolled] = useState(false);

 useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
 }, []);

 return (
 <header className={`sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl transition-shadow duration-200 ${scrolled ? "shadow-soft" : ""}`}>
 <div className="container-page flex h-[72px] items-center justify-between gap-4">
 <Logo logoUrl={logoUrl} companyName={companyName} />

 <nav aria-label="Navegação principal" className="hidden items-center lg:flex">
 {NAV_ITEMS.map((item) => (
 <Link
 key={item.href}
 href={item.href}
 className="rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-brand-50 hover:text-brand-800"
 >
 {item.label}
 </Link>
 ))}
 </nav>

 <div className="hidden items-center gap-2 lg:flex">
 {isAdmin ? (
 <Button asChild size="sm" className="h-10 bg-brand-500 text-ink hover:bg-brand-400">
 <Link href="/admin">
 <ShieldCheck className="size-4" aria-hidden="true" />
 Painel do Gestor
 </Link>
 </Button>
 ) : null}
 {isAuthenticated ? (
 <Button asChild size="sm" className="h-10">
 <Link href="/painel">
 <LayoutDashboard className="size-4" aria-hidden="true" />
 Meu painel
 </Link>
 </Button>
 ) : (
 <>
 <Button asChild variant="ghost" size="sm" className="h-10">
 <Link href="/login">Entrar</Link>
 </Button>
 <Button asChild size="sm" className="h-10">
 <Link href="/cadastro">
 Quero indicar
 <ArrowRight className="size-4" aria-hidden="true" />
 </Link>
 </Button>
 </>
 )}
 </div>

 <Sheet open={open} onOpenChange={setOpen}>
 <SheetTrigger asChild>
 <Button
 variant="ghost"
 size="icon"
 className="lg:hidden"
 aria-label="Abrir menu"
 >
 <Menu className="size-5" aria-hidden="true" />
 </Button>
 </SheetTrigger>
 <SheetContent side="right" className="w-[88vw] max-w-sm p-0">
 <SheetHeader className="border-b border-border px-5 py-4">
 <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
 <Logo
 logoUrl={logoUrl}
 companyName={companyName}
 onClick={() => setOpen(false)}
 />
 </SheetHeader>

 <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
 <nav className="flex flex-col gap-1" aria-label="Menu mobile">
 {NAV_ITEMS.map((item) => (
 <SheetClose asChild key={item.href}>
 <Link
 href={item.href}
 className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-brand-50 hover:text-brand-800"
 >
 {item.label}
 <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
 </Link>
 </SheetClose>
 ))}
 </nav>

 <div className="mt-5 rounded-2xl bg-brand-50 p-4">
 <p className="flex items-center gap-2 text-xs font-semibold text-brand-900">
 <Sparkles className="size-4 text-brand-600" aria-hidden="true" />
 Indique e acompanhe tudo pelo celular
 </p>
 <p className="mt-1 text-[11px] leading-relaxed text-brand-800/80">
 Instale o Estar On Indica como aplicativo no seu smartphone.
 </p>
 </div>
 </div>

 <div className="space-y-2 border-t border-border p-4">
 {isAuthenticated ? (
 <SheetClose asChild>
 <Button asChild size="lg" className="w-full">
 <Link href="/painel">
 <LayoutDashboard className="size-4" aria-hidden="true" />
 Meu painel
 </Link>
 </Button>
 </SheetClose>
 ) : (
 <>
 <SheetClose asChild>
 <Button asChild size="lg" className="w-full">
 <Link href="/cadastro">
 Criar minha conta
 <ArrowRight className="size-4" aria-hidden="true" />
 </Link>
 </Button>
 </SheetClose>
 <SheetClose asChild>
 <Button asChild variant="outline" size="lg" className="w-full">
 <Link href="/login">Já tenho conta</Link>
 </Button>
 </SheetClose>
 </>
 )}
 <p className="flex items-center justify-center gap-1.5 pt-1 text-[10px] text-muted-foreground">
 <ShieldCheck className="size-3.5" aria-hidden="true" />
 Seus dados são tratados conforme a LGPD
 </p>
 </div>
 </SheetContent>
 </Sheet>
 </div>
 </header>
 );
}
