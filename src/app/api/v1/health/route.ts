import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/services/supabase/config";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "estar-on-indica",
      version: "4.0.0",
      supabase: isSupabaseConfigured() ? "configured" : "not_configured",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
