"use client";

import { useState, useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { exportRewardsExcelAction } from "@/features/administracao/services/actions";

export function ExportExcelButton() {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      const result = await exportRewardsExcelAction();
      if (result.status === "error") {
        toast.error("Não foi possível exportar", { description: result.message });
        return;
      }
      const binary = atob(result.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação concluída", { description: result.filename });
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleExport}
      disabled={isPending}
      className="gap-1.5"
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="size-4" aria-hidden="true" />
      )}
      Exportar Excel
    </Button>
  );
}
