export type Nivel = {
  id: string;
  nome: string;
  descricao: string | null;
  pontos_minimos: number;
  cor: string;
  icone: string;
  ordem: number;
  ativo: boolean;
};

export type Conquista = {
  id: string;
  nome: string;
  descricao: string | null;
  icone: string;
  cor: string;
  criterio: string;
  pontos_recompensa: number;
  ativo: boolean;
};

export type ConquistaDesbloqueada = {
  id: string;
  nome: string;
  descricao: string | null;
  icone: string;
  cor: string;
  pontos_recompensa: number;
  desbloqueada_em: string;
};

export type MetaParticipante = {
  id: string;
  titulo: string;
  descricao: string | null;
  meta_valor: number;
  progresso: number;
  tipo: string;
};

export type PerfilGamificacao = {
  pontos: number;
  nivel: Nivel | null;
  proximo_nivel: { id: string; nome: string; pontos_minimos: number; cor: string } | null;
  conquistas: ConquistaDesbloqueada[];
  metas: MetaParticipante[];
  ranking: number;
};

export type RankingEntry = {
  participante_id: string;
  nome: string;
  pontos: number;
  nivel: string | null;
  nivel_cor: string | null;
};
