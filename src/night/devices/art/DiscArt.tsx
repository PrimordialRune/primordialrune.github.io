"use client";

// Haunt Record, top-down: a CD deck with a window over the tray, the jewel case beside it.
// The disc print is the crown, the booklet carries the logo; both in the game's own four
// tones (navy, red, cream, teal) with print grain inside the imagery only.
// viewBox 0 0 640 470. The case hinges on x = 120; the tray slides 165 units.
import { asset } from "../../asset";
import { FONT_BLACK, FONT_KANA, GrainFilter, LogoEmboss, ShadowFilter, useSvgId } from "./shared";

export const DISC_VIEW = { w: 640, h: 470 } as const;
export const CASE_HINGE = "120 369";
export const DISC_HOME = { x: 202.5, y: 369 } as const;
export const TRAY_SEAT = { x: 445, y: 293 } as const;
export const TRAY_TRAVEL = 165;

const NAVY = "#1f2c39";
const RED = "#eb5e54";
const CREAM = "#fbde9c";
const TEAL = "#48a9a6";

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
  const sector = (a0: number, a1: number, r: number) => {
    const p = (a: number) => [Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return `M0 0 L${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
  };
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
        <linearGradient id={`${id}clear`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".26" />
          <stop offset=".18" stopColor="#fff" stopOpacity=".06" />
          <stop offset=".19" stopColor="#fff" stopOpacity="0" />
          <stop offset=".62" stopColor="#fff" stopOpacity="0" />
          <stop offset=".64" stopColor="#fff" stopOpacity=".08" />
          <stop offset=".72" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}rim`} cx=".5" cy=".5" r=".5">
          <stop offset=".93" stopColor="#c3ccd1" />
          <stop offset=".97" stopColor="#eef2f4" />
          <stop offset="1" stopColor="#9aa4ab" />
        </radialGradient>
        <radialGradient id={`${id}glass`} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".4" stopColor="#fff" stopOpacity=".02" />
          <stop offset="1" stopColor="#000" stopOpacity=".18" />
        </radialGradient>
        <radialGradient id={`${id}led`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={TEAL} stopOpacity=".5" />
          <stop offset="1" stopColor={TEAL} stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}hole`} maskUnits="userSpaceOnUse" x="-80" y="-80" width="160" height="160">
          <circle r="70" fill="#fff" />
          <circle r="7.5" fill="#000" />
        </mask>
        <path id={`${id}arc`} d="M-50 0 A50 50 0 0 0 50 0" />
        <GrainFilter id={`${id}n`} opacity={0.16} scale={1.6} />
        <ShadowFilter id={`${id}sh0`} lift={0} />
        <ShadowFilter id={`${id}sh1`} lift={1} />
      </defs>

      {/* the tray, under the deck; starts closed (moved up by the timeline) */}
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

      {/* the jewel case base: black tray and the rosette that holds the disc */}
      <g filter={`url(#${id}sh0)`}>
        <rect x="120" y="296" width="165" height="146" rx="3" fill="#14141c" stroke="#3a3a46" strokeWidth="1.2" />
      </g>
      <rect x="120" y="296" width="9" height="146" fill="#24242c" />
      <circle cx={DISC_HOME.x} cy={DISC_HOME.y} r="16" fill="#24242c" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={DISC_HOME.x - 1.3} y={DISC_HOME.y - 14} width="2.6" height="7" fill="#3a3a46" transform={`rotate(${i * 30} ${DISC_HOME.x} ${DISC_HOME.y})`} />
      ))}

      {/* the disc, drawn around (0, 0), placed by the timeline */}
      <g data-p="disc" transform={`translate(${TRAY_SEAT.x} ${TRAY_SEAT.y - TRAY_TRAVEL})`} data-sh0={`url(#${id}sh0)`} data-sh1={`url(#${id}sh1)`}>
        <g mask={`url(#${id}hole)`}>
          <circle r="70" fill={`url(#${id}rim)`} />
          <g filter={`url(#${id}n)`}>
            <circle r="67.4" fill={NAVY} />
            <image href={asset("resources/desk/haunt-record-crown.png")} x="-27" y="-63" width="54" height="54" />
            <text style={FONT_BLACK} fontSize="9" fill={CREAM} letterSpacing="3.2" textAnchor="middle">
              <textPath href={`#${id}arc`} startOffset="50%">
                HAUNT RECORD
              </textPath>
            </text>
            <circle r="62" fill="none" stroke={TEAL} strokeWidth="1" opacity=".7" />
            <circle r="60" fill="none" stroke={RED} strokeWidth=".6" opacity=".5" />
          </g>
          {/* clear hub */}
          <circle r="22" fill="#fff" fillOpacity=".07" stroke="#fff" strokeOpacity=".35" strokeWidth="1" />
          <circle r="15" fill="#c3ccd1" fillOpacity=".4" />
          <g data-p="wedge">
            <path d={sector(-130, -106, 67)} fill="#fff" opacity=".22" />
            <path d={sector(50, 74, 67)} fill="#fff" opacity=".16" />
            <path d={sector(-125, -118, 67)} fill="#fff" opacity=".2" />
          </g>
          <path d="M-60 -36 A70 70 0 0 1 -20 -67" stroke="#fff" strokeOpacity=".7" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
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

      {/* the case lid: booklet under clear plastic; past vertical we see the inside */}
      <g data-p="lid">
        <g data-p="lid-out">
          <g filter={`url(#${id}n)`}>
            <rect x="128" y="298" width="155" height="142" fill={NAVY} />
            <image href={asset("resources/desk/haunt-record-logo.png")} x="139" y="308" width="133" height="91" preserveAspectRatio="xMidYMid meet" />
            <text x="205.5" y="424" style={FONT_KANA} fontSize="10" fill={TEAL} textAnchor="middle" letterSpacing="1.5">
              ホーント・レコード
            </text>
          </g>
          <rect x="120" y="296" width="165" height="146" rx="3" fill={`url(#${id}clear)`} stroke="#c3ccd1" strokeOpacity=".5" strokeWidth="1.2" />
          <path d="M123 297.6 H282" stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" strokeLinecap="round" />
        </g>
        <g data-p="lid-in" visibility="hidden">
          <g filter={`url(#${id}n)`}>
            <rect x="128" y="298" width="155" height="142" fill={NAVY} />
            <image href={asset("resources/desk/haunt-record-crown.png")} x="183" y="347" width="45" height="45" />
          </g>
          <rect x="120" y="296" width="165" height="146" rx="3" fill={`url(#${id}clear)`} stroke="#c3ccd1" strokeOpacity=".5" strokeWidth="1.2" />
          {[310, 420].map((y) => (
            <rect key={y} x="272" y={y} width="9" height="10" fill="#c3ccd1" fillOpacity=".35" />
          ))}
        </g>
      </g>
    </svg>
  );
}
