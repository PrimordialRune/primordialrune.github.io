"use client";

// Omar's logo. In the frame it is Omar's own mark (original colours, static). On the hub it is
// the AI's face: the inner accent turns warning red act by act, and at the end it comes apart
// into its 8px grid in stepped frames.

import { forwardRef, useId } from "react";
import { LOGO_INNER, LOGO_OUTER } from "@/lib/logo";
import type { LogoFill } from "./story";

export const LOGO_VIEWBOX = "0 0 554.72 555";

export function FrameLogo({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} width={size} height={size} aria-hidden="true" className="frame-logo">
      <path d={LOGO_OUTER} fill="var(--peacock-blue)" />
      <path d={LOGO_INNER} fill="var(--blood-orange)" />
    </svg>
  );
}

// the grid the logo comes apart on: 16 × 16 cells of ~35 units (an 8px grid at the hero size)
const CELLS = 16;
const CELL = 555 / CELLS;
export const GRID = Array.from({ length: CELLS * CELLS }, (_, i) => ({
  x: (i % CELLS) * CELL,
  y: Math.floor(i / CELLS) * CELL,
  // deterministic group 0..3: which of the 4 frames removes this cell
  g: ((i * 7919) % 13) % 4,
}));

/** The stepped edge of the act 2 red fill: rises from the bottom in 8px stairs */
function halfStairs() {
  const pts: string[] = [`0,555`];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const x = (554.72 / steps) * i;
    const y = 300 - (i % 2 ? CELL : 0) + (i > steps / 2 ? -CELL : 0);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    pts.push(`${Math.min(554.72, (554.72 / steps) * (i + 1)).toFixed(1)},${y.toFixed(1)}`);
  }
  pts.push(`554.72,555`);
  return pts.join(" ");
}
const HALF = halfStairs();

interface Props {
  fill: LogoFill;
  className?: string;
  /** eye offset in logo units (stepped, N/E/S/W/centre) */
  eye?: { x: number; y: number };
}

/** The AI's face. Cells of the disintegration masks carry data-g so the ending can step them out. */
const AiLogo = forwardRef<SVGSVGElement, Props>(function AiLogo({ fill, className, eye }, ref) {
  const id = "l" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const inner = fill === "original" || fill === "rim" ? "var(--blood-orange)" : fill === "red" ? "var(--ai-red)" : "var(--blood-orange)";
  return (
    <svg ref={ref} viewBox={LOGO_VIEWBOX} className={className} aria-hidden="true" data-fill={fill}>
      <defs>
        <clipPath id={`${id}h`}>
          <polygon points={HALF} />
        </clipPath>
        {(["o", "i"] as const).map((part) => (
          <mask id={`${id}${part}`} key={part} maskUnits="userSpaceOnUse" x="0" y="0" width="555" height="555">
            <rect width="555" height="555" fill="#000" />
            {GRID.map((c, i) => (
              <rect key={i} className={`cell cell-${part}`} data-g={c.g} x={c.x} y={c.y} width={CELL + 0.6} height={CELL + 0.6} fill="#fff" />
            ))}
          </mask>
        ))}
      </defs>
      <g mask={`url(#${id}o)`}>
        <path d={LOGO_OUTER} fill="var(--peacock-blue)" stroke="var(--teal)" strokeWidth="3" className="logo-outer" />
      </g>
      <g mask={`url(#${id}i)`} transform={eye ? `translate(${eye.x} ${eye.y})` : undefined} className="logo-eye">
        <path d={LOGO_INNER} fill={inner} className="logo-inner" />
        {fill === "half" && <path d={LOGO_INNER} fill="var(--ai-red)" clipPath={`url(#${id}h)`} />}
        {fill === "rim" && <path d={LOGO_INNER} fill="none" stroke="var(--ai-red)" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
      </g>
    </svg>
  );
});

export default AiLogo;
