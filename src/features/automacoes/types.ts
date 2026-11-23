export type AutomationFlow = {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  trigger_type: string;
  created_at: string;
  updated_at: string;
};

export type AutomationNode = {
  id: string;
  flow_id: string;
  node_type: string;
  label: string;
  config: Record<string, unknown>;
  position: number;
  created_at: string;
};

export type AutomationEdge = {
  id: string;
  flow_id: string;
  from_node: string | null;
  to_node: string | null;
  condition: Record<string, unknown>;
  created_at: string;
};

export type AutomationExecution = {
  id: string;
  flow_id: string;
  status: "simulado" | "sucesso" | "falha" | "em_execucao";
  trigger_payload: Record<string, unknown>;
  error: string | null;
  started_at: string;
  finished_at: string | null;
};

export type AutomationLog = {
  id: string;
  execution_id: string;
  node_id: string | null;
  node_type: string;
  status: "simulado" | "sucesso" | "falha" | "ignorado";
  message: string | null;
  error: string | null;
  created_at: string;
};
