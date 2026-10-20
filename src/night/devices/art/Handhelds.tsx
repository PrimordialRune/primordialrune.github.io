"use client";

// Two generic handhelds, remembered rather than copied (P1): a portrait one for the GB
// cart and a landscape one for the GBA cart. No wordmarks, no boot logos: the only mark
// on the plastic is Omar's own logo, pressed in. Units are screen pixels, so the screen
// window sits on whole units and the HTML screen inside lands on whole device pixels.
import { FONT_BLACK, LogoEmboss, useSvgId } from "./shared";
import s from "../devices.module.css";

/** Portrait handheld: 300 x 490 units, screen 160 x 144 at (70, 60) */
export const GB_BODY = { w: 300, h: 490, screenX: 70, screenY: 60, cartX: 46, cartY: -56 } as const;

export function GbShellArt() {
  const id = useSvgId();
  const body = "M14 0 H286 a14 14 0 0 1 14 14 V420 a70 70 0 0 1 -70 70 H14 a14 14 0 0 1 -14 -14 V14 a14 14 0 0 1 14 -14Z";
  const bezel = "M34 30 H266 a10 10 0 0 1 10 10 V216 a36 36 0 0 1 -36 36 H34 a10 10 0 0 1 -10 -10 V40 a10 10 0 0 1 10 -10Z";
  return (
    <svg viewBox="0 -14 300 504" className={s.fillTall} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2=".35" y2="1">
          <stop offset="0" stopColor="#dfd9cd" />
          <stop offset=".6" stopColor="#cdc6b9" />
          <stop offset="1" stopColor="#b7b0a2" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".34" />
          <stop offset=".28" stopColor="#fff" stopOpacity="0" />
          <stop offset=".85" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".1" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b3540" />
          <stop offset="1" stopColor="#2a2530" />
        </linearGradient>
        <linearGradient id={`${id}glass`} x1="0" y1="0" x2="1" y2=".8">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".3" stopColor="#fff" stopOpacity=".03" />
          <stop offset=".31" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}btn`} cx=".38" cy=".32" r=".7">
          <stop offset="0" stopColor="#fff" stopOpacity=".42" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".18" />
        </radialGradient>
        <radialGradient id={`${id}led`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#bd502f" stopOpacity=".75" />
          <stop offset="1" stopColor="#bd502f" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* power switch on the top face, above the shell edge */}
      <rect x="24" y="-9" width="50" height="9" rx="3" fill="#7d766a" />
      <rect data-p="knob" x="27" y="-11" width="16" height="10" rx="2.5" fill="#cdc6b9" stroke="#7d766a" strokeWidth="1" />

      <path d={body} fill={`url(#${id}s)`} stroke="#7d766a" strokeWidth="1.6" />
      {/* seam under the top face */}
      <path d="M2 16 H298" stroke="#a69f92" strokeWidth="1.2" />
      <path d="M2 17.6 H298" stroke="#f1ede5" strokeWidth=".8" opacity=".7" />
      <text x="26" y="11.5" style={FONT_BLACK} fontSize="6.5" fill="#7d766a" letterSpacing=".8">
        OFF · ON
      </text>

      {/* screen bezel, the game's stripes, the power LED */}
      <path d={bezel} fill={`url(#${id}b)`} />
      <path d="M40 42 H262" stroke="#bd502f" strokeWidth="2.4" />
      <path d="M40 47 H262" stroke="#34d1af" strokeWidth="2.4" />
      <rect x="66" y="56" width="168" height="152" rx="2" fill="#1d1a1f" />
      <circle cx="45" cy="118" r="4.5" fill="#4a2a26" />
      <g data-p="led-on" visibility="hidden">
        <circle cx="45" cy="118" r="15" fill={`url(#${id}led)`} />
        <circle cx="45" cy="118" r="4.5" fill="#bd502f" />
        <circle cx="43.8" cy="116.6" r="1.6" fill="#f7ecb9" opacity=".85" />
      </g>
      {/* glass over the bezel only: the screen pixels stay inside their palette */}
      <path d={`${bezel} M66 56 V208 H234 V56 Z`} fillRule="evenodd" fill={`url(#${id}glass)`} />

      <LogoEmboss x={28} y={266} size={24} fill="#c3bcaf" light="#efebe3" />

      {/* d-pad in its dish */}
      <circle cx="74" cy="342" r="42" fill="#c6bfb2" />
      <path d="M63 309 h22 v22 h22 v22 h-22 v22 h-22 v-22 h-22 v-22 h22 Z" fill="#2a2530" />
      <path d="M64 310 h20 M42 332 h20" stroke="#5a5260" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="74" cy="342" r="6" fill="#221e27" />

      {/* A and B in the game's own red */}
      <rect x="176" y="316" width="96" height="44" rx="22" transform="rotate(-28 224 338)" fill="#c6bfb2" />
      {[
        [244, 326, "A"],
        [202, 350, "B"],
      ].map(([cx, cy, l]) => (
        <g key={l as string}>
          <circle cx={cx as number} cy={(cy as number) + 1.6} r="17" fill="#8a3a22" />
          <circle cx={cx as number} cy={cy as number} r="17" fill="#bd502f" />
          <circle cx={cx as number} cy={cy as number} r="17" fill={`url(#${id}btn)`} />
          <text x={cx as number} y={(cy as number) + 32} style={FONT_BLACK} fontSize="10" fill="#7d766a" textAnchor="middle">
            {l}
          </text>
        </g>
      ))}

      {/* select / start */}
      {[
        [112, "SELECT"],
        [158, "START"],
      ].map(([x, l]) => (
        <g key={l as string} transform={`rotate(-26 ${x} 418)`}>
          <rect x={(x as number) - 19} y="410" width="38" height="16" rx="8" fill="#c6bfb2" />
          <rect x={(x as number) - 14} y="414" width="28" height="8" rx="4" fill="#7d766a" />
          <text x={x as number} y="438" style={FONT_BLACK} fontSize="6.5" fill="#7d766a" textAnchor="middle" letterSpacing=".6">
            {l}
          </text>
        </g>
      ))}

      {/* speaker slots */}
      {Array.from({ length: 6 }, (_, i) => {
        const cx = 194 + i * 12;
        const cy = 450 - i * 4;
        return (
          <g key={i} transform={`rotate(-30 ${cx} ${cy})`}>
            <rect x={cx - 2.6} y={cy - 18} width="5.2" height="36" rx="2.6" fill="#8f887b" />
            <rect x={cx - 2.6} y={cy - 18} width="1.4" height="36" rx=".7" fill="#6f685a" />
          </g>
        );
      })}

      {/* light on the plastic: sheen and the specular edge facing the lamp */}
      <path d={body} fill={`url(#${id}g)`} />
      <path d="M14 2 H286" stroke="#fbf9f4" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 14 V474" stroke="#fbf9f4" strokeWidth="1.3" strokeLinecap="round" opacity=".7" />

      {/* the clack: one frame of impact marks either side of the slot */}
      <g data-p="clack" visibility="hidden" stroke="#f7ecb9" strokeWidth="3" strokeLinecap="round">
        <path d="M30 -8 L16 -20 M24 2 L6 -2 M270 -8 L284 -20 M276 2 L294 -2" />
      </g>
    </svg>
  );
}

