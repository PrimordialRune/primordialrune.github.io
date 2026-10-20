"use client";

// A top-down walkman (seen from above, the way the desk is): keys on the top edge, a
// hinged lid with a big smoked window, the well with its spindles. Two cassette copies:
// "held" (above everything, in the hand) and "seat" (in the well, under the lid).
// viewBox -10 -40 380 370. The lid hinges on y = 250.
import type { Side } from "../../types";
import { CassetteArt } from "./Cassette";
import { FONT_BLACK, LogoEmboss, ShadowFilter, useSvgId } from "./shared";

export const WALKMAN_VIEW = { x: -10, y: -40, w: 380, h: 370 } as const;
/** where the seated cassette sits (top-left) and its scale from 100 x 64 */
export const TAPE_AT = { x: 40, y: 60, k: 2.8 } as const;
export const TAPE_CENTER = { x: 40 + 50 * 2.8, y: 60 + 32 * 2.8 } as const;
export const LID_HINGE = "180 250";

const KEYS = [
  { x: 62, w: 50, label: "■", name: "stop", fill: "#8e929b" },
  { x: 118, w: 62, label: "▶", name: "play", fill: "#e0459b" },
  { x: 186, w: 50, label: "▶▶", name: "ff", fill: "#8e929b" },
  { x: 242, w: 50, label: "◀◀", name: "rew", fill: "#8e929b" },
];

