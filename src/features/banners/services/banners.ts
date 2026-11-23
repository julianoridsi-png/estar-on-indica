import { createClient } from "@/services/supabase/client";
import type { Banner } from "../types";

export async function listarBannersPublicados(): Promise<Banner[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Erro ao listar banners:", error.message);
    return [];
  }
  const now = new Date();
  return ((data ?? []) as Banner[]).filter((b) => {
    if (b.data_inicio && new Date(b.data_inicio) > now) return false;
    if (b.data_fim && new Date(b.data_fim) < now) return false;
    return true;
  });
}

export async function listarTodosBanners(): Promise<Banner[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Erro ao listar banners:", error.message);
    return [];
  }
  return (data ?? []) as Banner[];
}

export async function salvarBanner(banner: Partial<Banner> & { id?: string }): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  if (banner.id) {
    const { error } = await supabase
      .from("banners")
      .update({
        titulo: banner.titulo,
        descricao: banner.descricao,
        imagem_url: banner.imagem_url,
        link_url: banner.link_url,
        botao_texto: banner.botao_texto,
        data_inicio: banner.data_inicio,
        data_fim: banner.data_fim,
        ativo: banner.ativo,
        ordem: banner.ordem,
        updated_at: new Date().toISOString(),
      })
      .eq("id", banner.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("banners").insert({
      titulo: banner.titulo,
      descricao: banner.descricao,
      imagem_url: banner.imagem_url,
      link_url: banner.link_url,
      botao_texto: banner.botao_texto,
      data_inicio: banner.data_inicio,
      data_fim: banner.data_fim,
      ativo: banner.ativo ?? true,
      ordem: banner.ordem ?? 0,
    });
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function excluirBanner(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function uploadBannerImage(file: File): Promise<{ url: string | null; error?: string }> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("banners").upload(path, file, { upsert: false });
  if (error) return { url: null, error: error.message };
  const { data } = supabase.storage.from("banners").getPublicUrl(path);
  return { url: data.publicUrl };
}
