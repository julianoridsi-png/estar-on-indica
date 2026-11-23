import { createClient } from "@/services/supabase/client";
import type {
  Conquista,
  MetaParticipante,
  Nivel,
  PerfilGamificacao,
  RankingEntry,
} from "../types";

export async function getMeuPerfilGamificacao(): Promise<PerfilGamificacao | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_meu_perfil_gamificacao");
  if (error) {
    console.error("Erro ao carregar perfil de gamificação:", error.message);
    return null;
  }
  return (data as PerfilGamificacao | null) ?? null;
}

export async function listarNiveis(): Promise<Nivel[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("listar_niveis");
  if (error) {
    console.error("Erro ao listar níveis:", error.message);
    return [];
  }
  return (data as Nivel[] | null) ?? [];
}

export async function listarConquistas(): Promise<Conquista[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("listar_conquistas");
  if (error) {
    console.error("Erro ao listar conquistas:", error.message);
    return [];
  }
  return (data as Conquista[] | null) ?? [];
}

export async function listarRanking(limit = 10): Promise<RankingEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("listar_ranking_participantes", { p_limit: limit });
  if (error) {
    console.error("Erro ao listar ranking:", error.message);
    return [];
  }
  return (data as RankingEntry[] | null) ?? [];
}
