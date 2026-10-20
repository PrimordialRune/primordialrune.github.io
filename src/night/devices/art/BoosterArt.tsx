"use client";

// PTCG Cube: the desk's own blue holo booster (desk/DeskArt.tsx Booster, copied line for
// line so the pack you clicked is the pack that tears), with its pulled card leaning on it,
// torn open over the real playmat; the cards are dealt onto the five bench slots printed on
// it, the pulled one onto the middle slot.
// viewBox 0 -40 640 420; the mat lies at 0,0 640x372 (its own pixel size). The desk art
// (104 x 112 desk units) sits at PACK_AT, scaled PACK_K.
import { asset } from "../../asset";
import { FONT_BLACK, FONT_KANA, FONT_MACHINE, ShadowFilter, useSvgId } from "./shared";

export const BOOSTER_VIEW = { x: 0, y: -40, w: 640, h: 420 } as const;
/** where the desk booster art box (104 x 112) sits in the scene, and its scale */
export const PACK_AT = { x: 266, y: 0, k: 1.8 } as const;
export const DESK_BOX = { w: 104, h: 112 } as const;
/** the pack's centre in the scene (the desk pack is 60 x 102 at the box's left) */
export const PACK = { cx: PACK_AT.x + 30 * PACK_AT.k, cy: PACK_AT.y + 51 * PACK_AT.k } as const;
/** the pulled card's centre in desk units (translate(52 36), 50 x 70) */
export const PULLED = { cx: 77, cy: 71, rot: 8 } as const;
/** the pack's lean on the desk, around its pivot (desk units) */
export const PACK_LEAN = { rot: -4, origin: "30 54" } as const;
/** bench cards are 52 scene units wide; the desk card is 50 desk units */
export const BENCH_CARD_SCALE = 1.04;

/** The five bench slots on the playmat */
export const BENCH = [142.5, 232, 319.5, 407.5, 496.5].map((x, i) => ({ x, y: 294, r: [-3, 2, -1, 3, -2][i] }));
/** the slot the pulled card goes to */
export const PULLED_SLOT = 2;

const RES = asset("resources/desk");
const MAT = `${RES}/ptcg-cube-playmat.jpg`;
const zig = Array.from({ length: 21 }, (_, i) => [i * 3, i % 2 ? 1.6 : 0]);
/** the top crimp, which is the tear strip */
const CRIMP_TOP = `M0 8 ${zig.map(([x, y]) => `L${x} ${y}`).join(" ")} V8 Z`;
const CUTS = [15, 30, 45];

/** The desk's pulled card (WotC era), in its own 50 x 70 space */
function DeskCard({ id }: { id: string }) {
  return (
    <g>
      <rect x="0" y="0" width="50" height="70" rx="2.6" fill="#f2cf3f" stroke="#b8932c" strokeWidth=".4" />
      <rect x="2.8" y="2.8" width="44.4" height="64.4" rx="1" fill="#efe9d6" />
      <text x="5" y="8.6" style={FONT_BLACK} fontSize="4.2" fill="#1b1b1b">
        PTCG Cube
      </text>
      <text x="45" y="8.6" style={FONT_BLACK} fontSize="3.4" fill="#c4392b" textAnchor="end">
        60 HP
      </text>
      <rect x="4.4" y="10.4" width="41.2" height="26.2" fill="#c9a640" />
      <g clipPath={`url(#${id}b)`}>
        <image href={MAT} x="-4" y="11" width="58" height="25" preserveAspectRatio="xMidYMid slice" />
      </g>
      <rect x="9" y="37.6" width="32" height="2.6" fill="#d9bd5c" />
      {(
        [
          ["Roguelike", 46],
          ["Co-op", 55.5],
        ] as const
      ).map(([name, y]) => (
        <g key={name}>
          <circle cx="7.6" cy={y - 1.2} r="1.5" fill="#c4392b" stroke="#1b1b1b" strokeWidth=".25" />
          <text x="10.8" y={y} style={FONT_BLACK} fontSize="3.6" fill="#1b1b1b">
            {name}
          </text>
          <path d={`M5 ${y + 2.4} H45`} stroke="#b9ab88" strokeWidth=".4" />
        </g>
      ))}
      <text x="5" y="64.6" style={{ fontFamily: "var(--f-omar), sans-serif", fontWeight: 300 }} fontSize="2" fill="#3a3a3a">
        Illus. Omar Golinelli
      </text>
      <rect x="0" y="0" width="50" height="70" rx="2.6" fill={`url(#${id}h)`} />
      <path d="M2.6 .6 H47.4" stroke="#fff6cf" strokeWidth=".6" strokeLinecap="round" />
    </g>
  );
}

