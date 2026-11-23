"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { createClient } from "@/services/supabase/client";

type Notificacao = {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  link: string | null;
  created_at: string;
};

export function NotificationsCenter() {
  const [items, setItems] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_minhas_notificacoes", { p_limit: 50 });
      if (error) {
        toast.error("Não foi possível carregar as notificações", { description: error.message });
        setItems([]);
        return;
      }
      setItems((data ?? []) as Notificacao[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleMarkRead = async (id: number) => {
    setMarking(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("marcar_notificacao_lida", { p_id: id });
      if (error) { toast.error("Erro ao marcar como lida", { description: error.message }); return; }
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    } finally {
      setMarking(null);
    }
  };

  const handleMarkAll = async () => {
    const unread = items.filter((n) => !n.lida);
    if (unread.length === 0) return;
    for (const n of unread) {
      await handleMarkRead(n.id);
    }
    toast.success("Todas marcadas como lidas.");
  };

  const unreadCount = items.filter((n) => !n.lida).length;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          {items.length} notificação(ões) · {unreadCount} não lida(s).
        </p>
        {unreadCount > 0 ? (
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleMarkAll}>
            <Check className="size-3.5" aria-hidden="true" />
            Marcar todas como lidas
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-soft">
          <Bell className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-ink">Nenhuma notificação</p>
          <p className="mt-1 text-xs text-muted-foreground">Você será notificado sobre atualizações de indicações e recompensas.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-2xl border p-4 shadow-soft transition-colors ${
                n.lida ? "border-border bg-card" : "border-brand-200 bg-brand-50/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!n.lida ? <span className="size-2 shrink-0 rounded-full bg-brand-500" aria-hidden="true" /> : null}
                    <p className="text-sm font-semibold text-ink">{n.titulo}</p>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold text-muted-foreground ring-1 ring-inset ring-border">
                      {n.tipo}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{n.mensagem}</p>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {n.link ? (
                    <a
                      href={n.link}
                      className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
                      aria-label="Abrir link"
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  ) : null}
                  {!n.lida ? (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.id)}
                      disabled={marking === n.id}
                      className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-ink disabled:opacity-50"
                      aria-label="Marcar como lida"
                    >
                      {marking === n.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
