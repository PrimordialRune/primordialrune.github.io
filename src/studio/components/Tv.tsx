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
  useImperativeHandle(ref, () => ({ glass: glass.current, frame: frame.current }), []);

  // Channel change: FULL = <=300ms static burst; SOFT = a 120ms crossfade
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const g = glass.current;
    if (!g || !screen.current) return;
    if (isSoft()) gsap.fromTo(screen.current, { opacity: 0.15 }, { opacity: 1, duration: 0.12, ease: "none" });
    else staticBurst(g, false);
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
