import Link from "next/link";
import { ArrowUpRight, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/shared/brand/logo";
import { getPublicSettings } from "@/shared/lib/settings";

export async function SiteFooter() {
 const settings = await getPublicSettings();
 const year = new Date().getFullYear();

 return (
 <footer className="border-t border-white/10 bg-ink text-slate-300">
 <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr] lg:py-16">
 <div>
 <Logo
 variant="dark"
 logoUrl={settings.logo_url}
 companyName={settings.nome_empresa}
 />
 <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
 O programa de indicação da {settings.nome_empresa}. Indique pessoas
 próximas, acompanhe cada etapa e consulte suas recompensas com
 transparência.
 </p>
 <div className="mt-6 flex flex-wrap gap-3 text-[11px] text-slate-400">
 <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
 <ShieldCheck className="size-3.5 text-brand-300" aria-hidden="true" />
 Dados protegidos e LGPD
 </span>
 <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
 <Mail className="size-3.5 text-brand-300" aria-hidden="true" />
 Atendimento pelos canais oficiais
 </span>
 </div>
 </div>

 <div>
 <h2 className="font-heading text-xs font-bold tracking-[0.18em] text-white uppercase">
 Plataforma
 </h2>
 <ul className="mt-4 space-y-2.5 text-sm">
 <li>
 <Link href="/cadastro" className="transition-colors hover:text-white">
 Criar conta
 </Link>
 </li>
 <li>
 <Link href="/login" className="transition-colors hover:text-white">
 Entrar
 </Link>
 </li>
 <li>
 <Link href="/regras" className="transition-colors hover:text-white">
 Regras da campanha
 </Link>
 </li>
 <li>
 <Link href="/#duvidas" className="transition-colors hover:text-white">
 Perguntas frequentes
 </Link>
 </li>
 {settings.site_url ? (
 <li>
 <a
 href={settings.site_url}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 transition-colors hover:text-white"
 >
 Site da Estar On
 <ArrowUpRight className="size-3.5" aria-hidden="true" />
 </a>
 </li>
 ) : null}
 </ul>
 </div>

 <div>
 <h2 className="font-heading text-xs font-bold tracking-[0.18em] text-white uppercase">
 Legal e privacidade
 </h2>
 <ul className="mt-4 space-y-2.5 text-sm">
 <li>
 <Link href="/termos" className="transition-colors hover:text-white">
 Termos de uso
 </Link>
 </li>
 <li>
 <Link href="/privacidade" className="transition-colors hover:text-white">
 Política de privacidade
 </Link>
 </li>
 <li>
 <Link href="/regras" className="transition-colors hover:text-white">
 Regras de recompensa
 </Link>
 </li>
 <li>
 <span className="text-slate-500">
 Solicitações LGPD pelos canais oficiais
 </span>
 </li>
 </ul>
 </div>
 </div>

 <div className="border-t border-white/10">
 <div className="container-page flex flex-col items-start justify-between gap-2 py-5 text-[11px] text-slate-500 sm:flex-row sm:items-center">
 <p>
 © {year} {settings.nome_empresa}. Todos os direitos reservados.
 </p>
 <p>
 Estar On Indica — programa oficial de indicação.{" "}
 <span className="text-slate-400">
 Versão em implantação, sujeita a revisão jurídica.
 </span>
 </p>
 </div>
 </div>
 </footer>
 );
}
