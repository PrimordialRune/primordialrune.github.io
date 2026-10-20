"use client";
// The pieces the narrator is drawn with: Omar's logo on its plate, and a line of text
// that can carry the machine's letters inside Omar's.
import { forwardRef, type ReactNode } from "react";
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

// ---- pixel glyphs the face doesn't have ------------------------------------------------
// 8bitDarling has no * ' # - — or block shades, so the browser would fall back to a smooth
// font in the middle of pixel text. These are drawn as tiny SVG blocks instead, on a grid of
// 1/8 em (2px at the 16px base, 6px at 48px), so they stay crisp at every integer multiple.

interface Glyph {
  rows: string[];
  /** cells above the baseline the glyph's bottom sits */
  raise: number;
}
const GLYPHS: Record<string, Glyph> = {
  "*": { rows: ["..x..", "x.x.x", ".xxx.", "x.x.x", "..x.."], raise: 0 },
  "'": { rows: ["x", "x"], raise: 3 },
  "-": { rows: ["xxx"], raise: 2 },
  "—": { rows: ["xxxxx"], raise: 2 },
  "#": { rows: [".x.x.", "xxxxx", ".x.x.", "xxxxx", ".x.x."], raise: 0 },
  "░": { rows: ["x...x", "..x..", "x...x", "..x..", "x...x"], raise: 0 },
  "▒": { rows: ["x.x.x", ".x.x.", "x.x.x", ".x.x.", "x.x.x"], raise: 0 },
  "▓": { rows: ["xx.xx", "x.xxx", "xxx.x", ".xxxx", "xx.xx"], raise: 0 },
  "█": { rows: ["xxxxx", "xxxxx", "xxxxx", "xxxxx", "xxxxx"], raise: 0 },
  "▶": { rows: ["x..", "xx.", "xxx", "xx.", "x.."], raise: 0 },
  "▼": { rows: ["xxxxx", ".xxx.", "..x.."], raise: 1 },
};
const GLYPH_RE = /([*'#\-—░▒▓█▶▼])/;
const CELL = 0.125; // em

function PixelGlyph({ g }: { g: Glyph }) {
  const w = g.rows[0].length;
  const h = g.rows.length;
  const cells: ReactNode[] = [];
  g.rows.forEach((row, y) =>
    [...row].forEach((c, x) => c === "x" && cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />))
  );
  return (
    <svg
      className={styles.glyph}
      viewBox={`0 0 ${w} ${h}`}
      width={`${w * CELL}em`}
      height={`${h * CELL}em`}
      style={{ verticalAlign: `${g.raise * CELL}em` }}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {cells}
    </svg>
  );
}

/** Text in the pixel face, with the glyphs it lacks drawn as pixel blocks (always aria-hidden: give the parent a label) */
export function PixelText({ text }: { text: string }) {
  if (!GLYPH_RE.test(text)) return <>{text}</>;
  return (
    <>
      {text.split(GLYPH_RE).map((part, i) =>
        GLYPHS[part] ? <PixelGlyph key={i} g={GLYPHS[part]} /> : part ? <span key={i}>{part}</span> : null
      )}
    </>
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
    const pixel = machine || seg.machine;
    return (
      <span key={i} className={cls}>
        {pixel ? <PixelText text={vis} /> : vis}
        {ghost && <span className={styles.ghost}>{pixel ? <PixelText text={ghost} /> : ghost}</span>}
      </span>
    );
  });
  return (
    <span ref={ref} className={`${machine ? styles.machine : styles.omar} ${className ?? ""}`} aria-hidden="true">
      {parts}
    </span>
  );
});