/** The desk's sealed pack, straight, in its own 60 x 102 space (minus the top crimp) */
function DeskPack({ id }: { id: string }) {
  return (
    <g>
      <rect x="0" y="6" width="60" height="90" fill={`url(#${id}f)`} />
      {[12, 24, 41, 50].map((x) => (
        <path key={x} d={`M${x} 9 V93`} stroke="#fff" strokeOpacity=".09" strokeWidth="1.2" />
      ))}
      <rect x="6" y="16" width="48" height="32" rx="1.5" fill="#102f41" />
      <g clipPath={`url(#${id}a)`}>
        <image href={MAT} x="-2" y="14" width="64" height="37" preserveAspectRatio="xMinYMid slice" />
      </g>
      <rect x="6" y="16" width="48" height="32" rx="1.5" fill="none" stroke="#f2cf3f" strokeWidth="1.3" />
      <text x="30" y="60" style={FONT_BLACK} fontSize="7.8" fill="#f2cf3f" stroke="#13234f" strokeWidth="1.3" paintOrder="stroke" textAnchor="middle">
        PTCG CUBE
      </text>
      <text x="30" y="68" style={FONT_KANA} fontSize="4.4" fill="#fce8cd" textAnchor="middle">
        ブースターパック
      </text>
      <text x="30" y="77" style={FONT_MACHINE} fontSize="3.4" fill="#fce8cd" textAnchor="middle" letterSpacing=".3">
        ROGUELIKE ◆ CO-OP
      </text>
      {/* the bottom crimp (the top one is the tear strip, drawn by the scene) */}
      <path d={`M0 94 H60 ${[...zig].reverse().map(([x, y]) => `L${x} ${102 - y}`).join(" ")} Z`} fill={`url(#${id}c)`} />
      {Array.from({ length: 30 }, (_, i) => (
        <path key={i} d={`M${1 + i * 2} 94.6 V100`} stroke="#9a8d74" strokeWidth=".35" />
      ))}
      <rect x="0" y="6" width="60" height="90" fill={`url(#${id}h)`} />
      <path d="M.6 8.5 V93.5" stroke="#fff" strokeOpacity=".75" strokeWidth=".7" />
    </g>
  );
}

