export type IntegrationStatus =
  | "nao_configurada"
  | "configurada"
  | "conectada"
  | "erro"
  | "desconectada";

export type IntegrationCategory =
  | "comunicacao"
  | "automacao"
  | "crm"
  | "dados"
  | "email"
  | "api";

export type IntegrationProvider = {
  id: string;
  nome: string;
  descricao: string;
  categoria: IntegrationCategory;
  icone: string;
  requerCredenciais: boolean;
  campos: { key: string; label: string; tipo: "text" | "secret" | "url" }[];
  dica: string;
};

export type IntegrationRecord = {
  id: string;
  provider: string;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  last_tested_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};
