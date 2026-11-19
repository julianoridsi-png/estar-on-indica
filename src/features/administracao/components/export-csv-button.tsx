"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { createClient } from "@/services/supabase/client";

export function ExportCsvButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("admin_listar_recompensas");
      if (error) throw error;

      const rewards = (data ?? []) as Array<Record<string, unknown>>;
      const headers = [
        "Indicado",
        "Indicador",
        "E-mail",
        "Valor (R$)",
        "Status",
        "PIX",
        "Registrada em",
        "Liberada em",
        "Paga em",
      ];
      const rows = rewards.map((r) => [
        r.indicado_nome,
        r.indicator_nome,
        r.indicator_email,
        (Number(r.valor_centavos ?? 0) / 100).toFixed(2).replace(".", ","),
        r.status,
        r.pix_mascarada ?? "",
        r.created_at,
        r.liberado_em ?? "",
        r.pago_em ?? "",
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))
        .join("\n");

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recompensas-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação CSV concluída");
    } catch (e) {
      toast.error("Não foi possível exportar", {
        description: e instanceof Error ? e.message : "Erro desconhecido.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" onClick={handleExport} disabled={loading} className="gap-1.5">
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <span className="text-xs font-bold">CSV</span>
      )}
      Exportar CSV
    </Button>
  );
}
