import type { PixKeyType } from "@/features/pagamentos-pix/services/types";

export type AdminIndicator = {
  id: string;
  nome_completo: string;
  email: string;
  cidade: string | null;
  estado: string | null;
  status: "ativo" | "inativo";
  created_at: string;
  total_indicacoes: number;
  instaladas: number;
  recompensas_pendentes: number;
  recompensas_pagas: number;
  pix_tipo: PixKeyType | null;
  pix_mascarada: string | null;
  pix_configurado: boolean | null;
  pix_atualizado_em: string | null;
};

export const REWARD_STATUS_VALUES = [
  "pendente",
  "disponivel",
  "pago",
  "cancelado",
] as const;

export type RewardStatus = (typeof REWARD_STATUS_VALUES)[number];

export type AdminReward = {
  id: string;
  referral_id: string;
  indicator_id: string;
  indicado_nome: string;
  indicator_nome: string;
  indicator_email: string;
  descricao: string;
  valor_centavos: number;
  status: RewardStatus;
  liberado_em: string | null;
  pago_em: string | null;
  created_at: string;
  pix_tipo: PixKeyType | null;
  pix_mascarada: string | null;
  pix_disponivel: boolean;
};
