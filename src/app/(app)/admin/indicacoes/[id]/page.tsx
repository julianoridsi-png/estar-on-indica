import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Clock3,
  FileCheck2,
  Gift,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
  Wifi,
} from "lucide-react";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { StatusBadge } from "@/features/indicacoes/components/status-badge";
import { RewardStatusBadge } from "@/features/recompensas/components/reward-status-badge";
import { ReferralStatusForm } from "@/features/administracao/components/referral-status-form";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { createClient } from "@/services/supabase/server";
import {
  formatCurrencyBRL,
  formatDateBR,
  formatDateTimeBR,
} from "@/shared/lib/format";
import { maskCpfFinal, onlyDigits } from "@/shared/lib/validation/cpf";
import {
  getStatusMeta,
  type StatusIndicacao,
} from "@/features/indicacoes/services/status";
import type { RewardStatus } from "@/features/administracao/services/types";

export const metadata: Metadata = {
  title: "Detalhe da indicação",
  robots: { index: false, follow: false },
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ReferralDetail = {
  id: string;
  indicator_id: string;
  indicado_nome: string;
  indicado_cpf_final: string | null;
  indicado_email: string | null;
  indicado_telefone: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  observacoes: string | null;
  status: StatusIndicacao;
  consentimento_lgpd_em: string | null;
  installed_at: string | null;
  created_at: string;
  updated_at: string;
};

type HistoryRow = {
  id: number;
  status_anterior: StatusIndicacao | null;
  status_novo: StatusIndicacao;
  observacao: string | null;
  alterado_por: string | null;
  created_at: string;
};

type ProfileLite = {
  id: string;
  nome_completo: string;
};

type RewardRow = {
  id: string;
  valor_centavos: number;
  status: RewardStatus;
  liberado_em: string | null;
  pago_em: string | null;
  created_at: string;
};

function formatCep(value: string | null) {
  const digits = onlyDigits(value ?? "");
  if (digits.length !== 8) return value ?? "Não informado";
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatPhone(value: string | null) {
  const digits = onlyDigits(value ?? "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return value ?? "Não informado";
}

function whatsappHref(value: string | null) {
  const digits = onlyDigits(value ?? "");
  if (digits.length === 10 || digits.length === 11) {
    return `https://wa.me/55${digits}`;
  }
  return null;
}

export default async function AdminReferralDetailPage(
  props: PageProps<"/admin/indicacoes/[id]">,
) {
  const session = await getCurrentSession();

  if (!session) redirect("/login?next=/admin/indicacoes");
  if (!session.profile) redirect("/sem-acesso");

  const profile = session.profile;

  if (profile.tipo_usuario === "indicador") redirect("/painel");

  const { id } = await props.params;

  if (!UUID_PATTERN.test(id)) notFound();

  const isAdmin = profile.tipo_usuario === "admin";
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("referrals")
    .select(
      "id, indicator_id, indicado_nome, indicado_cpf_final, indicado_email, indicado_telefone, cep, endereco, numero, complemento, bairro, cidade, estado, observacoes, status, consentimento_lgpd_em, installed_at, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar indicação:", error.message);
  }

  const referral = (data as ReferralDetail | null) ?? null;

  if (!referral) notFound();

  const [indicatorResult, historyResult, rewardResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nome_completo, email, cidade, estado")
      .eq("id", referral.indicator_id)
      .maybeSingle(),
    supabase
      .from("referral_history")
      .select(
        "id, status_anterior, status_novo, observacao, alterado_por, created_at",
      )
      .eq("referral_id", referral.id)
      .order("created_at", { ascending: false })
      .limit(50),
    isAdmin
      ? supabase
          .from("rewards")
          .select(
            "id, valor_centavos, status, liberado_em, pago_em, created_at",
          )
          .eq("referral_id", referral.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const indicator =
    (indicatorResult.data as
      | (ProfileLite & {
          email: string;
          cidade: string | null;
          estado: string | null;
        })
      | null) ?? null;

  const history = historyResult.error
    ? null
    : ((historyResult.data ?? []) as HistoryRow[]);

  const reward = (rewardResult.data as RewardRow | null) ?? null;

  let staffNames = new Map<string, string>();

  if (history && history.length > 0) {
    const staffIds = [
      ...new Set(
        history
          .map((row) => row.alterado_por)
          .filter((value): value is string => Boolean(value)),
      ),
    ];

    if (staffIds.length > 0) {
      const { data: staffRows } = await supabase
        .from("profiles")
        .select("id, nome_completo")
        .in("id", staffIds);

      staffNames = new Map(
        ((staffRows ?? []) as ProfileLite[]).map((row) => [
          row.id,
          row.nome_completo,
        ]),
      );
    }
  }

  const meta = getStatusMeta(referral.status);
  const whatsapp = whatsappHref(referral.indicado_telefone);
  const enderecoLinha = [
    referral.endereco,
    referral.numero,
    referral.complemento,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <Button asChild variant="ghost" size="sm" className="w-fit -ml-2">
          <Link href="/admin/indicacoes">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar para indicações
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
              <FileCheck2 className="size-3.5" aria-hidden="true" />
              Detalhe da indicação
            </p>
            <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
              {referral.indicado_nome}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <span>CPF {maskCpfFinal(referral.indicado_cpf_final)}</span>
              <span>•</span>
              <span>Indicada em {formatDateBR(referral.created_at)}</span>
              <span>•</span>
              <span>Atualizada em {formatDateTimeBR(referral.updated_at)}</span>
            </p>
          </div>

          <StatusBadge status={referral.status} className="w-fit" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <UserRound className="size-4.5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-heading text-sm font-bold text-ink">
                  Contato da pessoa indicada
                </h2>
                <p className="text-[10px] text-muted-foreground">
                  Dados usados pela equipe para atendimento.
                </p>
              </div>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-3">
                <dt className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                  <Mail className="size-3" aria-hidden="true" />
                  E-mail
                </dt>
                <dd className="mt-1 truncate text-xs font-semibold text-ink">
                  {referral.indicado_email ? (
                    <a
                      href={`mailto:${referral.indicado_email}`}
                      className="hover:text-brand-700 hover:underline"
                    >
                      {referral.indicado_email}
                    </a>
                  ) : (
                    "Não informado"
                  )}
                </dd>
              </div>

              <div className="rounded-xl border border-border bg-background p-3">
                <dt className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                  <Phone className="size-3" aria-hidden="true" />
                  Telefone
                </dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink">
                  {formatPhone(referral.indicado_telefone)}
                  {whatsapp ? (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-bold text-brand-800 ring-1 ring-brand-200 ring-inset hover:bg-brand-100"
                    >
                      <MessageCircle className="size-2.5" aria-hidden="true" />
                      WhatsApp
                    </a>
                  ) : null}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <MapPin className="size-4.5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-heading text-sm font-bold text-ink">
                  Endereço do serviço
                </h2>
                <p className="text-[10px] text-muted-foreground">
                  Local informado para análise de cobertura e instalação.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-background p-4">
              <p className="text-sm font-semibold text-ink">
                {enderecoLinha || "Endereço não informado"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {referral.bairro ?? "Bairro não informado"} •{" "}
                {referral.cidade && referral.estado
                  ? `${referral.cidade} / ${referral.estado}`
                  : "Cidade não informada"}{" "}
                • CEP {formatCep(referral.cep)}
              </p>
            </div>

            {referral.observacoes ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-[10px] font-bold tracking-[0.1em] text-amber-800 uppercase">
                  Observações do indicador
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-950">
                  {referral.observacoes}
                </p>
              </div>
            ) : null}
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
              <div>
                <h2 className="font-heading text-base font-bold text-ink">
                  Histórico de status
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Alterações registradas pela equipe.
                </p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                {history ? `${history.length} registros` : "Indisponível"}
              </span>
            </div>

            {history === null ? (
              <div className="p-5">
                <Alert className="border-amber-300/70 bg-amber-50 text-amber-950">
                  <CircleAlert
                    className="size-4 text-amber-600"
                    aria-hidden="true"
                  />
                  <AlertDescription className="text-xs">
                    Não foi possível carregar o histórico desta indicação.
                  </AlertDescription>
                </Alert>
              </div>
            ) : history.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Clock3
                  className="mx-auto size-6 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="mt-2 text-xs font-semibold text-ink">
                  Nenhuma alteração registrada
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  O histórico aparecerá após a primeira atualização de status.
                </p>
              </div>
            ) : (
              <ol className="divide-y divide-border">
                {history.map((row) => {
                  const metaNew = getStatusMeta(row.status_novo);
                  return (
                    <li key={row.id} className="px-5 py-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-2.5">
                          <span
                            aria-hidden="true"
                            className={`mt-1.5 size-2 shrink-0 rounded-full ${metaNew.dotClass}`}
                          />
                          <div>
                            <p className="text-xs font-semibold text-ink">
                              {row.status_anterior
                                ? `${getStatusMeta(row.status_anterior).label} → ${metaNew.label}`
                                : metaNew.label}
                            </p>
                            {row.observacao ? (
                              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                                {row.observacao}
                              </p>
                            ) : null}
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {row.alterado_por
                                ? (staffNames.get(row.alterado_por) ??
                                  "Equipe Estar On")
                                : "Sistema"}{" "}
                              • {formatDateTimeBR(row.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-ink text-brand-300">
                <CircleCheck className="size-4.5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-heading text-sm font-bold text-ink">
                  Atualizar atendimento
                </h2>
                <p className="text-[10px] text-muted-foreground">
                  A mudança fica visível para o indicador.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <ReferralStatusForm
                referralId={referral.id}
                currentStatus={referral.status}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-heading text-sm font-bold text-ink">
              Resumo do registro
            </h2>
            <dl className="mt-3 space-y-3 text-[11px]">
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="size-3.5" aria-hidden="true" />
                  Indicador
                </dt>
                <dd className="max-w-[170px] text-right font-semibold text-ink">
                  {indicator?.nome_completo ?? "Não encontrado"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="size-3.5" aria-hidden="true" />
                  E-mail do indicador
                </dt>
                <dd className="max-w-[170px] truncate text-right font-semibold text-ink">
                  {indicator?.email ?? "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  Registrada em
                </dt>
                <dd className="font-semibold text-ink">
                  {formatDateTimeBR(referral.created_at)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Wifi className="size-3.5" aria-hidden="true" />
                  Instalada em
                </dt>
                <dd className="font-semibold text-ink">
                  {referral.installed_at
                    ? formatDateTimeBR(referral.installed_at)
                    : "Ainda não instalada"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  Consentimento LGPD
                </dt>
                <dd className="font-semibold text-ink">
                  {referral.consentimento_lgpd_em
                    ? formatDateBR(referral.consentimento_lgpd_em)
                    : "Não registrado"}
                </dd>
              </div>
            </dl>

            <p className="mt-3 rounded-lg bg-muted/60 p-2.5 text-[10px] leading-relaxed text-muted-foreground">
              Etapa atual: <strong>{meta.label}</strong>. {meta.description}
            </p>
          </section>

          {isAdmin ? (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <Gift className="size-4.5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-heading text-sm font-bold text-ink">
                    Recompensa vinculada
                  </h2>
                  <p className="text-[10px] text-muted-foreground">
                    Controle financeiro desta indicação.
                  </p>
                </div>
              </div>

              {reward ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-lg font-bold text-ink">
                      {formatCurrencyBRL(reward.valor_centavos / 100)}
                    </span>
                    <RewardStatusBadge status={reward.status} />
                  </div>
                  <dl className="space-y-1.5 text-[10px] text-muted-foreground">
                    <div className="flex justify-between gap-2">
                      <dt>Registrada em</dt>
                      <dd>{formatDateBR(reward.created_at)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Liberada em</dt>
                      <dd>
                        {reward.liberado_em
                          ? formatDateBR(reward.liberado_em)
                          : "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Paga em</dt>
                      <dd>
                        {reward.pago_em ? formatDateBR(reward.pago_em) : "—"}
                      </dd>
                    </div>
                  </dl>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/admin/recompensas">
                      Gerenciar recompensas
                      <ArrowLeft
                        className="size-3.5 rotate-180"
                        aria-hidden="true"
                      />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-border bg-background p-4 text-center">
                  <p className="text-[11px] font-semibold text-ink">
                    Nenhuma recompensa registrada
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                    A recompensa é criada automaticamente quando o status muda
                    para instalado, se o valor da campanha estiver configurado.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    <Link href="/admin/recompensas">
                      Configurar campanha
                      <ArrowLeft
                        className="size-3.5 rotate-180"
                        aria-hidden="true"
                      />
                    </Link>
                  </Button>
                </div>
              )}
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
