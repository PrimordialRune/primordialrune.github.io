"use client";

// PTCG Cube: a booster designed from the playmat itself (black field, white line art,
// grey motifs, its own halftone and contour lines as the pack artwork), torn open over
// the real playmat, five cards dealt onto the five bench slots printed on it.
// viewBox 0 -40 640 420; the mat lies at 0,0 640x372 (its own pixel size).
import { asset } from "../../asset";
import { FONT_BLACK, FONT_KANA, GrainFilter, ShadowFilter, useSvgId } from "./shared";

export const BOOSTER_VIEW = { x: 0, y: -40, w: 640, h: 420 } as const;
export const PACK = { x: 265, y: 8, w: 110, h: 176, cx: 320, cy: 96 } as const;
const PERF = 30;

/** The five bench slots on the playmat, and the silhouette above each one */
export const BENCH = [
  { x: 142.5, sx: 163 },
  { x: 232, sx: 257 },
  { x: 319.5, sx: 340 },
  { x: 407.5, sx: 428 },
  { x: 496.5, sx: 509 },
].map((b, i) => ({ ...b, y: 294, r: [-3, 2, -1, 3, -2][i] }));

const MAT = asset("resources/desk/ptcg-cube-playmat.jpg");

function Card({ i, id }: { i: number; id: string }) {
  const b = BENCH[i];
  return (
    <g>
      <rect x="-26" y="-36" width="52" height="72" rx="3.2" fill="#1f1f1f" stroke="#151515" strokeWidth="1" />
      <rect x="-23.5" y="-33.5" width="47" height="67" rx="1.8" fill="none" stroke="#d8d8d8" strokeWidth="1" />
      <rect x="-21" y="-31" width="42" height="28" fill="#151515" />
      <g clipPath={`url(#${id}win)`}>
        <image href={MAT} x={-b.sx} y={-17 - 222} width="640" height="372" />
      </g>
      <rect x="-21" y="-31" width="42" height="28" fill="none" stroke="#8c8c8c" strokeWidth=".6" />
      <rect x="-21" y="1" width="26" height="2.4" fill="#d8d8d8" />
      <rect x="-21" y="7" width="38" height="1.4" fill="#8c8c8c" />
      <rect x="-21" y="11" width="32" height="1.4" fill="#8c8c8c" />
      {Array.from({ length: 12 }, (_, k) => (
        <circle key={k} cx={-19 + (k % 6) * 7.6} cy={18 + Math.floor(k / 6) * 5} r=".7" fill="#8c8c8c" />
      ))}
      <text x="-21" y="30.5" style={FONT_BLACK} fontSize="4.6" fill="#ffffff" letterSpacing=".6">
        CUBE
      </text>
      <text x="21" y="30.5" style={FONT_BLACK} fontSize="4" fill="#8c8c8c" textAnchor="end">
        {i + 1}/5
      </text>
      <path d="M-24 -34.6 H24" stroke="#fff" strokeOpacity=".35" strokeWidth=".8" strokeLinecap="round" />
    </g>
  );
}

function crimp(y0: number, y1: number, id: string) {
  return (
    <g>
      <rect x={PACK.x} y={y0} width={PACK.w} height={y1 - y0} fill={`url(#${id}foil)`} />
      {Array.from({ length: 27 }, (_, i) => (
        <path key={i} d={`M${PACK.x + 2 + i * 4} ${y0 + 1.5} V${y1 - 1.5}`} stroke="#5a5a5a" strokeWidth=".7" />
      ))}
    </g>
  );
}

