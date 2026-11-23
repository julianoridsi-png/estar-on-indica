import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
 ArrowRight,
 ArrowUpRight,
 BadgeCheck,
 CircleAlert,
 FileCheck2,
 Gift,
 LockKeyhole,
 QrCode,
 Send,
 ShieldCheck,
 Sparkles,
 TrendingUp,
 Users,
 Wallet,
 Wifi,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { StatCard } from "@/shared/layout/stat-card";
import { StatusBadge } from "@/features/indicacoes/components/status-badge";
import { AccessReport } from "@/features/administracao/components/access-report";
import {
 MonthlyReferralsChart,
 StatusDonutChart,
} from "@/features/dashboard/components/admin-charts";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { createClient } from "@/services/supabase/server";
import {
 formatCurrencyBRL,
 formatDateBR,
 formatNumberBR,
} from "@/shared/lib/format";
import { maskCpfFinal } from "@/shared/lib/validation/cpf";
import type { AdminStats } from "@/features/dashboard/services/types";
import type { AdminIndicator } from "@/features/administracao/services/types";
import type { StatusIndicacao } from "@/features/indicacoes/services/status";

export const metadata: Metadata = {
 title: "Visão geral",
 robots: { index: false, follow: false },
};

type AdminRecentReferral = {
 id: string;
 indicator_id: string;
 indicado_nome: string;
 indicado_cpf_final: string | null;
 status: StatusIndicacao;
 created_at: string;
};

type IndicatorName = {
 id: string;
 nome_completo: string;
};

