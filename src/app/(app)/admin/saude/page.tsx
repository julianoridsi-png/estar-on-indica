import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { createClient } from "@/services/supabase/server";
import { isSupabaseConfigured } from "@/services/supabase/config";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Saúde do sistema",
  robots: { index: false, follow: false },
};

type Check = { label: string; ok: boolean; detail: string };

type CronStatus = {
  pg_cron?: boolean;
  job_existe?: boolean;
  ativo?: boolean;
  agenda?: string;
  ultima_execucao?: string | null;
  ultimo_status?: string | null;
  ultima_mensagem?: string | null;
};

function formatDateTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("pt-BR");
}

export default async function SaudePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/admin/saude");
  if (!session.profile) redirect("/sem-acesso");
  if (session.profile.tipo_usuario !== "admin") redirect("/admin");

  const configured = isSupabaseConfigured();

  let supabaseOk = false;
  let auditOk = false;
  let integrationsOk = false;
  let automationsOk = false;
  let followupOk = false;
  let bannersOk = false;
  let beneficiosOk = false;

  let auditCount = 0;
  let integrationsCount = 0;
  let flowsCount = 0;
  let alertsCount = 0;
  let bannersCount = 0;
  let beneficiosCount = 0;

  let cron: CronStatus | null = null;
  let cronError: string | null = null;

  let recentEvents: { id: string; tabela: string; acao: string; created_at: string }[] = [];

  if (configured) {
    const supabase = await createClient();

    const { error: connectionError } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });
    supabaseOk = !connectionError;

    const [integrations, automations, followup, banners, beneficios, audit, cronResult] =
      await Promise.all([
        supabase.from("integracoes").select("id", { count: "exact", head: true }),
        supabase.from("automation_flows").select("id", { count: "exact", head: true }),
        supabase
          .from("followup_alerts")
          .select("id", { count: "exact", head: true })
          .eq("resolvido", false),
        supabase.from("banners").select("id", { count: "exact", head: true }),
        supabase.from("beneficios").select("id", { count: "exact", head: true }),
        supabase
          .from("audit_logs")
          .select("id, tabela, acao, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.rpc("saude_cron_status"),
      ]);

    integrationsOk = !integrations.error;
    integrationsCount = integrations.count ?? 0;

    automationsOk = !automations.error;
    flowsCount = automations.count ?? 0;

    followupOk = !followup.error;
    alertsCount = followup.count ?? 0;

    bannersOk = !banners.error;
    bannersCount = banners.count ?? 0;

    beneficiosOk = !beneficios.error;
    beneficiosCount = beneficios.count ?? 0;

    auditOk = !audit.error;
    auditCount = audit.count ?? 0;
    recentEvents = (audit.data ?? []) as typeof recentEvents;

    if (cronResult.error) {
      cronError = cronResult.error.message;
    } else {
      cron = (cronResult.data ?? null) as CronStatus | null;
    }
  }

  const cronOk = Boolean(
    cron?.pg_cron &&
      cron.job_existe &&
      cron.ativo &&
      cron.ultimo_status !== "failed",
  );

  const checks: Check[] = [
    {
      label: "Supabase configurado",
      ok: configured,
      detail: configured ? "Credenciais presentes" : "Variáveis ausentes",
    },
    {
      label: "Conexão com Supabase",
      ok: supabaseOk,
      detail: supabaseOk ? "Conectado" : "Falha na conexão",
    },
    {
      label: "Tabela de integrações",
      ok: integrationsOk,
      detail: integrationsOk
        ? `${integrationsCount} integração(ões) cadastrada(s)`
        : "Tabela ausente (migration 0017)",
    },
    {
      label: "Tabela de automações",
      ok: automationsOk,
      detail: automationsOk
        ? `${flowsCount} fluxo(s) cadastrado(s)`
        : "Tabela ausente (migration 0018)",
    },
    {
      label: "Tabela de banners",
      ok: bannersOk,
      detail: bannersOk
        ? `${bannersCount} banner(s) cadastrado(s)`
        : "Tabela ausente (migration 0021)",
    },
    {
      label: "Tabela de benefícios",
      ok: beneficiosOk,
      detail: beneficiosOk
        ? `${beneficiosCount} benefício(s) cadastrado(s)`
        : "Tabela ausente (migration 0022)",
    },
    {
      label: "Tabela de follow-up",
      ok: followupOk,
      detail: followupOk
        ? `${alertsCount} alerta(s) pendente(s)`
        : "Tabela ausente (migration 0023)",
    },
    {
      label: "Automação agendada",
      ok: cronOk,
      detail: cronError
        ? "Migration 0024 pendente"
        : !cron?.pg_cron
          ? "pg_cron não habilitado"
          : !cron.job_existe
            ? "Job não agendado"
            : !cron.ativo
              ? "Job pausado"
              : cron.ultimo_status === "failed"
                ? "Última execução falhou"
                : cron.ultima_execucao
                  ? `Ativa • ${cron.ultimo_status ?? "executada"} em ${formatDateTime(cron.ultima_execucao)}`
                  : "Ativa • aguardando primeira execução",
    },
    {
      label: "Trilha de auditoria",
      ok: auditOk,
      detail: auditOk ? `${auditCount} registro(s)` : "Tabela de auditoria indisponível",
    },
  ];

  const recommendations: string[] = [];
  if (!configured) {
    recommendations.push(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no build (GitHub Actions) e no Worker.",
    );
  }
  if (configured && !supabaseOk) {
    recommendations.push("Verifique a conexão com o Supabase e as chaves públicas do projeto.");
  }
  if (!integrationsOk) recommendations.push("Execute a migration 0017 (integrações).");
  if (!automationsOk) recommendations.push("Execute a migration 0018 (automações).");
  if (!bannersOk) recommendations.push("Execute a migration 0021 (banners).");
  if (!beneficiosOk) recommendations.push("Execute a migration 0022 (benefícios).");
  if (!followupOk) recommendations.push("Execute a migration 0023 (Smart Follow-Up).");
  if (cronError) {
    recommendations.push("Execute a migration 0024 e agende o pg_cron do Smart Follow-Up.");
  } else if (!cronOk) {
    recommendations.push(
      "Agende o job 'estar-on-smart-followup' no pg_cron (a cada hora) ou reative o job existente.",
    );
  }
  if (cron?.ultimo_status === "failed") {
    recommendations.push(
      `A última execução do cron falhou: ${cron.ultima_mensagem ?? "sem detalhes"}.`,
    );
  }
  if (recommendations.length === 0) {
    recommendations.push("Nenhuma pendência técnica detectada nas verificações acima.");
  }

  const allOk = checks.every((check) => check.ok);

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
            <Activity className="size-3.5" aria-hidden="true" />
            Central de Saúde
          </p>
          <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
            Saúde do sistema
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Status geral da plataforma e verificações automáticas.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${
            allOk
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-amber-50 text-amber-700 ring-amber-200"
          }`}
        >
          {allOk ? (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          ) : (
            <AlertTriangle className="size-4" aria-hidden="true" />
          )}
          {allOk ? "Sistema operacional" : "Atenção necessária"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((check) => (
          <div
            key={check.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-xl ring-1 ${
                  check.ok
                    ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
                    : "bg-amber-50 text-amber-600 ring-amber-200"
                }`}
              >
                {check.ok ? (
                  <CheckCircle2 className="size-4.5" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="size-4.5" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">{check.label}</p>
                <p className="text-[10px] text-muted-foreground">{check.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-ink">
          <Clock className="size-4 text-brand-600" aria-hidden="true" />
          Automação Smart Follow-Up
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Execução real via pg_cron, com histórico e resultado da última rodada.
        </p>
        <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-background px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Agendamento
            </dt>
            <dd className="mt-1 font-medium text-ink">
              {cron?.agenda ?? "não configurado"}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-background px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Última execução
            </dt>
            <dd className="mt-1 font-medium text-ink">
              {formatDateTime(cron?.ultima_execucao) ?? "aguardando"}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-background px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Resultado
            </dt>
            <dd className="mt-1 font-medium text-ink">
              {cronError
                ? "migration 0024 pendente"
                : cron?.ultimo_status ?? (cron?.job_existe ? "sem execuções" : "sem job")}
            </dd>
          </div>
        </dl>
        {cron?.ultima_mensagem ? (
          <p className="mt-3 rounded-xl border border-border bg-background px-3 py-2 text-[11px] text-muted-foreground">
            {cron.ultima_mensagem}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-ink">
          <Database className="size-4 text-brand-600" aria-hidden="true" />
          Eventos recentes (auditoria)
        </h2>
        <p className="text-[11px] text-muted-foreground">Últimos 5 registros da trilha de auditoria.</p>
        {recentEvents.length === 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">Nenhum evento registrado.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {recentEvents.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 text-xs"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Activity className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate font-medium text-ink">{event.tabela}</span>
                  <span className="text-muted-foreground">— {event.acao}</span>
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatDateTime(event.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-ink">
          <ShieldCheck className="size-4 text-brand-600" aria-hidden="true" />
          Recomendações
        </h2>
        <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
          {recommendations.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-brand-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
