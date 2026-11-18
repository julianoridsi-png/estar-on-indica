import type { StatusIndicacao } from "@/features/indicacoes/services/status";

export type IndicatorStats = {
 total_indicacoes: number;
 em_andamento: number;
 aprovadas: number;
 instaladas: number;
 recompensas_pendentes: number;
 recompensas_disponiveis: number;
};

export type AdminMonthlyPoint = {
 mes: string;
 total: number;
 instalados: number;
};

export type AdminTopIndicator = {
 id: string;
 nome: string;
 total: number;
 instalados: number;
};

export type AdminStats = {
 total_indicadores: number;
 total_indicacoes: number;
 contratos_aprovados: number;
 instalados: number;
 recompensas_pendentes: number;
 recompensas_disponiveis: number;
 recompensas_pagas: number;
 valor_recompensas_pendentes_centavos: number;
 valor_recompensas_pagas_centavos: number;
 por_status: Record<string, number>;
 por_mes: AdminMonthlyPoint[];
 top_indicadores: AdminTopIndicator[];
};

export type ReferralListItem = {
 id: string;
 indicado_nome: string;
 indicado_cpf_final: string | null;
 status: StatusIndicacao;
 created_at: string;
 updated_at: string;
};
