"use client";

// The hardware each object goes into (P3: the object decides its transition, the player makes it
// believable). Shells are lit like the objects: a light from the top left, a specular edge along
// the top and left. Each player keeps to its declared palette (PLAYER_PALETTES in projects.ts);
// white is only light. These are objects, not interface surfaces (P4).

import { useId } from "react";
import { PLAYER_PALETTES } from "../projects";

const { dmg: D, gba: A, deck: K, cd: C } = PLAYER_PALETTES;

function useSvgId() {
  return "p" + useId().replace(/[^a-zA-Z0-9]/g, "");
}

/** A Game Boy (DMG), front view: the cart drops in behind its top edge; d-pad and A/B below */
export function Dmg() {
  const id = useSvgId();
  const shell = "M3 4 H97 V112 Q97 128 79 128 H3 Z";
  return (
    <svg viewBox="0 0 100 130" className="pl-svg" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={D.shellTop} />
          <stop offset="1" stopColor={D.shellBottom} />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset=".4" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* shell (the famous rounded bottom-right corner), with the slot's mouth along the top edge */}
      <path d={shell} fill={`url(#${id}s)`} stroke={D.edge} strokeWidth=".6" />
      <rect x="18" y="0" width="64" height="5" rx="1" fill={D.slot} />
      <path d="M18 5 H82" stroke={D.lip} strokeWidth=".8" />
      {/* screen bezel (the screen itself is HTML, at integer scale) */}
      <rect x="9" y="11" width="82" height="80" rx="3" fill={D.edge} />
      <rect x="14" y="16" width="72" height="66" rx="1" fill={D.screenOff} />
      <path d="M14 16 H86" stroke={D.screenLine} strokeWidth=".8" />
      {/* d-pad */}
      <path d="M15 104 h6 v-6 h6 v6 h6 v6 h-6 v6 h-6 v-6 h-6 Z" fill={D.pad} />
      <path d="M21.4 98.4 h5.2 M15.4 104.4 h5.6" stroke="#fff" strokeOpacity=".3" strokeWidth=".6" />
      {/* B and A, on their slant */}
      <g transform="rotate(-25 77 104)">
        <circle cx="68" cy="105" r="5" fill={D.buttons} />
        <circle cx="83" cy="105" r="5" fill={D.buttons} />
        <circle cx="66.6" cy="103.4" r="1.6" fill="#fff" opacity=".3" />
        <circle cx="81.6" cy="103.4" r="1.6" fill="#fff" opacity=".3" />
      </g>
      {/* select / start */}
      <rect x="36" y="119" width="9" height="2.6" rx="1.3" fill={D.pill} transform="rotate(-25 40.5 120.3)" />
      <rect x="50" y="119" width="9" height="2.6" rx="1.3" fill={D.pill} transform="rotate(-25 54.5 120.3)" />
      {/* light */}
      <path d={shell} fill={`url(#${id}g)`} />
      <path d="M3.4 6 V127" stroke={D.specular} strokeWidth=".7" opacity=".7" />
      <path d="M3 4.4 H18 M82 4.4 H97" stroke={D.specular} strokeWidth=".7" />
    </svg>
  );
}

/** A Game Boy Advance, front view, with its cartridge slot open on the top edge */
export function Gba() {
  const id = useSvgId();
  const shell = "M22 6 H138 C152 6 158 18 158 50 C158 82 152 94 138 94 H22 C8 94 2 82 2 50 C2 18 8 6 22 6 Z";
  return (
    <svg viewBox="0 0 160 100" className="pl-svg" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={A.shellTop} />
          <stop offset="1" stopColor={A.shellBottom} />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={shell} fill={`url(#${id}s)`} stroke={A.edge} strokeWidth=".8" />
      {/* shoulder buttons */}
      <path d="M14 8 Q22 2 40 3 V7 Z" fill={A.shoulder} />
      <path d="M146 8 Q138 2 120 3 V7 Z" fill={A.shoulder} />
      {/* the screen glass */}
      <rect x="40" y="18" width="80" height="58" rx="4" fill={A.glass} />
      <rect x="47" y="23" width="66" height="46" rx="1" fill={A.edge} />
      {/* d-pad and buttons */}
      <path d="M17 44 h6 v-6 h6 v6 h6 v6 h-6 v6 h-6 v-6 h-6 Z" fill={A.glass} />
      <circle cx="136" cy="42" r="5" fill={A.buttons} />
      <circle cx="126" cy="52" r="5" fill={A.buttons} />
      {/* the cartridge slot's mouth on the top edge */}
      <rect x="44" y="3" width="72" height="5" rx="1" fill={A.slot} />
      <path d="M44 8.2 H116" stroke={A.lip} strokeWidth=".6" />
      {/* light */}
      <path d={shell} fill={`url(#${id}g)`} />
      <path d="M24 7 H136" stroke={A.lip} strokeWidth=".9" strokeLinecap="round" />
      <path d="M40.5 18.5 H119.5" stroke={A.shellTop} strokeWidth=".6" />
    </svg>
  );
}

