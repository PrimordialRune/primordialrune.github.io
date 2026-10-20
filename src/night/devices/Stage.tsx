"use client";

// The ceremony layer every device renders into: fills the shell's fixed overlay, measures
// it, and announces what is happening (aria-live) with how to skip it.
import { forwardRef, useLayoutEffect, useState, type ReactNode, type RefObject } from "react";
import s from "./devices.module.css";

export interface StageSize {
  w: number;
  h: number;
  dpr: number;
}

export function useStageSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<StageSize | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      const next = { w: Math.round(r.width), h: Math.round(r.height), dpr: window.devicePixelRatio || 1 };
      setSize((p) => (p && p.w === next.w && p.h === next.h && p.dpr === next.dpr ? p : next));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/**
 * Integer scale for a pixel screen (P1): k device pixels per screen pixel, so the screen
 * is never scaled 2.5x. `u` is the CSS size of one screen pixel.
 */
export function pixelUnit(nativeW: number, nativeH: number, size: StageSize, fitW = 0.8, fitH = 0.5) {
  const css = Math.min((size.w * fitW) / nativeW, (size.h * fitH) / nativeH);
  const k = Math.max(1, Math.floor(css * size.dpr));
  return { k, u: k / size.dpr };
}

/** Snap a CSS length to whole device pixels */
export const snap = (v: number, dpr: number) => Math.round(v * dpr) / dpr;

export const Stage = forwardRef<HTMLDivElement, { label: string; children: ReactNode; className?: string }>(function Stage({ label, children, className }, ref) {
  return (
    <div ref={ref} className={`${s.stage} ${className ?? ""}`}>
      <p className={s.live} role="status" aria-live="polite">
        {label}
      </p>
      <div className={s.layer} aria-hidden="true">
        {children}
      </div>
    </div>
  );
});
