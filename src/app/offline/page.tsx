import Link from "next/link";
import { Home, RefreshCw, WifiOff } from "lucide-react";
import { Logo } from "@/shared/brand/logo";
import { Button } from "@/shared/ui/button";
import { OfflineRetry } from "@/shared/pwa/offline-retry";

export const metadata = {
 title: "Sem conexão",
 robots: { index: false, follow: false },
};

export default function OfflinePage() {
 return (
 <main className="hero-glow flex min-h-dvh flex-col items-center justify-center px-5 py-12">
 <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-center shadow-lift sm:p-9">
 <div className="flex justify-center">
 <Logo />
 </div>

 <div className="mx-auto mt-8 grid size-16 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
 <WifiOff className="size-8" aria-hidden="true" />
 </div>

 <h1 className="mt-5 font-heading text-2xl font-bold text-ink">
 Você está sem conexão
 </h1>
 <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
 Não foi possível carregar esta página agora. Verifique sua internet e
 tente novamente.
 </p>

 <div className="mt-6 space-y-2.5">
 <OfflineRetry />
 <Button asChild variant="outline" className="w-full" size="lg">
 <Link href="/">
 <Home className="size-4" aria-hidden="true" />
 Ir para o início
 </Link>
 </Button>
 </div>

 <p className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
 <RefreshCw className="size-3" aria-hidden="true" />
 O Estar On Indica funciona como aplicativo no seu celular.
 </p>
 </div>
 </main>
 );
}
