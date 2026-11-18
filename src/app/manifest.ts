import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
 return {
 name: "Estar On Indica",
 short_name: "Estar On",
 description:
 "Programa de indicação da Estar On Internet. Indique amigos, acompanhe cada etapa e consulte suas recompensas.",
 start_url: "/",
 scope: "/",
 display: "standalone",
 orientation: "portrait",
 background_color: "#f5f8fd",
 theme_color: "#0b5cff",
 lang: "pt-BR",
 categories: ["business", "productivity"],
 icons: [
 {
 src: "/icons/icon-192.png",
 sizes: "192x192",
 type: "image/png",
 purpose: "any",
 },
 {
 src: "/icons/icon-512.png",
 sizes: "512x512",
 type: "image/png",
 purpose: "any",
 },
 {
 src: "/icons/maskable-512.png",
 sizes: "512x512",
 type: "image/png",
 purpose: "maskable",
 },
 ],
 };
}
