import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/shared/providers";
import { ServiceWorkerRegister } from "@/shared/pwa/service-worker-register";
import { LenisProvider } from "@/shared/layout/lenis-provider";

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
 "http://localhost:3000";

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
 themeColor: "#0b5cff",
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
          <LenisProvider>
            {children}
            <ServiceWorkerRegister />
          </LenisProvider>
        </Providers>
 </body>
 </html>
 );
}