export function BoosterScene() {
  const id = useSvgId();
  const k = PACK_AT.k;
  return (
    <svg viewBox={`${BOOSTER_VIEW.x} ${BOOSTER_VIEW.y} ${BOOSTER_VIEW.w} ${BOOSTER_VIEW.h}`} aria-hidden="true">
      <defs>
        {/* the desk booster's own gradients and clips */}
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1e3f8f" />
          <stop offset=".42" stopColor="#2b62a6" />
          <stop offset=".55" stopColor="#4eb99f" />
          <stop offset=".7" stopColor="#24509a" />
          <stop offset="1" stopColor="#1a3678" />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b9ab92" />
          <stop offset=".5" stopColor="#ded3bd" />
          <stop offset="1" stopColor="#b2a48a" />
        </linearGradient>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="1">
          <stop offset=".25" stopColor="#fff" stopOpacity="0" />
          <stop offset=".42" stopColor="#fff" stopOpacity=".45" />
          <stop offset=".5" stopColor="#4eb99f" stopOpacity=".25" />
          <stop offset=".62" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}a`}>
          <rect x="6" y="16" width="48" height="32" rx="1.5" />
        </clipPath>
        <clipPath id={`${id}b`}>
          <rect x="5" y="11" width="40" height="25" />
        </clipPath>
        <clipPath id={`${id}mat`}>
          <rect x="0" y="0" width="640" height="372" rx="14" />
        </clipPath>
        {/* the tear: the top crimp rips a quarter at a time along its seam */}
        <g id={`${id}strip`}>
          <path d={CRIMP_TOP} fill={`url(#${id}c)`} />
          {Array.from({ length: 30 }, (_, i) => (
            <path key={i} d={`M${1 + i * 2} 2 V7.4`} stroke="#9a8d74" strokeWidth=".35" />
          ))}
        </g>
        {CUTS.map((c, i) => (
          <g key={c}>
            <clipPath id={`${id}l${i + 1}`}>
              <rect x="-1" y="-3" width={c + 1} height="12" />
            </clipPath>
            <clipPath id={`${id}r${i + 1}`}>
              <rect x={c} y="-3" width={62 - c} height="12" />
            </clipPath>
          </g>
        ))}
        <ShadowFilter id={`${id}sh0`} lift={0} />
        <ShadowFilter id={`${id}sh1`} lift={1} />
        <ShadowFilter id={`${id}csh`} lift={0} />
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

      {/* four more cards wait inside the pack (behind its front) */}
      {BENCH.map((b, i) =>
        i === PULLED_SLOT ? null : (
          <g key={i} data-p="card" data-i={i} transform={`translate(${b.x} ${b.y})`}>
            <g data-p="card-rot" transform={`rotate(${b.r})`}>
              <g transform={`scale(${BENCH_CARD_SCALE}) translate(-25 -35)`} filter={`url(#${id}csh)`}>
                <DeskCard id={id} />
              </g>
            </g>
          </g>
        ),
      )}

      {/* the desk booster as it lay on the mat; `fly` carries it in from there (FLIP) */}
      <g data-p="fly">
        <g transform={`translate(${PACK_AT.x} ${PACK_AT.y}) scale(${k})`}>
          <rect data-p="box" x="0" y="0" width={DESK_BOX.w} height={DESK_BOX.h} fill="none" />
          <g data-p="pack" data-sh0={`url(#${id}sh0)`} data-sh1={`url(#${id}sh1)`} filter={`url(#${id}sh0)`}>
            <DeskPack id={id} />
            {/* the tear strip, 5 states: sealed, torn a quarter at a time, gone */}
            <g data-p="strip-0">
              <use href={`#${id}strip`} />
            </g>
            {CUTS.map((c, i) => (
              <g key={c} data-p={`strip-${i + 1}`} visibility="hidden">
                <rect x="0" y="6" width={c} height="2.4" fill="#0b1a3a" />
                <use href={`#${id}strip`} clipPath={`url(#${id}r${i + 1})`} />
                <g transform={`rotate(${-8 * (i + 1)} ${c} 8)`}>
                  <use href={`#${id}strip`} clipPath={`url(#${id}l${i + 1})`} />
                </g>
              </g>
            ))}
            <g data-p="strip-4" visibility="hidden">
              <rect x="0" y="6" width="60" height="2.4" fill="#0b1a3a" />
              <g transform="translate(-26 -14) rotate(-24 0 8)">
                <use href={`#${id}strip`} />
              </g>
            </g>
          </g>
          {/* the pulled card, leaning on the pack as on the desk (the pack's -4deg lean is set
              by the timeline, around its desk pivot 30 54) */}
          <g data-p="pulled">
            <g transform={`translate(52 36) rotate(${PULLED.rot} 25 35)`}>
              <DeskCard id={id} />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
