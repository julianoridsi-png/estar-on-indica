"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleAlert,
  KeyRound,
  Loader2,
  QrCode,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { FormErrorAlert } from "@/features/autenticacao/components/form-error-alert";
import { FormField } from "@/features/autenticacao/components/form-field";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { removePixAction, savePixAction } from "@/features/pagamentos-pix/services/actions";
import {
  PIX_KEY_PLACEHOLDERS,
  PIX_KEY_TYPES,
  PIX_KEY_TYPE_LABELS,
  type PayoutAccount,
  type PixKeyType,
} from "@/features/pagamentos-pix/services/types";
import { formatDateTimeBR } from "@/shared/lib/format";
import {
  formatPixKeyInput,
  pixFormSchema,
  type PixFormValues,
} from "@/features/pagamentos-pix/schemas/pix";

const INPUT_MODE: Record<PixKeyType, "text" | "email" | "tel" | "numeric"> = {
  cpf: "numeric",
  cnpj: "numeric",
  email: "email",
  telefone: "tel",
  aleatoria: "text",
};

const TYPE_HINT: Record<PixKeyType, string> = {
  cpf: "Informe o CPF do titular da conta.",
  cnpj: "Informe o CNPJ do titular da conta.",
  email: "Use o e-mail cadastrado como chave PIX.",
  telefone: "Informe DDD + número. O +55 é adicionado automaticamente.",
  aleatoria: "Cole a chave aleatória gerada pelo seu banco.",
};

export function PixForm({
  account,
  nomeTitular,
}: {
  account: PayoutAccount | null;
  nomeTitular: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PixFormValues>({
    resolver: zodResolver(pixFormSchema),
    defaultValues: {
      tipo: account?.tipo ?? "cpf",
      chave: "",
    },
  });

  const tipo = watch("tipo");

  const onSubmit = (values: PixFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await savePixAction(values);

      if (result.status === "error") {
        setServerError(result.message);
        toast.error("Não foi possível salvar a chave", {
          description: result.message,
        });
        return;
      }

      toast.success("Chave PIX salva", { description: result.message });
      reset({ tipo: values.tipo, chave: "" });
      router.refresh();
    });
  };

  const onRemove = async () => {
    setIsRemoving(true);
    const result = await removePixAction();
    setIsRemoving(false);

    if (result.status === "error") {
      toast.error("Não foi possível remover a chave", {
        description: result.message,
      });
      return;
    }

    setConfirmOpen(false);
    toast.success("Chave PIX removida");
    reset({ tipo: "cpf", chave: "" });
    router.refresh();
  };

  return (
    <div className="space-y-5">
      {account ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-brand-700 shadow-sm ring-1 ring-brand-200">
                <QrCode className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] font-bold tracking-[0.14em] text-brand-800 uppercase">
                  Chave cadastrada
                </p>
                <p className="mt-1 font-heading text-lg font-bold text-ink">
                  {account.chave_mascarada}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {PIX_KEY_TYPE_LABELS[account.tipo]} • Titular: {nomeTitular}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              className="border-red-200 bg-card text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Remover
            </Button>
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-brand-900/70">
            <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
            Atualizada em {formatDateTimeBR(account.updated_at)}. A chave
            completa fica criptografada no banco.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <CircleAlert
            className="mt-0.5 size-4 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs font-bold">
              Você ainda não cadastrou uma chave PIX
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-900/80">
              Cadastre agora para receber suas recompensas quando forem
              liberadas. O pagamento só é registrado depois que a equipe
              confirmar a chave.
            </p>
          </div>
        </div>
      )}

      <FormErrorAlert message={serverError} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-[190px_1fr]">
          <FormField
            label="Tipo de chave"
            htmlFor="pix-tipo"
            required
            error={errors.tipo?.message}
          >
            <Select
              value={tipo}
              onValueChange={(value) => {
                setValue("tipo", value as PixKeyType, {
                  shouldValidate: true,
                });
                setValue("chave", "");
              }}
            >
              <SelectTrigger id="pix-tipo" className="h-11 w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {PIX_KEY_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {PIX_KEY_TYPE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Chave PIX"
            htmlFor="pix-chave"
            required
            error={errors.chave?.message}
            hint={TYPE_HINT[tipo]}
          >
            <div className="relative">
              <KeyRound
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Controller
                control={control}
                name="chave"
                render={({ field }) => (
                  <Input
                    id="pix-chave"
                    type={tipo === "email" ? "email" : "text"}
                    inputMode={INPUT_MODE[tipo]}
                    autoComplete="off"
                    placeholder={PIX_KEY_PLACEHOLDERS[tipo]}
                    aria-invalid={Boolean(errors.chave)}
                    className="pl-9"
                    {...field}
                    onChange={(event) =>
                      field.onChange(
                        formatPixKeyInput(tipo, event.target.value),
                      )
                    }
                  />
                )}
              />
            </div>
          </FormField>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-lg text-[10px] leading-relaxed text-muted-foreground">
            A chave PIX é usada exclusivamente para pagamento das recompensas.
            Administradores podem consultá-la com registro de auditoria.
          </p>
          <Button type="submit" disabled={isPending} className="shrink-0">
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <QrCode className="size-4" aria-hidden="true" />
            )}
            {account ? "Atualizar chave" : "Salvar chave PIX"}
          </Button>
        </div>
      </form>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover chave PIX?</DialogTitle>
            <DialogDescription>
              Você não receberá novas recompensas até cadastrar outra chave. O
              histórico de pagamentos já realizados permanece.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isRemoving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onRemove}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              Remover chave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
