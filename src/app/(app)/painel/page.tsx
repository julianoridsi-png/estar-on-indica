import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CircleAlert,
  Clock3,
  Gift,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
  Wifi,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { StatCard } from "@/shared/layout/stat-card";
import { StatusBadge } from "@/features/indicacoes/components/status-badge";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { getFirstName } from "@/features/autenticacao/services/queries";
import { createClient } from "@/services/supabase/server";
import { formatDateBR, formatNumberBR } from "@/shared/lib/format";
import { getSiteUrl } from "@/shared/lib/site";
import { maskCpfFinal } from "@/shared/lib/validation/cpf";
import { TRACKING_STEPS } from "@/features/indicacoes/services/status";
import type {
  IndicatorStats,
  ReferralListItem,
} from "@/features/dashboard/services/types";

export const metadata: Metadata = {
  title: "Meu painel",
  robots: { index: false, follow: false },
};

export default async function IndicatorDashboardPage() {
  const session = await getCurrentSession();

  if (!session) redirect("/login?next=/painel");
  if (!session.profile) redirect("/sem-acesso");

  const profile = session.profile;

  if (profile.tipo_usuario !== "indicador") redirect("/admin");

  const supabase = await createClient();

  const [statsResult, referralsResult, pixResult, siteUrl] = await Promise.all([
    supabase.rpc("get_indicator_stats"),
    supabase
      .from("referrals")
      .select(
        "id, indicado_nome, indicado_cpf_final, status, created_at, updated_at",
      )
      .eq("indicator_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.rpc("get_minha_chave_pix"),
    getSiteUrl(),
  ]);

  if (statsResult.error) {
    console.error("Erro ao carregar estatísticas:", statsResult.error.message);
  }

  if (pixResult.error) {
    console.error("Erro ao carregar chave PIX:", pixResult.error.message);
  }

  const pixAccount = pixResult.error
    ? null
    : ((pixResult.data as { chave_mascarada?: string } | null) ?? null);

  const stats = statsResult.error
    ? null
    : (statsResult.data as IndicatorStats | null);

  const referrals = referralsResult.error
    ? null
    : ((referralsResult.data ?? []) as ReferralListItem[]);

  const shareText = encodeURIComponent(
    `Olá! Conheça o programa de indicação da Estar On Internet. Cadastre-se em ${siteUrl}/cadastro e acompanhe suas indicações pelo painel.`,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Meu painel
          </p>
          <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
            Olá, {getFirstName(profile.nome_completo)}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Acompanhe suas indicações, o andamento de cada etapa e suas
            recompensas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="h-9">
            <a
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Compartilhar programa
            </a>
          </Button>
          <Button asChild size="sm" className="h-9">
            <Link href="/indicacoes/nova">
              <Send className="size-3.5" aria-hidden="true" />
              Nova indicação
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link href="/regras">
              Regras da campanha
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      {!pixAccount ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-brand-300/70 bg-brand-50 p-4 text-ink sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-brand-700 shadow-sm ring-1 ring-brand-200">
              <Wallet className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold">
                Cadastre sua chave PIX para receber as recompensas
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                A chave fica criptografada e só é usada para pagar as
                recompensas aprovadas.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="w-fit shrink-0">
            <Link href="/recebimentos">
              Cadastrar PIX
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      ) : null}

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

      <section aria-label="Resumo das indicações" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total de indicações"
          value={stats ? formatNumberBR(stats.total_indicacoes) : "—"}
          description="Indicações vinculadas à sua conta."
          icon={Send}
          tone="brand"
        />
        <StatCard
          label="Em andamento"
          value={stats ? formatNumberBR(stats.em_andamento) : "—"}
          description="Aguardando análise, contato ou negociação."
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Aprovadas"
          value={stats ? formatNumberBR(stats.aprovadas) : "—"}
          description="Contrato aprovado ou instalação agendada."
          icon={BadgeCheck}
          tone="cyan"
        />
        <StatCard
          label="Clientes instalados"
          value={stats ? formatNumberBR(stats.instaladas) : "—"}
          description="Indicações concluídas com instalação."
          icon={Wifi}
          tone="emerald"
        />
        <StatCard
          label="Recompensas disponíveis"
          value={stats ? formatNumberBR(stats.recompensas_disponiveis) : "—"}
          description="Liberadas conforme a campanha vigente."
          icon={Wallet}
          tone="violet"
        />
        <StatCard
          label="Recompensas pendentes"
          value={stats ? formatNumberBR(stats.recompensas_pendentes) : "—"}
          description="Aguardando critérios ou validação."
          icon={Gift}
          tone="slate"
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-heading text-base font-bold text-ink">
                Indicações recentes
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Últimos registros vinculados à sua conta.
              </p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
              {referrals ? `${referrals.length} exibidas` : "Indisponível"}
            </span>
          </div>

          {referrals === null ? (
            <div className="p-5">
              <Alert className="border-amber-300/70 bg-amber-50 text-amber-950">
                <CircleAlert className="size-4 text-amber-600" aria-hidden="true" />
                <AlertDescription className="text-xs">
                  Não foi possível carregar suas indicações. Verifique a conexão
                  com o banco de dados.
                </AlertDescription>
              </Alert>
            </div>
          ) : referrals.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Send className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-heading text-sm font-bold text-ink">
                Nenhuma indicação registrada ainda
              </h3>
              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Cadastre a primeira pessoa indicada e acompanhe cada etapa do
                atendimento por aqui.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/indicacoes/nova">
                  <Send className="size-3.5" aria-hidden="true" />
                  Cadastrar indicação
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {referrals.map((referral) => (
                <li
                  key={referral.id}
                  className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {referral.indicado_nome}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      CPF {maskCpfFinal(referral.indicado_cpf_final)} • Indicada
                      em {formatDateBR(referral.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={referral.status} className="w-fit" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-base font-bold text-ink">
              Meus dados
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200 ring-inset">
              <ShieldCheck className="size-3" aria-hidden="true" />
              Protegido
            </span>
          </div>

          <dl className="mt-4 space-y-3.5">
            <div className="flex items-start gap-2.5">
              <UserRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-[10px] font-medium text-muted-foreground">
                  Nome completo
                </dt>
                <dd className="truncate text-xs font-semibold text-ink">
                  {profile.nome_completo}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="text-[10px] font-medium text-muted-foreground">
                  CPF
                </dt>
                <dd className="text-xs font-semibold text-ink">
                  {maskCpfFinal(profile.cpf_final)}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-[10px] font-medium text-muted-foreground">
                  E-mail
                </dt>
                <dd className="truncate text-xs font-semibold text-ink">
                  {profile.email}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="text-[10px] font-medium text-muted-foreground">
                  Cidade / UF
                </dt>
                <dd className="text-xs font-semibold text-ink">
                  {profile.cidade && profile.estado
                    ? `${profile.cidade} / ${profile.estado}`
                    : "Não informado"}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="text-[10px] font-medium text-muted-foreground">
                  Membro desde
                </dt>
                <dd className="text-xs font-semibold text-ink">
                  {formatDateBR(profile.created_at)}
                </dd>
              </div>
            </div>
          </dl>

          <p className="mt-4 flex items-start gap-1.5 rounded-lg bg-muted/60 p-2.5 text-[10px] leading-relaxed text-muted-foreground">
            <LockKeyhole className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
            O CPF completo não é exibido nas telas. A versão completa fica
            criptografada no banco de dados.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <BadgeCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-base font-bold text-ink">
              Como funciona o acompanhamento
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              A equipe Estar On atualiza cada etapa. Você acompanha o progresso
              em tempo real.
            </p>
          </div>
        </div>

        <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TRACKING_STEPS.map((step, index) => (
            <li
              key={step.label}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5"
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-500 text-[10px] font-bold text-ink">
                {index + 1}
              </span>
              <span className="text-[11px] font-medium text-foreground">
                {step.label}
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          Também podem ocorrer os status <strong>Cancelado</strong>,{" "}
          <strong>Reprovado</strong> e <strong>Não atendemos a região</strong>.
          Nesses casos, a indicação é encerrada sem avanço na jornada principal.
        </p>
      </section>
    </div>
  );
}
