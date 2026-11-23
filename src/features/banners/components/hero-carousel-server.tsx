import { createClient } from "@/services/supabase/server";
import { HeroCarousel } from "./hero-carousel";
import type { Banner } from "../types";

export async function HeroCarouselServer() {
 const supabase = await createClient();
 const { data } = await supabase
  .from("banners")
  .select("*")
  .eq("ativo", true)
  .order("ordem", { ascending: true })
  .order("created_at", { ascending: false });

 const now = new Date();
 const banners = ((data ?? []) as Banner[]).filter((b) => {
  if (b.data_inicio && new Date(b.data_inicio) > now) return false;
  if (b.data_fim && new Date(b.data_fim) < now) return false;
  return true;
 });

 // Fallback: exibe o banner oficial da campanha como slide único
 // até que o administrador cadastre banners no gerenciador.
 if (banners.length === 0) {
  const fallback: Banner = {
   id: "fallback-campanha",
   titulo: "Indique e Ganhe R$ 50",
   descricao: "Indique o melhor provedor de internet da região e ganhe R$ 50 por cada amigo que contratar a Estar On!",
   imagem_url: "/branding/indique-ganhe-banner.png",
   link_url: "/cadastro",
   botao_texto: "Quero participar",
   data_inicio: null,
   data_fim: null,
   ativo: true,
   ordem: 0,
   created_at: new Date().toISOString(),
   updated_at: new Date().toISOString(),
  };
  return <HeroCarousel banners={[fallback]} />;
 }

 return <HeroCarousel banners={banners} />;
}
