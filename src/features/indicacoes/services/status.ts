export const REFERRAL_STATUS_VALUES = [
 "indicacao_recebida",
 "nova_indicacao",
 "aguardando_contato",
 "em_contato",
 "em_analise",
 "em_analise_tecnica",
 "nao_atendemos_regiao",
 "sem_viabilidade_tecnica",
 "atendemos_regiao",
 "viabilidade_aprovada",
 "aguardando_contratacao",
 "em_negociacao",
 "contrato_aprovado",
 "instalacao_agendada",
 "instalado",
 "instalacao_realizada",
 "primeira_mensalidade_pendente",
 "primeira_mensalidade_confirmada",
 "bonificacao_aprovada",
 "bonificacao_disponivel",
 "bonificacao_paga",
 "cancelado",
 "cancelada",
 "reprovado",
 "reprovada",
] as const;

export type StatusIndicacao = (typeof REFERRAL_STATUS_VALUES)[number];

type StatusMeta = {
 value: StatusIndicacao;
 label: string;
 shortLabel: string;
 description: string;
 trackingStage: number;
 isFinal: boolean;
 isPositiveFinal: boolean;
 badgeClass: string;
 dotClass: string;
 softClass: string;
 chartColor: string;
};

export const REFERRAL_STATUS_MAP: Record<StatusIndicacao, StatusMeta> = {
 indicacao_recebida: { value: "indicacao_recebida", label: "Indicação recebida", shortLabel: "Recebida", description: "Cadastro realizado com sucesso e aguardando triagem.", trackingStage: 0, isFinal: false, isPositiveFinal: false, badgeClass: "bg-sky-50 text-sky-700 ring-sky-600/20", dotClass: "bg-sky-500", softClass: "bg-sky-50 text-sky-700", chartColor: "#0ea5e9" },
 nova_indicacao: { value: "nova_indicacao", label: "Nova indicação", shortLabel: "Nova", description: "Indicação recém-cadastrada.", trackingStage: 0, isFinal: false, isPositiveFinal: false, badgeClass: "bg-blue-50 text-blue-700 ring-blue-600/20", dotClass: "bg-blue-500", softClass: "bg-blue-50 text-blue-700", chartColor: "#3b82f6" },
 aguardando_contato: { value: "aguardando_contato", label: "Aguardando contato", shortLabel: "Aguard. contato", description: "A pessoa indicada aguarda o contato da equipe comercial.", trackingStage: 2, isFinal: false, isPositiveFinal: false, badgeClass: "bg-violet-50 text-violet-700 ring-violet-600/20", dotClass: "bg-violet-500", softClass: "bg-violet-50 text-violet-700", chartColor: "#8b5cf6" },
 em_contato: { value: "em_contato", label: "Em contato", shortLabel: "Em contato", description: "A equipe está em contato com a pessoa indicada.", trackingStage: 2, isFinal: false, isPositiveFinal: false, badgeClass: "bg-purple-50 text-purple-700 ring-purple-600/20", dotClass: "bg-purple-500", softClass: "bg-purple-50 text-purple-700", chartColor: "#a855f7" },
 em_analise: { value: "em_analise", label: "Em análise", shortLabel: "Em análise", description: "Nossa equipe está conferindo os dados da indicação.", trackingStage: 1, isFinal: false, isPositiveFinal: false, badgeClass: "bg-amber-50 text-amber-700 ring-amber-600/20", dotClass: "bg-amber-500", softClass: "bg-amber-50 text-amber-700", chartColor: "#f59e0b" },
 em_analise_tecnica: { value: "em_analise_tecnica", label: "Em análise técnica", shortLabel: "Análise técnica", description: "Verificando viabilidade técnica no endereço.", trackingStage: 1, isFinal: false, isPositiveFinal: false, badgeClass: "bg-yellow-50 text-yellow-700 ring-yellow-600/20", dotClass: "bg-yellow-500", softClass: "bg-yellow-50 text-yellow-700", chartColor: "#eab308" },
 nao_atendemos_regiao: { value: "nao_atendemos_regiao", label: "Não atendemos a região", shortLabel: "Sem cobertura", description: "O endereço informado está fora da área de cobertura.", trackingStage: -1, isFinal: true, isPositiveFinal: false, badgeClass: "bg-slate-100 text-slate-700 ring-slate-500/20", dotClass: "bg-slate-500", softClass: "bg-slate-100 text-slate-700", chartColor: "#64748b" },
 sem_viabilidade_tecnica: { value: "sem_viabilidade_tecnica", label: "Sem viabilidade técnica", shortLabel: "Sem viabilidade", description: "Não há viabilidade técnica para instalação no endereço.", trackingStage: -1, isFinal: true, isPositiveFinal: false, badgeClass: "bg-red-50 text-red-700 ring-red-600/20", dotClass: "bg-red-500", softClass: "bg-red-50 text-red-700", chartColor: "#ef4444" },
 atendemos_regiao: { value: "atendemos_regiao", label: "Atendemos a região", shortLabel: "Com cobertura", description: "Confirmamos cobertura para o endereço indicado.", trackingStage: 2, isFinal: false, isPositiveFinal: false, badgeClass: "bg-cyan-50 text-cyan-700 ring-cyan-600/20", dotClass: "bg-cyan-500", softClass: "bg-cyan-50 text-cyan-700", chartColor: "#06b6d4" },
 viabilidade_aprovada: { value: "viabilidade_aprovada", label: "Viabilidade aprovada", shortLabel: "Viabilidade OK", description: "Análise técnica aprovada.", trackingStage: 2, isFinal: false, isPositiveFinal: false, badgeClass: "bg-teal-50 text-teal-700 ring-teal-600/20", dotClass: "bg-teal-500", softClass: "bg-teal-50 text-teal-700", chartColor: "#14b8a6" },
 aguardando_contratacao: { value: "aguardando_contratacao", label: "Aguardando contratação", shortLabel: "Aguard. contrato", description: "Aguardando a contratação pelo indicado.", trackingStage: 3, isFinal: false, isPositiveFinal: false, badgeClass: "bg-indigo-50 text-indigo-700 ring-indigo-600/20", dotClass: "bg-indigo-500", softClass: "bg-indigo-50 text-indigo-700", chartColor: "#6366f1" },
 em_negociacao: { value: "em_negociacao", label: "Em negociação", shortLabel: "Em negociação", description: "A equipe comercial está tratando a contratação.", trackingStage: 3, isFinal: false, isPositiveFinal: false, badgeClass: "bg-indigo-50 text-indigo-700 ring-indigo-600/20", dotClass: "bg-indigo-500", softClass: "bg-indigo-50 text-indigo-700", chartColor: "#6366f1" },
 contrato_aprovado: { value: "contrato_aprovado", label: "Contrato aprovado", shortLabel: "Aprovado", description: "A contratação foi confirmada pela Estar On.", trackingStage: 3, isFinal: false, isPositiveFinal: false, badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dotClass: "bg-emerald-500", softClass: "bg-emerald-50 text-emerald-700", chartColor: "#10b981" },
 instalacao_agendada: { value: "instalacao_agendada", label: "Instalação agendada", shortLabel: "Instalação agendada", description: "A instalação do cliente foi programada.", trackingStage: 4, isFinal: false, isPositiveFinal: false, badgeClass: "bg-teal-50 text-teal-700 ring-teal-600/20", dotClass: "bg-teal-500", softClass: "bg-teal-50 text-teal-700", chartColor: "#14b8a6" },
 instalado: { value: "instalado", label: "Instalado", shortLabel: "Instalado", description: "Instalação concluída e serviço ativado.", trackingStage: 5, isFinal: true, isPositiveFinal: true, badgeClass: "bg-green-50 text-green-700 ring-green-600/25", dotClass: "bg-green-600", softClass: "bg-green-50 text-green-700", chartColor: "#16a34a" },
 instalacao_realizada: { value: "instalacao_realizada", label: "Instalação realizada", shortLabel: "Instalada", description: "Instalação concluída.", trackingStage: 5, isFinal: true, isPositiveFinal: true, badgeClass: "bg-green-50 text-green-700 ring-green-600/25", dotClass: "bg-green-600", softClass: "bg-green-50 text-green-700", chartColor: "#16a34a" },
 primeira_mensalidade_pendente: { value: "primeira_mensalidade_pendente", label: "Primeira mensalidade pendente", shortLabel: "Mensalidade pendente", description: "Aguardando confirmação do pagamento da primeira mensalidade.", trackingStage: 5, isFinal: false, isPositiveFinal: false, badgeClass: "bg-amber-50 text-amber-700 ring-amber-600/20", dotClass: "bg-amber-500", softClass: "bg-amber-50 text-amber-700", chartColor: "#f59e0b" },
 primeira_mensalidade_confirmada: { value: "primeira_mensalidade_confirmada", label: "Primeira mensalidade confirmada", shortLabel: "Mensalidade confirmada", description: "Primeira mensalidade paga e confirmada.", trackingStage: 5, isFinal: false, isPositiveFinal: true, badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dotClass: "bg-emerald-500", softClass: "bg-emerald-50 text-emerald-700", chartColor: "#10b981" },
 bonificacao_aprovada: { value: "bonificacao_aprovada", label: "Bonificação aprovada", shortLabel: "Bonif. aprovada", description: "Bonificação aprovada para liberação.", trackingStage: 5, isFinal: false, isPositiveFinal: true, badgeClass: "bg-brand-50 text-brand-800 ring-brand-600/25", dotClass: "bg-brand-500", softClass: "bg-brand-50 text-brand-800", chartColor: "#D2DD3A" },
 bonificacao_disponivel: { value: "bonificacao_disponivel", label: "Bonificação disponível", shortLabel: "Bonif. disponível", description: "Bonificação liberada para pagamento.", trackingStage: 5, isFinal: false, isPositiveFinal: true, badgeClass: "bg-brand-50 text-brand-800 ring-brand-600/25", dotClass: "bg-brand-500", softClass: "bg-brand-50 text-brand-800", chartColor: "#D2DD3A" },
 bonificacao_paga: { value: "bonificacao_paga", label: "Bonificação paga", shortLabel: "Bonif. paga", description: "Bonificação paga ao indicador.", trackingStage: 5, isFinal: true, isPositiveFinal: true, badgeClass: "bg-green-50 text-green-700 ring-green-600/25", dotClass: "bg-green-600", softClass: "bg-green-50 text-green-700", chartColor: "#16a34a" },
 cancelado: { value: "cancelado", label: "Cancelado", shortLabel: "Cancelado", description: "A indicação ou contratação foi cancelada.", trackingStage: -1, isFinal: true, isPositiveFinal: false, badgeClass: "bg-red-50 text-red-700 ring-red-600/20", dotClass: "bg-red-500", softClass: "bg-red-50 text-red-700", chartColor: "#ef4444" },
 cancelada: { value: "cancelada", label: "Cancelada", shortLabel: "Cancelada", description: "A indicação foi cancelada.", trackingStage: -1, isFinal: true, isPositiveFinal: false, badgeClass: "bg-red-50 text-red-700 ring-red-600/20", dotClass: "bg-red-500", softClass: "bg-red-50 text-red-700", chartColor: "#ef4444" },
 reprovado: { value: "reprovado", label: "Reprovado", shortLabel: "Reprovado", description: "A indicação não atende aos critérios da campanha.", trackingStage: -1, isFinal: true, isPositiveFinal: false, badgeClass: "bg-orange-50 text-orange-700 ring-orange-600/20", dotClass: "bg-orange-500", softClass: "bg-orange-50 text-orange-700", chartColor: "#f97316" },
 reprovada: { value: "reprovada", label: "Reprovada", shortLabel: "Reprovada", description: "A indicação foi reprovada.", trackingStage: -1, isFinal: true, isPositiveFinal: false, badgeClass: "bg-orange-50 text-orange-700 ring-orange-600/20", dotClass: "bg-orange-500", softClass: "bg-orange-50 text-orange-700", chartColor: "#f97316" },
};

