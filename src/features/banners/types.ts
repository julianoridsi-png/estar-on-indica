export type Banner = {
  id: string;
  titulo: string;
  descricao: string | null;
  imagem_url: string;
  link_url: string | null;
  botao_texto: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
};

export type BannerStatus = "rascunho" | "agendado" | "publicado" | "expirado" | "desativado";

export function getBannerStatus(b: Banner): BannerStatus {
  if (!b.ativo) return "desativado";
  const now = new Date();
  if (b.data_inicio && new Date(b.data_inicio) > now) return "agendado";
  if (b.data_fim && new Date(b.data_fim) < now) return "expirado";
  return "publicado";
}