export function BoosterScene() {
  const id = useSvgId();
  const zig = Array.from({ length: 23 }, (_, i) => `L${PACK.x + i * 5} ${PACK.y + (i % 2 ? 2.4 : 0)}`).join(" ");
  const stripShape = `M${PACK.x} ${PACK.y + 2} ${zig} L${PACK.x + PACK.w} ${PACK.y + 2} V${PERF} H${PACK.x} Z`;
  const cuts = [0, 1, 2, 3].map((k) => PACK.x + (PACK.w * k) / 4);
  return (
    <svg viewBox={`${BOOSTER_VIEW.x} ${BOOSTER_VIEW.y} ${BOOSTER_VIEW.w} ${BOOSTER_VIEW.h}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}pouch`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1f1f1f" />
          <stop offset="1" stopColor="#151515" />
        </linearGradient>
        <linearGradient id={`${id}foil`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d8d8d8" />
          <stop offset=".5" stopColor="#8c8c8c" />
          <stop offset="1" stopColor="#d8d8d8" />
        </linearGradient>
        <linearGradient id={`${id}holo`} x1="0" y1="0" x2="1" y2="1">
          <stop offset=".2" stopColor="#fff" stopOpacity="0" />
          <stop offset=".38" stopColor="#fff" stopOpacity=".2" />
          <stop offset=".46" stopColor="#fff" stopOpacity=".04" />
          <stop offset=".6" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}art`}>
          <rect x="272" y="40" width="96" height="78" />
        </clipPath>
        <clipPath id={`${id}win`}>
          <rect x="-21" y="-31" width="42" height="28" />
        </clipPath>
        <clipPath id={`${id}mat`}>
          <rect x="0" y="0" width="640" height="372" rx="14" />
        </clipPath>
        {cuts.slice(1).map((c, k) => (
          <g key={k}>
            <clipPath id={`${id}l${k + 1}`}>
              <rect x={PACK.x - 2} y={PACK.y - 4} width={c - PACK.x + 2} height="40" />
            </clipPath>
            <clipPath id={`${id}r${k + 1}`}>
              <rect x={c} y={PACK.y - 4} width={PACK.x + PACK.w - c + 2} height="40" />
            </clipPath>
          </g>
        ))}
        <g id={`${id}strip`}>
          <path d={stripShape} fill={`url(#${id}foil)`} />
          {Array.from({ length: 27 }, (_, i) => (
            <path key={i} d={`M${PACK.x + 2 + i * 4} ${PACK.y + 4} V${PERF - 3}`} stroke="#5a5a5a" strokeWidth=".7" />
          ))}
          <path d={`M${PACK.x} ${PERF - 0.5} H${PACK.x + PACK.w}`} stroke="#151515" strokeWidth="1" strokeDasharray="2 1.6" />
        </g>
        <GrainFilter id={`${id}n`} opacity={0.12} scale={1.8} />
        <ShadowFilter id={`${id}sh0`} lift={0} />
        <ShadowFilter id={`${id}sh1`} lift={1} />
      </defs>

      {/* the playmat (its real art), lying under the pack */}
      <g data-p="mat">
        <g filter={`url(#${id}sh0)`}>
          <rect x="0" y="0" width="640" height="372" rx="14" fill="#151515" />
        </g>
        <g clipPath={`url(#${id}mat)`}>
          <image href={MAT} x="0" y="0" width="640" height="372" />
        </g>
        <rect x="1.5" y="1.5" width="637" height="369" rx="13" fill="none" stroke="#2e2e2e" strokeWidth="3" strokeDasharray="3 2" />
      </g>

      {/* the five cards wait inside the pack (behind its front) */}
      {BENCH.map((_, i) => (
        <g key={i} data-p="card" data-i={i} transform={`translate(${BENCH[i].x} ${BENCH[i].y}) rotate(${BENCH[i].r})`}>
          <Card i={i} id={id} />
        </g>
      ))}

      <g data-p="pack" data-sh0={`url(#${id}sh0)`} data-sh1={`url(#${id}sh1)`} filter={`url(#${id}sh0)`}>
        {/* pouch with the playmat's own halftone and contours as artwork */}
        <rect x={PACK.x} y={PERF - 4} width={PACK.w} height={150} fill={`url(#${id}pouch)`} />
        <g filter={`url(#${id}n)`}>
          <g clipPath={`url(#${id}art)`}>
            <rect x="272" y="40" width="96" height="78" fill="#151515" />
            <image href={MAT} x={320 - 472} y={79 - 62} width="640" height="372" />
          </g>
        </g>
        <rect x="272" y="40" width="96" height="78" fill="none" stroke="#d8d8d8" strokeWidth="1" />
        <path d="M272 124 H368" stroke="#8c8c8c" strokeWidth=".6" />
        <text x={PACK.cx} y="137" style={FONT_BLACK} fontSize="15" fill="#ffffff" textAnchor="middle" letterSpacing=".4">
          PTCG CUBE
        </text>
        <text x={PACK.cx} y="147" style={FONT_BLACK} fontSize="6" fill="#8c8c8c" textAnchor="middle" letterSpacing="2.2">
          BOOSTER PACK
        </text>
        <text x={PACK.cx} y="157" style={FONT_KANA} fontSize="7" fill="#d8d8d8" textAnchor="middle" opacity=".8" letterSpacing="1">
          ブースターパック
        </text>
        <text x={PACK.cx} y="167" style={FONT_BLACK} fontSize="5" fill="#8c8c8c" textAnchor="middle" letterSpacing="1.4">
          ROGUELIKE · CO-OP
        </text>
        {crimp(170, PACK.y + PACK.h, id)}
        <rect x={PACK.x} y={PERF - 4} width={PACK.w} height={PACK.h - PERF + 12} fill={`url(#${id}holo)`} />
        <path d={`M${PACK.x + 0.6} ${PERF} V170`} stroke="#fff" strokeOpacity=".5" strokeWidth=".8" />

        {/* the tear strip, 5 states: sealed, torn a quarter at a time, gone */}
        <g data-p="strip-0">
          <use href={`#${id}strip`} />
        </g>
        {[1, 2, 3].map((k) => {
          const c = cuts[k];
          return (
            <g key={k} data-p={`strip-${k}`} visibility="hidden">
              <rect x={PACK.x} y={PERF - 3} width={c - PACK.x} height="5" fill="#0b0b0b" />
              <path d={`M${PACK.x} ${PERF - 1} ${Array.from({ length: Math.ceil((c - PACK.x) / 4) }, (_, i) => `L${PACK.x + i * 4 + 2} ${PERF - (i % 2 ? 0 : 2.2)}`).join(" ")} L${c} ${PERF - 1}`} stroke="#d8d8d8" strokeWidth=".8" fill="none" />
              <use href={`#${id}strip`} clipPath={`url(#${id}r${k})`} />
              <g transform={`rotate(${-7 * k} ${c} ${PERF})`}>
                <use href={`#${id}strip`} clipPath={`url(#${id}l${k})`} />
              </g>
            </g>
          );
        })}
        <g data-p="strip-4" visibility="hidden">
          <rect x={PACK.x} y={PERF - 3} width={PACK.w} height="5" fill="#0b0b0b" />
          <path d={`M${PACK.x} ${PERF - 1} ${Array.from({ length: 28 }, (_, i) => `L${PACK.x + i * 4 + 2} ${PERF - (i % 2 ? 0 : 2.2)}`).join(" ")}`} stroke="#d8d8d8" strokeWidth=".8" fill="none" />
          <g transform={`translate(-58 -30) rotate(-26 ${PACK.x} ${PERF})`}>
            <use href={`#${id}strip`} />
          </g>
        </g>
      </g>
    </svg>
  );
}
