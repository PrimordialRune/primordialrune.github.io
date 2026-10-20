"use client";

// Haunt Record, top-down: a CD deck with a window over the tray. The disc is the desk's own
// disc (desk/DeskArt.tsx Cd, redrawn in SVG at the same proportions: the rainbow data side
// at the rim, the navy print with the logo, the crown and DISC 1, the clear hub), so the disc
// you clicked is the disc that goes in. Two copies: "held" (above everything, carried in
// from the mat) and "disc" (on the tray, under the deck top).
// viewBox 0 0 640 470. The tray slides 165 units.
import { asset } from "../../asset";
import { FONT_BLACK, FONT_MACHINE, LogoEmboss, ShadowFilter, useSvgId } from "./shared";

export const DISC_VIEW = { w: 640, h: 470 } as const;
/** the disc's radius in scene units (the desk disc is 92 desk units across) */
export const DISC_R = 70;
export const TRAY_SEAT = { x: 445, y: 293 } as const;
export const TRAY_TRAVEL = 165;

const NAVY = "#1f2c39";
const TEAL = "#48a9a6";
/** the desk disc's DISC 1 print */
const PRINT = "#48a8a0";

// the desk disc's data side: conic-gradient(from 200deg, ...) as 72 five-degree sectors
const RAINBOW = ["#c3ccd1", "#eef2f4", "#b9c3c9", "#e7d3ef", "#c4e5f0", "#d6efcc", "#f3eac6", "#c3ccd1", "#eef2f4", "#c3ccd1"];
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function rainbowAt(f: number) {
  const n = RAINBOW.length - 1;
  const i = Math.min(n - 1, Math.floor(f * n));
  const k = f * n - i;
  const a = hex(RAINBOW[i]);
  const b = hex(RAINBOW[i + 1]);
  return "#" + a.map((v, j) => Math.round(v + (b[j] - v) * k).toString(16).padStart(2, "0")).join("");
}
/** a sector of radius r between two CSS conic angles (0 = up, clockwise), around 0,0 */
function cssSector(a0: number, a1: number, r: number) {
  const p = (a: number) => [Math.sin((a * Math.PI) / 180) * r, -Math.cos((a * Math.PI) / 180) * r];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M0 0 L${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}
const DATA_SIDE = Array.from({ length: 72 }, (_, i) => ({
  d: cssSector(200 + i * 5, 200 + (i + 1) * 5 + 0.6, DISC_R),
  fill: rainbowAt((i + 0.5) / 72),
}));

/**
 * The desk disc, drawn around (0, 0). Proportions from the desk CSS (DeskArt.module.css .cd):
 * face inset 2.6% with an 11.7% hole, logo at 26%/3% x 48%, crown at 42%/70% x 16%, DISC 1
 * at 16% from the right and 58% down, hub at 32% inset, centre hole 5.1%.
 */
export function DiscArt({ wedge = false }: { wedge?: boolean }) {
  const id = useSvgId();
  const D = DISC_R * 2;
  const faceR = 0.474 * D;
  const faceBox = 2 * faceR;
  const fx = (f: number) => -faceR + f * faceBox;
  return (
    <g>
      <defs>
        <mask id={`${id}hole`} maskUnits="userSpaceOnUse" x={-DISC_R - 4} y={-DISC_R - 4} width={D + 8} height={D + 8}>
          <circle r={DISC_R} fill="#fff" />
          <circle r={0.051 * D} fill="#000" />
        </mask>
        <mask id={`${id}face`} maskUnits="userSpaceOnUse" x={-DISC_R} y={-DISC_R} width={D} height={D}>
          <circle r={faceR} fill="#fff" />
          <circle r={0.1173 * D} fill="#000" />
        </mask>
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".3" />
          <stop offset=".38" stopColor="#fff" stopOpacity="0" />
          <stop offset=".64" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".12" />
        </linearGradient>
      </defs>
      <g mask={`url(#${id}hole)`}>
        {DATA_SIDE.map((s, i) => (
          <path key={i} d={s.d} fill={s.fill} />
        ))}
        <circle r={DISC_R - 0.5} fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1" />
        <circle r={DISC_R - 1.5} fill="none" stroke="#3c4650" strokeOpacity=".35" strokeWidth="1" />
        <g mask={`url(#${id}face)`}>
          <circle r={faceR} fill={NAVY} />
          <image href={asset("resources/desk/haunt-record-logo.png")} x={fx(0.26)} y={fx(0.03)} width={0.48 * faceBox} height={0.48 * faceBox * (288 / 420)} />
          <image href={asset("resources/desk/haunt-record-crown.png")} x={fx(0.42)} y={fx(0.7)} width={0.16 * faceBox} height={0.16 * faceBox} />
          <text x={faceR - 0.16 * faceBox} y={fx(0.58) + 0.044 * D * 0.8} style={FONT_MACHINE} fontSize={0.044 * D} fill={PRINT} textAnchor="end" letterSpacing={0.044 * D * 0.08}>
            DISC 1
          </text>
        </g>
        {/* clear hub */}
        <circle r={0.18 * D + 0.5} fill="none" stroke="#202838" strokeOpacity=".6" strokeWidth="1" />
        <circle r={0.18 * D} fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1" />
        <circle r={0.18 * D - 2} fill="none" stroke="#fff" strokeOpacity=".1" strokeWidth="3" />
        <circle r={DISC_R} fill={`url(#${id}sheen)`} />
        {/* the conic glints: on the tray copy they turn with the spin-up */}
        <g data-p={wedge ? "wedge" : undefined}>
          <circle r={DISC_R} fill="none" />
          <path d={cssSector(306, 334, DISC_R)} fill="#fff" opacity=".12" />
          <path d={cssSector(312, 328, DISC_R)} fill="#fff" opacity=".08" />
          <path d={cssSector(186, 214, DISC_R)} fill="#fff" opacity=".1" />
        </g>
      </g>
    </g>
  );
}

// seven-segment digits: segments a b c d e f g
const SEGS: Record<string, string> = {
  "0": "abcdef",
  "1": "bc",
  "2": "abged",
  "3": "abgcd",
  "4": "fgbc",
  "5": "afgcd",
  "6": "afgedc",
  "7": "abc",
  "8": "abcdefg",
  "9": "abcdfg",
};

function Seg({ x, y, digit, fill }: { x: number; y: number; digit: string; fill: string }) {
  const w = 12;
  const h = 22;
  const t = 2.6;
  const on = SEGS[digit] ?? "";
  const r: Record<string, [number, number, number, number]> = {
    a: [x + t, y, w - 2 * t, t],
    d: [x + t, y + h - t, w - 2 * t, t],
    g: [x + t, y + h / 2 - t / 2, w - 2 * t, t],
    f: [x, y + t, t, h / 2 - t * 1.5],
    b: [x + w - t, y + t, t, h / 2 - t * 1.5],
    e: [x, y + h / 2 + t / 2, t, h / 2 - t * 1.5],
    c: [x + w - t, y + h / 2 + t / 2, t, h / 2 - t * 1.5],
  };
  return (
    <g fill={fill} transform={`skewX(-6)`}>
      {[...on].map((k) => (
        <rect key={k} x={r[k][0]} y={r[k][1]} width={r[k][2]} height={r[k][3]} rx=".6" />
      ))}
    </g>
  );
}

function Readout({ fill }: { fill: string }) {
  return (
    <>
      <Seg x={112} y={78} digit="0" fill={fill} />
      <Seg x={128} y={78} digit="1" fill={fill} />
      <Seg x={194} y={78} digit="0" fill={fill} />
      <Seg x={210} y={78} digit="0" fill={fill} />
      <rect x="227" y="83" width="2.6" height="2.6" fill={fill} />
      <rect x="226" y="93" width="2.6" height="2.6" fill={fill} />
      <Seg x={234} y={78} digit="0" fill={fill} />
      <Seg x={250} y={78} digit="0" fill={fill} />
    </>
  );
}

export function DiscScene() {
  const id = useSvgId();
  return (
    <svg viewBox={`0 0 ${DISC_VIEW.w} ${DISC_VIEW.h}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}deck`} x1="0" y1="0" x2=".2" y2="1">
          <stop offset="0" stopColor="#2e2e38" />
          <stop offset=".7" stopColor="#24242c" />
          <stop offset="1" stopColor="#1c1c23" />
        </linearGradient>
        <linearGradient id={`${id}tray`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#202028" />
          <stop offset=".5" stopColor="#2a2a33" />
          <stop offset="1" stopColor="#1d1d24" />
        </linearGradient>
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".14" />
          <stop offset=".3" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}glass`} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".4" stopColor="#fff" stopOpacity=".02" />
          <stop offset="1" stopColor="#000" stopOpacity=".18" />
        </radialGradient>
        <radialGradient id={`${id}led`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={TEAL} stopOpacity=".5" />
          <stop offset="1" stopColor={TEAL} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}under`}>
          <rect x="0" y="16" width="640" height="460" />
        </clipPath>
        <ShadowFilter id={`${id}sh0`} lift={0} />
        <ShadowFilter id={`${id}sh1`} lift={1} />
      </defs>

      {/* the tray, under the deck; starts closed (moved up by the timeline) */}
      <g clipPath={`url(#${id}under)`}>
      <g data-p="tray">
        <rect x="360" y="40" width="170" height="340" rx="6" fill={`url(#${id}tray)`} stroke="#121218" strokeWidth="1.2" />
        <circle cx={TRAY_SEAT.x} cy={TRAY_SEAT.y} r="74" fill="#14141c" />
        <circle cx={TRAY_SEAT.x} cy={TRAY_SEAT.y} r="74" fill="none" stroke="#3a3a46" strokeWidth="1.4" />
        <circle cx={TRAY_SEAT.x} cy={TRAY_SEAT.y} r="40" fill="#17171d" />
        <circle cx={TRAY_SEAT.x} cy={TRAY_SEAT.y} r="11" fill="#3a3a46" />
        <rect x="360" y="366" width="170" height="14" rx="4" fill="#2e2e38" />
        <path d="M364 367.4 H526" stroke="#fff" strokeOpacity=".22" strokeWidth="1.2" />
        <path d="M440 374 L445 369 L450 374Z M440 376.4 H450" fill="#c3ccd1" stroke="#c3ccd1" strokeWidth=".8" opacity=".6" />
      </g>
      </g>

      {/* the disc on the tray, under the deck top: placed by the timeline */}
      <g data-p="disc" transform={`translate(${TRAY_SEAT.x} ${TRAY_SEAT.y - TRAY_TRAVEL})`}>
        <DiscArt wedge />
      </g>

      {/* the deck top, with the window over the tray's seat */}
      <path
        d="M70 10 H590 a10 10 0 0 1 10 10 V200 a10 10 0 0 1 -10 10 H70 a10 10 0 0 1 -10 -10 V20 a10 10 0 0 1 10 -10Z M445 52 a76 76 0 1 0 .01 0Z"
        fillRule="evenodd"
        fill={`url(#${id}deck)`}
        stroke="#121218"
        strokeWidth="1.4"
      />
      <rect x="62" y="200" width="536" height="9" rx="3" fill="#3a3a46" />
      <rect x="356" y="203" width="178" height="5" rx="1.5" fill="#0c0c10" />
      <circle cx="445" cy="128" r="77" fill="none" stroke="#3a3a46" strokeWidth="3" />
      <circle cx="445" cy="128" r="76" fill={`url(#${id}glass)`} />
      <path d="M392 72 A76 76 0 0 1 470 56" stroke="#fff" strokeOpacity=".4" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* display: ghost segments, lit when the disc is read */}
      <rect x="90" y="54" width="210" height="58" rx="4" fill="#101018" stroke="#3a3a46" strokeWidth="1.2" />
      <text x="104" y="68" style={FONT_BLACK} fontSize="6" fill="#3a3a46" letterSpacing="1.2">
        TRACK
      </text>
      <text x="196" y="68" style={FONT_BLACK} fontSize="6" fill="#3a3a46" letterSpacing="1.2">
        TIME
      </text>
      <g opacity=".5">
        <Readout fill="#1f2c39" />
      </g>
      <g data-p="lit" visibility="hidden">
        <Readout fill={TEAL} />
        <rect x="90" y="54" width="210" height="58" rx="4" fill={`url(#${id}led)`} opacity=".5" />
      </g>

      {[104, 150, 196, 242].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="158" r="12" fill="#17171d" />
          <circle cx={x} cy="157" r="11" fill="#3a3a46" />
          <g transform={`translate(${x} 157)`} fill="#c3ccd1" stroke="#c3ccd1" strokeWidth="1.6" strokeLinecap="round">
            {i === 0 && <path d="M-3.2 -2.8 A4.6 4.6 0 1 0 3.2 -2.8 M0 -5 V-0.6" fill="none" />}
            {i === 1 && <path d="M-4 1 L0 -4 L4 1Z M-4 3.4 H4" strokeWidth="1.2" />}
            {i === 2 && <path d="M-2.6 -4 L4 0 L-2.6 4Z" stroke="none" />}
            {i === 3 && <rect x="-3.4" y="-3.4" width="6.8" height="6.8" stroke="none" />}
          </g>
        </g>
      ))}
      <circle data-p="led" cx="282" cy="158" r="3.5" fill="#3a3a46" />
      <LogoEmboss x={556} y={170} size={26} fill="#2e2e38" light="#3e3e4a" />
      <path d="M72 11.6 H588" stroke="#fff" strokeOpacity=".22" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="60" y="10" width="540" height="200" rx="10" fill={`url(#${id}sheen)`} pointerEvents="none" />

      {/* the disc in the hand, above everything; `fly` carries it in from the desk (FLIP) */}
      <g data-p="fly">
        <g data-p="held" transform={`translate(${TRAY_SEAT.x} ${TRAY_SEAT.y})`} filter={`url(#${id}sh0)`} data-sh0={`url(#${id}sh0)`} data-sh1={`url(#${id}sh1)`}>
          <DiscArt />
          <rect data-p="box" x={-DISC_R} y={-DISC_R} width={DISC_R * 2} height={DISC_R * 2} fill="none" />
        </g>
      </g>
    </svg>
  );
}
