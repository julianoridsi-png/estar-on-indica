import type { Metadata } from "next";
import { SignupForm } from "@/features/autenticacao/components/signup-form";
import { isSupabaseConfigured } from "@/services/supabase/config";

export const metadata: Metadata = {
  title: "Criar conta",
  description:
    "Cadastre-se no Estar On Indica e comece a indicar amigos para a Estar On Internet.",
};

export default function SignupPage() {
  return <SignupForm configured={isSupabaseConfigured()} />;
}
