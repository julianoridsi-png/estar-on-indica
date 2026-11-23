"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/services/supabase/client";

export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase.rpc("get_minhas_notificacoes", { p_limit: 50 });
        if (!active) return;
        const unread = ((data ?? []) as { lida: boolean }[]).filter((n) => !n.lida).length;
        setCount(unread);
      } catch {
        // ignore
      }
    }
    void load();
    const id = setInterval(load, 60000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return (
    <Link
      href="/notificacoes"
      aria-label={`Notificações${count > 0 ? ` (${count} não lidas)` : ""}`}
      className="relative grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
    >
      <Bell className="size-4" aria-hidden="true" />
      {count > 0 ? (
        <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-brand-500 text-[9px] font-bold text-ink ring-2 ring-background">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
