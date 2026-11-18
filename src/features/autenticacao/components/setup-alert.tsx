import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";

export function SetupAlert({ compact = false }: { compact?: boolean }) {
 return (
 <Alert className="border-amber-300/70 bg-amber-50 text-amber-950">
 <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
 <AlertTitle className="text-sm font-semibold">
 Conexão com o Supabase pendente
 </AlertTitle>
 <AlertDescription className="text-xs leading-relaxed text-amber-900/90">
 {compact ? (
 <>Preencha o arquivo <code className="rounded bg-amber-100 px-1">.env.local</code> para ativar o cadastro e o login.</>
 ) : (
 <>
 Preencha o arquivo{" "}
 <code className="rounded bg-amber-100 px-1 py-0.5">.env.local</code>{" "}
 com a URL e a chave pública do seu projeto Supabase e execute as
 migrations em{" "}
 <code className="rounded bg-amber-100 px-1 py-0.5">
 supabase/migrations
 </code>
 . O passo a passo completo está no{" "}
 <code className="rounded bg-amber-100 px-1 py-0.5">README.md</code>.
 </>
 )}
 </AlertDescription>
 </Alert>
 );
}
