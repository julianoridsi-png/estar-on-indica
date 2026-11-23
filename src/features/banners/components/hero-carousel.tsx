"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/features/banners/types";

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const count = banners.length;

  const go = useCallback((i: number) => {
    if (count === 0) return;
    setIndex(((i % count) + count) % count);
  }, [count]);

  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  // Auto-play
  useEffect(() => {
    if (count <= 1 || paused) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(id);
  }, [count, paused]);

  // Swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) next(); else prev();
    }
    touchStart.current = null;
  };

  if (count === 0) return null;

  const current = banners[index];

  return (
    <section
      aria-label="Banners da Estar On"
      className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-lift"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative aspect-[16/7] w-full sm:aspect-[16/6]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.imagem_url}
          alt={current.titulo}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <h2 className="font-heading text-xl font-bold text-white sm:text-3xl drop-shadow">
            {current.titulo}
          </h2>
          {current.descricao ? (
            <p className="mt-1.5 max-w-xl text-sm text-white/90 sm:text-base">
              {current.descricao}
            </p>
          ) : null}
          {current.link_url ? (
            <a
              href={current.link_url}
              target={current.link_url.startsWith("http") ? "_blank" : undefined}
              rel={current.link_url.startsWith("http") ? "noopener noreferrer" : undefined}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-ink shadow-glow transition-all hover:-translate-y-0.5 hover:bg-brand-400"
            >
              {current.botao_texto || "Saiba mais"}
              <ChevronRight className="size-4" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-ink shadow-soft backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Próximo banner"
            className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-ink shadow-soft backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ir para banner ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-brand-500" : "w-1.5 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
