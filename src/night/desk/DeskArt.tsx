"use client";

// Night Desk copy of components/desk/DeskArt.tsx: same art, assets through asset() so the
// export works from a sub-path, styles in a CSS module.
// The objects on the Desk, drawn as "pre-rendered" props: shells with a light from the top
// left and a specular edge (P3), dressed in each project's real label art and palette (P4).
// Lighting gradients live only on the objects; interface surfaces stay flat.

import { useId, useSyncExternalStore } from "react";
import type { ArtKind as DeskObjectKind } from "../content/layout";
import { asset } from "../asset";
import s from "./DeskArt.module.css";

const RES = asset("resources/desk");

// SVG ids must be unique per instance and safe inside url(#...)
function useSvgId() {
  return "d" + useId().replace(/[^a-zA-Z0-9]/g, "");
}

const noSubscribe = () => () => {};
const readDpr = () => window.devicePixelRatio || 1;

function Cassette() {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 100 64" className={s.svg} aria-hidden="true">
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
      </defs>
      {/* shell */}
      <rect x=".5" y=".5" width="99" height="63" rx="4" fill={`url(#${id}s)`} stroke="#8a6c17" strokeWidth=".8" />
      {/* label recess and paper label */}
      <rect x="5.2" y="3.9" width="89.6" height="42" rx="2.6" fill="#b8962a" opacity=".55" />
      <rect x="6" y="4.6" width="88" height="40.4" rx="2" fill="#f1ead6" />
      <rect x="6" y="21" width="88" height="2.2" fill="#e0459b" />
      <rect x="6" y="23.2" width="88" height="1.1" fill="#53b3c9" />
      <text x="12.2" y="18.2" className={s.svgBlack} fontSize="12.5" fill="#e0459b" textAnchor="middle">
        A
      </text>
      <image href={`${RES}/crossfader-logo.png`} x="19.5" y="6" width="68" height="14" preserveAspectRatio="xMidYMid meet" />
      <text x="50" y="43.2" className={s.svgPixel} fontSize="2.5" fill="#2e2828" textAnchor="middle" letterSpacing=".25">
        FLIP THE SIDE ◆ REMIX THE SONG
      </text>
      {/* tape window: purple frame, smoked plastic, two reels */}
      <rect x="25.6" y="25.2" width="48.8" height="14.4" rx="7.2" fill="#8233c4" />
      <rect x="27" y="26.4" width="46" height="12" rx="6" fill="#2e2828" />
      <g clipPath={`url(#${id}c)`}>
        <circle cx="37" cy="32.4" r="8.2" fill="#4a3226" />
        <circle cx="63" cy="32.4" r="5.4" fill="#4a3226" />
        <rect x="27" y="37.4" width="46" height=".5" fill="#4a3226" />
      </g>
      {[37, 63].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="32.4" r="3.3" fill="#f1ead6" />
          <circle cx={cx} cy="32.4" r="1.7" fill="#2e2828" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <rect key={a} x={cx - 0.35} y={32.4 - 1.9} width=".7" height="1" fill="#f1ead6" transform={`rotate(${a} ${cx} 32.4)`} />
          ))}
        </g>
      ))}
      <rect x="27" y="26.4" width="46" height="12" rx="6" fill={`url(#${id}w)`} />
      {/* head opening at the bottom */}
      <path d="M20 63.5 L24.5 49.5 H75.5 L80 63.5 Z" fill="#d7b23a" stroke="#8a6c17" strokeWidth=".6" />
      <path d="M25 50.1 H75" stroke="#fff4c4" strokeWidth=".6" opacity=".8" />
      <circle cx="31.5" cy="57.5" r="1.9" fill="#3a2e10" />
      <circle cx="68.5" cy="57.5" r="1.9" fill="#3a2e10" />
      <rect x="44" y="55" width="3.4" height="4.2" rx=".6" fill="#3a2e10" />
      <rect x="52.6" y="55" width="3.4" height="4.2" rx=".6" fill="#3a2e10" />
      {/* screws */}
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
      {/* light: broad sheen plus the specular edge along the top and left */}
      <rect x=".5" y=".5" width="99" height="63" rx="4" fill={`url(#${id}g)`} />
      <path d="M4.5 1.25 H95.5" stroke="#fffbe6" strokeWidth=".9" strokeLinecap="round" />
      <path d="M1.25 4.5 V59" stroke="#fffbe6" strokeWidth=".55" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

