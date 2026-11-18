import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MfaEnrollment } from "@/features/autenticacao/components/mfa-enrollment";
import { getCurrentSession } from "@/features/autenticacao/services/current";

export const metadata: Metadata = {
  title: "Configurar MFA",
  robots: { index: false, follow: false },
};

export default async function MfaConfigPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/configurar-mfa");
  if (!session.profile) redirect("/sem-acesso");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">
          Autenticação de dois fatores (MFA)
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Adicione uma camada extra de segurança à sua conta usando um
          aplicativo autenticador (Google Authenticator, Authy, etc.).
        </p>
      </div>
      <MfaEnrollment />
    </div>
  );
}
