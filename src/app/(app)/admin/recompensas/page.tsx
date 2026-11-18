import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
 ArrowLeft,
 CircleAlert,
 Gift,
 ShieldCheck,
 Sparkles,
 Wallet,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { StatCard } from "@/shared/layout/stat-card";
import { RewardSettingsForm, GenerateRewardsButton } from "@/features/administracao/components/reward-settings-form";
import { RewardsTable } from "@/features/administracao/components/rewards-table";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { createClient } from "@/services/supabase/server";
import { formatCurrencyBRL, formatNumberBR } from "@/shared/lib/format";
import type { AdminReward } from "@/features/administracao/services/types";

export const metadata: Metadata = {
 title: "Recompensas",
 robots: { index: false, follow: false },
};

type SettingsRow = {
 recompensa_valor_centavos: number;
 prazo_pagamento_dias: number;
};

export default async function AdminRewardsPage(
 props: PageProps<"/admin/recompensas">,
) {
 const session = await getCurrentSession();

 if (!session) redirect("/login?next=/admin/recompensas");
 if (!session.profile) redirect("/sem-acesso");

 const profile = session.profile;

 if (profile.tipo_usuario !== "admin") redirect("/admin");

 const params = await props.searchParams;
 const statusParam = typeof params.status === "string" ? params.status : "";
 const initialStatus = [
 "pendente",
 "disponivel",
 "pago",
 "cancelado",
 ].includes(statusParam)
 ? (statusParam as "pendente" | "disponivel" | "pago" | "cancelado")
 : "todos";

 const supabase = await createClient();

 const [rewardsResult, settingsResult] = await Promise.all([
 supabase.rpc("admin_listar_recompensas"),
 supabase
 .from("settings")
 .select("recompensa_valor_centavos, prazo_pagamento_dias")
 .eq("id", 1)
 .maybeSingle(),
 ]);

 if (rewardsResult.error) {
 console.error(
 "Erro ao listar recompensas:",
 rewardsResult.error.message,
 );
 }

 if (settingsResult.error) {
 console.error(
 "Erro ao carregar configuração de recompensa:",
 settingsResult.error.message,
 );
 }

 const rewards = rewardsResult.error
 ? null
 : ((rewardsResult.data ?? []) as AdminReward[]);

 const settings = (settingsResult.data as SettingsRow | null) ?? null;

 const counts = (rewards ?? []).reduce(
 (acc, reward) => {
 acc.total += 1;
 acc.valorTotal += reward.valor_centavos;
 if (reward.status === "pendente") acc.pendente += reward.valor_centavos;
 if (reward.status === "disponivel") acc.disponivel += reward.valor_centavos;
 if (reward.status === "pago") acc.pago += reward.valor_centavos;
 return acc;
 },
 {
 total: 0,
 pendente: 0,
 disponivel: 0,
 pago: 0,
 valorTotal: 0,
 },
 );

 return (
 <div className="space-y-6">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
 <div>
 <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
 <Gift className="size-3.5" aria-hidden="true" />
 Recompensas
 </p>
 <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
 Pagamentos aos indicadores
 </h1>
 <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
 Configure o valor da campanha, gere recompensas pendentes e registre
 liberações e pagamentos com base nas chaves PIX cadastradas.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200 ring-inset">
 <ShieldCheck className="size-3" aria-hidden="true" />
 Administrador
 </span>
 <GenerateRewardsButton />
 </div>
 </div>

 {rewards === null ? (
 <Alert className="border-amber-300/70 bg-amber-50 text-amber-950">
 <CircleAlert className="size-4 text-amber-600" aria-hidden="true" />
 <AlertTitle className="text-sm font-semibold">
 Não foi possível carregar as recompensas
 </AlertTitle>
 <AlertDescription className="text-xs text-amber-900/80">
 Verifique a conexão com o banco de dados e se as migrations foram
 executadas.
 </AlertDescription>
 </Alert>
 ) : null}

 <section
 aria-label="Resumo de recompensas"
 className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
 >
 <StatCard
 label="Total de recompensas"
 value={formatNumberBR(counts.total)}
 description="Registros criados para indicadores."
 icon={Gift}
 tone="brand"
 />
 <StatCard
 label="A pagar (pendente + disponível)"
 value={formatCurrencyBRL((counts.pendente + counts.disponivel) / 100)}
 description={
 `${formatNumberBR(
 (rewards ?? []).filter((reward) => reward.status === "pendente")
 .length,
 )} pendentes e ${formatNumberBR(
 (rewards ?? []).filter((reward) => reward.status === "disponivel")
 .length,
 )} disponíveis.`
 }
 icon={Wallet}
 tone="violet"
 />
 <StatCard
 label="Pendente de liberação"
 value={formatCurrencyBRL(counts.pendente / 100)}
 description="Aguardando liberação pela equipe."
 icon={Sparkles}
 tone="amber"
 />
 <StatCard
 label="Total já pago"
 value={formatCurrencyBRL(counts.pago / 100)}
 description="Pagamentos registrados via PIX."
 icon={Wallet}
 tone="emerald"
 />
 </section>

 <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
 <div className="flex items-center gap-2.5">
 <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
 <Sparkles className="size-5" aria-hidden="true" />
 </span>
 <div>
 <h2 className="font-heading text-base font-bold text-ink">
 Configuração da campanha
 </h2>
 <p className="text-[11px] text-muted-foreground">
 Valor padrão aplicado às novas recompensas geradas.
 </p>
 </div>
 </div>

 <div className="mt-5">
 <RewardSettingsForm
 valorCentavos={settings?.recompensa_valor_centavos ?? 0}
 prazoDias={settings?.prazo_pagamento_dias ?? 30}
 />
 </div>
 </section>

 <RewardsTable rewards={rewards ?? []} initialStatus={initialStatus} />

 <div className="flex justify-start">
 <Button asChild variant="ghost" size="sm">
 <Link href="/admin">
 <ArrowLeft className="size-3.5 rotate-180" aria-hidden="true" />
 Voltar para a visão geral
 </Link>
 </Button>
 </div>
 </div>
 );
}