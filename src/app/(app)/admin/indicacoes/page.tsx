import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
 ArrowRight,
 ArrowUpRight,
 CircleAlert,
 Filter,
 MapPin,
 Search,
 Send,
 ShieldCheck,
 Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { StatusBadge } from "@/features/indicacoes/components/status-badge";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { createClient } from "@/services/supabase/server";
import { formatDateBR } from "@/shared/lib/format";
import { maskCpfFinal } from "@/shared/lib/validation/cpf";
import {
 OPEN_STATUSES,
 REFERRAL_STATUS_OPTIONS,
 type StatusIndicacao,
} from "@/features/indicacoes/services/status";
import type { AdminIndicator } from "@/features/administracao/services/types";

export const metadata: Metadata = {
 title: "Indicações",
 robots: { index: false, follow: false },
};

type AdminReferral = {
 id: string;
 indicator_id: string;
 indicado_nome: string;
 indicado_cpf_final: string | null;
 cidade: string | null;
 estado: string | null;
 status: StatusIndicacao;
 created_at: string;
 updated_at: string;
};

const GROUPS = [
 { value: "", label: "Todas" },
 { value: "abertas", label: "Em andamento" },
 { value: "concluidas", label: "Encerradas" },
] as const;

const CLOSED_STATUSES: StatusIndicacao[] = [
 "instalado",
 "cancelado",
 "reprovado",
 "nao_atendemos_regiao",
];

