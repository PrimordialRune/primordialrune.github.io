"use client";

// The ceremony layer every device renders into: fills the shell's fixed overlay, measures
// it, and announces what is happening (aria-live) with how to skip it.
import { forwardRef, useCallback, useLayoutEffect, useState, type ReactNode, type RefObject } from "react";
import s from "./devices.module.css";

export interface StageSize {
  w: number;
  h: number;
  dpr: number;
}

export function useStageSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<StageSize | null>(null);
  const read = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // layout size, not the on-screen box: the shell may be springing the device box
    // (a transform) while the stage measures
    const next = { w: el.offsetWidth, h: el.offsetHeight, dpr: window.devicePixelRatio || 1 };
    setSize((p) => (p && p.w === next.w && p.h === next.h && p.dpr === next.dpr ? p : next));
  }, [ref]);
  // every render too: when the shell moves the device (reading, closing) in the same commit,
  // the new size lands before paint and before the ceremony builds on it
  useLayoutEffect(read);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, read]);
  return size;
}

/** A key of the stage layout, for useCeremony (false until measured) */
export const layoutKey = (size: StageSize | null) => (size ? `${size.w}x${size.h}@${size.dpr}` : false);

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
    <div ref={ref} data-stage="" className={`${s.stage} ${className ?? ""}`}>
      <p className={s.live} role="status" aria-live="polite">
        {label}
      </p>
      <div className={s.layer} aria-hidden="true">
        {children}
      </div>
    </div>
  );
});
