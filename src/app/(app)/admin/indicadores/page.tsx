import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
 ArrowRight,
 CircleAlert,
 KeyRound,
 ShieldCheck,
 Users,
 UserX,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { StatCard } from "@/shared/layout/stat-card";
import { IndicatorsTable } from "@/features/administracao/components/indicators-table";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { createClient } from "@/services/supabase/server";
import { formatNumberBR } from "@/shared/lib/format";
import type { AdminIndicator } from "@/features/administracao/services/types";

export const metadata: Metadata = {
 title: "Indicadores",
 robots: { index: false, follow: false },
};

export default async function AdminIndicatorsPage(
 props: PageProps<"/admin/indicadores">,
) {
 const session = await getCurrentSession();

 if (!session) redirect("/login?next=/admin/indicadores");
 if (!session.profile) redirect("/sem-acesso");

 const profile = session.profile;

 if (profile.tipo_usuario === "indicador") redirect("/painel");

 const isAdmin = profile.tipo_usuario === "admin";
 const params = await props.searchParams;
 const pixParam = typeof params.pix === "string" ? params.pix : "";

 const supabase = await createClient();
 const { data, error } = await supabase.rpc("admin_listar_indicadores");

 if (error) {
 console.error("Erro ao listar indicadores:", error.message);
 }

 const indicators = error ? null : ((data ?? []) as AdminIndicator[]);

 const total = indicators?.length ?? 0;
 const comPix = indicators
 ? indicators.filter((indicator) => indicator.pix_configurado === true).length
 : 0;
 const semPix = indicators
 ? indicators.filter((indicator) => indicator.pix_configurado === false)
 .length
 : 0;

 const initialPixFilter =
 pixParam === "pendente" ? "pendente" : pixParam === "com" ? "com" : "todos";

 return (
 <div className="space-y-6">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
 <div>
 <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
 <ShieldCheck className="size-3.5" aria-hidden="true" />
 Gestão de indicadores
 </p>
 <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
 Base de indicadores
 </h1>
 <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
 Consulte o desempenho, o status da conta e a situação da chave PIX
 de cada indicador.
 </p>
 </div>

 <Button asChild size="sm" variant="outline" className="h-9">
 <Link href="/admin/indicacoes">
 Ver indicações
 <ArrowRight className="size-3.5" aria-hidden="true" />
 </Link>
 </Button>
 </div>

 {indicators === null ? (
 <Alert className="border-amber-300/70 bg-amber-50 text-amber-950">
 <CircleAlert className="size-4 text-amber-600" aria-hidden="true" />
 <AlertTitle className="text-sm font-semibold">
 Não foi possível carregar os indicadores
 </AlertTitle>
 <AlertDescription className="text-xs text-amber-900/80">
 Verifique a conexão com o banco de dados e tente novamente em
 instantes.
 </AlertDescription>
 </Alert>
 ) : (
 <>
 <section
 aria-label="Resumo dos indicadores"
 className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
 >
 <StatCard
 label="Indicadores cadastrados"
 value={formatNumberBR(total)}
 description="Contas com perfil de indicador."
 icon={Users}
 tone="brand"
 />
 {isAdmin ? (
 <>
 <StatCard
 label="Com chave PIX"
 value={formatNumberBR(comPix)}
 description="Prontos para receber recompensas."
 icon={KeyRound}
 tone="emerald"
 />
 <StatCard
 label="Sem chave PIX"
 value={formatNumberBR(semPix)}
 description="Precisam cadastrar a chave para receber."
 icon={UserX}
 tone="amber"
 />
 </>
 ) : (
 <>
 <StatCard
 label="Indicações recebidas"
 value={formatNumberBR(
 indicators.reduce(
 (sum, indicator) => sum + indicator.total_indicacoes,
 0,
 ),
 )}
 description="Total registrado pelos indicadores."
 icon={ArrowRight}
 tone="cyan"
 />
 <StatCard
 label="Instalações concluídas"
 value={formatNumberBR(
 indicators.reduce(
 (sum, indicator) => sum + indicator.instaladas,
 0,
 ),
 )}
 description="Indicações com instalação finalizada."
 icon={ShieldCheck}
 tone="emerald"
 />
 </>
 )}
 </section>

 <IndicatorsTable
 indicators={indicators}
 isAdmin={isAdmin}
 initialPixFilter={initialPixFilter}
 />

 {isAdmin ? (
 <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
 <p className="flex items-start gap-2 text-[10px] leading-relaxed text-muted-foreground">
 <ShieldCheck
 className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
 aria-hidden="true"
 />
 A chave PIX é criptografada no banco. Cada consulta da chave
 completa é registrada com o usuário administrador responsável.
 </p>
 <Button asChild variant="outline" size="sm" className="w-fit">
 <Link href="/admin/recompensas">
 Gerenciar recompensas
 <ArrowRight className="size-3.5" aria-hidden="true" />
 </Link>
 </Button>
 </div>
 ) : null}
 </>
 )}
 </div>
 );
}
