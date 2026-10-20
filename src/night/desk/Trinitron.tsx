"use client";

// The Trinitron: the room's only light and the narrator's home. Frame and glass only; the
// screen content (NarratorScreen) is passed in. Glass reflects the pointer (P3), static in
// QUIET. When the AI leaves (stage 3) or the set is switched off, the glass goes dark.
import { useEffect, useRef, type ReactNode } from "react";
import { isQuiet } from "@/lib/motion";
import s from "./Trinitron.module.css";

interface Props {
  screen: ReactNode;
  powered: boolean;
  /** the AI is still inside (stage < 3) */
  inCrt: boolean;
}

export default function Trinitron({ screen, powered, inCrt }: Props) {
  const glassRef = useRef<HTMLDivElement>(null);

  // pointer glint: fine pointers only, one rAF per move, nothing at rest
  useEffect(() => {
    const glass = glassRef.current;
    if (!glass || !window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf || isQuiet()) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = glass.getBoundingClientRect();
        const x = Math.min(1.4, Math.max(-0.4, (e.clientX - r.left) / r.width));
        const y = Math.min(1.4, Math.max(-0.4, (e.clientY - r.top) / r.height));
        glass.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
        glass.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const lit = powered && inCrt;
  return (
    <div className={s.set} data-lit={lit ? "" : undefined} data-powered={powered ? "" : undefined}>
      <div className={s.bezel}>
        <div className={s.glass} ref={glassRef}>
          <div className={s.screen} aria-hidden={powered ? undefined : true} style={{ visibility: powered ? undefined : "hidden" }}>
            {screen}
          </div>
          <div className={s.dark} aria-hidden="true" />
          <div className={s.glint} aria-hidden="true" />
        </div>
      </div>
      <div className={s.chin} aria-hidden="true">
        <span className={s.grille} />
        <span className={s.led} />
      </div>
    </div>
  );
}
