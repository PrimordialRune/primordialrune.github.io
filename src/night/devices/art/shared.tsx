"use client";

// Small pieces every device drawing shares: unique SVG ids, the print grain that lives
// only inside label imagery (P3: paper has grain; P4: never on interface fills), the
// embossed logo mark (Omar's own hardware, no third-party wordmarks) and soft shadows.
import { useId } from "react";
import { LOGO_INNER, LOGO_OUTER } from "@/lib/logo";

/** An id that is unique per instance and safe inside url(#...) */
export function useSvgId() {
  return "n" + useId().replace(/[^a-zA-Z0-9]/g, "");
}

/** Print grain: a faint monochrome noise, applied as a filter on label imagery only */
export function GrainFilter({ id, opacity = 0.16, scale = 1.4 }: { id: string; opacity?: number; scale?: number }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency={scale} numOctaves="2" seed="7" result="noise" />
      <feColorMatrix in="noise" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${opacity * 2.2} -${opacity * 0.6}`} result="grain" />
      <feComposite in="grain" in2="SourceGraphic" operator="in" result="g" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="g" />
      </feMerge>
    </filter>
  );
}

/**
 * A soft shadow cast away from the light (the light sits top-left, like the Trinitron on
 * the desk). `lift` 0 = resting, 1 = held above the desk.
 */
export function ShadowFilter({ id, lift = 0, color = "#000" }: { id: string; lift?: number; color?: string }) {
  const d = 1.2 + lift * 7;
  return (
    <filter id={id} x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx={d * 0.6} dy={d} stdDeviation={0.8 + lift * 4} floodColor={color} floodOpacity={0.5 - lift * 0.18} />
    </filter>
  );
}

/** The logo, pressed into plastic: a highlight under a slightly darker fill */
export function LogoEmboss({ x, y, size, fill, light }: { x: number; y: number; size: number; fill: string; light: string }) {
  const k = size / 555;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} aria-hidden="true">
      <g transform="translate(-9 -9)" fill={light}>
        <path d={LOGO_OUTER} />
        <path d={LOGO_INNER} />
      </g>
      <g fill={fill}>
        <path d={LOGO_OUTER} />
        <path d={LOGO_INNER} />
      </g>
    </g>
  );
}

export const FONT_BLACK = { fontFamily: "var(--f-omar), sans-serif", fontWeight: 900 } as const;
export const FONT_KANA = { fontFamily: "var(--f-kana), sans-serif" } as const;
