import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/shared/providers";
import { ServiceWorkerRegister } from "@/shared/pwa/service-worker-register";

const manrope = Manrope({
 variable: "--font-manrope",
 subsets: ["latin"],
 display: "swap",
});

const sora = Sora({
 variable: "--font-sora",
 subsets: ["latin"],
 display: "swap",
});

const siteUrl =
 process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
 "https://estar-on-indica.julianoridsi.workers.dev";

export const metadata: Metadata = {
 metadataBase: new URL(siteUrl),
 title: {
 default: "Estar On Indica | Programa de indicação Estar On Internet",
 template: "%s | Estar On Indica",
 },
 description:
 "Indique amigos para a Estar On Internet, acompanhe cada etapa da indicação e consulte suas recompensas em um só lugar.",
 applicationName: "Estar On Indica",
 manifest: "/manifest.webmanifest",
 appleWebApp: {
 capable: true,
 statusBarStyle: "default",
 title: "Estar On Indica",
 },
 formatDetection: {
 telephone: false,
 },
 openGraph: {
 type: "website",
 locale: "pt_BR",
 url: siteUrl,
 siteName: "Estar On Indica",
 title: "Estar On Indica | Indique amigos e acompanhe suas recompensas",
 description:
 "O programa de indicação da Estar On Internet. Indique, acompanhe o status em tempo real e consulte suas recompensas.",
 images: [
 {
 url: "/branding/og-image.png",
 width: 1200,
 height: 630,
 alt: "Estar On Indica — Indique e Ganhe R$ 50",
 },
 ],
 },
 twitter: {
 card: "summary_large_image",
 title: "Estar On Indica | Indique amigos e acompanhe suas recompensas",
 description:
 "O programa de indicação da Estar On Internet. Indique, acompanhe o status em tempo real e consulte suas recompensas.",
 images: ["/branding/og-image.png"],
 },
 robots: {
 index: true,
 follow: true,
 },
 icons: {
 icon: [
 { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
 { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
 ],
 apple: "/icons/apple-touch-icon.png",
 },
};

export const viewport: Viewport = {
 width: "device-width",
 initialScale: 1,
 maximumScale: 5,
 themeColor: "#D2DD3A",
 colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
 return (
 <html
 lang="pt-BR"
 className={`${manrope.variable} ${sora.variable}`}
 >
 <body className="min-h-dvh bg-background">
 <Providers>
          {children}
          <ServiceWorkerRegister />
        </Providers>
 </body>
 </html>
 );
}
