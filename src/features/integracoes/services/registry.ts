import type { IntegrationProvider } from "../types";

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  {
    id: "whatsapp_business",
    nome: "WhatsApp Business",
    descricao: "Notificações de indicações, atualizações de status e avisos de recompensas.",
    categoria: "comunicacao",
    icone: "MessageCircle",
    requerCredenciais: true,
    campos: [
      { key: "phone_number_id", label: "Phone Number ID", tipo: "text" },
      { key: "access_token", label: "Access Token", tipo: "secret" },
      { key: "verify_token", label: "Verify Token (webhook)", tipo: "secret" },
    ],
    dica: "Requer conta no WhatsApp Business Platform (Meta).",
  },
  {
    id: "email_smtp",
    nome: "E-mail (SMTP)",
    descricao: "Confirmação de cadastro, recuperação de acesso e notificações automáticas.",
    categoria: "email",
    icone: "Mail",
    requerCredenciais: true,
    campos: [
      { key: "host", label: "Servidor SMTP", tipo: "text" },
      { key: "port", label: "Porta", tipo: "text" },
      { key: "user", label: "Usuário", tipo: "text" },
      { key: "password", label: "Senha", tipo: "secret" },
      { key: "from", label: "Remetente (e-mail)", tipo: "text" },
    ],
    dica: "Use um provedor SMTP (Resend, SendGrid, Mailgun, etc.).",
  },
  {
    id: "n8n",
    nome: "n8n",
    descricao: "Automações externas, gatilhos e fluxos personalizados entre plataformas.",
    categoria: "automacao",
    icone: "Workflow",
    requerCredenciais: true,
    campos: [
      { key: "webhook_url", label: "Webhook URL", tipo: "url" },
      { key: "api_key", label: "API Key (opcional)", tipo: "secret" },
    ],
    dica: "Crie um webhook no n8n e cole a URL aqui.",
  },
  {
    id: "make",
    nome: "Make (Integromat)",
    descricao: "Integração com serviços externos e automações de marketing.",
    categoria: "automacao",
    icone: "Zap",
    requerCredenciais: true,
    campos: [{ key: "webhook_url", label: "Webhook URL", tipo: "url" }],
    dica: "Crie um cenário no Make com um módulo Webhook.",
  },
  {
    id: "crm_generico",
    nome: "CRM (API genérica)",
    descricao: "Sincronização de clientes, registro de oportunidades e atualização de status.",
    categoria: "crm",
    icone: "Users",
    requerCredenciais: true,
    campos: [
      { key: "api_url", label: "URL da API", tipo: "url" },
      { key: "api_key", label: "API Key / Token", tipo: "secret" },
    ],
    dica: "Compatível com CRMs que expõem API REST.",
  },
  {
    id: "google_sheets",
    nome: "Google Sheets",
    descricao: "Exportação de relatórios e sincronização autorizada.",
    categoria: "dados",
    icone: "Sheet",
    requerCredenciais: true,
    campos: [
      { key: "spreadsheet_id", label: "ID da planilha", tipo: "text" },
      { key: "service_account_json", label: "Service Account JSON", tipo: "secret" },
    ],
    dica: "Crie uma Service Account no Google Cloud e compartilhe a planilha.",
  },
  {
    id: "webhook_custom",
    nome: "Webhook personalizado",
    descricao: "Conexões customizadas com sistemas externos via webhooks.",
    categoria: "api",
    icone: "Link",
    requerCredenciais: true,
    campos: [
      { key: "url", label: "URL do webhook", tipo: "url" },
      { key: "secret", label: "Secret (HMAC)", tipo: "secret" },
    ],
    dica: "Use para integrar com qualquer sistema que aceite webhooks.",
  },
];

export function getProvider(id: string) {
  return INTEGRATION_PROVIDERS.find((p) => p.id === id);
}
