"use client";

// The notebook's portrait slot. There is no photo in the repo yet, so Omar's logo stands
// in for a face, drawn as a 64 × 64 picture in four tones with ordered dithering (inside
// imagery only, P4). Shown at an integer scale with crisp edges (P1).
// Declared palette (4 tones): #102f41 peacock, #256069 dark teal, #4eb99f aquamarine, #fce8cd cream.

import { useId } from "react";
import { LOGO_INNER, LOGO_OUTER } from "@/lib/logo";
import { useIntScaleWidth } from "../manual/hooks";

const T = { d: "#102f41", m: "#256069", l: "#4eb99f", w: "#fce8cd" };
const N = 64;

export default function Portrait({ max = 320 }: { max?: number }) {
  const id = "p" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const { box, width } = useIntScaleWidth(N, true, max);
  // the logo (554.72 × 555) fitted into 48 units, centred in the 64-unit frame
  const k = 48 / 555;
  const logo = `translate(${(N - 554.72 * k) / 2} ${(N - 555 * k) / 2 + 2}) scale(${k})`;
  return (
    <div ref={box} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <svg
        viewBox={`0 0 ${N} ${N}`}
        width={width}
        height={width}
        shapeRendering="crispEdges"
        role="img"
        aria-label="Portrait slot: Omar's logo, dithered in four tones"
        style={{ display: "block" }}
      >
        <defs>
          {/* 2×2 checker: halfway between two tones */}
          <pattern id={`${id}a`} width="2" height="2" patternUnits="userSpaceOnUse">
            <rect width="2" height="2" fill={T.d} />
            <rect width="1" height="1" fill={T.m} />
            <rect x="1" y="1" width="1" height="1" fill={T.m} />
          </pattern>
          <pattern id={`${id}b`} width="2" height="2" patternUnits="userSpaceOnUse">
            <rect width="2" height="2" fill={T.l} />
            <rect width="1" height="1" fill={T.w} />
            <rect x="1" y="1" width="1" height="1" fill={T.w} />
          </pattern>
          {/* 4×4 sparse: a quarter step toward the light */}
          <pattern id={`${id}c`} width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill={T.m} />
            <rect width="1" height="1" fill={T.l} />
            <rect x="2" y="2" width="1" height="1" fill={T.l} />
          </pattern>
          {/* the dither must stay on the 64-unit grid, so the logo clips it instead of filling */}
          <clipPath id={`${id}i`}>
            <path d={LOGO_INNER} transform={logo} />
          </clipPath>
        </defs>
        {/* background: dark at the bottom, lifting toward a light from the top left */}
        <rect width={N} height={N} fill={T.d} />
        <rect width={N} height="40" fill={`url(#${id}a)`} />
        <rect width="36" height="20" fill={T.m} />
        <rect width="20" height="10" fill={`url(#${id}c)`} />
        <g transform={logo}>
          <path d={LOGO_OUTER} fill={T.l} />
        </g>
        <rect width={N} height={N} fill={`url(#${id}b)`} clipPath={`url(#${id}i)`} />
        {/* the frame of the slot */}
        <rect x=".5" y=".5" width={N - 1} height={N - 1} fill="none" stroke={T.d} strokeWidth="1" />
      </svg>
    </div>
  );
}