/** Landscape handheld: 600 x 340 units, screen 240 x 160 at (180, 66) */
export const GBA_BODY = { w: 600, h: 340, screenX: 180, screenY: 66, cartX: 185, cartY: -28 } as const;

export function GbaShellArt() {
  const id = useSvgId();
  const body = "M120 0 H480 C556 0 600 52 600 150 V214 C600 296 548 340 470 340 H130 C52 340 0 296 0 214 V150 C0 52 44 0 120 0Z";
  return (
    <svg viewBox="0 -14 600 354" className={s.fillTall} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2=".3" y2="1">
          <stop offset="0" stopColor="#544c86" />
          <stop offset=".55" stopColor="#4a4378" />
          <stop offset="1" stopColor="#332d5a" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".26" />
          <stop offset=".3" stopColor="#fff" stopOpacity="0" />
          <stop offset=".8" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".16" />
        </linearGradient>
        <linearGradient id={`${id}glass`} x1="0" y1="0" x2="1" y2=".7">
          <stop offset="0" stopColor="#fff" stopOpacity=".14" />
          <stop offset=".34" stopColor="#fff" stopOpacity=".03" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}btn`} cx=".38" cy=".32" r=".7">
          <stop offset="0" stopColor="#fff" stopOpacity=".5" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".2" />
        </radialGradient>
        <radialGradient id={`${id}led`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#f500b8" stopOpacity=".7" />
          <stop offset="1" stopColor="#f500b8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* shoulder buttons */}
      <path d="M40 46 C52 8 92 -10 150 -10 H204 V12 H60 Z" fill="#332d5a" stroke="#221d3d" strokeWidth="1.4" />
      <path d="M560 46 C548 8 508 -10 450 -10 H396 V12 H540 Z" fill="#332d5a" stroke="#221d3d" strokeWidth="1.4" />
      <path d="M70 6 C90 -4 120 -8 150 -8 H200" stroke="#c9c4e6" strokeWidth="1.4" opacity=".5" fill="none" />

      <path d={body} fill={`url(#${id}s)`} stroke="#221d3d" strokeWidth="1.8" />

      {/* screen bezel */}
      <rect x="158" y="44" width="284" height="222" rx="18" fill="#26232f" />
      <rect x="176" y="62" width="248" height="168" rx="2" fill="#1b1922" />
      <circle cx="176" cy="248" r="4" fill="#3b2a3f" />
      <g data-p="led-on" visibility="hidden">
        <circle cx="176" cy="248" r="14" fill={`url(#${id}led)`} />
        <circle cx="176" cy="248" r="4" fill="#f500b8" />
        <circle cx="175" cy="246.8" r="1.4" fill="#ffffff" opacity=".8" />
      </g>
      <path d="M190 248 H286" stroke="#e6cdec" strokeWidth="1" opacity=".25" />
      <path d="M176 44 H424 a18 18 0 0 1 18 18 V248 a18 18 0 0 1 -18 18 H176 a18 18 0 0 1 -18 -18 V62 a18 18 0 0 1 18 -18Z M176 62 V230 H424 V62 Z" fillRule="evenodd" fill={`url(#${id}glass)`} />

      {/* d-pad */}
      <circle cx="86" cy="150" r="44" fill="#3d3669" />
      <path d="M75 117 h22 v22 h22 v22 h-22 v22 h-22 v-22 h-22 v-22 h22 Z" fill="#221d3d" />
      <path d="M76 118 h20 M54 140 h20" stroke="#5d5694" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="86" cy="150" r="6" fill="#1a162f" />

      {/* A / B */}
      {[
        [526, 132, "A"],
        [478, 174, "B"],
      ].map(([cx, cy, l]) => (
        <g key={l as string}>
          <circle cx={cx as number} cy={cy as number} r="26" fill="#3d3669" />
          <circle cx={cx as number} cy={(cy as number) + 1.8} r="19" fill="#8f89b3" />
          <circle cx={cx as number} cy={cy as number} r="19" fill="#c9c4e6" />
          <circle cx={cx as number} cy={cy as number} r="19" fill={`url(#${id}btn)`} />
          <text x={(cx as number) + 30} y={(cy as number) + 26} style={FONT_BLACK} fontSize="10" fill="#c9c4e6" opacity=".7">
            {l}
          </text>
        </g>
      ))}

      {/* start / select */}
      {[
        [254, "START"],
        [286, "SELECT"],
      ].map(([y, l]) => (
        <g key={l as string}>
          <circle cx="86" cy={(y as number) + 1.2} r="7" fill="#1a162f" />
          <circle cx="86" cy={y as number} r="7" fill="#221d3d" />
          <text x="100" y={(y as number) + 3.2} style={FONT_BLACK} fontSize="8" fill="#c9c4e6" opacity=".7" letterSpacing=".8">
            {l}
          </text>
        </g>
      ))}

      {/* speaker */}
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} cx={506 + (i % 3) * 14} cy={252 + Math.floor(i / 3) * 14} r="3.4" fill="#221d3d" />
      ))}

      {/* power slide on the lower edge */}
      <rect x="38" y="316" width="52" height="9" rx="3" fill="#221d3d" />
      <rect data-p="knob" x="41" y="314" width="16" height="12" rx="3" fill="#8f89b3" stroke="#221d3d" strokeWidth="1" />

      <LogoEmboss x={466} y={50} size={22} fill="#433c70" light="#5f5896" />

      <path d={body} fill={`url(#${id}g)`} />
      <path d="M124 2 H476" stroke="#c9c4e6" strokeWidth="2" strokeLinecap="round" opacity=".85" />
      <path d="M2.2 150 C2.2 70 40 10 110 3" stroke="#c9c4e6" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".6" />

      <g data-p="clack" visibility="hidden" stroke="#e6cdec" strokeWidth="3" strokeLinecap="round">
        <path d="M172 -6 L156 -22 M164 6 L144 0 M428 -6 L444 -22 M436 6 L456 0" />
      </g>
    </svg>
  );
}
