"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
 AlertTriangle,
 Banknote,
 CheckCircle2,
 Loader2,
 Search,
 Send,
 Wallet,
 XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/shared/ui/dialog";
import { RewardStatusBadge } from "@/features/recompensas/components/reward-status-badge";
import { PixRevealButton } from "@/features/administracao/components/pix-reveal-dialog";
import { updateRewardStatusAction } from "@/features/administracao/services/actions";
import { formatCurrencyBRL, formatDateBR } from "@/shared/lib/format";
import type { AdminReward, RewardStatus } from "@/features/administracao/services/types";

type StatusFilter = RewardStatus | "todos";

const FILTERS: { value: StatusFilter; label: string }[] = [
 { value: "todos", label: "Todas" },
 { value: "pendente", label: "Pendentes" },
 { value: "disponivel", label: "Disponíveis" },
 { value: "pago", label: "Pagas" },
 { value: "cancelado", label: "Canceladas" },
];

const ACTION_COPY: Record<
 Exclude<RewardStatus, "pendente">,
 { title: string; description: string; confirm: string }
> = {
 disponivel: {
 title: "Liberar esta recompensa?",
 description:
 "A recompensa ficará disponível para pagamento e o indicador será notificado.",
 confirm: "Liberar recompensa",
 },
 pago: {
 title: "Registrar pagamento?",
 description:
 "Confirme que o pagamento foi realizado via PIX para o indicador. A data e o responsável serão registrados.",
 confirm: "Registrar pagamento",
 },
 cancelado: {
 title: "Cancelar esta recompensa?",
 description:
 "A recompensa será cancelada e o indicador será notificado. Esta ação não apaga o histórico.",
 confirm: "Cancelar recompensa",
 },
};

