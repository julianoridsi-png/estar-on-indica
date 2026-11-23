export type Beneficio = {
  id: string;
  titulo: string;
  descricao: string | null;
  imagem_url: string | null;
  regulamento: string | null;
  condicoes: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  ativo: boolean;
  ordem: number;
  link_url: string | null;
  botao_texto: string | null;
  created_at: string;
  updated_at: string;
};
