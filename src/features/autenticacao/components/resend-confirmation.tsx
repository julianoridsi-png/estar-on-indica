"use client";

import { useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { resendConfirmationAction } from "@/features/autenticacao/services/actions";

export function ResendConfirmation({
 email,
 configured,
}: {
 email: string;
 configured: boolean;
}) {
 const [isPending, startTransition] = useTransition();

 const handleResend = () => {
 startTransition(async () => {
 const result = await resendConfirmationAction(email);

 if (result.status === "error") {
 toast.error("Não foi possível reenviar", {
 description: result.message,
 });
 return;
 }

 toast.success("Solicitação registrada", {
 description: result.message,
 });
 });
 };

 return (
 <Button
 type="button"
 variant="outline"
 size="lg"
 className="w-full"
 onClick={handleResend}
 disabled={!configured || isPending || !email}
 >
 {isPending ? (
 <>
 <Loader2 className="size-4 animate-spin" aria-hidden="true" />
 Reenviando...
 </>
 ) : (
 <>
 <Send className="size-4" aria-hidden="true" />
 Reenviar e-mail de confirmação
 </>
 )}
 </Button>
 );
}
