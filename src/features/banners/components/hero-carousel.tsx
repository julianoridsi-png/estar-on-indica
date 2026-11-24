"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/features/banners/types";

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef<number | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const count = banners.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const go = useCallback(
    (i: number) => {
      if (count === 0) return;
      setIndex(((i % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  // Auto-play (respect reduced-motion)
  useEffect(() => {
    if (count <= 1 || paused || reducedMotion) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(id);
  }, [count, paused, reducedMotion]);

  // Keyboard navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [next, prev]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) > 40) {
      if (diff < 0) next();
      else prev();
    }
    touchStart.current = null;
  };

  if (count === 0) return null;

  const current = banners[index];

  return (
    <section
      ref={containerRef}
      aria-label="Banners da Estar On"
      aria-roledescription="carrossel"
      tabIndex={0}
      className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-lift outline-none focus-visible:ring-4 focus-visible:ring-ring/40 animate-rise"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative aspect-[16/7] w-full sm:aspect-[16/6] lg:aspect-[16/5]">
        {banners.map((b, i) => (
          <img
            key={b.id}
            src={b.imagem_url}
            alt={i === index ? b.titulo : ""}
            aria-hidden={i !== index}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 flex justify-center p-5 sm:p-8">
          {current.link_url ? (
            <a
              href={current.link_url}
              target={current.link_url.startsWith("http") ? "_blank" : undefined}
              rel={current.link_url.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-ink shadow-glow transition-all hover:-translate-y-0.5 hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
            >
              {current.botao_texto || "Quero participar"}
              <ChevronRight className="size-4" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Slide {index + 1} de {count}
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-soft backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Próximo banner"
            className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-soft backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ir para banner ${i + 1} de ${count}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-8 bg-brand-500" : "w-1.5 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