const WINDOW = "M17 7 H83 a3 3 0 0 1 3 3 V49 a3 3 0 0 1 -3 3 H17 a3 3 0 0 1 -3 -3 V10 a3 3 0 0 1 3 -3 Z";

/** A cassette deck's face: the tape shows through the smoked window, keys underneath */
export function Deck() {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 100 80" className="pl-svg" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={K.faceTop} />
          <stop offset="1" stopColor={K.faceBottom} />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".18" />
          <stop offset=".4" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* the face with the window cut out (even-odd), so the tape behind shows through */}
      <path fillRule="evenodd" d={`M2 2 H98 V78 H2 Z ${WINDOW}`} fill={`url(#${id}s)`} stroke={K.edge} strokeWidth=".6" />
      <path d={WINDOW} fill="none" stroke={K.rim} strokeWidth="1" />
      {/* transport keys: rewind, play, fast-forward, stop, eject */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${18 + i * 13.5} 58)`}>
          <rect width="11" height="12" rx="1.4" fill={K.key} stroke={K.edge} strokeWidth=".4" />
          <path d="M.6 .8 H10.4" stroke="#fff" strokeWidth=".5" opacity=".8" />
          <path
            d={
              ["M7.5 4 L4.5 6 L7.5 8 Z M4.5 4 L1.5 6 L4.5 8 Z", "M4 3.6 L8 6 L4 8.4 Z", "M3.5 4 L6.5 6 L3.5 8 Z M6.5 4 L9.5 6 L6.5 8 Z", "M3.8 3.8 H7.2 V7.2 H3.8 Z", "M3 7 H8 L5.5 4 Z M3 8.2 H8"][i]
            }
            fill={K.faceBottom}
            stroke={i === 4 ? K.faceBottom : "none"}
            strokeWidth=".5"
          />
        </g>
      ))}
      {/* light: sheen and the specular top and left edges */}
      <path d="M2 2 H98 V78 H2 Z" fill={`url(#${id}g)`} pointerEvents="none" />
      <path d="M2.5 2.5 H97.5" stroke={K.specular} strokeWidth=".6" />
      <path d="M2.5 2.5 V77.5" stroke={K.specular} strokeWidth=".4" opacity=".7" />
    </svg>
  );
}

/** Smoked glass over the deck's window, in front of the tape */
export function DeckGlass() {
  return (
    <svg viewBox="0 0 100 80" className="pl-svg" preserveAspectRatio="none" aria-hidden="true">
      <path d={WINDOW} fill={K.faceBottom} opacity=".28" />
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
          <stop offset="0" stopColor={C.lidLight} />
          <stop offset=".5" stopColor={C.lidMid} />
          <stop offset="1" stopColor={C.lidDark} />
        </linearGradient>
      </defs>
      <path
        fillRule="evenodd"
        d="M4 2 H96 a2 2 0 0 1 2 2 V96 a2 2 0 0 1 -2 2 H4 a2 2 0 0 1 -2 -2 V4 a2 2 0 0 1 2 -2 Z M50 13 a35 35 0 1 0 0.01 0 Z"
        fill={`url(#${id}s)`}
        stroke={C.edge}
        strokeWidth=".6"
      />
      <circle cx="50" cy="48" r="35" fill="none" stroke={C.edge} strokeWidth="1.2" />
      {/* the display */}
      <rect x="62" y="88" width="30" height="7" rx="1" fill={C.tray} />
      <rect x="80" y="90" width="2" height="3" fill={C.display} />
      <rect x="84" y="90" width="2" height="3" fill={C.display} />
      <circle cx="10" cy="91.5" r="2.4" fill={C.tray} />
      <path d="M2.5 3 H97.5" stroke="#fff" strokeWidth=".8" />
      <path d="M2.5 3 V97" stroke="#fff" strokeWidth=".5" opacity=".7" />
    </svg>
  );
}

/** The tray: a dark plate with the disc's round recess */
export function CdTray() {
  return (
    <svg viewBox="0 0 100 100" className="pl-svg" preserveAspectRatio="none" aria-hidden="true">
      <rect x="1" y="1" width="98" height="98" rx="4" fill={C.tray} stroke={C.trayEdge} strokeWidth=".8" />
      <circle cx="50" cy="50" r="46" fill={C.trayWell} />
      <circle cx="50" cy="50" r="10" fill={C.trayEdge} />
      <path d="M2 2.5 H98" stroke={C.display} strokeWidth=".6" opacity=".6" />
    </svg>
  );
}
