import type { RewardStatus } from "@/features/administracao/services/types";

type RewardStatusMeta = {
 label: string;
 description: string;
 badgeClass: string;
 dotClass: string;
};

export const REWARD_STATUS_MAP: Record<RewardStatus, RewardStatusMeta> = {
 pendente: {
 label: "Pendente",
 description: "Aguardando liberação pela equipe financeira.",
 badgeClass: "bg-amber-50 text-amber-700 ring-amber-600/20",
 dotClass: "bg-amber-500",
 },
 disponivel: {
 label: "Disponível",
 description: "Liberada e pronta para pagamento.",
 badgeClass: "bg-brand-50 text-brand-800 ring-brand-600/25",
 dotClass: "bg-brand-500",
 },
 pago: {
 label: "Pago",
 description: "Pagamento registrado pela equipe.",
 badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
 dotClass: "bg-emerald-500",
 },
 cancelado: {
 label: "Cancelado",
 description: "Recompensa cancelada pela operação.",
 badgeClass: "bg-slate-100 text-slate-600 ring-slate-500/20",
 dotClass: "bg-slate-400",
 },
};

export const REWARD_STATUS_OPTIONS = (
 Object.keys(REWARD_STATUS_MAP) as RewardStatus[]
).map((value) => ({ value, ...REWARD_STATUS_MAP[value] }));

export function getRewardStatusMeta(status: string): RewardStatusMeta {
 return REWARD_STATUS_MAP[status as RewardStatus] ?? REWARD_STATUS_MAP.pendente;
}
