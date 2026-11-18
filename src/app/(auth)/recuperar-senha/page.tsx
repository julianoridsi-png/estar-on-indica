import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/autenticacao/components/forgot-password-form";
import { isSupabaseConfigured } from "@/services/supabase/config";

export const metadata: Metadata = {
 title: "Recuperar senha",
 description: "Recupere o acesso à sua conta do Estar On Indica.",
 robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
 return <ForgotPasswordForm configured={isSupabaseConfigured()} />;
}
