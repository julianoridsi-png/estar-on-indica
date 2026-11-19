"use client";

import { useEffect, useRef, useState } from "react";

type Note = {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  depth: number;
  rotation: number;
  delay: number;
};

const NOTES: Note[] = [
  { id: 1, x: 8, y: 12, size: 140, speed: 1, depth: 0.3, rotation: -12, delay: 0 },
  { id: 2, x: 85, y: 18, size: 110, speed: 1.4, depth: 0.6, rotation: 8, delay: 0.5 },
  { id: 3, x: 45, y: 8, size: 95, speed: 0.8, depth: 0.9, rotation: -6, delay: 1 },
  { id: 4, x: 72, y: 58, size: 160, speed: 1.2, depth: 0.2, rotation: 15, delay: 0.3 },
  { id: 5, x: 18, y: 68, size: 120, speed: 1.6, depth: 0.5, rotation: -18, delay: 0.8 },
  { id: 6, x: 92, y: 42, size: 90, speed: 0.9, depth: 0.8, rotation: 22, delay: 1.2 },
  { id: 7, x: 4, y: 38, size: 130, speed: 1.1, depth: 0.4, rotation: -8, delay: 0.2 },
  { id: 8, x: 55, y: 82, size: 105, speed: 1.3, depth: 0.7, rotation: 12, delay: 0.6 },
  { id: 9, x: 35, y: 22, size: 80, speed: 0.7, depth: 1, rotation: -20, delay: 1.4 },
  { id: 10, x: 78, y: 78, size: 135, speed: 1.5, depth: 0.35, rotation: 18, delay: 0.4 },
];

export function MoneyNotesAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const rafRef = useRef<number>(0);

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

    let running = true;
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

    const smooth = { x: 0, y: 0 };
    const animate = () => {
      if (!running) return;
      const rect = container.getBoundingClientRect();
      const cx = mouseRef.current.x;
      const cy = mouseRef.current.y;
      // smooth interpolation
      smooth.x += (cx - smooth.x) * 0.08;
      smooth.y += (cy - smooth.y) * 0.08;

      const noteEls = container.querySelectorAll<HTMLElement>(".money-note");
      noteEls.forEach((el, i) => {
        const note = NOTES[i];
        if (!note) return;
        const depth = note.depth;
        const mx = smooth.x * depth * 40;
        const my = smooth.y * depth * 30;
        const sy = scrollRef.current * depth * 0.12;
        const t = Date.now() / 1000;
        const fx = Math.sin(t * 0.7 + i * 1.3) * 6;
        const fy = Math.cos(t * 0.5 + i * 0.9) * 10;
        const rot = note.rotation + Math.sin(t * 0.4 + i) * 4;
        const rx = Math.sin(t * 0.3 + i * 0.7) * 8;
        const ry = Math.cos(t * 0.4 + i * 1.1) * 12;
        el.style.transform = `translate3d(${mx + fx}px, ${my + fy - sy}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rot}deg)`;
      });
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouse, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  const visibleNotes = isMobile ? NOTES.slice(0, 4) : NOTES;

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
            opacity: 0.9 - note.depth * 0.2,
            filter: note.depth > 0.7 ? "blur(0.5px)" : "none",
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          <img
            src="/branding/nota-50.svg"
            alt=""
            draggable={false}
            className="h-auto w-full select-none"
            style={{
              filter: `drop-shadow(0 ${4 + note.depth * 8}px ${12 + note.depth * 20}px rgba(0,0,0,${0.2 + note.depth * 0.15}))`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
