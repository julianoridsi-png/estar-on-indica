"use client";

import { useEffect, useRef, useState } from "react";

type Note = {
  id: number;
  x: number; // percent
  y: number; // percent
  size: number;
  speed: number;
  depth: number; // 0..1, for parallax
  rotation: number;
  delay: number;
};

const NOTES: Note[] = [
  { id: 1, x: 8, y: 12, size: 90, speed: 1, depth: 0.3, rotation: -12, delay: 0 },
  { id: 2, x: 85, y: 18, size: 70, speed: 1.4, depth: 0.6, rotation: 8, delay: 0.5 },
  { id: 3, x: 45, y: 8, size: 60, speed: 0.8, depth: 0.9, rotation: -6, delay: 1 },
  { id: 4, x: 72, y: 60, size: 100, speed: 1.2, depth: 0.2, rotation: 15, delay: 0.3 },
  { id: 5, x: 20, y: 70, size: 75, speed: 1.6, depth: 0.5, rotation: -18, delay: 0.8 },
  { id: 6, x: 92, y: 45, size: 55, speed: 0.9, depth: 0.8, rotation: 22, delay: 1.2 },
  { id: 7, x: 5, y: 40, size: 80, speed: 1.1, depth: 0.4, rotation: -8, delay: 0.2 },
  { id: 8, x: 55, y: 85, size: 65, speed: 1.3, depth: 0.7, rotation: 12, delay: 0.6 },
  { id: 9, x: 35, y: 25, size: 50, speed: 0.7, depth: 1, rotation: -20, delay: 1.4 },
  { id: 10, x: 78, y: 80, size: 85, speed: 1.5, depth: 0.35, rotation: 18, delay: 0.4 },
];

export function MoneyNotesAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);

    const mobileMq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mobileMq.matches);
    const mobileHandler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mobileMq.addEventListener("change", mobileHandler);

    return () => {
      mq.removeEventListener("change", handler);
      mobileMq.removeEventListener("change", mobileHandler);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const container = containerRef.current;
    if (!container) return;

    let rafId: number;
    const handleMouse = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5,
      };
    };
    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };

    const animate = () => {
      const noteEls = container.querySelectorAll<HTMLElement>(".money-note");
      noteEls.forEach((el, i) => {
        const note = NOTES[i];
        if (!note) return;
        const depth = note.depth;
        const mx = mouseRef.current.x * depth * 30;
        const my = mouseRef.current.y * depth * 20;
        const sy = scrollRef.current * depth * 0.15;
        el.style.transform = `translate(${mx}px, ${my - sy}px) rotate(${note.rotation + Math.sin(Date.now() / 2000 + i) * 5}deg)`;
      });
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouse, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return null;
  }

  const visibleNotes = isMobile ? NOTES.slice(0, 5) : NOTES;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      style={{ perspective: "1200px" }}
    >
      {visibleNotes.map((note) => (
        <div
          key={note.id}
          className="money-note absolute"
          style={{
            left: `${note.x}%`,
            top: `${note.y}%`,
            width: `${note.size}px`,
            height: `${note.size * 0.45}px`,
            animation: `floatNote ${6 + note.speed * 2}s ease-in-out ${note.delay}s infinite alternate`,
            opacity: 0.85 - note.depth * 0.3,
            filter: note.depth > 0.7 ? "blur(1px)" : "none",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className="flex h-full w-full items-center justify-center rounded-lg border border-yellow-600/30 bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-500 shadow-lg"
            style={{
              boxShadow: `0 ${4 + note.depth * 8}px ${12 + note.depth * 20}px rgba(0,0,0,${0.15 + note.depth * 0.15})`,
            }}
          >
            <span className="text-xs font-bold text-yellow-900 sm:text-sm">R$ 50</span>
          </div>
        </div>
      ))}
      <style jsx>{`
        @keyframes floatNote {
          0% {
            transform: translateY(0px) translateX(0px) rotateZ(0deg);
          }
          25% {
            transform: translateY(-18px) translateX(8px) rotateZ(3deg);
          }
          50% {
            transform: translateY(-8px) translateX(-6px) rotateZ(-2deg);
          }
          75% {
            transform: translateY(-22px) translateX(10px) rotateZ(4deg);
          }
          100% {
            transform: translateY(-12px) translateX(-4px) rotateZ(-1deg);
          }
        }
      `}</style>
    </div>
  );
}
