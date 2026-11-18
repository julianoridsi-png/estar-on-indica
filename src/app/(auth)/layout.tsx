import Link from "next/link";
import {
 ArrowLeft,
 BadgeCheck,
 Clock3,
 Gift,
 ShieldCheck,
 Wifi,
} from "lucide-react";
import { Logo } from "@/shared/brand/logo";
import { getPublicSettings } from "@/shared/lib/settings";

export const dynamic = "force-dynamic";

export default async function AuthLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const settings = await getPublicSettings();

 return (
 <div className="grid min-h-dvh lg:grid-cols-[1.02fr_1fr]">
 <aside className="panel-dark relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-14">
 <div className="relative z-10">
 <Logo
 variant="dark"
 href="/"
 logoUrl={settings.logo_url}
 companyName={settings.nome_empresa}
 />
 </div>

 <div className="relative z-10 my-10 max-w-lg">
 <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-brand-200 uppercase">
 <Wifi className="size-3.5" aria-hidden="true" />
 Programa de indicação
 </span>

 <h1 className="mt-6 font-heading text-4xl leading-[1.1] font-bold text-white xl:text-[2.9rem]">
 Sua indicação,
 <br />
 <span className="text-brand-300">acompanhada de perto.</span>
 </h1>

 <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
 Indique amigos para a Estar On Internet e acompanhe cada etapa, da
 análise à instalação, com transparência e segurança.
 </p>

 <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
 <div className="flex items-center justify-between gap-3">
 <p className="text-[10px] font-bold tracking-[0.18em] text-brand-200 uppercase">
 Exemplo ilustrativo
 </p>
 <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/30 ring-inset">
 <BadgeCheck className="size-3" aria-hidden="true" />
 Instalado
 </span>
 </div>

 <ol className="mt-5 space-y-3">
 {[
 "Indicação recebida",
 "Em análise pela equipe",
 "Contrato aprovado",
 "Instalação concluída",
 ].map((label, index) => (
 <li key={label} className="flex items-center gap-3">
 <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-500/20 text-[10px] font-bold text-brand-200 ring-1 ring-brand-400/30">
 {index + 1}
 </span>
 <span className="text-xs text-slate-200">{label}</span>
 <span className="ml-auto h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
 </li>
 ))}
 </ol>
 </div>

 <div className="mt-8 grid gap-3 text-xs text-slate-300 sm:grid-cols-3">
 <div className="flex items-center gap-2">
 <ShieldCheck className="size-4 text-brand-300" aria-hidden="true" />
 Dados protegidos
 </div>
 <div className="flex items-center gap-2">
 <Clock3 className="size-4 text-brand-300" aria-hidden="true" />
 Status em tempo real
 </div>
 <div className="flex items-center gap-2">
 <Gift className="size-4 text-brand-300" aria-hidden="true" />
 Regras transparentes
 </div>
 </div>
 </div>

 <p className="relative z-10 text-[11px] text-slate-400">
 © {new Date().getFullYear()} {settings.nome_empresa}. Todos os
 direitos reservados.
 </p>

 <div
 aria-hidden="true"
 className="bg-dots pointer-events-none absolute inset-0 opacity-40"
 />
 <div
 aria-hidden="true"
 className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-brand-500/20 blur-3xl"
 />
 </aside>

 <section className="flex min-h-dvh flex-col bg-background">
 <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5 lg:hidden">
 <Logo
 logoUrl={settings.logo_url}
 companyName={settings.nome_empresa}
 className="scale-95"
 />
 <Link
 href="/"
 className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
 >
 <ArrowLeft className="size-3.5" aria-hidden="true" />
 Início
 </Link>
 </div>

 <div className="flex flex-1 items-start justify-center px-5 py-8 sm:px-8 sm:py-12 lg:items-center">
 <div className="w-full max-w-[480px]">{children}</div>
 </div>

 <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-5 py-4 text-[11px] text-muted-foreground sm:px-8">
 <span>
 © {new Date().getFullYear()} {settings.nome_empresa}
 </span>
 <span className="flex items-center gap-3">
 <Link href="/termos" className="hover:text-foreground">
 Termos
 </Link>
 <Link href="/privacidade" className="hover:text-foreground">
 Privacidade
 </Link>
 <Link href="/regras" className="hover:text-foreground">
 Regras
 </Link>
 </span>
 </footer>
 </section>
 </div>
 );
}
