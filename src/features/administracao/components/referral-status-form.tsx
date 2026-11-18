"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Loader2, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/shared/ui/select";
import { FormField } from "@/features/autenticacao/components/form-field";
import { updateReferralStatusAction } from "@/features/indicacoes/services/actions";
import { REFERRAL_STATUS_OPTIONS } from "@/features/indicacoes/services/status";

export function ReferralStatusForm({
 referralId,
 currentStatus,
}: {
 referralId: string;
 currentStatus: string;
}) {
 const router = useRouter();
 const [status, setStatus] = useState(currentStatus);
 const [observacao, setObservacao] = useState("");
 const [serverError, setServerError] = useState<string | null>(null);
 const [isPending, startTransition] = useTransition();

 const currentMeta = REFERRAL_STATUS_OPTIONS.find(
 (option) => option.value === currentStatus,
 );

 const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 setServerError(null);

 if (status === currentStatus && !observacao.trim()) {
 toast.info("Nenhuma alteração para salvar.");
 return;
 }

 startTransition(async () => {
 const result = await updateReferralStatusAction({
 referralId,
 status,
 observacao,
 });

 if (result.status === "error") {
 setServerError(result.message);
 toast.error("Não foi possível atualizar o status", {
 description: result.message,
 });
 return;
 }

 toast.success("Status atualizado", { description: result.message });
 setObservacao("");
 router.refresh();
 });
 };

 return (
 <form onSubmit={onSubmit} className="space-y-4">
 <div className="rounded-xl border border-border bg-background p-3">
 <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
 Status atual
 </p>
 <p className="mt-1 text-sm font-semibold text-ink">
 {currentMeta?.label ?? currentStatus}
 </p>
 {currentMeta ? (
 <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
 {currentMeta.description}
 </p>
 ) : null}
 </div>

 <FormField
 label="Novo status"
 htmlFor="status-indicacao"
 required
 error={serverError ?? undefined}
 >
 <Select value={status} onValueChange={setStatus}>
 <SelectTrigger id="status-indicacao" className="h-11 w-full">
 <SelectValue placeholder="Selecione o novo status" />
 </SelectTrigger>
 <SelectContent>
 {REFERRAL_STATUS_OPTIONS.map((option) => (
 <SelectItem key={option.value} value={option.value}>
 {option.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </FormField>

 <FormField
 label="Observação interna"
 htmlFor="status-observacao"
 hint="Opcional. Fica registrada no histórico da indicação."
 >
 <Textarea
 id="status-observacao"
 rows={3}
 maxLength={500}
 value={observacao}
 onChange={(event) => setObservacao(event.target.value)}
 placeholder="Ex.: cliente confirmou instalação para sexta-feira..."
 />
 </FormField>

 <div className="flex flex-col gap-2">
 <Button type="submit" disabled={isPending} className="w-full">
 {isPending ? (
 <Loader2 className="size-4 animate-spin" aria-hidden="true" />
 ) : (
 <Save className="size-4" aria-hidden="true" />
 )}
 {isPending ? "Salvando..." : "Salvar novo status"}
 </Button>

 <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground">
 <ShieldCheck
 className="mt-0.5 size-3 shrink-0 text-emerald-600"
 aria-hidden="true"
 />
 A alteração notifica o indicador e fica registrada na trilha de
 auditoria. Marcar como instalado pode gerar uma recompensa
 automaticamente.
 </p>
 </div>

 {status === "instalado" && currentStatus !== "instalado" ? (
 <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
 <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
 <p className="text-[10px] leading-relaxed">
 Ao confirmar, a data de instalação será registrada e a recompensa
 será criada conforme o valor configurado na campanha.
 </p>
 </div>
 ) : null}
 </form>
 );
}
