"use client";

import { useEffect, useRef } from "react";
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

const NOTES: NoteConfig[] = [
  { id: 1, x: 8, y: 10, size: 150, depth: 0.2, rotation: -12, delay: 0 },
  { id: 2, x: 88, y: 15, size: 110, depth: 0.5, rotation: 8, delay: 0.4 },
  { id: 3, x: 48, y: 5, size: 90, depth: 0.85, rotation: -6, delay: 0.8 },
  { id: 4, x: 75, y: 55, size: 170, depth: 0.15, rotation: 15, delay: 0.2 },
  { id: 5, x: 16, y: 65, size: 125, depth: 0.45, rotation: -18, delay: 0.6 },
  { id: 6, x: 94, y: 40, size: 85, depth: 0.75, rotation: 22, delay: 1.0 },
  { id: 7, x: 3, y: 35, size: 140, depth: 0.3, rotation: -8, delay: 0.1 },
  { id: 8, x: 58, y: 80, size: 110, depth: 0.6, rotation: 12, delay: 0.5 },
  { id: 9, x: 32, y: 20, size: 75, depth: 1.0, rotation: -20, delay: 1.2 },
  { id: 10, x: 80, y: 75, size: 145, depth: 0.25, rotation: 18, delay: 0.3 },
];

export function MoneyNotesAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const noteRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const visibleNotes = isMobile ? NOTES.slice(0, 4) : NOTES;

    // Set up mouse tracking
    const handleMouse = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5,
      };
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });

    // Smooth interpolation loop
    let rafId: number;
    const animate = () => {
      const smooth = smoothRef.current;
      smooth.x += (mouseRef.current.x - smooth.x) * 0.06;
      smooth.y += (mouseRef.current.y - smooth.y) * 0.06;

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
        el.style.transform = `translate3d(${mx + fx}px, ${my + fy}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rot}deg)`;
      });
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    // ScrollTrigger parallax
    const scrollTrigger = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: "bottom top",
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        visibleNotes.forEach((note, i) => {
          const el = noteRefs.current[i];
          if (!el) return;
          const depth = note.depth;
          const sy = progress * depth * 80;
          // Apply scroll offset (combined with mouse in animate loop via ref)
          el.dataset.scrollY = String(sy);
        });
      },
    });

    // Combine scroll into animate loop
    const origAnimate = animate;
    // We'll just let scrollRef track it
    const handleScroll = () => {
      // scroll progress handled by scrollTrigger
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
      scrollTrigger.kill();
    };
  }, []);

  // Intersection Observer to pause
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
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

  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
  const visibleNotes = isMobile ? NOTES.slice(0, 4) : NOTES;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
    >
      {visibleNotes.map((note, i) => (
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
            src="/branding/nota-50.svg"
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
