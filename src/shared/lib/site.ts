import "server-only";
import { headers } from "next/headers";

export async function getSiteUrl(): Promise<string> {
 const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
 if (configured) return configured;

 const requestHeaders = await headers();
 const host =
 requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
 const protocol =
 requestHeaders.get("x-forwarded-proto") ??
 (host?.includes("localhost") ? "http" : "https");

 return `${protocol}://${host ?? "localhost:3000"}`;
}