export default async function AdminReferralsPage(
 props: PageProps<"/admin/indicacoes">,
) {
 const session = await getCurrentSession();

 if (!session) redirect("/login?next=/admin/indicacoes");
 if (!session.profile) redirect("/sem-acesso");

 const profile = session.profile;

 if (profile.tipo_usuario === "indicador") redirect("/painel");

 const params = await props.searchParams;
 const statusParam =
 typeof params.status === "string" ? params.status : "";
 const grupoParam = typeof params.grupo === "string" ? params.grupo : "";
 const indicadorParam =
 typeof params.indicador === "string" ? params.indicador : "";
 const busca = typeof params.q === "string" ? params.q.trim() : "";

 const statusFiltro = REFERRAL_STATUS_OPTIONS.some(
 (option) => option.value === statusParam,
 )
 ? (statusParam as StatusIndicacao)
 : null;

 const supabase = await createClient();

 const [referralsResult, indicatorsResult] = await Promise.all([
 supabase
 .from("referrals")
 .select(
 "id, indicator_id, indicado_nome, indicado_cpf_final, cidade, estado, status, created_at, updated_at",
 )
 .order("created_at", { ascending: false })
 .limit(500),
 supabase.rpc("admin_listar_indicadores"),
 ]);

 if (referralsResult.error) {
 console.error(
 "Erro ao carregar indicações administrativas:",
 referralsResult.error.message,
 );
 }

 if (indicatorsResult.error) {
 console.error(
 "Erro ao carregar indicadores:",
 indicatorsResult.error.message,
 );
 }

 const allReferrals = referralsResult.error
 ? null
 : ((referralsResult.data ?? []) as AdminReferral[]);

 const indicators = indicatorsResult.error
 ? []
 : ((indicatorsResult.data ?? []) as AdminIndicator[]);

 const indicatorNames = new Map(
 indicators.map((indicator) => [indicator.id, indicator.nome_completo]),
 );

 const indicatorFilter = indicators.find(
 (indicator) => indicator.id === indicadorParam,
 );

 const visibleReferrals = (allReferrals ?? []).filter((referral) => {
 if (statusFiltro && referral.status !== statusFiltro) return false;

 if (grupoParam === "abertas" && !OPEN_STATUSES.includes(referral.status)) {
 return false;
 }

 if (grupoParam === "concluidas" && !CLOSED_STATUSES.includes(referral.status)) {
 return false;
 }

 if (indicadorParam && referral.indicator_id !== indicadorParam) {
 return false;
 }

 if (busca) {
 const term = busca.toLowerCase();
 const nameMatch = referral.indicado_nome.toLowerCase().includes(term);
 const indicatorName =
 indicatorNames.get(referral.indicator_id)?.toLowerCase() ?? "";
 return nameMatch || indicatorName.includes(term);
 }

 return true;
 });

 const total = allReferrals?.length ?? 0;
 const abertas = (allReferrals ?? []).filter((referral) =>
 OPEN_STATUSES.includes(referral.status),
 ).length;
 const concluidas = (allReferrals ?? []).filter((referral) =>
 CLOSED_STATUSES.includes(referral.status),
 ).length;

 const buildGroupHref = (group: string) => {
 const query = new URLSearchParams();
 if (group) query.set("grupo", group);
 if (statusFiltro) query.set("status", statusFiltro);
 if (indicadorParam) query.set("indicador", indicadorParam);
 if (busca) query.set("q", busca);
 const value = query.toString();
 return value ? `/admin/indicacoes?${value}` : "/admin/indicacoes";
 };

 return (
 <div className="space-y-6">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
 <div>
 <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
 <ShieldCheck className="size-3.5" aria-hidden="true" />
 Gestão de indicações
 </p>
 <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
 Todas as indicações
 </h1>
 <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
 Filtre a fila, abra cada indicação e atualize o status do
 atendimento com registro no histórico.
 </p>
 </div>

 <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200 ring-inset">
 <Users className="size-3" aria-hidden="true" />
 {profile.tipo_usuario === "admin" ? "Administrador" : "Comercial"}
 </span>
 </div>

 <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
 <div className="flex flex-wrap items-center gap-2">
 {GROUPS.map((group) => {
 const active = grupoParam === group.value && !statusFiltro;
 const count =
 group.value === "abertas"
 ? abertas
 : group.value === "concluidas"
 ? concluidas
 : total;

 return (
 <Link
 key={group.value}
 href={buildGroupHref(group.value)}
 aria-current={active ? "page" : undefined}
 className={
 active
 ? "inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[11px] font-semibold text-white"
 : "inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-brand-50 hover:text-ink"
 }
 >
 {group.label}
 <span
 className={
 active
 ? "rounded-full bg-white/15 px-1.5 text-[9px] font-bold"
 : "rounded-full bg-card px-1.5 text-[9px] font-bold text-ink/70"
 }
 >
 {count}
 </span>
 </Link>
 );
 })}
 </div>

 <form
 action="/admin/indicacoes"
 method="get"
 className="mt-4 grid gap-2 lg:grid-cols-[1fr_210px_240px_auto]"
 >
 <div className="relative">
 <Search
 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
 aria-hidden="true"
 />
 <Input
 name="q"
 defaultValue={busca}
 placeholder="Buscar por indicado ou indicador"
 className="pl-9"
 aria-label="Buscar por nome do indicado ou do indicador"
 />
 </div>

 <div>
 <select
 name="status"
 defaultValue={statusFiltro ?? ""}
 aria-label="Filtrar por status"
 className="h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
 >
 <option value="">Todos os status</option>
 {REFERRAL_STATUS_OPTIONS.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </div>

 <div>
 <select
 name="indicador"
 defaultValue={indicadorParam}
 aria-label="Filtrar por indicador"
 className="h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
 >
 <option value="">Todos os indicadores</option>
 {indicators.map((indicator) => (
 <option key={indicator.id} value={indicator.id}>
 {indicator.nome_completo}
 </option>
 ))}
 </select>
 </div>

 <div className="flex gap-2">
 <Button type="submit" variant="outline" className="gap-1.5">
 <Filter className="size-4" aria-hidden="true" />
 Filtrar
 </Button>
 {statusFiltro || busca || grupoParam || indicadorParam ? (
 <Button asChild variant="ghost">
 <Link href="/admin/indicacoes">Limpar</Link>
 </Button>
 ) : null}
 </div>
 </form>

 {indicatorFilter ? (
 <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-[11px] text-brand-900 ring-1 ring-brand-200 ring-inset">
 <Users className="size-3.5" aria-hidden="true" />
 Filtrando pelo indicador{" "}
 <strong className="font-semibold">
 {indicatorFilter.nome_completo}
 </strong>
 <Link
 href={buildGroupHref(grupoParam)}
 className="ml-auto font-semibold text-brand-700 hover:underline"
 >
 Remover filtro
 </Link>
 </div>
 ) : null}
 </section>

 {allReferrals === null ? (
 <Alert className="border-amber-300/70 bg-amber-50 text-amber-950">
 <CircleAlert className="size-4 text-amber-600" aria-hidden="true" />
 <AlertTitle className="text-sm font-semibold">
 Não foi possível carregar as indicações
 </AlertTitle>
 <AlertDescription className="text-xs text-amber-900/80">
 Verifique a conexão com o banco de dados e tente novamente em
 instantes.
 </AlertDescription>
 </Alert>
 ) : visibleReferrals.length === 0 ? (
 <section className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-soft">
 <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
 <Send className="size-6" aria-hidden="true" />
 </span>
 <h2 className="mt-4 font-heading text-base font-bold text-ink">
 {total === 0
 ? "Nenhuma indicação recebida ainda"
 : "Nenhuma indicação encontrada"}
 </h2>
 <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
 {total === 0
 ? "As indicações cadastradas pelos indicadores aparecerão aqui."
 : "Ajuste a busca ou os filtros para encontrar a indicação desejada."}
 </p>
 {total > 0 ? (
 <Button asChild variant="outline" className="mt-4">
 <Link href="/admin/indicacoes">Limpar filtros</Link>
 </Button>
 ) : null}
 </section>
 ) : (
 <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
 <div>
 <h2 className="font-heading text-base font-bold text-ink">
 Fila de atendimento
 </h2>
 <p className="text-[11px] text-muted-foreground">
 Clique em uma indicação para atualizar o status.
 </p>
 </div>
 <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
 {visibleReferrals.length}{" "}
 {visibleReferrals.length === 1 ? "resultado" : "resultados"}
 </span>
 </div>

 <ul className="divide-y divide-border">
 {visibleReferrals.map((referral) => (
 <li key={referral.id}>
 <Link
 href={`/admin/indicacoes/${referral.id}`}
 className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-background sm:flex-row sm:items-center sm:justify-between"
 >
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <p className="truncate text-sm font-semibold text-ink">
 {referral.indicado_nome}
 </p>
 <StatusBadge status={referral.status} />
 </div>
 <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
 <span>
 CPF {maskCpfFinal(referral.indicado_cpf_final)}
 </span>
 <span>•</span>
 <span className="inline-flex items-center gap-1">
 <Users className="size-3" aria-hidden="true" />
 {indicatorNames.get(referral.indicator_id) ??
 "Indicador"}
 </span>
 <span>•</span>
 <span className="inline-flex items-center gap-1">
 <MapPin className="size-3" aria-hidden="true" />
 {referral.cidade && referral.estado
 ? `${referral.cidade} / ${referral.estado}`
 : "Local não informado"}
 </span>
 <span>•</span>
 <span>{formatDateBR(referral.created_at)}</span>
 </p>
 </div>

 <div className="flex shrink-0 items-center gap-2 text-[11px] font-semibold text-brand-700">
 Abrir
 <ArrowUpRight className="size-3.5" aria-hidden="true" />
 </div>
 </Link>
 </li>
 ))}
 </ul>

 <div className="border-t border-border bg-background px-5 py-3">
 <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
 <ShieldCheck className="size-3 shrink-0" aria-hidden="true" />
 Exibindo até 500 registros. Use os filtros para localizar uma
 indicação específica.
 </p>
 </div>
 </section>
 )}

 <div className="flex justify-start">
 <Button asChild variant="ghost" size="sm">
 <Link href="/admin">
 <ArrowRight className="size-3.5 rotate-180" aria-hidden="true" />
 Voltar para a visão geral
 </Link>
 </Button>
 </div>
 </div>
 );
}