export default async function AdminDashboardPage(
  props: PageProps<"/admin">,
) {
 const session = await getCurrentSession();

 if (!session) redirect("/login?next=/admin");

 const profile = session.profile;
 if (!profile) redirect("/sem-acesso");
 if (profile.tipo_usuario === "indicador") redirect("/painel");

 const isAdmin = profile.tipo_usuario === "admin";
 const params = await props.searchParams;
 const dataInicio = typeof params.inicio === "string" ? params.inicio : "";
 const dataFim = typeof params.fim === "string" ? params.fim : "";

 const supabase = await createClient();

 const [statsResult, recentResult, indicatorsResult] = await Promise.all([
 supabase.rpc("get_admin_stats", {
      p_data_inicio: dataInicio || null,
      p_data_fim: dataFim || null,
    }),
 supabase
 .from("referrals")
 .select(
 "id, indicator_id, indicado_nome, indicado_cpf_final, status, created_at",
 )
 .order("created_at", { ascending: false })
 .limit(6),
 isAdmin ? supabase.rpc("admin_listar_indicadores") : Promise.resolve(null),
 ]);

 if (statsResult.error) {
 console.error(
 "Erro ao carregar estatísticas administrativas:",
 statsResult.error.message,
 );
 }

 const stats = statsResult.error
 ? null
 : ((statsResult.data as AdminStats | null) ?? null);

 const recentRows = recentResult.error
 ? null
 : ((recentResult.data ?? []) as AdminRecentReferral[]);

 let indicatorNames = new Map<string, string>();

 if (recentRows && recentRows.length > 0) {
 const indicatorIds = [...new Set(recentRows.map((row) => row.indicator_id))];
 const { data: indicators, error: indicatorsError } = await supabase
 .from("profiles")
 .select("id, nome_completo")
 .in("id", indicatorIds);

 if (indicatorsError) {
 console.error(
 "Erro ao carregar nomes dos indicadores:",
 indicatorsError.message,
 );
 } else {
 indicatorNames = new Map(
 ((indicators ?? []) as IndicatorName[]).map((item) => [
 item.id,
 item.nome_completo,
 ]),
 );
 }
 }

 const adminIndicators =
 indicatorsResult && !indicatorsResult.error
 ? ((indicatorsResult.data ?? []) as AdminIndicator[])
 : null;

 const indicadoresSemPix = adminIndicators
 ? adminIndicators.filter((indicator) => indicator.pix_configurado === false)
 .length
 : 0;

 const porStatus = stats?.por_status ?? {};
 const totalStatus = Object.values(porStatus).reduce(
 (total, value) => total + Number(value ?? 0),
 0,
 );

 const aPagarCentavos = stats
 ? stats.valor_recompensas_pendentes_centavos
 : 0;

 return (
 <div className="space-y-6 animate-rise">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
 <div>
 <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
 <Sparkles className="size-3.5" aria-hidden="true" />
 {isAdmin ? "Administração" : "Equipe comercial"}
 </p>
 <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
 Central de controle
 </h1>
 <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
 Acompanhe os números da operação, priorize atendimentos e controle
 indicações, indicadores e recompensas.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200 ring-inset">
 <LockKeyhole className="size-3" aria-hidden="true" />
 {isAdmin ? "Acesso administrativo" : "Acesso operacional"}
 </span>
 <Button asChild size="sm" className="h-9">
 <Link href="/admin/indicacoes">
 Gerenciar indicações
 <ArrowRight className="size-3.5" aria-hidden="true" />
 </Link>
 </Button>
 </div>
 </div>

      <form action="/admin" method="get" className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div>
          <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Data inicial</label>
          <input type="date" name="inicio" defaultValue="${dataInicio}" className="mt-1 h-9 rounded-lg border border-border bg-card px-3 text-sm" />
        </div>
        <div>
          <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Data final</label>
          <input type="date" name="fim" defaultValue="${dataFim}" className="mt-1 h-9 rounded-lg border border-border bg-card px-3 text-sm" />
        </div>
        <button type="submit" className="h-9 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-ink hover:bg-brand-400">
          Filtrar
        </button>
      </form>

 {!stats ? (
 <Alert className="border-amber-300/70 bg-amber-50 text-amber-950">
 <CircleAlert className="size-4 text-amber-600" aria-hidden="true" />
 <AlertTitle className="text-sm font-semibold">
 Indicadores temporariamente indisponíveis
 </AlertTitle>
 <AlertDescription className="text-xs text-amber-900/80">
 Não foi possível carregar os totais agora. Confirme se as migrations
 do banco foram executadas e tente novamente.
 </AlertDescription>
 </Alert>
 ) : null}

 <section
 aria-label="Resumo do programa"
 className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
 >
 <StatCard
 label="Indicadores cadastrados"
 value={stats ? formatNumberBR(stats.total_indicadores) : "—"}
 description="Pessoas com perfil de indicador na plataforma."
 icon={Users}
 tone="brand"
 />
 <StatCard
 label="Indicações recebidas"
 value={stats ? formatNumberBR(stats.total_indicacoes) : "—"}
 description="Total de indicações registradas por todos os indicadores."
 icon={Send}
 tone="cyan"
 />
 <StatCard
 label="Contratos aprovados"
 value={stats ? formatNumberBR(stats.contratos_aprovados) : "—"}
 description="Inclui contratos aprovados, agendados e instalados."
 icon={FileCheck2}
 tone="amber"
 />
 <StatCard
 label="Instalações concluídas"
 value={stats ? formatNumberBR(stats.instalados) : "—"}
 description="Indicações com instalação finalizada."
 icon={Wifi}
 tone="emerald"
 />
 {isAdmin ? (
 <>
 <StatCard
 label="A pagar em recompensas"
 value={
 stats ? formatCurrencyBRL(aPagarCentavos / 100) : "—"
 }
 description={
 stats
 ? `${formatNumberBR(stats.recompensas_pendentes)} pendentes e ${formatNumberBR(stats.recompensas_disponiveis)} disponíveis.`
 : "Pendentes e disponíveis para pagamento."
 }
 icon={Gift}
 tone="violet"
 />
 <StatCard
 label="Total já pago"
 value={
 stats
 ? formatCurrencyBRL(
 stats.valor_recompensas_pagas_centavos / 100,
 )
 : "—"
 }
 description={
 stats
 ? `${formatNumberBR(stats.recompensas_pagas)} pagamentos registrados.`
 : "Recompensas quitadas pela operação."
 }
 icon={Wallet}
 tone="slate"
 />
 </>
 ) : null}
 <StatCard
  label="Taxa de conversão"
  value={
   stats && stats.total_indicacoes > 0
    ? `${Math.round((stats.contratos_aprovados / stats.total_indicacoes) * 100)}%`
    : "—"
  }
  description="Contratos aprovados sobre o total de indicações."
  icon={TrendingUp}
  tone="emerald"
 />
 </section>

 <section aria-label="Indicadores de desempenho" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
  <StatCard
   label="Taxa de conversão"
   value={
    stats && stats.total_indicacoes > 0
     ? `${Math.round((stats.contratos_aprovados / stats.total_indicacoes) * 100)}%`
     : "—"
   }
   description="Contratos aprovados sobre o total de indicações."
   icon={TrendingUp}
   tone="emerald"
  />
  <StatCard
   label="Taxa de instalação"
   value={
    stats && stats.total_indicacoes > 0
     ? `${Math.round((stats.instalados / stats.total_indicacoes) * 100)}%`
     : "—"
   }
   description="Indicações concluídas com instalação."
   icon={Wifi}
   tone="cyan"
  />
  <StatCard
   label="Custo por conversão"
   value={
    stats && stats.instalados > 0
     ? formatCurrencyBRL(stats.valor_recompensas_pagas_centavos / 100 / stats.instalados)
     : "—"
   }
   description="Recompensas pagas por indicação instalada."
   icon={Wallet}
   tone="violet"
  />
  <StatCard
   label="Ticket médio de recompensa"
   value={
    stats && stats.recompensas_pagas > 0
     ? formatCurrencyBRL(stats.valor_recompensas_pagas_centavos / 100 / stats.recompensas_pagas)
     : "—"
   }
   description="Valor médio por recompensa paga."
   icon={Gift}
   tone="amber"
  />
 </section>

 <section aria-label="Alertas operacionais" className="rounded-2xl border border-border bg-card p-5 shadow-soft">
  <div className="flex items-center gap-2.5">
   <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
    <CircleAlert className="size-4.5" aria-hidden="true" />
   </span>
   <div>
    <h2 className="font-heading text-sm font-bold text-ink">Alertas operacionais</h2>
    <p className="text-[10px] text-muted-foreground">Situações que merecem atenção.</p>
   </div>
  </div>
  <ul className="mt-4 space-y-2">
   {indicadoresSemPix > 0 ? (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
     <span>{formatNumberBR(indicadoresSemPix)} indicador(es) sem chave PIX cadastrada.</span>
     <Button asChild variant="outline" size="sm" className="h-7 text-[10px]">
      <Link href="/admin/indicadores?pix=pendente">Ver</Link>
     </Button>
    </li>
   ) : null}
   {stats && stats.recompensas_pendentes > 0 ? (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-900">
     <span>{formatNumberBR(stats.recompensas_pendentes)} recompensa(s) pendente(s) de liberação.</span>
     <Button asChild variant="outline" size="sm" className="h-7 text-[10px]">
      <Link href="/admin/recompensas?status=pendente">Ver</Link>
     </Button>
    </li>
   ) : null}
   {stats && stats.recompensas_disponiveis > 0 ? (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
     <span>{formatNumberBR(stats.recompensas_disponiveis)} recompensa(s) disponível(is) para pagamento.</span>
     <Button asChild variant="outline" size="sm" className="h-7 text-[10px]">
      <Link href="/admin/recompensas?status=disponivel">Ver</Link>
     </Button>
    </li>
   ) : null}
   {indicadoresSemPix === 0 && (!stats || (stats.recompensas_pendentes === 0 && stats.recompensas_disponiveis === 0)) ? (
    <li className="rounded-xl border border-dashed border-border bg-background px-3 py-4 text-center text-xs text-muted-foreground">
     Nenhum alerta operacional no momento.
    </li>
   ) : null}
  </ul>
 </section>

 <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
 <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
 <div className="flex flex-wrap items-start justify-between gap-2">
 <div>
 <h2 className="font-heading text-base font-bold text-ink">
 Evolução das indicações
 </h2>
 <p className="mt-0.5 text-[11px] text-muted-foreground">
 Últimos 6 meses: indicações recebidas e instalações concluídas.
 </p>
 </div>
 <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-800 ring-1 ring-brand-200 ring-inset">
 <TrendingUp className="size-3" aria-hidden="true" />
 Série mensal
 </span>
 </div>

 <div className="mt-4">
 <MonthlyReferralsChart data={stats?.por_mes ?? []} />
 </div>

 <div className="mt-2 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-[10px] text-muted-foreground">
 <span className="inline-flex items-center gap-1.5">
 <span className="h-1 w-4 rounded-full bg-brand-500" />
 Indicações recebidas
 </span>
 <span className="inline-flex items-center gap-1.5">
 <span className="h-0.5 w-4 rounded-full bg-ink" />
 Instalações concluídas
 </span>
 </div>
 </section>

 <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
 <div className="flex flex-wrap items-start justify-between gap-2">
 <div>
 <h2 className="font-heading text-base font-bold text-ink">
 Distribuição por status
 </h2>
 <p className="mt-0.5 text-[11px] text-muted-foreground">
 Etapas atuais de todas as indicações registradas.
 </p>
 </div>
 <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
 {formatNumberBR(totalStatus)}{" "}
 {totalStatus === 1 ? "indicação" : "indicações"}
 </span>
 </div>

 <div className="mt-4">
 <StatusDonutChart porStatus={porStatus} />
 </div>
 </section>
 </div>

 <div className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
 <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
 <div className="flex items-center justify-between gap-2">
 <div>
 <h2 className="font-heading text-base font-bold text-ink">
 Top indicadores
 </h2>
 <p className="text-[11px] text-muted-foreground">
 Quem mais indicou nos últimos registros.
 </p>
 </div>
 <Button asChild variant="ghost" size="sm" className="h-8">
 <Link href="/admin/indicadores">
 Ver todos
 <ArrowRight className="size-3.5" aria-hidden="true" />
 </Link>
 </Button>
 </div>

 {stats && stats.top_indicadores.length > 0 ? (
 <ol className="mt-3 space-y-2">
 {stats.top_indicadores.map((indicator, index) => (
 <li key={indicator.id}>
 <Link
 href={`/admin/indicacoes?indicador=${indicator.id}`}
 className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-background"
 >
 <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-[9px] font-bold text-brand-300">
 {index + 1}
 </span>
 <div className="min-w-0 flex-1">
 <p className="truncate text-xs font-semibold text-ink">
 {indicator.nome}
 </p>
 <p className="text-[10px] text-muted-foreground">
 {formatNumberBR(indicator.instalados)} instaladas
 </p>
 </div>
 <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-800 ring-1 ring-brand-200 ring-inset">
 {formatNumberBR(indicator.total)}
 </span>
 </Link>
 </li>
 ))}
 </ol>
 ) : (
 <div className="mt-4 rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center">
 <Users
 className="mx-auto size-6 text-muted-foreground"
 aria-hidden="true"
 />
 <p className="mt-2 text-xs font-semibold text-ink">
 Nenhum indicador com indicações
 </p>
 <p className="mt-1 text-[11px] text-muted-foreground">
 O ranking aparecerá quando houver indicações registradas.
 </p>
 </div>
 )}
 </section>

 <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
 <div>
 <h2 className="font-heading text-base font-bold text-ink">
 Indicações recentes
 </h2>
 <p className="text-[11px] text-muted-foreground">
 Últimos registros recebidos pela operação.
 </p>
 </div>
 <Button asChild variant="outline" size="sm" className="h-8">
 <Link href="/admin/indicacoes">
 Ver todas
 <ArrowRight className="size-3.5" aria-hidden="true" />
 </Link>
 </Button>
 </div>

 {recentRows === null ? (
 <div className="p-5">
 <Alert className="border-amber-300/70 bg-amber-50 text-amber-950">
 <CircleAlert className="size-4 text-amber-600" aria-hidden="true" />
 <AlertDescription className="text-xs">
 Não foi possível carregar as indicações recentes. Verifique a
 conexão com o banco de dados.
 </AlertDescription>
 </Alert>
 </div>
 ) : recentRows.length === 0 ? (
 <div className="flex flex-col items-center px-6 py-10 text-center">
 <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
 <Send className="size-5" aria-hidden="true" />
 </span>
 <p className="mt-3 text-xs font-semibold text-ink">
 Nenhuma indicação recebida
 </p>
 <p className="mt-1 max-w-sm text-[11px] text-muted-foreground">
 As indicações mais recentes aparecerão aqui conforme forem
 cadastradas.
 </p>
 </div>
 ) : (
 <ul className="divide-y divide-border">
 {recentRows.map((referral) => (
 <li key={referral.id}>
 <Link
 href={`/admin/indicacoes/${referral.id}`}
 className="flex flex-col gap-2 px-5 py-3.5 transition-colors hover:bg-background sm:flex-row sm:items-center sm:justify-between"
 >
 <div className="min-w-0">
 <p className="truncate text-sm font-semibold text-ink">
 {referral.indicado_nome}
 </p>
 <p className="mt-0.5 text-[10px] text-muted-foreground">
 CPF {maskCpfFinal(referral.indicado_cpf_final)} •
 Indicado por{" "}
 {indicatorNames.get(referral.indicator_id) ??
 "indicador cadastrado"}{" "}
 • {formatDateBR(referral.created_at)}
 </p>
 </div>
 <div className="flex shrink-0 items-center gap-2">
 <StatusBadge status={referral.status} />
 <ArrowUpRight
 className="size-3.5 text-muted-foreground"
 aria-hidden="true"
 />
 </div>
 </Link>
 </li>
 ))}
 </ul>
 )}
 </section>
 </div>

  <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
    <div className="flex items-center gap-2.5 mb-4">
      <span className="grid size-9 place-items-center rounded-xl bg-ink text-brand-300">
        <ShieldCheck className="size-4.5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="font-heading text-sm font-bold text-ink">Relatório de acessos</h2>
        <p className="text-[10px] text-muted-foreground">Quantas pessoas acessam o sistema.</p>
      </div>
    </div>
    <AccessReport />
  </section>

 <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
 <div className="flex items-center gap-2.5">
 <span className="grid size-9 place-items-center rounded-xl bg-ink text-brand-300">
 <BadgeCheck className="size-4.5" aria-hidden="true" />
 </span>
 <div>
 <h2 className="font-heading text-sm font-bold text-ink">
 Atalhos de gestão
 </h2>
 <p className="text-[10px] text-muted-foreground">
 Ações rápidas para o dia a dia da operação.
 </p>
 </div>
 </div>

 <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
 <Link
 href="/admin/indicacoes?grupo=abertas"
 className="group flex items-start gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/50"
 >
 <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-card text-brand-700 shadow-sm ring-1 ring-border">
 <Send className="size-4" aria-hidden="true" />
 </span>
 <div className="min-w-0 flex-1">
 <p className="text-xs font-semibold text-ink">
 Fila de indicações abertas
 </p>
 <p className="mt-0.5 text-[10px] text-muted-foreground">
 Atualize etapas e mantenha o funil em dia.
 </p>
 </div>
 <ArrowRight
 className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
 aria-hidden="true"
 />
 </Link>

 <Link
 href="/admin/indicadores?pix=pendente"
 className="group flex items-start gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/50"
 >
 <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-card text-brand-700 shadow-sm ring-1 ring-border">
 <QrCode className="size-4" aria-hidden="true" />
 </span>
 <div className="min-w-0 flex-1">
 <p className="text-xs font-semibold text-ink">
 Indicadores sem chave PIX
 </p>
 <p className="mt-0.5 text-[10px] text-muted-foreground">
 {isAdmin
 ? `${formatNumberBR(indicadoresSemPix)} aguardando cadastro.`
 : "Acompanhe quem ainda não cadastrou a chave."}
 </p>
 </div>
 <ArrowRight
 className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
 aria-hidden="true"
 />
 </Link>

 {isAdmin ? (
 <Link
 href="/admin/recompensas?status=disponivel"
 className="group flex items-start gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/50"
 >
 <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-card text-brand-700 shadow-sm ring-1 ring-border">
 <Wallet className="size-4" aria-hidden="true" />
 </span>
 <div className="min-w-0 flex-1">
 <p className="text-xs font-semibold text-ink">
 Recompensas para pagar
 </p>
 <p className="mt-0.5 text-[10px] text-muted-foreground">
 {stats
 ? `${formatNumberBR(stats.recompensas_disponiveis)} disponíveis.`
 : "Libere e registre pagamentos."}
 </p>
 </div>
 <ArrowRight
 className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
 aria-hidden="true"
 />
 </Link>
 ) : (
 <Link
 href="/admin/indicadores"
 className="group flex items-start gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/50"
 >
 <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-card text-brand-700 shadow-sm ring-1 ring-border">
 <Users className="size-4" aria-hidden="true" />
 </span>
 <div className="min-w-0 flex-1">
 <p className="text-xs font-semibold text-ink">
 Base de indicadores
 </p>
 <p className="mt-0.5 text-[10px] text-muted-foreground">
 Consulte contatos e desempenho.
 </p>
 </div>
 <ArrowRight
 className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
 aria-hidden="true"
 />
 </Link>
 )}
 </div>
 </section>

 <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground">
 <ShieldCheck className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
 Dados pessoais e financeiros são exibidos conforme o perfil de acesso.
 Consultas de chave PIX e alterações de status ficam registradas na
 trilha de auditoria.
 </p>
 </div>
 );
}
