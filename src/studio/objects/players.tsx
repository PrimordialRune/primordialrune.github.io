"use client";

// The hardware each object goes into (P3: the object decides its transition, the player makes it
// believable). Shells are lit like the objects: a light from the top left, a specular edge along
// the top and left, and each player uses its own medium's declared palette. Light is free (P4);
// these are objects, not interface surfaces.

import { useId } from "react";

function useSvgId() {
  return "p" + useId().replace(/[^a-zA-Z0-9]/g, "");
}

/** The upper half of a Game Boy (DMG), front view: the cart drops in behind its top edge */
export function Dmg() {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 100 100" className="pl-svg" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d3cdc2" />
          <stop offset="1" stopColor="#aba496" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset=".4" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* shell, with the slot's dark mouth along the top edge */}
      <path d="M3 4 H97 V100 H3 Z" fill={`url(#${id}s)`} stroke="#6f685a" strokeWidth=".6" />
      <rect x="18" y="0" width="64" height="5" rx="1" fill="#3c3830" />
      <path d="M18 5 H82" stroke="#f2eee6" strokeWidth=".8" />
      {/* screen bezel (the screen itself is HTML, at integer scale) */}
      <rect x="9" y="11" width="82" height="80" rx="3" fill="#6f685a" />
      {/* the screen while it's off */}
      <rect x="14" y="16" width="72" height="66" rx="1" fill="#958e80" />
      <path d="M14 16 H86" stroke="#5e584c" strokeWidth=".8" />
      {/* light */}
      <path d="M3 4 H97 V100 H3 Z" fill={`url(#${id}g)`} />
      <path d="M3.4 6 V99" stroke="#fbf9f4" strokeWidth=".7" opacity=".7" />
      <path d="M3 4.4 H18 M82 4.4 H97" stroke="#fbf9f4" strokeWidth=".7" />
    </svg>
  );
}

/** A Game Boy Advance, front view, with its cartridge slot open on the right edge */
export function Gba() {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 160 100" className="pl-svg" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#62636e" />
          <stop offset="1" stopColor="#3a3b43" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* the wide shell, rounded wings */}
      <path d="M22 6 H138 C152 6 158 18 158 50 C158 82 152 94 138 94 H22 C8 94 2 82 2 50 C2 18 8 6 22 6 Z" fill={`url(#${id}s)`} stroke="#1f2025" strokeWidth=".8" />
      {/* shoulder buttons */}
      <path d="M14 8 Q22 2 40 3 V7 Z" fill="#4b4c56" />
      <path d="M146 8 Q138 2 120 3 V7 Z" fill="#4b4c56" />
      {/* the screen glass */}
      <rect x="40" y="18" width="80" height="58" rx="4" fill="#28292e" />
      <rect x="47" y="23" width="66" height="46" rx="1" fill="#1f2025" />
      {/* d-pad and buttons */}
      <path d="M17 44 h6 v-6 h6 v6 h6 v6 h-6 v6 h-6 v-6 h-6 Z" fill="#28292e" />
      <circle cx="136" cy="42" r="5" fill="#7a0a96" />
      <circle cx="126" cy="52" r="5" fill="#7a0a96" />
      {/* the cartridge slot's mouth on the top edge */}
      <rect x="44" y="3" width="72" height="5" rx="1" fill="#1f2025" />
      <path d="M44 8.2 H116" stroke="#c9cad3" strokeWidth=".6" />
      {/* light */}
      <path d="M22 6 H138 C152 6 158 18 158 50 C158 82 152 94 138 94 H22 C8 94 2 82 2 50 C2 18 8 6 22 6 Z" fill={`url(#${id}g)`} />
      <path d="M24 7 H136" stroke="#c9cad3" strokeWidth=".9" strokeLinecap="round" />
      <path d="M40.5 18.5 H119.5" stroke="#62636e" strokeWidth=".6" />
    </svg>
  );
}