export const REFERRAL_STATUS_OPTIONS = REFERRAL_STATUS_VALUES.map(
 (value) => REFERRAL_STATUS_MAP[value],
);

export const TRACKING_STEPS = [
 { label: "Indicação recebida", shortLabel: "Recebida" },
 { label: "Em análise", shortLabel: "Análise" },
 { label: "Atendemos a região", shortLabel: "Cobertura" },
 { label: "Contrato aprovado", shortLabel: "Aprovado" },
 { label: "Instalação agendada", shortLabel: "Agendada" },
 { label: "Instalado", shortLabel: "Instalado" },
] as const;

export const OPEN_STATUSES: StatusIndicacao[] = [
 "indicacao_recebida", "nova_indicacao", "aguardando_contato", "em_contato",
 "em_analise", "em_analise_tecnica", "atendemos_regiao", "viabilidade_aprovada",
 "aguardando_contratacao", "em_negociacao", "contrato_aprovado", "instalacao_agendada",
 "primeira_mensalidade_pendente",
];

export const APPROVED_STATUSES: StatusIndicacao[] = [
 "contrato_aprovado", "instalacao_agendada", "instalado", "instalacao_realizada",
 "primeira_mensalidade_confirmada", "bonificacao_aprovada", "bonificacao_disponivel",
 "bonificacao_paga",
];

export function getStatusMeta(status: string): StatusMeta {
 return (
 REFERRAL_STATUS_MAP[status as StatusIndicacao] ??
 REFERRAL_STATUS_MAP.indicacao_recebida
 );
}

export function getTrackingStage(status: StatusIndicacao): number {
 return REFERRAL_STATUS_MAP[status].trackingStage;
}