// The label is pixel art (160×144, 4 tones), so it sits in HTML at an integer scale of
// device pixels with nearest-neighbour sampling (P1), cropped by its sticker if needed.
function GbCart({ scale }: { scale: number }) {
  const id = useSvgId();
  const dpr = useSyncExternalStore(noSubscribe, readDpr, () => 1);
  const innerW = 46 * scale;
  // round up when the sticker would crop less than a fifth (only dark sky at the edges)
  const fit = (innerW * dpr) / 160;
  const k = Math.max(1, Math.ceil(fit) <= fit * 1.2 ? Math.ceil(fit) : Math.floor(fit));
  const imgW = (160 * k) / dpr;
  return (
    <>
      <svg viewBox="0 0 64 72" className={s.svg} aria-hidden="true">
        <defs>
          <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d3cdc2" />
            <stop offset="1" stopColor="#aba496" />
          </linearGradient>
          <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".35" />
            <stop offset=".35" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M3 .5 H52 L63.5 12 V69 a2.5 2.5 0 0 1 -2.5 2.5 H3 a2.5 2.5 0 0 1 -2.5 -2.5 V3 a2.5 2.5 0 0 1 2.5 -2.5Z"
          fill={`url(#${id}s)`}
          stroke="#6f685a"
          strokeWidth=".7"
        />
        {/* grip grooves */}
        {[4, 6.4, 8.8].map((y) => (
          <g key={y}>
            <path d={`M6 ${y} H46`} stroke="#8f887b" strokeWidth=".9" strokeLinecap="round" />
            <path d={`M6 ${y + 0.6} H46`} stroke="#f2eee6" strokeWidth=".4" strokeLinecap="round" opacity=".8" />
          </g>
        ))}
        {/* label recess */}
        <rect x="6.4" y="12.9" width="51.2" height="47.2" rx="1.6" fill="#958e80" />
        <path d="M7 60.4 H57.2 V13.4" stroke="#e6e1d7" strokeWidth=".5" fill="none" />
        {/* embossed arrow */}
        <path d="M28.5 64 H35.5 L32 68.4 Z" fill="#9e9789" />
        <path d="M28.9 64.5 H35.1" stroke="#ece8df" strokeWidth=".4" />
        <path d="M3 .5 H52 L63.5 12 V69 a2.5 2.5 0 0 1 -2.5 2.5 H3 a2.5 2.5 0 0 1 -2.5 -2.5 V3 a2.5 2.5 0 0 1 2.5 -2.5Z" fill={`url(#${id}g)`} />
        <path d="M3.5 1.25 H51.6 L62.7 12.3" stroke="#fbf9f4" strokeWidth=".8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M1.25 3.5 V68" stroke="#fbf9f4" strokeWidth=".5" strokeLinecap="round" opacity=".7" />
      </svg>
      <span className={s.gbSticker} style={{ left: `${(7.3 / 64) * 100}%`, top: `${(13.8 / 72) * 100}%`, width: `${(49.4 / 64) * 100}%`, height: `${(45.4 / 72) * 100}%` }}>
        <span className={s.gbScreen}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${RES}/galactic-news-cover.png`} alt="" width={imgW} height={(imgW * 144) / 160} draggable={false} />
        </span>
      </span>
    </>
  );
}

function GbaCart() {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 80 52" className={s.svg} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#62636e" />
          <stop offset="1" stopColor="#3a3b43" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".3" />
          <stop offset=".3" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".4" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M4 .5 H76 a3.5 3.5 0 0 1 3.5 3.5 V49 a2.5 2.5 0 0 1 -2.5 2.5 H46 L44.5 50 H35.5 L34 51.5 H3 a2.5 2.5 0 0 1 -2.5 -2.5 V4 a3.5 3.5 0 0 1 3.5 -3.5Z"
        fill={`url(#${id}s)`}
        stroke="#1f2025"
        strokeWidth=".7"
      />
      {/* top grip */}
      <rect x="9" y="2.4" width="62" height="4.6" rx="1.4" fill="#4b4c56" />
      {[3.8, 5.6].map((y) => (
        <path key={y} d={`M12 ${y} H68`} stroke="#2c2d33" strokeWidth=".5" />
      ))}
      {/* label recess and paper label in the logo's own palette */}
      <rect x="5.4" y="8.6" width="69.2" height="38.8" rx="1.6" fill="#28292e" />
      <rect x="6.2" y="9.4" width="67.6" height="37.2" rx="1" fill="#fbf8fb" />
      <image href={`${RES}/minamoto-logo.png`} x="9" y="11" width="62" height="24.6" preserveAspectRatio="xMidYMid meet" />
      <rect x="6.2" y="37.2" width="67.6" height="9.4" fill="#7a0a96" />
      <rect x="6.2" y="37.2" width="67.6" height=".7" fill="#e020c0" />
      <text x="40" y="43.7" className={s.svgBlack} fontSize="4.6" fill="#fbf8fb" textAnchor="middle" letterSpacing=".35">
        PROJECT MINAMOTO
      </text>
      <rect x="6.2" y="9.4" width="67.6" height="37.2" rx="1" fill={`url(#${id}p)`} />
      <path
        d="M4 .5 H76 a3.5 3.5 0 0 1 3.5 3.5 V49 a2.5 2.5 0 0 1 -2.5 2.5 H46 L44.5 50 H35.5 L34 51.5 H3 a2.5 2.5 0 0 1 -2.5 -2.5 V4 a3.5 3.5 0 0 1 3.5 -3.5Z"
        fill={`url(#${id}g)`}
      />
      <path d="M4.2 1.25 H75.8" stroke="#c9cad3" strokeWidth=".8" strokeLinecap="round" />
      <path d="M1.25 4.2 V48" stroke="#c9cad3" strokeWidth=".5" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}

// CSS rather than SVG: the data side's rainbow is a conic sweep of light
function Cd() {
  return (
    <span className={s.cd} aria-hidden="true">
      <span className={s.cdDisc} />
      <span className={s.cdFace}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.cdLogo} src={`${RES}/haunt-record-logo.png`} alt="" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.cdCrown} src={`${RES}/haunt-record-crown.png`} alt="" draggable={false} />
        <span className={s.cdPrint}>DISC 1</span>
      </span>
      <span className={s.cdHub} />
      <span className={s.cdSheen} />
    </span>
  );
}

