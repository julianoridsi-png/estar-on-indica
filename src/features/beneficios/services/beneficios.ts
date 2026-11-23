import { createClient } from "@/services/supabase/client";
import type { Beneficio } from "../types";

export async function listarBeneficiosPublicados(): Promise<Beneficio[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("beneficios")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) { console.error("Erro ao listar benefícios:", error.message); return []; }
  const now = new Date();
  return ((data ?? []) as Beneficio[]).filter((b) => {
    if (b.data_inicio && new Date(b.data_inicio) > now) return false;
    if (b.data_fim && new Date(b.data_fim) < now) return false;
    return true;
  });
}

export async function listarTodosBeneficios(): Promise<Beneficio[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("beneficios")
    .select("*")
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) { console.error("Erro ao listar benefícios:", error.message); return []; }
  return (data ?? []) as Beneficio[];
}

export async function salvarBeneficio(b: Partial<Beneficio> & { id?: string }): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  if (b.id) {
    const { error } = await supabase.from("beneficios").update({
      titulo: b.titulo, descricao: b.descricao, imagem_url: b.imagem_url,
      regulamento: b.regulamento, condicoes: b.condicoes,
      data_inicio: b.data_inicio, data_fim: b.data_fim, ativo: b.ativo,
      ordem: b.ordem, link_url: b.link_url, botao_texto: b.botao_texto,
      updated_at: new Date().toISOString(),
    }).eq("id", b.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("beneficios").insert({
      titulo: b.titulo, descricao: b.descricao, imagem_url: b.imagem_url,
      regulamento: b.regulamento, condicoes: b.condicoes,
      data_inicio: b.data_inicio, data_fim: b.data_fim, ativo: b.ativo ?? true,
      ordem: b.ordem ?? 0, link_url: b.link_url, botao_texto: b.botao_texto,
    });
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function excluirBeneficio(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("beneficios").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
