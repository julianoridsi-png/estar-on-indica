"use client";

import { useEffect, useState } from "react";
import { Gift, Sparkles } from "lucide-react";
import { listarBeneficiosPublicados } from "@/features/beneficios/services/beneficios";
import type { Beneficio } from "@/features/beneficios/types";

export function BenefitsGrid() {
  const [items, setItems] = useState<Beneficio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listarBeneficiosPublicados().then((data) => {
      if (active) { setItems(data); setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((b) => (
        <article key={b.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
          {b.imagem_url ? (
            <div className="aspect-[16/9] overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.imagem_url} alt={b.titulo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center bg-brand-50">
              <Gift className="size-10 text-brand-600" aria-hidden="true" />
            </div>
          )}
          <div className="p-5">
            <h3 className="font-heading text-base font-bold text-ink">{b.titulo}</h3>
            {b.descricao ? <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{b.descricao}</p> : null}
            {b.condicoes ? (
              <p className="mt-2 text-[10px] text-muted-foreground">
                <strong>Condições:</strong> {b.condicoes}
              </p>
            ) : null}
            {b.data_fim ? (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Válido até {new Date(b.data_fim).toLocaleDateString("pt-BR")}
              </p>
            ) : null}
            {b.link_url ? (
              <a
                href={b.link_url}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-ink transition-all hover:-translate-y-0.5 hover:bg-brand-400"
              >
                {b.botao_texto || "Saiba mais"}
                <Sparkles className="size-3.5" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
