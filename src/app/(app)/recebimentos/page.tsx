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
  Info,
  QrCode,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { StatCard } from "@/shared/layout/stat-card";
import { PixForm } from "@/features/pagamentos-pix/components/pix-form";
import { RewardStatusBadge } from "@/features/recompensas/components/reward-status-badge";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { createClient } from "@/services/supabase/server";
import { formatCurrencyBRL, formatDateBR } from "@/shared/lib/format";
import type { RewardStatus } from "@/features/administracao/services/types";
import type { PayoutAccount } from "@/features/pagamentos-pix/services/types";

export const metadata: Metadata = {
  title: "Recebimentos",
  robots: { index: false, follow: false },
};

type MyReward = {
  id: string;
  descricao: string;
  valor_centavos: number;
  status: RewardStatus;
  liberado_em: string | null;
  pago_em: string | null;
  created_at: string;
};

type RewardSettings = {
  recompensa_valor_centavos: number;
  prazo_pagamento_dias: number;
};

export default async function RecebimentosPage() {
  const session = await getCurrentSession();

  if (!session) redirect("/login?next=/recebimentos");
  if (!session.profile) redirect("/sem-acesso");

  const profile = session.profile;

  if (profile.tipo_usuario !== "indicador") redirect("/admin");

  const supabase = await createClient();

  const [pixResult, rewardsResult, settingsResult] = await Promise.all([
    supabase.rpc("get_minha_chave_pix"),
    supabase
      .from("rewards")
      .select(
        "id, descricao, valor_centavos, status, liberado_em, pago_em, created_at",
      )
      .eq("indicator_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("settings")
      .select("recompensa_valor_centavos, prazo_pagamento_dias")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (pixResult.error) {
    console.error("Erro ao carregar chave PIX:", pixResult.error.message);
  }
  if (rewardsResult.error) {
    console.error(
      "Erro ao carregar recompensas:",
      rewardsResult.error.message,
    );
  }

  const account = pixResult.error
    ? null
    : ((pixResult.data as PayoutAccount | null) ?? null);

  const rewards = rewardsResult.error
    ? null
    : ((rewardsResult.data ?? []) as MyReward[]);

  const settings = (settingsResult.data as RewardSettings | null) ?? null;

  const totals = (rewards ?? []).reduce(
    (acc, reward) => {
      if (reward.status === "pendente") {
        acc.pendenteCentavos += reward.valor_centavos;
        acc.pendentes += 1;
      }
      if (reward.status === "disponivel") {
        acc.disponivelCentavos += reward.valor_centavos;
        acc.disponiveis += 1;
      }
      if (reward.status === "pago") {
        acc.pagoCentavos += reward.valor_centavos;
        acc.pagos += 1;
      }
      return acc;
    },
    {
      pendenteCentavos: 0,
      disponivelCentavos: 0,
      pagoCentavos: 0,
      pendentes: 0,
      disponiveis: 0,
      pagos: 0,
    },
  );

  const aReceberCentavos =
    totals.pendenteCentavos + totals.disponivelCentavos;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
            <QrCode className="size-3.5" aria-hidden="true" />
            Recebimentos
          </p>
          <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
            Sua chave PIX e recompensas
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Cadastre a chave PIX que deve receber o pagamento e acompanhe cada
            recompensa registrada na sua conta.
          </p>
        </div>

        <span
          className={
            account
              ? "inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 ring-inset"
              : "inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200 ring-inset"
          }
        >
          {account ? (
            <BadgeCheck className="size-3" aria-hidden="true" />
          ) : (
            <CircleAlert className="size-3" aria-hidden="true" />
          )}
          {account ? "PIX cadastrado" : "PIX pendente"}
        </span>
      </div>

      {!account ? (
        <Alert className="border-brand-300/70 bg-brand-50 text-ink">
          <Info className="size-4 text-brand-700" aria-hidden="true" />
          <AlertTitle className="text-sm font-semibold">
            Cadastre sua chave PIX para receber
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            A recompensa só pode ser paga quando a chave estiver cadastrada. A
            chave completa fica criptografada e aparece mascarada nas listagens.
          </AlertDescription>
        </Alert>
      ) : null}

      <section
        aria-label="Resumo financeiro"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          label="A receber"
          value={formatCurrencyBRL(aReceberCentavos / 100)}
          description="Somatório de pendentes e disponíveis."
          icon={Wallet}
          tone="brand"
        />
        <StatCard
          label="Disponível para pagamento"
          value={formatCurrencyBRL(totals.disponivelCentavos / 100)}
          description={
            totals.disponiveis === 1
              ? "1 recompensa liberada."
              : `${totals.disponiveis} recompensas liberadas.`
          }
          icon={BadgeCheck}
          tone="emerald"
        />
        <StatCard
          label="Pendente de liberação"
          value={formatCurrencyBRL(totals.pendenteCentavos / 100)}
          description={
            totals.pendentes === 1
              ? "1 recompensa em análise."
              : `${totals.pendentes} recompensas em análise.`
          }
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Total já pago"
          value={formatCurrencyBRL(totals.pagoCentavos / 100)}
          description={
            totals.pagos === 1
              ? "1 pagamento registrado."
              : `${totals.pagos} pagamentos registrados.`
          }
          icon={Gift}
          tone="slate"
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
              <QrCode className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-base font-bold text-ink">
                Chave PIX para pagamento
              </h2>
              <p className="text-[11px] text-muted-foreground">
                A mesma chave é usada para todas as recompensas.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <PixForm account={account} nomeTitular={profile.nome_completo} />
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <ShieldCheck className="size-4.5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-heading text-sm font-bold text-ink">
                  Segurança da chave
                </h2>
                <p className="text-[10px] text-muted-foreground">
                  Criptografia e auditoria
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2.5 text-[11px] leading-relaxed text-muted-foreground">
              <li className="flex gap-2">
                <ShieldCheck
                  className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                A chave completa é gravada com criptografia AES-256 no banco.
              </li>
              <li className="flex gap-2">
                <ShieldCheck
                  className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                Somente administradores podem consultar a chave completa, com
                registro na trilha de auditoria.
              </li>
              <li className="flex gap-2">
                <ShieldCheck
                  className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                Você pode atualizar ou remover a chave a qualquer momento.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-heading text-sm font-bold text-ink">
              Como funciona o pagamento
            </h2>
            <ol className="mt-3 space-y-3">
              <li className="flex gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-500 text-[9px] font-bold text-ink">
                  1
                </span>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  A equipe marca a indicação como <strong>instalada</strong> e a
                  recompensa é criada como pendente.
                </p>
              </li>
              <li className="flex gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-500 text-[9px] font-bold text-ink">
                  2
                </span>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Após a validação, a recompensa fica{" "}
                  <strong>disponível para pagamento</strong>.
                </p>
              </li>
              <li className="flex gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-500 text-[9px] font-bold text-ink">
                  3
                </span>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  A equipe paga usando a sua chave PIX e registra a data do
                  pagamento.
                </p>
              </li>
            </ol>

            {settings && settings.recompensa_valor_centavos > 0 ? (
              <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/70 p-3">
                <p className="text-[10px] font-bold tracking-[0.1em] text-brand-800 uppercase">
                  Campanha vigente
                </p>
                <p className="mt-1 font-heading text-lg font-bold text-ink">
                  {formatCurrencyBRL(
                    settings.recompensa_valor_centavos / 100,
                  )}{" "}
                  <span className="font-sans text-[11px] font-medium text-muted-foreground">
                    por indicação instalada
                  </span>
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Prazo de pagamento de até {settings.prazo_pagamento_dias}{" "}
                  {settings.prazo_pagamento_dias === 1 ? "dia" : "dias"} após a
                  liberação.
                </p>
              </div>
            ) : (
              <p className="mt-4 rounded-lg bg-muted/60 p-2.5 text-[10px] leading-relaxed text-muted-foreground">
                O valor da campanha é definido pela equipe Estar On. Consulte as{" "}
                <Link
                  href="/regras"
                  className="font-semibold text-brand-700 hover:underline"
                >
                  regras da campanha
                </Link>{" "}
                para mais detalhes.
              </p>
            )}
          </section>
        </aside>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-heading text-base font-bold text-ink">
              Histórico de recompensas
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Registros financeiros vinculados às suas indicações.
            </p>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            {rewards ? `${rewards.length} registros` : "Indisponível"}
          </span>
        </div>

        {rewards === null ? (
          <div className="p-5">
            <Alert className="border-amber-300/70 bg-amber-50 text-amber-950">
              <CircleAlert className="size-4 text-amber-600" aria-hidden="true" />
              <AlertDescription className="text-xs">
                Não foi possível carregar suas recompensas. Verifique a conexão
                com o banco de dados e tente novamente.
              </AlertDescription>
            </Alert>
          </div>
        ) : rewards.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
              <Gift className="size-6" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-heading text-sm font-bold text-ink">
              Nenhuma recompensa registrada ainda
            </h3>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
              A recompensa é criada automaticamente quando uma das suas
              indicações é marcada como instalada. Continue acompanhando suas
              indicações.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/indicacoes">
                Ver minhas indicações
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rewards.map((reward) => (
              <li
                key={reward.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {reward.descricao}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3" aria-hidden="true" />
                      Registrada em {formatDateBR(reward.created_at)}
                    </span>
                    {reward.pago_em ? (
                      <span>• Paga em {formatDateBR(reward.pago_em)}</span>
                    ) : reward.liberado_em ? (
                      <span>• Liberada em {formatDateBR(reward.liberado_em)}</span>
                    ) : null}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-heading text-sm font-bold text-ink">
                    {formatCurrencyBRL(reward.valor_centavos / 100)}
                  </span>
                  <RewardStatusBadge status={reward.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
        Os valores e prazos exibidos seguem a campanha vigente. Em caso de
        divergência, a equipe Estar On pode revisar a recompensa antes do
        pagamento.
      </p>
    </div>
  );
}
