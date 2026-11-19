"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type NoteConfig = {
  id: number;
  x: number;
  y: number;
  size: number;
  depth: number;
  rotation: number;
  delay: number;
};

// Posições seguras: evitam a coluna de texto do hero e o painel de preview.
// Todas as notas ficam sobre áreas de fundo/vazias, nunca sobre o conteúdo.
const NOTES: NoteConfig[] = [
  { id: 1, x: 5, y: 84, size: 160, depth: 0.45, rotation: 8, delay: 0 },
  { id: 2, x: 38, y: 92, size: 105, depth: 0.85, rotation: -10, delay: 0.4 },
  { id: 3, x: 74, y: 90, size: 170, depth: 0.25, rotation: -14, delay: 0.8 },
  { id: 4, x: 88, y: 76, size: 90, depth: 0.6, rotation: 16, delay: 0.2 },
  { id: 5, x: 14, y: 97, size: 125, depth: 0.7, rotation: -6, delay: 1.0 },
];

// Mobile / tablet: menos notas e sempre em zonas seguras (fundo inferior).
const MOBILE_NOTES: NoteConfig[] = [
  { id: 1, x: 10, y: 86, size: 110, depth: 0.5, rotation: 8, delay: 0 },
  { id: 2, x: 68, y: 90, size: 90, depth: 0.8, rotation: -12, delay: 0.5 },
  { id: 3, x: 42, y: 94, size: 70, depth: 0.95, rotation: -8, delay: 1.0 },
];

export function MoneyNotesAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const noteRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });
  const scrollProgressRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const applyMobile = () => setIsMobile(mobileQuery.matches);
    applyMobile();
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mobileQuery.addEventListener("change", listener);
    return () => mobileQuery.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const visibleNotes = isMobile ? MOBILE_NOTES : NOTES;

    // Set up mouse tracking
    const handleMouse = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5,
      };
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });

    // Smooth interpolation loop (mouse + vento + parallax de scroll)
    let rafId: number;
    const animate = () => {
      const smooth = smoothRef.current;
      smooth.x += (mouseRef.current.x - smooth.x) * 0.06;
      smooth.y += (mouseRef.current.y - smooth.y) * 0.06;

      const scrollOffset = scrollProgressRef.current * 60;

      visibleNotes.forEach((note, i) => {
        const el = noteRefs.current[i];
        if (!el) return;
        const depth = note.depth;
        const mx = smooth.x * depth * 50;
        const my = smooth.y * depth * 35;
        const t = performance.now() / 1000;
        const fx = Math.sin(t * 0.6 + i * 1.3) * 8;
        const fy = Math.cos(t * 0.45 + i * 0.9) * 12;
        const rot = note.rotation + Math.sin(t * 0.35 + i) * 5;
        const rx = Math.sin(t * 0.25 + i * 0.7) * 10;
        const ry = Math.cos(t * 0.3 + i * 1.1) * 15;
        el.style.transform = `translate3d(${mx - scrollOffset + fx}px, ${my - scrollOffset + fy}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rot}deg)`;
      });
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    // ScrollTrigger parallax (continuidade entre seções)
    const scrollTrigger = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: "bottom top",
      scrub: 1,
      onUpdate: (self) => {
        scrollProgressRef.current = self.progress;
      },
    });

    return () => {
      window.removeEventListener("mousemove", handleMouse);
      cancelAnimationFrame(rafId);
      scrollTrigger.kill();
    };
  }, [isMobile]);

  // Intersection Observer para pausar animação fora da área visível
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            container.style.visibility = "visible";
          } else {
            container.style.visibility = "hidden";
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const notes = isMobile ? MOBILE_NOTES : NOTES;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
    >
      {notes.map((note, i) => (
        <div
          key={note.id}
          ref={(el) => { noteRefs.current[i] = el; }}
          className="money-note absolute"
          style={{
            left: `${note.x}%`,
            top: `${note.y}%`,
            width: `${note.size}px`,
            opacity: 0.92 - note.depth * 0.25,
            filter: note.depth > 0.7 ? "blur(0.4px)" : "none",
            transformStyle: "preserve-3d",
            willChange: "transform",
            transition: "opacity 0.3s ease",
          }}
        >
          <img
            src="/branding/nota-50.png"
            alt=""
            draggable={false}
            className="h-auto w-full select-none"
            style={{
              filter: `drop-shadow(0 ${6 + note.depth * 10}px ${16 + note.depth * 24}px rgba(0,0,0,${0.25 + note.depth * 0.15}))`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