/** `loaded`: the tape sits in the well, lid shut, PLAY latched (the rest pose) */
export function WalkmanArt({ side, loaded = true }: { side: Side; loaded?: boolean }) {
  const id = useSvgId();
  const v = WALKMAN_VIEW;
  return (
    <svg viewBox={`${v.x} ${v.y} ${v.w} ${v.h}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2=".3" y2="1">
          <stop offset="0" stopColor="#3a3942" />
          <stop offset=".5" stopColor="#2b2a31" />
          <stop offset="1" stopColor="#1c1b21" />
        </linearGradient>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e1e4e8" />
          <stop offset=".45" stopColor="#c9ccd2" />
          <stop offset="1" stopColor="#a3a7b0" />
        </linearGradient>
        <linearGradient id={`${id}mi`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#9a9ea7" />
          <stop offset="1" stopColor="#7c808a" />
        </linearGradient>
        <linearGradient id={`${id}glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".2" />
          <stop offset=".22" stopColor="#fff" stopOpacity=".05" />
          <stop offset=".23" stopColor="#fff" stopOpacity="0" />
          <stop offset=".6" stopColor="#fff" stopOpacity="0" />
          <stop offset=".61" stopColor="#fff" stopOpacity=".06" />
          <stop offset=".7" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".3" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <ShadowFilter id={`${id}sh0`} lift={0} />
        <ShadowFilter id={`${id}sh1`} lift={1} />
      </defs>

      {/* keys stand on the top edge; PLAY latches down */}
      {KEYS.map((k) => (
        <g key={k.name} data-p={`key-${k.name}`} transform={k.name === "play" && loaded ? "translate(0 10)" : undefined}>
          <rect x={k.x} y="2" width={k.w} height="30" rx="4" fill={k.fill} stroke="#1c1b21" strokeWidth="1.2" />
          <path d={`M${k.x + 4} 4.4 H${k.x + k.w - 4}`} stroke="#fff" strokeOpacity=".55" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}
      {/* volume wheel on the right edge */}
      <rect x="344" y="96" width="16" height="80" rx="4" fill="#8e929b" stroke="#1c1b21" strokeWidth="1.2" />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M350 ${102 + i * 8.4} H360`} stroke="#5d616a" strokeWidth="1.6" />
      ))}

      <g filter={`url(#${id}sh0)`}>
        <rect x="10" y="24" width="340" height="266" rx="18" fill={`url(#${id}b)`} stroke="#121116" strokeWidth="1.6" />
      </g>
      {KEYS.map((k) => (
        <text key={k.name} x={k.x + k.w / 2} y="42" style={FONT_BLACK} fontSize="8" fill={k.name === "play" ? "#e0459b" : "#8e929b"} textAnchor="middle">
          {k.label}
        </text>
      ))}
      <circle cx="322" cy="38" r="6" fill="#121116" stroke="#5d616a" strokeWidth="1.2" />

      {/* the well: spindles and head where the tape seats */}
      <rect x="34" y="54" width="292" height="192" rx="9" fill="#121116" />
      {[
        [143.6, 150.7],
        [216.4, 150.7],
      ].map(([cx, cy]) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r="10" fill="#c9ccd2" />
          <circle cx={cx} cy={cy} r="4" fill="#5d616a" />
        </g>
      ))}
      <rect x="160" y="222" width="40" height="14" rx="2" fill="#c9ccd2" />
      <circle cx="122" cy="230" r="6" fill="#2b2a31" stroke="#5d616a" />
      <circle cx="238" cy="230" r="6" fill="#2b2a31" stroke="#5d616a" />

      <g data-p="seat" visibility={loaded ? "visible" : "hidden"}>
        <g transform={`translate(${TAPE_AT.x} ${TAPE_AT.y}) scale(${TAPE_AT.k})`}>
          <CassetteArt name="seat" side={side} />
        </g>
      </g>

      {/* the lid: outer face (frame + smoked window) and inner face, swapped past vertical */}
      <g data-p="lid">
        <g data-p="lid-out">
          <path d="M42 50 H318 a12 12 0 0 1 12 12 V250 H30 V62 a12 12 0 0 1 12 -12Z M54 64 H306 a8 8 0 0 1 8 8 V218 a8 8 0 0 1 -8 8 H54 a8 8 0 0 1 -8 -8 V72 a8 8 0 0 1 8 -8Z" fillRule="evenodd" fill={`url(#${id}m)`} stroke="#5d616a" strokeWidth="1.2" />
          <rect x="46" y="64" width="268" height="162" rx="8" fill="#1c1b21" opacity=".3" />
          <rect x="46" y="64" width="268" height="162" rx="8" fill={`url(#${id}glass)`} />
          <rect x="165" y="50" width="30" height="7" rx="2" fill="#a3a7b0" />
          {[170, 176, 182, 188].map((x) => (
            <path key={x} d={`M${x} 51.5 V55.5`} stroke="#6b6f78" strokeWidth="1" />
          ))}
          <rect x="46" y="234" width="268" height="4" fill="#53b3c9" />
          <rect x="46" y="238" width="268" height="1.6" fill="#e0459b" />
          <path d="M44 51.6 H316" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".85" />
          <path d="M31.6 62 V246" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity=".6" />
        </g>
        <g data-p="lid-in" visibility="hidden">
          <path d="M42 50 H318 a12 12 0 0 1 12 12 V250 H30 V62 a12 12 0 0 1 12 -12Z" fill={`url(#${id}mi)`} stroke="#5d616a" strokeWidth="1.2" />
          <rect x="52" y="70" width="256" height="150" rx="6" fill="#6b6f78" />
          <rect x="72" y="88" width="216" height="110" rx="6" fill="#1c1b21" opacity=".45" />
          <path d="M84 80 C120 92 150 92 180 80 C210 92 240 92 276 80" stroke="#c9ccd2" strokeWidth="2.4" fill="none" />
        </g>
      </g>

      {/* body print under the lid */}
      <LogoEmboss x={30} y={258} size={20} fill="#3a3942" light="#55545e" />
      <text x="58" y="273" style={FONT_BLACK} fontSize="9" fill="#8e929b" letterSpacing="1.6">
        STEREO CASSETTE PLAYER
      </text>
      <text x="330" y="273" style={FONT_BLACK} fontSize="9" fill="#53b3c9" textAnchor="end" letterSpacing="1.2">
        A ⇄ B
      </text>
      <rect x="10" y="24" width="340" height="266" rx="18" fill={`url(#${id}g)`} pointerEvents="none" />
      <path d="M28 25.4 H332" stroke="#fff" strokeOpacity=".35" strokeWidth="1.4" strokeLinecap="round" />

      {/* the tape in the hand, above everything; `fly` carries it in from the desk (FLIP) */}
      <g data-p="fly">
        <g data-p="held" visibility={loaded ? "hidden" : "visible"} filter={`url(#${id}sh0)`} data-sh0={`url(#${id}sh0)`} data-sh1={`url(#${id}sh1)`}>
          <g transform={`translate(${TAPE_AT.x} ${TAPE_AT.y}) scale(${TAPE_AT.k})`}>
            <CassetteArt name="held" side={side} />
            <rect data-p="box" x="0" y="0" width="100" height="64" fill="none" />
          </g>
        </g>
      </g>
    </svg>
  );
}
