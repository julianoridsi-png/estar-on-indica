import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
 ArrowRight,
 CircleAlert,
 CircleCheck,
 Clock3,
 Filter,
 MapPin,
 Plus,
 Search,
 Send,
 Sparkles,
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
 getStatusMeta,
 OPEN_STATUSES,
 REFERRAL_STATUS_OPTIONS,
 type StatusIndicacao,
} from "@/features/indicacoes/services/status";

export const metadata: Metadata = {
 title: "Minhas indicações",
 robots: { index: false, follow: false },
};

type MyReferral = {
 id: string;
 indicado_nome: string;
 indicado_cpf_final: string | null;
 cidade: string | null;
 estado: string | null;
 status: StatusIndicacao;
 created_at: string;
 updated_at: string;
};

const CLOSED_STATUSES: StatusIndicacao[] = [
 "instalado",
 "cancelado",
 "reprovado",
 "nao_atendemos_regiao",
];

const GROUPS = [
 { value: "", label: "Todas" },
 { value: "abertas", label: "Em andamento" },
 { value: "concluidas", label: "Encerradas" },
] as const;

export default async function IndicacoesPage(
 props: PageProps<"/indicacoes">,
) {
 const session = await getCurrentSession();

 if (!session) redirect("/login?next=/indicacoes");
 if (!session.profile) redirect("/sem-acesso");

 const profile = session.profile;

 if (profile.tipo_usuario !== "indicador") redirect("/admin");

 const params = await props.searchParams;
 const statusParam =
 typeof params.status === "string" ? params.status : "";
 const grupoParam = typeof params.grupo === "string" ? params.grupo : "";
 const busca = typeof params.q === "string" ? params.q.trim() : "";
 const cadastro = params.cadastro === "1";

 const statusFiltro = REFERRAL_STATUS_OPTIONS.some(
 (option) => option.value === statusParam,
 )
 ? (statusParam as StatusIndicacao)
 : null;

 const supabase = await createClient();
 const { data, error } = await supabase
 .from("referrals")
 .select(
 "id, indicado_nome, indicado_cpf_final, cidade, estado, status, created_at, updated_at",
 )
 .eq("indicator_id", profile.id)
 .order("created_at", { ascending: false })
 .limit(300);

 if (error) {
 console.error("Erro ao carregar indicações:", error.message);
 }

 const allReferrals = error ? null : ((data ?? []) as MyReferral[]);

 const visibleReferrals = (allReferrals ?? []).filter((referral) => {
 if (statusFiltro && referral.status !== statusFiltro) return false;

 if (grupoParam === "abertas" && !OPEN_STATUSES.includes(referral.status)) {
 return false;
 }

 if (grupoParam === "concluidas" && !CLOSED_STATUSES.includes(referral.status)) {
 return false;
 }

 if (busca) {
 return referral.indicado_nome
 .toLowerCase()
 .includes(busca.toLowerCase());
 }

 return true;
 });

 const counts = (allReferrals ?? []).reduce(
 (acc, referral) => {
 acc.status[referral.status] = (acc.status[referral.status] ?? 0) + 1;
 if (OPEN_STATUSES.includes(referral.status)) acc.abertas += 1;
 if (CLOSED_STATUSES.includes(referral.status)) acc.concluidas += 1;
 return acc;
 },
 { status: {} as Record<string, number>, abertas: 0, concluidas: 0 },
 );

 const total = allReferrals?.length ?? 0;

 const buildQuery = (group: string) => {
 const query = new URLSearchParams();
 if (group) query.set("grupo", group);
 if (statusFiltro) query.set("status", statusFiltro);
 if (busca) query.set("q", busca);
 const value = query.toString();
 return value ? `/indicacoes?${value}` : "/indicacoes";
 };

 return (
 <div className="space-y-6">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
 <div>
 <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
 <Sparkles className="size-3.5" aria-hidden="true" />
 Minhas indicações
 </p>
 <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
 Pessoas que você indicou
 </h1>
 <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
 Consulte o andamento de cada indicação e cadastre novas pessoas para
 a campanha.
 </p>
 </div>

 <Button asChild className="w-fit">
 <Link href="/indicacoes/nova">
 <Plus className="size-4" aria-hidden="true" />
 Nova indicação
 </Link>
 </Button>
 </div>

 {cadastro ? (
 <Alert className="border-emerald-300/70 bg-emerald-50 text-emerald-950">
 <CircleCheck className="size-4 text-emerald-600" aria-hidden="true" />
 <AlertTitle className="text-sm font-semibold">
 Indicação cadastrada
 </AlertTitle>
 <AlertDescription className="text-xs text-emerald-900/80">
 A equipe Estar On já recebeu os dados. Você pode acompanhar cada
 etapa por esta lista.
 </AlertDescription>
 </Alert>
 ) : null}

 <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
 <div className="flex flex-wrap items-center gap-2">
 {GROUPS.map((group) => {
 const active = grupoParam === group.value && !statusFiltro;
 const count =
 group.value === "abertas"
 ? counts.abertas
 : group.value === "concluidas"
 ? counts.concluidas
 : total;

 return (
 <Link
 key={group.value}
 href={buildQuery(group.value)}
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
 action="/indicacoes"
 method="get"
 className="mt-4 flex flex-col gap-2 sm:flex-row"
 >
 <div className="relative flex-1">
 <Search
 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
 aria-hidden="true"
 />
 <Input
 name="q"
 defaultValue={busca}
 placeholder="Buscar pelo nome da pessoa indicada"
 className="pl-9"
 aria-label="Buscar indicação por nome"
 />
 </div>

 <div className="sm:w-56">
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

 <div className="flex gap-2">
 <Button type="submit" variant="outline" className="gap-1.5">
 <Filter className="size-4" aria-hidden="true" />
 Filtrar
 </Button>
 {statusFiltro || busca || grupoParam ? (
 <Button asChild variant="ghost">
 <Link href="/indicacoes">Limpar</Link>
 </Button>
 ) : null}
 </div>
 </form>
 </section>

 {allReferrals === null ? (
 <Alert className="border-amber-300/70 bg-amber-50 text-amber-950">
 <CircleAlert className="size-4 text-amber-600" aria-hidden="true" />
 <AlertTitle className="text-sm font-semibold">
 Não foi possível carregar suas indicações
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
 ? "Você ainda não cadastrou indicações"
 : "Nenhuma indicação encontrada"}
 </h2>
 <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
 {total === 0
 ? "Cadastre a primeira pessoa indicada e acompanhe todas as etapas do atendimento por aqui."
 : "Ajuste a busca ou os filtros para encontrar a indicação desejada."}
 </p>
 {total === 0 ? (
 <Button asChild className="mt-4">
 <Link href="/indicacoes/nova">
 <Plus className="size-4" aria-hidden="true" />
 Cadastrar indicação
 </Link>
 </Button>
 ) : (
 <Button asChild variant="outline" className="mt-4">
 <Link href="/indicacoes">Limpar filtros</Link>
 </Button>
 )}
 </section>
 ) : (
 <section className="space-y-3">
 <div className="flex items-center justify-between gap-2">
 <p className="text-[11px] font-semibold text-muted-foreground">
 {visibleReferrals.length}{" "}
 {visibleReferrals.length === 1
 ? "indicação encontrada"
 : "indicações encontradas"}
 </p>
 <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-800 ring-1 ring-brand-200 ring-inset">
 <Clock3 className="size-3" aria-hidden="true" />
 Atualização em tempo real
 </span>
 </div>

 <ul className="space-y-3">
 {visibleReferrals.map((referral) => {
 const meta = getStatusMeta(referral.status);
 const stage = meta.trackingStage;

 return (
 <li
 key={referral.id}
 className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5"
 >
 <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <h2 className="truncate font-heading text-base font-bold text-ink">
 {referral.indicado_nome}
 </h2>
 <StatusBadge status={referral.status} />
 </div>
 <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
 <span>
 CPF {maskCpfFinal(referral.indicado_cpf_final)}
 </span>
 <span>•</span>
 <span className="inline-flex items-center gap-1">
 <MapPin className="size-3" aria-hidden="true" />
 {referral.cidade && referral.estado
 ? `${referral.cidade} / ${referral.estado}`
 : "Local não informado"}
 </span>
 <span>•</span>
 <span>
 Indicada em {formatDateBR(referral.created_at)}
 </span>
 </p>
 <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
 {meta.description}
 </p>
 </div>

 <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
 Atualizada em {formatDateBR(referral.updated_at)}
 </span>
 </div>

 {stage >= 0 ? (
 <div className="mt-4">
 <div className="flex items-center gap-1.5">
 {[0, 1, 2, 3, 4, 5].map((step) => (
 <span
 key={step}
 aria-hidden="true"
 className={
 step <= stage
 ? "h-1.5 flex-1 rounded-full bg-brand-500"
 : "h-1.5 flex-1 rounded-full bg-muted"
 }
 />
 ))}
 </div>
 <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px]">
 <span className="font-semibold text-brand-800">
 Etapa {stage + 1} de 6
 </span>
 <span className="text-muted-foreground">
 {meta.label}
 </span>
 </div>
 </div>
 ) : (
 <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
 <CircleAlert
 className="size-3.5 shrink-0 text-muted-foreground"
 aria-hidden="true"
 />
 <p className="text-[10px] leading-relaxed text-muted-foreground">
 Esta indicação foi encerrada sem avanço na jornada
 principal. Em caso de dúvidas, fale com a equipe Estar
 On.
 </p>
 </div>
 )}
 </li>
 );
 })}
 </ul>
 </section>
 )}

 <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-start gap-2.5">
 <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
 <ArrowRight className="size-4" aria-hidden="true" />
 </span>
 <div>
 <h2 className="font-heading text-sm font-bold text-ink">
 Quer receber pelas indicações?
 </h2>
 <p className="text-[11px] text-muted-foreground">
 Cadastre sua chave PIX em Recebimentos para que o pagamento
 possa ser registrado quando a recompensa for liberada.
 </p>
 </div>
 </div>
 <Button asChild variant="outline" size="sm" className="w-fit shrink-0">
 <Link href="/recebimentos">Configurar PIX</Link>
 </Button>
 </div>
 </section>
 </div>
 );
}
