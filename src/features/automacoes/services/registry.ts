
export type BlockCategory =
  | "gatilho"
  | "condicao"
  | "acao"
  | "espera"
  | "notificacao"
  | "consulta"
  | "integracao"
  | "atualizacao";

export type BlockType = {
  type: string;
  category: BlockCategory;
  label: string;
  descricao: string;
  icone: string;
  campos: { key: string; label: string; tipo: "text" | "select" | "number" }[];
  opcoes?: { value: string; label: string }[];
};

export const BLOCK_CATEGORY_LABEL: Record<BlockCategory, string> = {
  gatilho: "Gatilhos",
  condicao: "Condições",
  acao: "Ações",
  espera: "Esperas",
  notificacao: "Notificações",
  consulta: "Consultas",
  integracao: "Integrações",
  atualizacao: "Atualizações",
};

export const BLOCK_CATEGORY_COLOR: Record<BlockCategory, string> = {
  gatilho: "bg-brand-50 text-brand-700 ring-brand-200",
  condicao: "bg-amber-50 text-amber-700 ring-amber-200",
  acao: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  espera: "bg-slate-100 text-slate-700 ring-slate-300",
  notificacao: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  consulta: "bg-violet-50 text-violet-700 ring-violet-200",
  integracao: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  atualizacao: "bg-orange-50 text-orange-700 ring-orange-200",
};

export const BLOCK_TYPES: BlockType[] = [
  { type: "gatilho_nova_indicacao", category: "gatilho", label: "Nova indicação", descricao: "Dispara quando uma nova indicação é cadastrada.", icone: "Send", campos: [], opcoes: [] },
  { type: "gatilho_status_alterado", category: "gatilho", label: "Status alterado", descricao: "Dispara quando o status de uma indicação muda.", icone: "RefreshCw", campos: [{ key: "status", label: "Status alvo", tipo: "select" }], opcoes: [{ value: "instalado", label: "Instalado" }, { value: "contrato_aprovado", label: "Contrato aprovado" }] },
  { type: "gatilho_recompensa_liberada", category: "gatilho", label: "Recompensa liberada", descricao: "Dispara quando uma recompensa é liberada.", icone: "Gift", campos: [], opcoes: [] },
  { type: "gatilho_meta_atingida", category: "gatilho", label: "Meta atingida", descricao: "Dispara quando uma meta mensal é atingida.", icone: "Target", campos: [{ key: "meta", label: "Meta (número)", tipo: "number" }], opcoes: [] },
  { type: "gatilho_manual", category: "gatilho", label: "Execução manual", descricao: "Disparado manualmente pelo administrador.", icone: "Play", campos: [], opcoes: [] },
  { type: "condicao_se_status", category: "condicao", label: "Se status for", descricao: "Continua apenas se o status for o informado.", icone: "GitBranch", campos: [{ key: "status", label: "Status", tipo: "select" }], opcoes: [{ value: "instalado", label: "Instalado" }, { value: "contrato_aprovado", label: "Contrato aprovado" }, { value: "cancelado", label: "Cancelado" }] },
  { type: "condicao_se_perfil", category: "condicao", label: "Se perfil for", descricao: "Continua apenas para determinado perfil.", icone: "UserCheck", campos: [{ key: "perfil", label: "Perfil", tipo: "select" }], opcoes: [{ value: "indicador", label: "Indicador" }, { value: "comercial", label: "Comercial" }, { value: "admin", label: "Admin" }] },
  { type: "acao_enviar_email", category: "acao", label: "Enviar e-mail", descricao: "Envia um e-mail ao participante.", icone: "Mail", campos: [{ key: "template", label: "Template", tipo: "text" }] },
  { type: "acao_enviar_whatsapp", category: "acao", label: "Enviar WhatsApp", descricao: "Envia mensagem via WhatsApp (requer integração).", icone: "MessageCircle", campos: [{ key: "template", label: "Template", tipo: "text" }] },
  { type: "acao_atualizar_status", category: "acao", label: "Atualizar status", descricao: "Atualiza o status da indicação.", icone: "RefreshCw", campos: [{ key: "status", label: "Novo status", tipo: "select" }], opcoes: [{ value: "em_analise", label: "Em análise" }, { value: "contrato_aprovado", label: "Contrato aprovado" }] },
  { type: "acao_registrar_evento", category: "acao", label: "Registrar evento", descricao: "Registra um evento no histórico.", icone: "FileText", campos: [{ key: "evento", label: "Evento", tipo: "text" }] },
  { type: "acao_chamar_webhook", category: "acao", label: "Chamar webhook", descricao: "Dispara um webhook para sistema externo.", icone: "Webhook", campos: [{ key: "url", label: "URL", tipo: "text" }] },
  { type: "espera_horas", category: "espera", label: "Aguardar (horas)", descricao: "Aguarda N horas antes de continuar.", icone: "Clock", campos: [{ key: "horas", label: "Horas", tipo: "number" }] },
  { type: "espera_dias", category: "espera", label: "Aguardar (dias)", descricao: "Aguarda N dias antes de continuar.", icone: "Calendar", campos: [{ key: "dias", label: "Dias", tipo: "number" }] },
  { type: "notificacao_admin", category: "notificacao", label: "Notificar admin", descricao: "Gera alerta no painel administrativo.", icone: "Bell", campos: [{ key: "mensagem", label: "Mensagem", tipo: "text" }] },
  { type: "notificacao_participante", category: "notificacao", label: "Notificar participante", descricao: "Envia notificação ao participante.", icone: "BellRing", campos: [{ key: "mensagem", label: "Mensagem", tipo: "text" }] },
  { type: "consulta_indicacao", category: "consulta", label: "Buscar indicação", descricao: "Consulta dados de uma indicação.", icone: "Search", campos: [] },
  { type: "consulta_participante", category: "consulta", label: "Buscar participante", descricao: "Consulta dados de um participante.", icone: "UserSearch", campos: [] },
  { type: "integracao_conector", category: "integracao", label: "Chamar conector", descricao: "Invoca uma integração do Connect Hub.", icone: "Plug", campos: [{ key: "provider", label: "Provider", tipo: "select" }], opcoes: [{ value: "whatsapp_business", label: "WhatsApp Business" }, { value: "email_smtp", label: "E-mail (SMTP)" }, { value: "n8n", label: "n8n" }, { value: "make", label: "Make" }, { value: "crm_generico", label: "CRM" }, { value: "google_sheets", label: "Google Sheets" }, { value: "webhook_custom", label: "Webhook" }] },
  { type: "atualizacao_campo", category: "atualizacao", label: "Atualizar campo", descricao: "Atualiza um campo da indicação.", icone: "Edit", campos: [{ key: "campo", label: "Campo", tipo: "text" }, { key: "valor", label: "Valor", tipo: "text" }] },
];

export function getBlockType(type: string) {
  return BLOCK_TYPES.find((b) => b.type === type);
}

export function getDefaultLabel(type: string) {
  return getBlockType(type)?.label ?? type;
}