export function RewardsTable({
 rewards,
 initialStatus = "todos",
}: {
 rewards: AdminReward[];
 initialStatus?: StatusFilter;
}) {
 const router = useRouter();
 const [statusFilter, setStatusFilter] =
 useState<StatusFilter>(initialStatus);
 const [search, setSearch] = useState("");
 const [target, setTarget] = useState<{
 reward: AdminReward;
 status: Exclude<RewardStatus, "pendente">;
 } | null>(null);
 const [isPending, startTransition] = useTransition();

 const filtered = useMemo(() => {
 const term = search.trim().toLowerCase();

 return rewards.filter((reward) => {
 if (statusFilter !== "todos" && reward.status !== statusFilter) {
 return false;
 }

 if (!term) return true;

 return (
 reward.indicado_nome.toLowerCase().includes(term) ||
 reward.indicator_nome.toLowerCase().includes(term) ||
 reward.indicator_email.toLowerCase().includes(term)
 );
 });
 }, [rewards, search, statusFilter]);

 const counts = useMemo(
 () =>
 rewards.reduce(
 (acc, reward) => {
 acc[reward.status] = (acc[reward.status] ?? 0) + 1;
 return acc;
 },
 {} as Record<string, number>,
 ),
 [rewards],
 );

 const runAction = () => {
 if (!target) return;

 startTransition(async () => {
 const result = await updateRewardStatusAction({
 rewardId: target.reward.id,
 status: target.status,
 });

 if (result.status === "error") {
 toast.error("Não foi possível atualizar a recompensa", {
 description: result.message,
 });
 return;
 }

 toast.success("Recompensa atualizada", {
 description: result.message,
 });
 setTarget(null);
 router.refresh();
 });
 };

 return (
 <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
 <div className="border-b border-border p-4 sm:p-5">
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div className="relative w-full sm:max-w-sm">
 <Search
 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
 aria-hidden="true"
 />
 <Input
 value={search}
 onChange={(event) => setSearch(event.target.value)}
 placeholder="Buscar por indicado ou indicador"
 className="pl-9"
 aria-label="Buscar recompensa"
 />
 </div>

 <div className="flex flex-wrap items-center gap-2">
 {FILTERS.map((filter) => {
 const active = statusFilter === filter.value;
 const count =
 filter.value === "todos"
 ? rewards.length
 : (counts[filter.value] ?? 0);

 return (
 <button
 key={filter.value}
 type="button"
 onClick={() => setStatusFilter(filter.value)}
 aria-pressed={active}
 className={
 active
 ? "rounded-full bg-ink px-3 py-1.5 text-[10px] font-bold text-white"
 : "rounded-full bg-muted px-3 py-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-brand-50 hover:text-ink"
 }
 >
 {filter.label}
 <span
 className={
 active
 ? "ml-1 rounded-full bg-white/15 px-1.5 text-[9px] font-bold"
 : "ml-1 rounded-full bg-card px-1.5 text-[9px] font-bold text-ink/70"
 }
 >
 {count}
 </span>
 </button>
 );
 })}
 </div>
 </div>
 </div>

 {filtered.length === 0 ? (
 <div className="flex flex-col items-center px-6 py-14 text-center">
 <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
 <Wallet className="size-6" aria-hidden="true" />
 </span>
 <h2 className="mt-4 font-heading text-base font-bold text-ink">
 {rewards.length === 0
 ? "Nenhuma recompensa registrada"
 : "Nenhuma recompensa encontrada"}
 </h2>
 <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
 {rewards.length === 0
 ? "As recompensas são criadas quando uma indicação é marcada como instalada e o valor da campanha está configurado."
 : "Ajuste a busca ou o filtro de status para encontrar a recompensa desejada."}
 </p>
 {rewards.length > 0 ? (
 <Button
 type="button"
 variant="outline"
 className="mt-4"
 onClick={() => {
 setSearch("");
 setStatusFilter("todos");
 }}
 >
 Limpar filtros
 </Button>
 ) : null}
 </div>
 ) : (
 <>
 <div className="overflow-x-auto">
 <table className="w-full min-w-[900px] text-left text-xs">
 <thead className="bg-background text-[9px] tracking-[0.1em] text-muted-foreground uppercase">
 <tr>
 <th className="px-4 py-3 font-bold">Indicado / Indicador</th>
 <th className="px-4 py-3 font-bold">Valor</th>
 <th className="px-4 py-3 font-bold">Status</th>
 <th className="px-4 py-3 font-bold">Chave PIX</th>
 <th className="px-4 py-3 font-bold">Registro</th>
 <th className="px-4 py-3 text-right font-bold">Ações</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map((reward) => (
 <tr key={reward.id} className="hover:bg-background/60">
 <td className="px-4 py-3">
 <p className="max-w-[180px] truncate font-semibold text-ink">
 {reward.indicado_nome}
 </p>
 <p className="max-w-[180px] truncate text-[10px] text-muted-foreground">
 {reward.indicator_nome} • {reward.indicator_email}
 </p>
 </td>
 <td className="px-4 py-3">
 <span className="font-heading text-sm font-bold text-ink">
 {formatCurrencyBRL(reward.valor_centavos / 100)}
 </span>
 <p className="max-w-[170px] truncate text-[10px] text-muted-foreground">
 {reward.descricao}
 </p>
 </td>
 <td className="px-4 py-3">
 <RewardStatusBadge status={reward.status} />
 </td>
 <td className="px-4 py-3">
 {reward.pix_disponivel ? (
 <div className="flex flex-col items-start gap-1.5">
 <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200 ring-inset">
 {reward.pix_mascarada ?? "Cadastrada"}
 </span>
 <PixRevealButton
 profileId={reward.indicator_id}
 nome={reward.indicator_nome}
 tipo={reward.pix_tipo}
 chaveMascarada={reward.pix_mascarada}
 size="sm"
 />
 </div>
 ) : (
 <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-800 ring-1 ring-amber-200 ring-inset">
 <AlertTriangle
 className="size-2.5"
 aria-hidden="true"
 />
 Sem chave
 </span>
 )}
 </td>
 <td className="px-4 py-3 text-[10px] text-muted-foreground">
 <p>Registrada em {formatDateBR(reward.created_at)}</p>
 {reward.liberado_em ? (
 <p>Liberada em {formatDateBR(reward.liberado_em)}</p>
 ) : null}
 {reward.pago_em ? (
 <p>Paga em {formatDateBR(reward.pago_em)}</p>
 ) : null}
 </td>
 <td className="px-4 py-3">
 <div className="flex justify-end gap-1.5">
 {reward.status === "pendente" ? (
 <>
 <Button
 type="button"
 size="sm"
 onClick={() =>
 setTarget({
 reward,
 status: "disponivel",
 })
 }
 className="gap-1"
 >
 <CheckCircle2
 className="size-3.5"
 aria-hidden="true"
 />
 Liberar
 </Button>
 <Button
 type="button"
 size="sm"
 variant="outline"
 onClick={() =>
 setTarget({
 reward,
 status: "cancelado",
 })
 }
 className="gap-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
 >
 <XCircle
 className="size-3.5"
 aria-hidden="true"
 />
 Cancelar
 </Button>
 </>
 ) : reward.status === "disponivel" ? (
 <>
 <Button
 type="button"
 size="sm"
 disabled={!reward.pix_disponivel}
 title={
 reward.pix_disponivel
 ? "Registrar pagamento"
 : "O indicador precisa cadastrar uma chave PIX."
 }
 onClick={() =>
 setTarget({ reward, status: "pago" })
 }
 className="gap-1"
 >
 <Banknote
 className="size-3.5"
 aria-hidden="true"
 />
 Pagar
 </Button>
 <Button
 type="button"
 size="sm"
 variant="outline"
 onClick={() =>
 setTarget({
 reward,
 status: "cancelado",
 })
 }
 className="gap-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
 >
 <XCircle
 className="size-3.5"
 aria-hidden="true"
 />
 Cancelar
 </Button>
 </>
 ) : (
 <span className="text-[10px] text-muted-foreground">
 Sem ações
 </span>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="border-t border-border bg-background px-4 py-3">
 <p className="text-[10px] text-muted-foreground">
 Exibindo até 500 recompensas. Pagamentos só são registrados
 quando o indicador possui chave PIX cadastrada.
 </p>
 </div>
 </>
 )}

 <Dialog
 open={Boolean(target)}
 onOpenChange={(open) => {
 if (!open && !isPending) setTarget(null);
 }}
 >
 <DialogContent>
 <DialogHeader>
 <DialogTitle>
 {target ? ACTION_COPY[target.status].title : "Confirmar ação"}
 </DialogTitle>
 <DialogDescription>
 {target ? ACTION_COPY[target.status].description : ""}
 </DialogDescription>
 </DialogHeader>

 {target ? (
 <div className="space-y-2 rounded-xl border border-border bg-background p-3 text-[11px]">
 <div className="flex justify-between gap-3">
 <span className="text-muted-foreground">Indicado</span>
 <span className="text-right font-semibold text-ink">
 {target.reward.indicado_nome}
 </span>
 </div>
 <div className="flex justify-between gap-3">
 <span className="text-muted-foreground">Indicador</span>
 <span className="text-right font-semibold text-ink">
 {target.reward.indicator_nome}
 </span>
 </div>
 <div className="flex justify-between gap-3">
 <span className="text-muted-foreground">Valor</span>
 <span className="text-right font-semibold text-ink">
 {formatCurrencyBRL(target.reward.valor_centavos / 100)}
 </span>
 </div>
 <div className="flex justify-between gap-3">
 <span className="text-muted-foreground">Chave PIX</span>
 <span className="text-right font-semibold text-ink">
 {target.reward.pix_mascarada ?? "Não cadastrada"}
 </span>
 </div>
 </div>
 ) : null}

 {target?.status === "pago" && !target.reward.pix_disponivel ? (
 <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950">
 <AlertTriangle
 className="mt-0.5 size-4 shrink-0 text-amber-600"
 aria-hidden="true"
 />
 <p className="text-[11px] leading-relaxed">
 O indicador não possui chave PIX. Cadastre a chave antes de
 registrar o pagamento.
 </p>
 </div>
 ) : null}

 <DialogFooter>
 <Button
 type="button"
 variant="outline"
 onClick={() => setTarget(null)}
 disabled={isPending}
 >
 Voltar
 </Button>
 <Button
 type="button"
 onClick={runAction}
 disabled={
 isPending ||
 (target?.status === "pago" && !target.reward.pix_disponivel)
 }
 variant={
 target?.status === "cancelado" ? "destructive" : "default"
 }
 className="gap-1.5"
 >
 {isPending ? (
 <Loader2 className="size-4 animate-spin" aria-hidden="true" />
 ) : target?.status === "pago" ? (
 <Banknote className="size-4" aria-hidden="true" />
 ) : target?.status === "cancelado" ? (
 <XCircle className="size-4" aria-hidden="true" />
 ) : (
 <Send className="size-4" aria-hidden="true" />
 )}
 {target ? ACTION_COPY[target.status].confirm : "Confirmar"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </section>
 );
}
