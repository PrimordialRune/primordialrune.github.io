"use client";
// The pieces the narrator is drawn with: Omar's logo on its plate, and a line of text
// that can carry the machine's letters inside Omar's.
import { forwardRef } from "react";
import { LOGO_INNER, LOGO_OUTER } from "@/lib/logo";
import { parseLine } from "./lines";
import styles from "./speaker.module.css";

interface LogoProps {
  inner: "plate" | "red";
  /** Stage 1: the inner flickers warning red once */
  flicker?: boolean;
  className?: string;
}

/** Omar's logo on its cream plate: peacock-blue crown, blood-orange inner (warning red once the AI shows) */
export function NarratorLogo({ inner, flicker, className }: LogoProps) {
  return (
    <svg
      className={`${styles.logo} ${className ?? ""}`}
      viewBox="-48 -48 651 651"
      aria-hidden="true"
      data-inner={inner}
      data-flicker={flicker ? "1" : undefined}
    >
      <rect x="-48" y="-48" width="651" height="651" rx="96" className={styles.plate} />
      <path d={LOGO_OUTER} className={styles.outer} />
      <path d={LOGO_INNER} className={styles.inner} />
    </svg>
  );
}

interface LineTextProps {
  chunk: string;
  shown: number;
  machine: boolean;
  className?: string;
}

/** The visible part of the line; the rest is laid out invisibly so the box never jumps */
export const LineText = forwardRef<HTMLSpanElement, LineTextProps>(function LineText(
  { chunk, shown, machine, className },
  ref
) {
  const segs = parseLine(chunk);
  const starts = segs.map((_, i) => segs.slice(0, i).reduce((n, s) => n + s.text.length, 0));
  const parts = segs.map((seg, i) => {
    const vis = seg.text.slice(0, Math.max(0, shown - starts[i]));
    const ghost = seg.text.slice(vis.length);
    const cls = seg.machine && !machine ? styles.creep : undefined;
    return (
      <span key={i} className={cls}>
        {vis}
        {ghost && <span className={styles.ghost}>{ghost}</span>}
      </span>
    );
  });
  return (
    <span ref={ref} className={`${machine ? styles.machine : styles.omar} ${className ?? ""}`} aria-hidden="true">
      {parts}
    </span>
  );
});
