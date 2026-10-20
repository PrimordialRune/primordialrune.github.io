"use client";

// Crossfader's cassette, redrawn from the desk object with both sides printed: side A
// "The Game", side B "Making Of". Drawn in its own 100 x 64 space as an SVG group so a
// walkman can hold two copies (one in the hand, one in the well). Every label face is
// a named group the timeline swaps; the mirrored faces (Am, Bm) read correctly while the
// tape is turned over on Y (scaleX < 0), because a tape flips, it never fades (P3).
import { asset } from "../../asset";
import type { Side } from "../../types";
import { FONT_BLACK, GrainFilter, useSvgId } from "./shared";

export const REELS = [
  { cx: 37, cy: 32.4 },
  { cx: 63, cy: 32.4 },
] as const;

const FACE = {
  A: { letter: "A", ink: "#e0459b", top: "#e0459b", bottom: "#53b3c9", line: "FLIP THE SIDE ◆ REMIX THE SONG" },
  B: { letter: "B", ink: "#53b3c9", top: "#53b3c9", bottom: "#e0459b", line: "SIDE B ◆ MAKING OF" },
} as const;

function Label({ side, grain }: { side: Side; grain: string }) {
  const f = FACE[side];
  return (
    <g filter={`url(#${grain})`}>
      <rect x="6" y="4.6" width="88" height="40.4" rx="2" fill="#f1ead6" />
      <rect x="6" y="21" width="88" height="2.2" fill={f.top} />
      <rect x="6" y="23.2" width="88" height="1.1" fill={f.bottom} />
      <text x="12.2" y="18.2" style={FONT_BLACK} fontSize="12.5" fill={f.ink} textAnchor="middle">
        {f.letter}
      </text>
      <image href={asset("resources/desk/crossfader-logo.png")} x="19.5" y="6" width="68" height="14" preserveAspectRatio="xMidYMid meet" />
      <text x="50" y="43" style={FONT_BLACK} fontSize="2.6" fill="#2e2828" textAnchor="middle" letterSpacing=".3">
        {f.line}
      </text>
    </g>
  );
}

/**
 * `name` prefixes the data-p hooks: `${name}-A`, `${name}-B`, `${name}-Am`, `${name}-Bm`
 * (faces) and `${name}-reel` (the two hubs, rotate around REELS[i]).
 */
export function CassetteArt({ name, side }: { name: string; side: Side }) {
  const id = useSvgId();
  const vis = (on: boolean) => (on ? "inherit" : "hidden");
  return (
    <g>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8df72" />
          <stop offset=".55" stopColor="#ebc84a" />
          <stop offset="1" stopColor="#d2a92f" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".4" />
          <stop offset=".3" stopColor="#fff" stopOpacity="0" />
          <stop offset=".75" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".12" />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <rect x="27" y="26.4" width="46" height="12" rx="6" />
        </clipPath>
        <GrainFilter id={`${id}n`} opacity={0.14} scale={2.6} />
      </defs>
      <rect x=".5" y=".5" width="99" height="63" rx="4" fill={`url(#${id}s)`} stroke="#8a6c17" strokeWidth=".8" />
      <rect x="5.2" y="3.9" width="89.6" height="42" rx="2.6" fill="#b8962a" opacity=".55" />

      <g data-p={`${name}-A`} visibility={vis(side === "A")}>
        <Label side="A" grain={`${id}n`} />
      </g>
      <g data-p={`${name}-B`} visibility={vis(side === "B")}>
        <Label side="B" grain={`${id}n`} />
      </g>
      <g data-p={`${name}-Am`} visibility="hidden" transform="translate(100 0) scale(-1 1)">
        <Label side="A" grain={`${id}n`} />
      </g>
      <g data-p={`${name}-Bm`} visibility="hidden" transform="translate(100 0) scale(-1 1)">
        <Label side="B" grain={`${id}n`} />
      </g>

      {/* tape window: purple frame, smoked plastic, two reels */}
      <rect x="25.6" y="25.2" width="48.8" height="14.4" rx="7.2" fill="#8233c4" />
      <rect x="27" y="26.4" width="46" height="12" rx="6" fill="#2e2828" />
      <g clipPath={`url(#${id}c)`}>
        <circle cx="37" cy="32.4" r="8.2" fill="#4a3226" />
        <circle cx="63" cy="32.4" r="5.4" fill="#4a3226" />
        <rect x="27" y="37.4" width="46" height=".5" fill="#4a3226" />
      </g>
      {REELS.map(({ cx, cy }) => (
        <g key={cx} data-p={`${name}-reel`}>
          <circle cx={cx} cy={cy} r="3.3" fill="#f1ead6" />
          <circle cx={cx} cy={cy} r="1.7" fill="#2e2828" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <rect key={a} x={cx - 0.35} y={cy - 1.9} width=".7" height="1" fill="#f1ead6" transform={`rotate(${a} ${cx} ${cy})`} />
          ))}
        </g>
      ))}
      <rect x="27" y="26.4" width="46" height="12" rx="6" fill={`url(#${id}w)`} />
      {/* head opening */}
      <path d="M20 63.5 L24.5 49.5 H75.5 L80 63.5 Z" fill="#d7b23a" stroke="#8a6c17" strokeWidth=".6" />
      <path d="M25 50.1 H75" stroke="#fff4c4" strokeWidth=".6" opacity=".8" />
      <circle cx="31.5" cy="57.5" r="1.9" fill="#3a2e10" />
      <circle cx="68.5" cy="57.5" r="1.9" fill="#3a2e10" />
      <rect x="44" y="55" width="3.4" height="4.2" rx=".6" fill="#3a2e10" />
      <rect x="52.6" y="55" width="3.4" height="4.2" rx=".6" fill="#3a2e10" />
      {[
        [4.2, 4.2],
        [95.8, 4.2],
        [4.2, 59.8],
        [95.8, 59.8],
        [50, 52.6],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="1.35" fill="#c19d2e" stroke="#7a5f14" strokeWidth=".3" />
          <path d={`M${x - 0.8} ${y} H${x + 0.8} M${x} ${y - 0.8} V${y + 0.8}`} stroke="#7a5f14" strokeWidth=".35" />
        </g>
      ))}
      <rect x=".5" y=".5" width="99" height="63" rx="4" fill={`url(#${id}g)`} />
      <path d="M4.5 1.25 H95.5" stroke="#fffbe6" strokeWidth=".9" strokeLinecap="round" />
      <path d="M1.25 4.5 V59" stroke="#fffbe6" strokeWidth=".55" strokeLinecap="round" opacity=".7" />
    </g>
  );
}
