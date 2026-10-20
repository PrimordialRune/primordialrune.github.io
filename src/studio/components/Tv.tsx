"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import gsap from "gsap";
import { staticBurst } from "./transitions";
import { isSoft } from "@/studio/lib/motion";

export interface TvHandle {
  glass: HTMLDivElement | null;
  frame: HTMLDivElement | null;
}

// The remembered TV: thin dark-teal bezel, peacock glass, warm bloom (light, not fill).
// A supporting stage (P7): no glow on the frame. Clean at rest; static only on a channel change.
const Tv = forwardRef<TvHandle, {
  channel: string;
  tint?: string;
  announce: string;
  children: React.ReactNode;
  narrator?: React.ReactNode;
}>(function Tv({ channel, tint, announce, children, narrator }, ref) {
  const glass = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const prev = useRef(channel);
  const lastBurst = useRef(0);
  const settle = useRef<number | undefined>(undefined);
  useImperativeHandle(ref, () => ({ glass: glass.current, frame: frame.current }), []);

  // Channel change: FULL = <=300ms static burst; SOFT = a 120ms crossfade.
  // Flash safety (WCAG 2.3.1): no static coming out of the power-on (it has its own
  // animation), at most one burst per 400ms, and a quick sweep across the shelf only
  // bursts once it settles for 120ms; changes in between get the soft crossfade.
  useEffect(() => {
    const from = prev.current;
    prev.current = channel;
    if (first.current) {
      first.current = false;
      return;
    }
    const g = glass.current;
    const scr = screen.current;
    if (!g || !scr) return;
    const fade = () => gsap.fromTo(scr, { opacity: 0.15 }, { opacity: 1, duration: 0.12, ease: "none" });
    if (isSoft() || from === "boot" || from === "standby" || from === "power") {
      if (from !== "boot" && from !== "standby") fade();
      return;
    }
    window.clearTimeout(settle.current);
    if (performance.now() - lastBurst.current < 400) {
      fade();
      return;
    }
    settle.current = window.setTimeout(() => {
      lastBurst.current = performance.now();
      staticBurst(g, false);
    }, 120);
    return () => window.clearTimeout(settle.current);
  }, [channel]);

  // The glass reflects the pointer (FULL only; SOFT has no pointer specular)
  const onMove = (e: React.PointerEvent) => {
    const g = glass.current;
    if (!g || isSoft() || e.pointerType !== "mouse") return;
    const r = g.getBoundingClientRect();
    g.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    g.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div className="tv" ref={frame} onPointerMove={onMove}>
      <div className="tv-bezel">
        <div ref={glass} className="tv-glass" style={{ "--tint": tint ?? "transparent" } as React.CSSProperties}>
          <div ref={screen} className="tv-screen">
            {children}
          </div>
          <div className="tv-bloom" aria-hidden />
          <div className="tv-sheen" aria-hidden />
        </div>
      </div>
      {narrator}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
});

export default Tv;
