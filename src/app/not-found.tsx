import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Logo } from "@/shared/brand/logo";
import { Button } from "@/shared/ui/button";

export default function NotFound() {
 return (
 <main className="hero-glow flex min-h-dvh flex-col items-center justify-center px-5 py-12">
 <div className="w-full max-w-md text-center">
 <div className="flex justify-center">
 <Logo />
 </div>

 <p className="mt-10 font-heading text-7xl font-bold text-brand-100">
 404
 </p>
 <h1 className="mt-2 font-heading text-2xl font-bold text-ink">
 Página não encontrada
 </h1>
 <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
 O endereço acessado não existe, foi movido ou você não tem permissão
 para visualizá-lo.
 </p>

 <div className="mt-6 space-y-2.5">
 <Button asChild size="lg" className="w-full">
 <Link href="/">
 <ArrowLeft className="size-4" aria-hidden="true" />
 Voltar para o início
 </Link>
 </Button>
 <Button asChild variant="outline" size="lg" className="w-full">
 <Link href="/login">
 <Compass className="size-4" aria-hidden="true" />
 Ir para o login
 </Link>
 </Button>
 </div>
 </div>
 </main>
 );
}