/** A cassette deck's face: the tape shows through the smoked window, keys underneath */
export function Deck() {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 100 80" className="pl-svg" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a3f3f" />
          <stop offset="1" stopColor="#2e2828" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".18" />
          <stop offset=".4" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* the face with the window cut out (even-odd), so the tape behind shows through */}
      <path
        fillRule="evenodd"
        d="M2 2 H98 V78 H2 Z M17 7 H83 a3 3 0 0 1 3 3 V49 a3 3 0 0 1 -3 3 H17 a3 3 0 0 1 -3 -3 V10 a3 3 0 0 1 3 -3 Z"
        fill={`url(#${id}s)`}
        stroke="#1d1818"
        strokeWidth=".6"
      />
      <path d="M17 7 H83 a3 3 0 0 1 3 3 V49 a3 3 0 0 1 -3 3 H17 a3 3 0 0 1 -3 -3 V10 a3 3 0 0 1 3 -3 Z" fill="none" stroke="#8233c4" strokeWidth="1" />
      {/* transport keys: rewind, play, fast-forward, stop, eject */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${18 + i * 13.5} 58)`}>
          <rect width="11" height="12" rx="1.4" fill="#d9d2c4" stroke="#1d1818" strokeWidth=".4" />
          <path d="M.6 .8 H10.4" stroke="#fff" strokeWidth=".5" opacity=".8" />
          <path
            d={
              ["M7.5 4 L4.5 6 L7.5 8 Z M4.5 4 L1.5 6 L4.5 8 Z", "M4 3.6 L8 6 L4 8.4 Z", "M3.5 4 L6.5 6 L3.5 8 Z M6.5 4 L9.5 6 L6.5 8 Z", "M3.8 3.8 H7.2 V7.2 H3.8 Z", "M3 7 H8 L5.5 4 Z M3 8.2 H8"][i]
            }
            fill="#2e2828"
            stroke={i === 4 ? "#2e2828" : "none"}
            strokeWidth=".5"
          />
        </g>
      ))}
      {/* light: sheen and the specular top and left edges */}
      <path d="M2 2 H98 V78 H2 Z" fill={`url(#${id}g)`} pointerEvents="none" />
      <path d="M2.5 2.5 H97.5" stroke="#a89c9c" strokeWidth=".6" />
      <path d="M2.5 2.5 V77.5" stroke="#a89c9c" strokeWidth=".4" opacity=".7" />
    </svg>
  );
}

/** Smoked glass over the deck's window, in front of the tape */
export function DeckGlass() {
  return (
    <svg viewBox="0 0 100 80" className="pl-svg" preserveAspectRatio="none" aria-hidden="true">
      <path d="M17 7 H83 a3 3 0 0 1 3 3 V49 a3 3 0 0 1 -3 3 H17 a3 3 0 0 1 -3 -3 V10 a3 3 0 0 1 3 -3 Z" fill="#2e2828" opacity=".28" />
      <path d="M18 9 L40 9 L26 50 L16 50 Z" fill="#fff" opacity=".07" />
    </svg>
  );
}

/** A CD player seen from above: a silver lid with a round window; the tray slides out to the right */
export function CdPlayer() {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 100 100" className="pl-svg" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef2f4" />
          <stop offset=".5" stopColor="#c3ccd1" />
          <stop offset="1" stopColor="#b9c3c9" />
        </linearGradient>
      </defs>
      <path
        fillRule="evenodd"
        d="M4 2 H96 a2 2 0 0 1 2 2 V96 a2 2 0 0 1 -2 2 H4 a2 2 0 0 1 -2 -2 V4 a2 2 0 0 1 2 -2 Z M50 13 a35 35 0 1 0 0.01 0 Z"
        fill={`url(#${id}s)`}
        stroke="#7d878d"
        strokeWidth=".6"
      />
      <circle cx="50" cy="48" r="35" fill="none" stroke="#7d878d" strokeWidth="1.2" />
      {/* the display */}
      <rect x="62" y="88" width="30" height="7" rx="1" fill="#1f2c39" />
      <rect x="80" y="90" width="2" height="3" fill="#48a8a0" />
      <rect x="84" y="90" width="2" height="3" fill="#48a8a0" />
      <circle cx="10" cy="91.5" r="2.4" fill="#1f2c39" />
      <path d="M2.5 3 H97.5" stroke="#fff" strokeWidth=".8" />
      <path d="M2.5 3 V97" stroke="#fff" strokeWidth=".5" opacity=".7" />
    </svg>
  );
}

/** The tray: a dark plate with the disc's round recess */
export function CdTray() {
  return (
    <svg viewBox="0 0 100 100" className="pl-svg" preserveAspectRatio="none" aria-hidden="true">
      <rect x="1" y="1" width="98" height="98" rx="4" fill="#1f2c39" stroke="#0f1820" strokeWidth=".8" />
      <circle cx="50" cy="50" r="46" fill="#18232e" />
      <circle cx="50" cy="50" r="10" fill="#0f1820" />
      <path d="M2 2.5 H98" stroke="#48a8a0" strokeWidth=".6" opacity=".6" />
    </svg>
  );
}
