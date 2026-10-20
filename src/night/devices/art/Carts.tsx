"use client";

// The two cartridges as they arrive in a ceremony. Both are redrawn from the desk objects
// (src/components/desk/DeskArt.tsx) at ceremony size, measured in the units of the
// handheld they go into (one unit = one screen pixel), so the Galactic News label is the
// cover at exactly the screen's integer scale.
import { asset } from "../../asset";
import { FONT_BLACK, GrainFilter, useSvgId } from "./shared";
import s from "../devices.module.css";

/** GB-style cart: 208 x 234 units, label window 160 x 144 at (24, 46) */
export const GB_CART = { w: 208, h: 234, labelX: 24, labelY: 46 } as const;

export function GbCartArt() {
  const id = useSvgId();
  const shell = "M8 1 H170 L207 38 V226 a7 7 0 0 1 -7 7 H8 a7 7 0 0 1 -7 -7 V8 a7 7 0 0 1 7 -7Z";
  return (
    <>
      <svg viewBox="0 0 208 234" className={s.fill} aria-hidden="true">
        <defs>
          <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d3cdc2" />
            <stop offset="1" stopColor="#aba496" />
          </linearGradient>
          <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".38" />
            <stop offset=".3" stopColor="#fff" stopOpacity="0" />
            <stop offset=".8" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" stopOpacity=".08" />
          </linearGradient>
        </defs>
        <path d={shell} fill={`url(#${id}s)`} stroke="#6f685a" strokeWidth="1.6" />
        {/* grip grooves */}
        {[11, 19, 27].map((y) => (
          <g key={y}>
            <path d={`M20 ${y} H150`} stroke="#8f887b" strokeWidth="2.8" strokeLinecap="round" />
            <path d={`M20 ${y + 1.8} H150`} stroke="#f2eee6" strokeWidth="1.1" strokeLinecap="round" opacity=".8" />
          </g>
        ))}
        {/* label recess and sticker */}
        <rect x="18.5" y="40.5" width="171" height="155" rx="4" fill="#958e80" />
        <path d="M20 196 H189.5 V42" stroke="#e6e1d7" strokeWidth="1.4" fill="none" />
        <rect x="21" y="43" width="166" height="150" rx="2" fill="#f7ecb9" />
        {/* embossed arrow */}
        <path d="M92 206 H116 L104 221 Z" fill="#9e9789" />
        <path d="M93.5 207.4 H114.5" stroke="#ece8df" strokeWidth="1.1" />
        {/* light: broad sheen and the specular edge facing the lamp */}
        <path d={shell} fill={`url(#${id}g)`} />
        <path d="M9 2.8 H169 L205 38.6" stroke="#fbf9f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M2.8 9 V224" stroke="#fbf9f4" strokeWidth="1.3" strokeLinecap="round" opacity=".7" />
      </svg>
      {/* the label is pixel art: placed in HTML at 1 unit per pixel (integer device scale) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={s.pixel}
        src={asset("resources/desk/galactic-news-cover.png")}
        alt=""
        draggable={false}
        style={{ left: "calc(24 * var(--u))", top: "calc(46 * var(--u))", width: "calc(160 * var(--u))", height: "calc(144 * var(--u))" }}
      />
    </>
  );
}

/** GBA-style cart: 230 x 149.5 units (the desk art's 80 x 52 at 2.875) */
export const GBA_CART = { w: 230, h: 149.5 } as const;

export function GbaCartArt() {
  const id = useSvgId();
  const shell =
    "M4 .5 H76 a3.5 3.5 0 0 1 3.5 3.5 V49 a2.5 2.5 0 0 1 -2.5 2.5 H46 L44.5 50 H35.5 L34 51.5 H3 a2.5 2.5 0 0 1 -2.5 -2.5 V4 a3.5 3.5 0 0 1 3.5 -3.5Z";
  return (
    <svg viewBox="0 0 80 52" className={s.fill} aria-hidden="true">
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
          <stop offset="0" stopColor="#fff" stopOpacity=".26" />
          <stop offset=".4" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <GrainFilter id={`${id}n`} opacity={0.12} scale={2.2} />
      </defs>
      <path d={shell} fill={`url(#${id}s)`} stroke="#28292e" strokeWidth=".6" />
      <rect x="9" y="2.4" width="62" height="4.6" rx="1.4" fill="#4b4c56" />
      {[3.8, 5.6].map((y) => (
        <path key={y} d={`M12 ${y} H68`} stroke="#28292e" strokeWidth=".5" />
      ))}
      <rect x="5.4" y="8.6" width="69.2" height="38.8" rx="1.6" fill="#28292e" />
      {/* the paper label, in the logo's declared palette, with print grain */}
      <g filter={`url(#${id}n)`}>
        <rect x="6.2" y="9.4" width="67.6" height="37.2" rx="1" fill="#ffffff" />
        <image href={asset("resources/desk/minamoto-logo.png")} x="9" y="11" width="62" height="24.6" preserveAspectRatio="xMidYMid meet" />
        <rect x="6.2" y="37.2" width="67.6" height="9.4" fill="#85079d" />
        <rect x="6.2" y="37.2" width="67.6" height=".7" fill="#f500b8" />
        <text x="40" y="43.7" style={FONT_BLACK} fontSize="4.6" fill="#ffffff" textAnchor="middle" letterSpacing=".35">
          PROJECT MINAMOTO
        </text>
      </g>
      <rect x="6.2" y="9.4" width="67.6" height="37.2" rx="1" fill={`url(#${id}p)`} />
      <path d={shell} fill={`url(#${id}g)`} />
      <path d="M4.2 1.25 H75.8" stroke="#c9cad3" strokeWidth=".8" strokeLinecap="round" />
      <path d="M1.25 4.2 V48" stroke="#c9cad3" strokeWidth=".5" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}
