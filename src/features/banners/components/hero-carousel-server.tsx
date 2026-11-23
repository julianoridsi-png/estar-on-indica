import Image from "next/image";
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

 if (banners.length === 0) {
  return (
   <div className="overflow-hidden rounded-2xl shadow-soft">
    <Image
     src="/branding/indique-ganhe-banner.png"
     alt="Estar On faz o Pix — Indique e Ganhe R$ 50,00"
     width={1920}
     height={650}
     className="h-auto w-full object-cover"
     priority
    />
   </div>
  );
 }

 return <HeroCarousel banners={banners} />;
}
