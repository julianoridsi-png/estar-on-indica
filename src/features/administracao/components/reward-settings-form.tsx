"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
 CalendarClock,
 Coins,
 Loader2,
 RefreshCw,
 Save,
 Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/shared/ui/dialog";
import { FormField } from "@/features/autenticacao/components/form-field";
import {
 generatePendingRewardsAction,
 updateRewardSettingsAction,
} from "@/features/administracao/services/actions";
import { formatCurrencyBRL } from "@/shared/lib/format";

function parseCurrencyToCents(input: string): number | null {
 const cleaned = input
 .replace(/R\$/gi, "")
 .replace(/\s/g, "")
 .trim();

 if (!cleaned) return null;

 let normalized = cleaned;

 if (cleaned.includes(",")) {
 normalized = cleaned.replace(/\./g, "").replace(",", ".");
 } else if (cleaned.includes(".")) {
 const parts = cleaned.split(".");
 const last = parts[parts.length - 1];
 if (parts.length > 2 || last.length === 3) {
 normalized = cleaned.replace(/\./g, "");
 }
 }

 const value = Number(normalized);
 if (!Number.isFinite(value) || value < 0) return null;

 return Math.round(value * 100);
}

export function RewardSettingsForm({
 valorCentavos,
 prazoDias,
 dataInicio,
 dataFim,
}: {
 valorCentavos: number;
 prazoDias: number;
 dataInicio?: string | null;
 dataFim?: string | null;
}) {
 const router = useRouter();
 const [valor, setValor] = useState(
 valorCentavos > 0
 ? (valorCentavos / 100).toFixed(2).replace(".", ",")
 : "",
 );
 const [prazo, setPrazo] = useState(String(prazoDias));
 const [dataIni, setDataIni] = useState(dataInicio ?? "");
 const [dataFimState, setDataFimState] = useState(dataFim ?? "");
 const [serverError, setServerError] = useState<string | null>(null);
 const [isPending, startTransition] = useTransition();

 const parsedCentavos = parseCurrencyToCents(valor);

 const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 setServerError(null);

 if (parsedCentavos === null) {
 setServerError("Informe um valor válido em reais.");
 return;
 }

 const prazoNumber = Number(prazo);

 if (
 !Number.isInteger(prazoNumber) ||
 prazoNumber < 0 ||
 prazoNumber > 365
 ) {
 setServerError("Informe um prazo entre 0 e 365 dias.");
 return;
 }

 startTransition(async () => {
 const result = await updateRewardSettingsAction({
 valorCentavos: parsedCentavos,
 prazoDias: prazoNumber,
 dataInicio: dataIni || null,
 dataFim: dataFimState || null,
 });

 if (result.status === "error") {
 setServerError(result.message);
 toast.error("Não foi possível salvar", {
 description: result.message,
 });
 return;
 }

 toast.success("Configuração atualizada", {
 description: result.message,
 });
 router.refresh();
 });
 };

 return (
 <form onSubmit={onSubmit} className="space-y-4">
 <div className="grid gap-4 sm:grid-cols-2">
 <FormField
 label="Valor padrão da recompensa"
 htmlFor="recompensa-valor"
 required
 error={serverError ?? undefined}
 hint="Valor pago por indicação instalada. Use 0 para desativar a geração automática."
 >
 <div className="relative">
 <Coins
 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
 aria-hidden="true"
 />
 <Input
 id="recompensa-valor"
 inputMode="decimal"
 value={valor}
 onChange={(event) => setValor(event.target.value)}
 placeholder="Ex.: 50,00"
 className="pl-9"
 />
 </div>
 </FormField>

 <FormField
 label="Prazo de pagamento (dias)"
 htmlFor="recompensa-prazo"
 required
 hint="Prazo informado ao indicador na área de recebimentos."
 >
 <div className="relative">
 <CalendarClock
 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
 aria-hidden="true"
 />
 <Input
 id="recompensa-prazo"
 inputMode="numeric"
 value={prazo}
 onChange={(event) => setPrazo(event.target.value)}
 placeholder="30"
 className="pl-9"
 />
 </div>
 </FormField>
 </div>

 <div className="grid gap-4 sm:grid-cols-2">
 <FormField label="Data de início da campanha" htmlFor="recompensa-inicio" hint="Opcional.">
 <Input
 id="recompensa-inicio"
 type="date"
 value={dataIni}
 onChange={(e) => setDataIni(e.target.value)}
 />
 </FormField>
 <FormField label="Data de encerramento" htmlFor="recompensa-fim" hint="Opcional.">
 <Input
 id="recompensa-fim"
 type="date"
 value={dataFimState}
 onChange={(e) => setDataFimState(e.target.value)}
 />
 </FormField>
 </div>

 <div className="flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <p className="text-[10px] font-bold tracking-[0.1em] text-brand-800 uppercase">
 Prévia da campanha
 </p>
 <p className="mt-0.5 font-heading text-lg font-bold text-ink">
 {parsedCentavos === null
 ? "Valor inválido"
 : parsedCentavos > 0
 ? `${formatCurrencyBRL(parsedCentavos / 100)} por instalação`
 : "Geração automática desativada"}
 </p>
 <p className="text-[10px] text-muted-foreground">
 Pagamento em até {prazo || "0"} dias após a liberação.
 </p>
 </div>

 <Button type="submit" disabled={isPending} className="shrink-0">
 {isPending ? (
 <Loader2 className="size-4 animate-spin" aria-hidden="true" />
 ) : (
 <Save className="size-4" aria-hidden="true" />
 )}
 Salvar configuração
 </Button>
 </div>
 </form>
 );
}

export function GenerateRewardsButton() {
 const router = useRouter();
 const [open, setOpen] = useState(false);
 const [isPending, startTransition] = useTransition();

 const handleGenerate = () => {
 startTransition(async () => {
 const result = await generatePendingRewardsAction();

 if (result.status === "error") {
 toast.error("Não foi possível gerar recompensas", {
 description: result.message,
 });
 return;
 }

 toast.success("Processamento concluído", {
 description: result.message,
 });
 setOpen(false);
 router.refresh();
 });
 };

 return (
 <>
 <Button
 type="button"
 variant="outline"
 onClick={() => setOpen(true)}
 className="gap-1.5"
 >
 <Sparkles className="size-4" aria-hidden="true" />
 Gerar pendentes
 </Button>

 <Dialog open={open} onOpenChange={setOpen}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Gerar recompensas pendentes?</DialogTitle>
 <DialogDescription>
 O sistema vai procurar indicações já instaladas que ainda não têm
 recompensa ativa e criar um registro pendente com o valor padrão
 configurado.
 </DialogDescription>
 </DialogHeader>

 <div className="flex items-start gap-2 rounded-xl border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-foreground">
 <RefreshCw
 className="mt-0.5 size-3.5 shrink-0"
 aria-hidden="true"
 />
 Indicações que já possuem recompensa ativa não serão duplicadas.
 </div>

 <DialogFooter>
 <Button
 type="button"
 variant="outline"
 onClick={() => setOpen(false)}
 disabled={isPending}
 >
 Cancelar
 </Button>
 <Button
 type="button"
 onClick={handleGenerate}
 disabled={isPending}
 className="gap-1.5"
 >
 {isPending ? (
 <Loader2 className="size-4 animate-spin" aria-hidden="true" />
 ) : (
 <Sparkles className="size-4" aria-hidden="true" />
 )}
 Gerar recompensas
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </>
 );
}