function Booster() {
  const id = useSvgId();
  const zig = Array.from({ length: 21 }, (_, i) => [i * 3, i % 2 ? 1.6 : 0]);
  return (
    <svg viewBox="0 0 104 112" className={s.svg} aria-hidden="true">
      <defs>
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
      </defs>

      {/* the sealed pack, leaning a little */}
      <g transform="rotate(-4 30 54)">
        <rect x="0" y="6" width="60" height="90" fill={`url(#${id}f)`} />
        {[12, 24, 41, 50].map((x) => (
          <path key={x} d={`M${x} 9 V93`} stroke="#fff" strokeOpacity=".09" strokeWidth="1.2" />
        ))}
        <rect x="6" y="16" width="48" height="32" rx="1.5" fill="#102f41" />
        <g clipPath={`url(#${id}a)`}>
          <image href={`${RES}/ptcg-cube-playmat.jpg`} x="-2" y="14" width="64" height="37" preserveAspectRatio="xMinYMid slice" />
        </g>
        <rect x="6" y="16" width="48" height="32" rx="1.5" fill="none" stroke="#f2cf3f" strokeWidth="1.3" />
        <text x="30" y="60" className={s.svgBlack} fontSize="7.8" fill="#f2cf3f" stroke="#13234f" strokeWidth="1.3" paintOrder="stroke" textAnchor="middle">
          PTCG CUBE
        </text>
        <text x="30" y="68" className={s.svgJp} fontSize="4.4" fill="#fce8cd" textAnchor="middle">
          ブースターパック
        </text>
        <text x="30" y="77" className={s.svgPixel} fontSize="3.4" fill="#fce8cd" textAnchor="middle" letterSpacing=".3">
          ROGUELIKE ◆ CO-OP
        </text>
        {/* crimped ends */}
        <path d={`M0 8 ${zig.map(([x, y]) => `L${x} ${y}`).join(" ")} V8 Z`} fill={`url(#${id}c)`} />
        <path d={`M0 94 H60 ${[...zig].reverse().map(([x, y]) => `L${x} ${102 - y}`).join(" ")} Z`} fill={`url(#${id}c)`} />
        {Array.from({ length: 30 }, (_, i) => (
          <g key={i} stroke="#9a8d74" strokeWidth=".35">
            <path d={`M${1 + i * 2} 2 V7.4`} />
            <path d={`M${1 + i * 2} 94.6 V100`} />
          </g>
        ))}
        <rect x="0" y="6" width="60" height="90" fill={`url(#${id}h)`} />
        <path d="M.6 8.5 V93.5" stroke="#fff" strokeOpacity=".75" strokeWidth=".7" />
      </g>

      {/* the pulled card, WotC era, resting on the pack */}
      <g transform="translate(52 36) rotate(8 25 35)">
        <rect x="0" y="0" width="50" height="70" rx="2.6" fill="#f2cf3f" stroke="#b8932c" strokeWidth=".4" />
        <rect x="2.8" y="2.8" width="44.4" height="64.4" rx="1" fill="#efe9d6" />
        <text x="5" y="8.6" className={s.svgBlack} fontSize="4.2" fill="#1b1b1b">
          PTCG Cube
        </text>
        <text x="45" y="8.6" className={s.svgBlack} fontSize="3.4" fill="#c4392b" textAnchor="end">
          60 HP
        </text>
        <rect x="4.4" y="10.4" width="41.2" height="26.2" fill="#c9a640" />
        <g clipPath={`url(#${id}b)`}>
          <image href={`${RES}/ptcg-cube-playmat.jpg`} x="-4" y="11" width="58" height="25" preserveAspectRatio="xMidYMid slice" />
        </g>
        <rect x="9" y="37.6" width="32" height="2.6" fill="#d9bd5c" />
        {[
          ["Roguelike", 46],
          ["Co-op", 55.5],
        ].map(([name, y]) => (
          <g key={name as string}>
            <circle cx="7.6" cy={(y as number) - 1.2} r="1.5" fill="#c4392b" stroke="#1b1b1b" strokeWidth=".25" />
            <text x="10.8" y={y as number} className={s.svgBlack} fontSize="3.6" fill="#1b1b1b">
              {name}
            </text>
            <path d={`M5 ${(y as number) + 2.4} H45`} stroke="#b9ab88" strokeWidth=".4" />
          </g>
        ))}
        <text x="5" y="64.6" className={s.svgGrotesk} fontSize="2" fill="#3a3a3a">
          Illus. Omar Golinelli
        </text>
        <rect x="0" y="0" width="50" height="70" rx="2.6" fill={`url(#${id}h)`} />
        <path d="M2.6 .6 H47.4" stroke="#fff6cf" strokeWidth=".6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export default function DeskArt({ kind, scale }: { kind: DeskObjectKind; scale: number }) {
  switch (kind) {
    case "cassette":
      return <Cassette />;
    case "gb-cart":
      return <GbCart scale={scale} />;
    case "gba-cart":
      return <GbaCart />;
    case "cd":
      return <Cd />;
    case "booster":
      return <Booster />;
  }
}
