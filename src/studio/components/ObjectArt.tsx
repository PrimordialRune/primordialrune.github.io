"use client";

// The shelf objects (P3: one medium per project, built from its real assets). Each one is a
// small SVG drawing in its own palette (P4) with honest materials: plastic gets a 1px
// specular top edge that follows the pointer (--spec-x, set by the parent), paper labels get
// a baked print grain (one feTurbulence filter, inside imagery only). Pixel-art labels sit in
// HTML at an integer scale of device pixels (P1). Sub-parts that move carry data-part so
// transitions.ts can address them.

import { useId, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { LOGO_INNER, LOGO_OUTER } from "@/lib/logo";
import type { Art, ObjectArtProps, ObjectKind, StudioProject } from "../types";
import { asset } from "../lib/asset";
import "../styles/objects.css";

/** viewBox of each drawing and its real-world width in shelf units (cassette = 100) */
export const OBJECT_BOX: Record<ObjectKind, { w: number; h: number; units: number }> = {
  "trainer-card": { w: 70, h: 96, units: 66 },
  booster: { w: 64, h: 104, units: 72 },
  cassette: { w: 100, h: 64, units: 100 },
  "gb-cart": { w: 64, h: 72, units: 60 },
  cd: { w: 113, h: 100, units: 108 },
  "gba-cart": { w: 80, h: 52, units: 70 },
  "deck-box": { w: 64, h: 92, units: 70 },
  "ds-card": { w: 44, h: 52, units: 54 },
  floppy: { w: 90, h: 94, units: 90 },
};

/** Height in CSS px of an object drawn at `size` px wide */
export const objectHeight = (kind: ObjectKind, size: number) => (size * OBJECT_BOX[kind].h) / OBJECT_BOX[kind].w;

/**
 * Each object's palette, sampled from its real art (P4). The data file should declare the
 * same list as project.palette; objects not listed here use project.palette by role.
 */
export const OBJECT_PALETTES: Record<string, string[]> = {
  omar: ["#fce8cd", "#102f41", "#ec563b", "#fadb68", "#339999"],
  "ptcg-cube": ["#1a1819", "#545252", "#ffffff"],
  // the cassette in Crossfader's title screen: yellow shell, purple window, cyan label
  crossfader: ["#f4de32", "#7934c3", "#30cbd0", "#110c1d", "#d2508f"],
  "galactic-news": ["#291f23", "#bd502f", "#34d1af", "#f7ecb9"],
  "haunt-record": ["#202c39", "#eb5e55", "#fcde9c", "#48a9a6"],
  "project-minamoto": ["#65028b", "#8b05a0", "#ffffff", "#b560c2", "#40100a"],
  // Cremisi Portals title screen: purple space, crimson logo
  "cremisi-portals": ["#241e41", "#3c2e76", "#d10053", "#91007b", "#ffffff"],
};

/** Label art the drawings use when the project's own art.label is not the right crop */
const LABEL_OVERRIDE: Record<string, Art> = {
  // boot-cart-11.png is the logo and the ship on a starfield (the file names are swapped)
  "galactic-news": {
    src: "resources/studio-a/galactic-news/boot-cart-11.png",
    w: 160,
    h: 144,
    pixel: true,
    alt: "The Galactic News logo and ship on a starfield",
  },
  "cremisi-portals": {
    src: "resources/studio-a/cremisi-portals/title-screen.png",
    w: 480,
    h: 270,
    pixel: false,
    alt: "The Cremisi Portals title screen",
  },
};

const HAUNT_LOGO = "resources/studio-a/haunt-record/logo.png";
const HAUNT_CROWN = "resources/studio-a/haunt-record/crown-icon.png";

/* ---------------------------------------------------------------------------------------- */
/* Palette by role, for objects without a sampled livery                                     */
/* ---------------------------------------------------------------------------------------- */

function rgb(hex: string) {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
}
const luma = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const sat = (hex: string) => {
  const c = rgb(hex);
  const mx = Math.max(...c);
  const mn = Math.min(...c);
  return mx === 0 ? 0 : (mx - mn) / mx;
};

interface Roles {
  dark: string;
  light: string;
  /** accents, most saturated first */
  acc: (i: number) => string;
}

function roles(palette: string[], fallback: string[]): Roles {
  const list = (palette.length >= 2 ? palette : fallback).filter((c) => /^#[0-9a-f]{6}$/i.test(c));
  const byLuma = [...list].sort((a, b) => luma(a) - luma(b));
  const dark = byLuma[0];
  const light = byLuma[byLuma.length - 1];
  const rest = list.filter((c) => c !== dark && c !== light).sort((a, b) => sat(b) - sat(a));
  return { dark, light, acc: (i) => (rest.length ? rest[i % rest.length] : i % 2 ? light : dark) };
}

/* ---------------------------------------------------------------------------------------- */
/* Shared bits                                                                               */
/* ---------------------------------------------------------------------------------------- */

function useSvgId() {
  return "o" + useId().replace(/[^a-zA-Z0-9]/g, "");
}

const noSubscribe = () => () => {};
const readDpr = () => window.devicePixelRatio || 1;

/** One print-grain filter per drawing; baseFrequency follows the drawn size so the grain
 *  stays about a CSS pixel whatever the scale */
function Grain({ id, pxPerUnit }: { id: string; pxPerUnit: number }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency={(0.75 * pxPerUnit).toFixed(3)} numOctaves="2" seed="7" stitchTiles="stitch" />
      <feColorMatrix type="matrix" values="0 0 0 0 0.16  0 0 0 0 0.12  0 0 0 0 0.10  1.8 0 0 0 -0.75" />
    </filter>
  );
}

/** Grain over a paper area (a rect with the filter, very light) */
function Paper({ grain, x, y, w, h, rx = 0 }: { grain: string; x: number; y: number; w: number; h: number; rx?: number }) {
  return <rect className="obj-grain" x={x} y={y} width={w} height={h} rx={rx} filter={`url(#${grain})`} />;
}

/** The plastic's specular top edge, positioned in % of the drawing */
function Spec({ left, right, top }: { left: number; right: number; top: number }) {
  return <span className="obj-spec" aria-hidden="true" style={{ left: `${left}%`, right: `${right}%`, top: `${top}%` }} />;
}

/** How much of a pixel-art image fits a window at 1 device pixel per art pixel (1 = all) */
function usePixelFit(art: Art | undefined, windowPx: { w: number; h: number }) {
  const dpr = useSyncExternalStore(noSubscribe, readDpr, () => 1);
  if (!art) return 0;
  return Math.min((windowPx.w * dpr) / art.w, (windowPx.h * dpr) / art.h);
}

/** A narrow light band clipped to the plastic; at rest it sits outside the shape. The idle
 *  (objects.css, focused object only) steps it across: light, not fill (P4), one step a second */
function Glint({ clip, x, y, w, h, travel, skew = -18, opacity = 0.22 }: { clip: string; x: number; y: number; w: number; h: number; travel: number; skew?: number; opacity?: number }) {
  return (
    <g clipPath={clip}>
      <g transform={`skewX(${skew})`}>
        <rect data-idle="glint" x={x} y={y} width={w} height={h} fill="#fff" opacity={opacity} style={{ "--gd": `${travel}px` } as CSSProperties} />
      </g>
    </g>
  );
}

/** A pixel-art image in an HTML window at an integer scale of device pixels: the largest
 *  that fits, or one size up when that crops less than a fifth; cropped from `focus` */
function PixelWindow({
  art,
  box,
  windowPx,
  focus = "50% 50%",
}: {
  art: Art;
  box: { x: number; y: number; w: number; h: number; vw: number; vh: number };
  windowPx: { w: number; h: number };
  focus?: string;
}) {
  const dpr = useSyncExternalStore(noSubscribe, readDpr, () => 1);
  const fit = Math.min((windowPx.w * dpr) / art.w, (windowPx.h * dpr) / art.h);
  const k = Math.max(1, Math.ceil(fit) <= fit * 1.2 ? Math.ceil(fit) : Math.floor(fit));
  const w = (art.w * k) / dpr;
  const h = (art.h * k) / dpr;
  return (
    <span
      className="obj-pixel"
      data-part="label"
      style={{
        left: `${(box.x / box.vw) * 100}%`,
        top: `${(box.y / box.vh) * 100}%`,
        width: `${(box.w / box.vw) * 100}%`,
        height: `${(box.h / box.vh) * 100}%`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(art.src)} alt="" width={w} height={h} draggable={false} style={{ width: w, height: h, objectPosition: focus }} />
    </span>
  );
}

/** Non-pixel label art inside the SVG, contained in its box */
function LabelImage({ art, x, y, w, h, align = "xMidYMid" }: { art: Art | undefined; x: number; y: number; w: number; h: number; align?: string }) {
  if (!art) return null;
  return <image href={asset(art.src)} x={x} y={y} width={w} height={h} preserveAspectRatio={`${align} meet`} />;
}

/** Omar's logo (from @/lib/logo, never retyped) at a given size */
function LogoMark({ x, y, size, outer, inner }: { x: number; y: number; size: number; outer: string; inner: string }) {
  const k = size / 555;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <path d={LOGO_OUTER} fill={outer} />
      <path d={LOGO_INNER} fill={inner} />
    </g>
  );
}

interface DrawProps {
  p: StudioProject;
  r: Roles;
  id: string;
  size: number;
  side: "A" | "B";
  label?: Art;
}

/* ---------------------------------------------------------------------------------------- */
/* Trainer Card: Omar's card in a clear sleeve                                               */
/* ---------------------------------------------------------------------------------------- */

function TrainerCard({ p, r, id, size }: DrawProps) {
  const px = size / 70;
  const cream = r.light;
  const peacock = r.dark;
  const orange = r.acc(0);
  const gold = r.acc(1);
  const teal = r.acc(2);
  const cls = (p.role ?? "Game designer").toUpperCase();
  return (
    <svg viewBox="0 0 70 96" className="obj-svg" aria-hidden="true">
      <defs>
        <Grain id={`${id}g`} pxPerUnit={px} />
        <clipPath id={`${id}hs`}>
          <rect x="3.5" y="27.2" width="63" height="1.6" />
        </clipPath>
        <clipPath id={`${id}cc`}>
          <rect x="3.5" y="6" width="63" height="88" rx="3" />
        </clipPath>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".34" />
          <stop offset=".28" stopColor="#fff" stopOpacity=".04" />
          <stop offset=".7" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".12" />
        </linearGradient>
      </defs>
      <g data-part="card">
        {/* front */}
        <g data-part="card-front">
          <rect x="3.5" y="6" width="63" height="88" rx="3" fill={cream} />
          <rect x="3.5" y="6" width="63" height="20" rx="3" fill={peacock} />
          <rect x="3.5" y="20" width="63" height="6" fill={peacock} />
          <text x="7.5" y="15.2" className="obj-t-black" fontSize="6" fill={cream} letterSpacing=".2">
            TRAINER CARD
          </text>
          <text x="7.5" y="21.6" className="obj-t-kana" fontSize="3.4" fill={cream} opacity=".75">
            トレーナーカード
          </text>
          <rect x="3.5" y="26" width="63" height="1.2" fill={orange} />
          {/* holo foil stripe: four inks in a repeat; the idle shifts it one band a step */}
          <g clipPath={`url(#${id}hs)`}>
            <g data-idle="holo" opacity=".85">
              {Array.from({ length: 22 }, (_, i) => (
                <rect key={i} x={3.5 + i * 4 - 8} y="27.2" width="4.05" height="1.6" fill={[teal, gold, cream, orange][i % 4]} transform={`skewX(-30)`} />
              ))}
            </g>
          </g>
          {/* portrait slot: the logo, since the narrator speaks through it */}
          <rect x="8" y="31" width="22" height="25" rx="1.5" fill={peacock} />
          <LogoMark x={10} y={34.5} size={18} outer={cream} inner={orange} />
          <text x="34" y="35.5" className="obj-t-black" fontSize="2.6" fill={teal} letterSpacing=".2">
            NAME
          </text>
          <text x="34" y="41" className="obj-t-black" fontSize="4.2" fill={peacock}>
            OMAR
          </text>
          <text x="34" y="45.6" className="obj-t-black" fontSize="4.2" fill={peacock}>
            GOLINELLI
          </text>
          <text x="34" y="51.5" className="obj-t-black" fontSize="2.6" fill={teal} letterSpacing=".2">
            CLASS
          </text>
          <text x="34" y="55.6" className="obj-t-black" fontSize="3" fill={orange}>
            {cls.length > 16 ? cls.slice(0, 16) : cls}
          </text>
          {[63, 69.5].map((y) => (
            <path key={y} d={`M8 ${y} H62`} stroke={peacock} strokeOpacity=".18" strokeWidth=".4" />
          ))}
          <text x="8" y="62" className="obj-t-black" fontSize="2.6" fill={peacock} letterSpacing=".2">
            PRIMORDIALRUNE
          </text>
          <text x="62" y="62" className="obj-t-thin" fontSize="2.6" fill={peacock} textAnchor="end">
            {p.titleJp}
          </text>
          {/* badge case: eight slots, the way the card kept them */}
          <text x="8" y="74.6" className="obj-t-black" fontSize="2.6" fill={teal} letterSpacing=".2">
            BADGES
          </text>
          {Array.from({ length: 8 }, (_, i) => {
            const cx = 11 + i * 6.8;
            const filled = i < 5;
            return (
              <g key={i}>
                <circle cx={cx} cy="82" r="2.6" fill={filled ? [orange, gold, teal][i % 3] : "none"} stroke={peacock} strokeOpacity={filled ? 0.9 : 0.3} strokeWidth=".5" />
                {filled && <circle cx={cx - 0.8} cy="81.2" r=".7" fill="#fff" opacity=".6" />}
              </g>
            );
          })}
          <Paper grain={`${id}g`} x={3.5} y={6} w={63} h={88} rx={3} />
        </g>
        {/* back, pre-mirrored so it reads right when the card is turned over */}
        <g data-part="card-back" transform="matrix(-1 0 0 1 70 0)" visibility="hidden">
          <rect x="3.5" y="6" width="63" height="88" rx="3" fill={peacock} />
          <rect x="6.5" y="9" width="57" height="82" rx="2" fill="none" stroke={gold} strokeWidth=".8" />
          <LogoMark x={17} y={30} size={36} outer={cream} inner={orange} />
          <text x="35" y="78" className="obj-t-black" fontSize="4.2" fill={cream} textAnchor="middle" letterSpacing=".3">
            PRIMORDIALRUNE
          </text>
          <Paper grain={`${id}g`} x={3.5} y={6} w={63} h={88} rx={3} />
        </g>
      </g>
      {/* the clear sleeve: open at the top, light on its faces and edges */}
      <g data-part="sleeve">
        <rect x="1.5" y="3.5" width="67" height="91.5" rx="2.4" fill={`url(#${id}s)`} stroke="#fff" strokeOpacity=".55" strokeWidth=".5" />
        <path d="M2 4 H68" stroke="#fff" strokeOpacity=".9" strokeWidth=".7" />
        <path d="M2.2 6 V92" stroke="#fff" strokeOpacity=".35" strokeWidth=".5" />
        <Glint clip={`url(#${id}cc)`} x={-6} y={4} w={6} h={92} travel={110} opacity={0.2} />
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------------------- */
/* Booster pack: PTCG Cube, graphite foil with Omar's playmat as its art and his signature     */
/* ---------------------------------------------------------------------------------------- */

function Booster({ p, r, id, size, label }: DrawProps) {
  const foil = r.dark;
  const graphite = r.acc(0);
  const white = r.light;
  const zigTop = Array.from({ length: 31 }, (_, i) => `L${2 + i * 2} ${i % 2 ? 4 : 5.6}`).join(" ");
  const zigBot = Array.from({ length: 31 }, (_, i) => `L${62 - i * 2} ${i % 2 ? 100 : 98.4}`).join(" ");
  // the tear runs along y=15: the strip above it is the crimp that comes away
  const jag = [-6, -2, 2, 6, 10, 14, 18, 22].map((y, i) => `L${i % 2 ? -2.4 : 0} ${y}`).join(" ");
  const keep = `M200 -6 ${jag} L200 22 Z`;
  const off = `M-200 -6 ${jag} L-200 22 Z`;
  const strip = (
    <>
      <path d={`M2 5 ${zigTop} L62 15.5 L2 15.5 Z`} fill={graphite} />
      {/* crimp ridges: every other one catches the light */}
      {Array.from({ length: 30 }, (_, i) => (
        <path key={i} d={`M${3 + i * 2} 5.6 V14.6`} stroke={i % 2 ? foil : "#fff"} strokeOpacity={i % 2 ? 0.45 : 0.42} strokeWidth=".35" />
      ))}
      <path d="M2 6.2 H62" stroke="#fff" strokeOpacity=".3" strokeWidth=".3" />
      <path d="M2 15.2 H62" stroke={white} strokeOpacity=".55" strokeWidth=".4" strokeDasharray="1 1" />
    </>
  );
  // each card's art: one of the bench silhouettes from the playmat (centres in playmat px)
  const card = (cx: number, key: number) => (
    <g key={key} data-part="card">
      <rect x="10" y="22" width="44" height="62" rx="2" fill={white} />
      <rect x="12.2" y="24.2" width="39.6" height="57.6" rx="1" fill={foil} />
      <svg x="13.4" y="30" width="37.2" height="26" viewBox={`${cx - 34} 199 68 47.6`} preserveAspectRatio="xMidYMid slice">
        {label && <image href={asset(label.src)} x="0" y="0" width="640" height="372" />}
      </svg>
      <rect x="13.4" y="30" width="37.2" height="26" fill="none" stroke={white} strokeOpacity=".7" strokeWidth=".4" />
      <text x="14" y="28.4" className="obj-t-black" fontSize="2.8" fill={white}>
        PTCG CUBE
      </text>
      {[61, 67.5].map((y, i) => (
        <g key={y}>
          <circle cx="16" cy={y - 1} r="1.3" fill={white} />
          <text x="19" y={y} className="obj-t-black" fontSize="2.6" fill={white}>
            {i ? "CO-OP" : "ROGUELIKE"}
          </text>
          <path d={`M14 ${y + 2} H50`} stroke={white} strokeOpacity=".25" strokeWidth=".3" />
        </g>
      ))}
    </g>
  );
  return (
    <svg viewBox="0 0 64 104" className="obj-svg" aria-hidden="true">
      <defs>
        <Grain id={`${id}g`} pxPerUnit={size / 64} />
        <clipPath id={`${id}k`}>
          <path data-part="tear-keep" d={keep} transform="translate(-3 0)" />
        </clipPath>
        <clipPath id={`${id}o`}>
          <path data-part="tear-off" d={off} transform="translate(-3 0)" />
        </clipPath>
        <clipPath id={`${id}w`}>
          <rect x="6" y="20" width="52" height="40" rx="1.5" />
        </clipPath>
        <clipPath id={`${id}p`}>
          <rect x="2" y="15.5" width="60" height="83" />
        </clipPath>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".18" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".3" stopColor="#fff" stopOpacity="0" />
          <stop offset=".72" stopColor="#fff" stopOpacity="0" />
          <stop offset=".84" stopColor="#fff" stopOpacity=".1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* three cards wait inside, behind the foil */}
      <g data-part="cards">{[257, 340, 428].map((x, i) => card(x, i))}</g>
      <g data-part="pack">
        {/* the foil: graphite, lit (P4: the sheen is light over one flat ink) */}
        <path d={`M2 15.5 H62 V98.4 ${zigBot} L2 98.4 Z`} fill={graphite} />
        <path d="M2 15.5 H26 L2 52 Z" fill="#fff" opacity=".12" />
        <path d="M34 15.5 H46 L2 82 V64 Z" fill="#fff" opacity=".07" />
        <path d="M62 40 V60 L44 98.4 H32 Z" fill="#fff" opacity=".06" />
        {/* foil crinkles */}
        {[8.5, 21, 43, 55.5].map((x) => (
          <path key={x} d={`M${x} 17 V96`} stroke="#fff" strokeOpacity=".1" strokeWidth=".5" />
        ))}
        {/* the art window: the playmat's halftone burst, printed big */}
        <rect x="5.4" y="19.4" width="53.2" height="41.2" rx="1.8" fill={foil} />
        <g clipPath={`url(#${id}w)`}>
          <svg x="6" y="20" width="52" height="40" viewBox="412 6 130 100" preserveAspectRatio="xMidYMid slice">
            {label && <image href={asset(label.src)} x="0" y="0" width="640" height="372" />}
          </svg>
        </g>
        <rect x="6" y="20" width="52" height="40" rx="1.5" fill="none" stroke={white} strokeOpacity=".9" strokeWidth=".5" />
        <text x="32" y="69.2" className="obj-t-black" fontSize="8.4" fill={white} textAnchor="middle" letterSpacing=".2">
          PTCG CUBE
        </text>
        <text x="32" y="74.6" className="obj-t-kana" fontSize="3.4" fill={white} textAnchor="middle" opacity=".85">
          {p.titleJp || "キューブ"}
        </text>
        <text x="32" y="80.6" className="obj-t-black" fontSize="2.8" fill={white} textAnchor="middle" letterSpacing=".5" opacity=".8">
          ROGUELIKE · CO-OP
        </text>
        {/* Omar's signature band, as on the playmat: the mark and PRIMORDIALRUNE */}
        <rect x="2" y="84" width="60" height="12" fill={foil} />
        <LogoMark x={9} y={87} size={5.6} outer={white} inner={graphite} />
        <text x="16.4" y="91.2" className="obj-t-black" fontSize="2.4" fill={white} letterSpacing=".6" opacity=".75">
          PRIMORDIALRUNE
        </text>
        <rect x="2" y="15.5" width="60" height="83" fill={`url(#${id}l)`} />
        <Glint clip={`url(#${id}p)`} x={-12} y={14} w={6} h={86} travel={120} skew={-14} opacity={0.2} />
        {/* the bottom crimp, ridged and catching the light */}
        <path d={`M2 96 H62 V98.4 ${zigBot} L2 98.4 Z`} fill={graphite} />
        {Array.from({ length: 30 }, (_, i) => (
          <path key={i} d={`M${3 + i * 2} 96.4 V99.4`} stroke="#fff" strokeOpacity={i % 2 ? 0.18 : 0.42} strokeWidth=".35" />
        ))}
        <path d="M2 96 H62" stroke={foil} strokeOpacity=".6" strokeWidth=".4" />
      </g>
      {/* the crimp: one copy stays, the other is the piece that tears away */}
      <g data-part="foil" clipPath={`url(#${id}k)`}>
        {strip}
      </g>
      <g data-part="foil-off" clipPath={`url(#${id}o)`}>
        {strip}
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------------------- */
/* Cassette: Crossfader's own tape (yellow shell, purple window, cyan label)                 */
/* ---------------------------------------------------------------------------------------- */

function Cassette({ p, id, size, side, label }: DrawProps) {
  const pal = OBJECT_PALETTES.crossfader;
  const own = p.slug === "crossfader";
  const rr = roles(p.palette, pal);
  const shell = own ? pal[0] : rr.acc(0);
  const windowC = own ? pal[1] : rr.acc(1);
  const labelC = own ? pal[2] : rr.light;
  const ink = own ? pal[3] : rr.dark;
  const magenta = own ? pal[4] : rr.acc(2);
  const px = size / 100;
  const sideLetter = (s: "A" | "B") => (
    <g data-part={`side-${s.toLowerCase()}`} visibility={side === s ? undefined : "hidden"}>
      <rect x="7.5" y="7" width="10" height="10" rx="1.4" fill={ink} />
      <text x="12.5" y="15.4" className="obj-t-black" fontSize="9" fill={shell} textAnchor="middle">
        {s}
      </text>
      <text x="86" y="43.2" className="obj-t-black" fontSize="2.8" fill={ink} textAnchor="end" letterSpacing=".3">
        SIDE {s}
      </text>
    </g>
  );
  return (
    <svg viewBox="0 0 100 64" className="obj-svg" aria-hidden="true">
      <defs>
        <Grain id={`${id}g`} pxPerUnit={px} />
        <clipPath id={`${id}c`}>
          <rect x="29" y="27.4" width="42" height="11" rx="5.5" />
        </clipPath>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".12" />
        </linearGradient>
      </defs>
      <g data-part="shell">
        <rect x=".5" y=".5" width="99" height="63" rx="4" fill={shell} stroke={ink} strokeOpacity=".55" strokeWidth=".7" />
        {/* paper J-label */}
        <rect x="5" y="4.2" width="90" height="41" rx="2.2" fill={labelC} />
        <LabelImage art={label} x={20} y={6} w={69} h={14.8} />
        <rect x="5" y="21.8" width="90" height="1.6" fill={magenta} />
        <rect x="5" y="23.4" width="90" height="1" fill={ink} />
        {sideLetter("A")}
        {sideLetter("B")}
        <text x="14" y="43.2" className="obj-t-black" fontSize="2.8" fill={ink} letterSpacing=".3">
          FLIP THE SIDE · REMIX THE SONG
        </text>
        <Paper grain={`${id}g`} x={5} y={4.2} w={90} h={41} rx={2.2} />
        {/* tape window: purple frame, smoked plastic, two reels */}
        <rect x="27.4" y="26" width="45.2" height="13.8" rx="6.9" fill={windowC} />
        <rect x="29" y="27.4" width="42" height="11" rx="5.5" fill={ink} />
        <g clipPath={`url(#${id}c)`}>
          <circle cx="38" cy="32.9" r="8" fill={magenta} opacity=".55" />
          <circle cx="62" cy="32.9" r="5.2" fill={magenta} opacity=".55" />
        </g>
        {[38, 62].map((cx) => (
          <g key={cx} data-part="reel">
            <circle cx={cx} cy="32.9" r="3.2" fill={labelC} />
            <circle cx={cx} cy="32.9" r="1.6" fill={ink} />
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <rect key={a} x={cx - 0.35} y={32.9 - 1.9} width=".7" height="1" fill={labelC} transform={`rotate(${a} ${cx} 32.9)`} />
            ))}
          </g>
        ))}
        <rect x="29" y="27.4" width="42" height="5" rx="2.5" fill="#fff" opacity=".1" />
        {/* head opening */}
        <path d="M20 63.5 L24.5 49.5 H75.5 L80 63.5 Z" fill={shell} stroke={ink} strokeOpacity=".45" strokeWidth=".6" />
        <path d="M20 63.5 L24.5 49.5 H75.5 L80 63.5 Z" fill="#000" opacity=".08" />
        <path d="M25 50.1 H75" stroke="#fff" strokeOpacity=".55" strokeWidth=".5" />
        <circle cx="31.5" cy="57.5" r="1.9" fill={ink} />
        <circle cx="68.5" cy="57.5" r="1.9" fill={ink} />
        <rect x="44" y="55" width="3.4" height="4.2" rx=".6" fill={ink} />
        <rect x="52.6" y="55" width="3.4" height="4.2" rx=".6" fill={ink} />
        {[
          [3, 3],
          [97, 3],
          [3, 61],
          [97, 61],
          [50, 52.4],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="1.2" fill={shell} stroke={ink} strokeOpacity=".5" strokeWidth=".3" />
            <path d={`M${x - 0.7} ${y} H${x + 0.7} M${x} ${y - 0.7} V${y + 0.7}`} stroke={ink} strokeOpacity=".6" strokeWidth=".3" />
          </g>
        ))}
        <rect x=".5" y=".5" width="99" height="63" rx="4" fill={`url(#${id}h)`} />
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------------------- */
/* Game Boy-style cartridge: Galactic News, its title screen as the label                    */
/* ---------------------------------------------------------------------------------------- */

const GB_SHAPE = "M3 .5 H52 L63.5 12 V69 a2.5 2.5 0 0 1 -2.5 2.5 H3 a2.5 2.5 0 0 1 -2.5 -2.5 V3 a2.5 2.5 0 0 1 2.5 -2.5Z";

function GbCart({ p, r, id, size, label }: DrawProps) {
  const shell = r.light;
  const plum = r.dark;
  const rust = p.palette.includes("#bd502f") ? "#bd502f" : r.acc(0);
  const mint = p.palette.includes("#34d1af") ? "#34d1af" : r.acc(1);
  const px = size / 64;
  // the pixel window inside the sticker
  const win = { x: 9.4, y: 15.6, w: 45.2, h: 36.4 };
  const windowPx = { w: (win.w / 64) * size, h: (win.h / 64) * size };
  // The real label art only where it shows whole at 1 device px per pixel (P1: never a
  // fractional scale, never a crop that reads "ALAL"); smaller, the sticker is typeset
  const pixel = usePixelFit(label, windowPx) >= 0.88;
  const stars: [number, number, string][] = [
    [12, 18.5, mint],
    [50.5, 19.5, shell],
    [47, 47.5, mint],
    [14, 46, shell],
    [30, 49.5, mint],
  ];
  return (
    <>
      <svg viewBox="0 0 64 72" className="obj-svg" aria-hidden="true">
        <defs>
          <Grain id={`${id}g`} pxPerUnit={px} />
          <linearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".3" />
            <stop offset=".35" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".1" />
          </linearGradient>
          <clipPath id={`${id}c`}>
            <path d={GB_SHAPE} />
          </clipPath>
        </defs>
        <g data-part="shell">
          <path d={GB_SHAPE} fill={shell} stroke={plum} strokeOpacity=".5" strokeWidth=".7" />
          {[4, 6.4, 8.8].map((y) => (
            <g key={y}>
              <path d={`M6 ${y} H46`} stroke={plum} strokeOpacity=".28" strokeWidth=".9" strokeLinecap="round" />
              <path d={`M6 ${y + 0.6} H46`} stroke="#fff" strokeOpacity=".6" strokeWidth=".4" strokeLinecap="round" />
            </g>
          ))}
          {/* label recess */}
          <rect x="6.4" y="12.9" width="51.2" height="47.2" rx="1.6" fill={plum} opacity=".22" />
          {/* sticker: plum paper, the logo, rust and mint print strip */}
          <rect x="7.3" y="13.8" width="49.4" height="45.4" rx="1.2" fill={plum} />
          {!pixel && (
            <g>
              {stars.map(([x, y, c], i) => (
                <rect key={i} x={x} y={y} width=".9" height=".9" fill={c} />
              ))}
              <g data-idle="star">
                <path d="M44.5 23.4 h3 M46 21.9 v3" stroke={mint} strokeWidth=".7" />
              </g>
              {/* the masthead: THE / GALACTIC / [NEWS], set italic like the game's logo */}
              <g transform="skewX(-14) translate(7.6 0)">
                <text x="11.6" y="26.2" className="obj-t-black" fontSize="4" fill={rust} letterSpacing=".2">
                  THE
                </text>
                <text x="11.4" y="34.4" className="obj-t-black" fontSize="8.6" fill={rust} textLength="37" lengthAdjust="spacingAndGlyphs">
                  GALACTIC
                </text>
                <path d="M10 36.6 H50" stroke={rust} strokeWidth=".7" strokeDasharray="1.4 .7" />
                <rect x="22.6" y="38.2" width="17.4" height="6.6" fill={rust} />
                <text x="31.3" y="43.6" className="obj-t-black" fontSize="5.4" fill={plum} textAnchor="middle" letterSpacing=".5">
                  NEWS
                </text>
              </g>
              {/* the ship's dithered mint trail */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <rect key={i} x={41.5 + i * 1.4} y={41.6 + (i % 2) * 1.1} width=".8" height=".8" fill={mint} opacity={1 - i * 0.12} />
              ))}
            </g>
          )}
          <rect x="7.3" y="53" width="49.4" height="1" fill={rust} />
          <rect x="7.3" y="54" width="49.4" height=".6" fill={mint} />
          <text x="10" y="57.9" className="obj-t-black" fontSize="2.7" fill={shell} letterSpacing=".25">
            {pixel ? "GALACTIC NEWS" : "GBJAM 11"}
          </text>
          <text x="54" y="57.9" className="obj-t-black" fontSize="2.7" fill={mint} textAnchor="end">
            {pixel ? "GBJAM 11" : "2023"}
          </text>
          <Paper grain={`${id}g`} x={7.3} y={52.6} w={49.4} h={6.6} />
          {/* embossed arrow */}
          <path d="M28.5 63.6 H35.5 L32 68 Z" fill={plum} opacity=".25" />
          <path d="M28.9 64.1 H35.1" stroke="#fff" strokeOpacity=".6" strokeWidth=".4" />
          <path d={GB_SHAPE} fill={`url(#${id}h)`} />
          <Glint clip={`url(#${id}c)`} x={-14} y={-4} w={7} h={80} travel={110} />
        </g>
      </svg>
      {label && pixel && <PixelWindow art={label} box={{ ...win, vw: 64, vh: 72 }} windowPx={windowPx} focus="50% 0%" />}
    </>
  );
}

/* ---------------------------------------------------------------------------------------- */
/* CD in a jewel case: Haunt Record, the logo on the insert, the crown as the disc print     */
/* ---------------------------------------------------------------------------------------- */

function Cd({ r, id, size }: DrawProps) {
  const navy = r.dark;
  const cream = r.light;
  const coral = r.acc(0);
  const teal = r.acc(1);
  const px = size / 113;
  const cx = 60.5;
  const cy = 50;
  return (
    <svg viewBox="0 0 113 100" className="obj-svg" aria-hidden="true">
      <defs>
        <Grain id={`${id}g`} pxPerUnit={px} />
        <clipPath id={`${id}c`}>
          <circle cx={cx} cy={cy} r="20" />
        </clipPath>
        <path id={`${id}a`} d={`M${cx - 33} ${cy} A33 33 0 0 0 ${cx + 33} ${cy}`} />
        <clipPath id={`${id}lc`}>
          <rect x="9" y="1" width="103" height="98" />
        </clipPath>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".3" />
          <stop offset=".22" stopColor="#fff" stopOpacity=".05" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset=".9" stopColor="#fff" stopOpacity=".08" />
        </linearGradient>
      </defs>
      {/* the case's back and its black tray */}
      <g data-part="case">
        <rect x=".5" y=".5" width="112" height="99" rx="1.6" fill={navy} />
        <rect x="9" y="2" width="102" height="96" rx="1" fill="#000" opacity=".35" />
        <circle cx={cx} cy={cy} r="9" fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth=".8" />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={cx - 0.6} y={cy - 7.5} width="1.2" height="3" rx=".5" fill="#fff" opacity=".22" transform={`rotate(${i * 45} ${cx} ${cy})`} />
        ))}
        {/* spine */}
        <rect x=".5" y=".5" width="8" height="99" rx="1.2" fill={navy} />
        <rect x="2.4" y="2" width="4.2" height="96" fill={coral} />
        <text x="4.5" y="50" className="obj-t-black" fontSize="3.2" fill={navy} textAnchor="middle" transform="rotate(90 4.5 50)" dominantBaseline="middle" letterSpacing=".4">
          HAUNT RECORD
        </text>
      </g>
      {/* the disc, printed side up (self-contained, so it can be cloned onto a tray) */}
      <g data-part="disc">
        <circle cx={cx} cy={cy} r="44" fill={cream} />
        <circle cx={cx} cy={cy} r="44" fill="none" stroke={navy} strokeOpacity=".35" strokeWidth=".5" />
        <circle cx={cx} cy={cy} r="38" fill="none" stroke={coral} strokeWidth="2.4" />
        <circle cx={cx} cy={cy} r="21.5" fill={navy} />
        <image href={asset(HAUNT_CROWN)} x={cx - 20} y={cy - 20} width="40" height="40" clipPath={`url(#${id}c)`} />
        <text className="obj-t-black" fontSize="4" fill={navy} letterSpacing="1.2">
          <textPath href={`#${id}a`} startOffset="50%" textAnchor="middle">
            HAUNT RECORD · DISC 1
          </textPath>
        </text>
        <circle cx={cx} cy={cy} r="5.2" fill={teal} />
        <circle cx={cx} cy={cy} r="3.4" fill={navy} />
        <Paper grain={`${id}g`} x={cx - 44} y={cy - 44} w={88} h={88} rx={44} />
      </g>
      {/* the lid: clear plastic over the paper insert, hinged at the spine */}
      <g data-part="lid">
        <rect x="9" y="1.5" width="103" height="97" rx="1" fill={navy} />
        <image href={asset(HAUNT_LOGO)} x="18" y="20" width="85" height="58" preserveAspectRatio="xMidYMid meet" />
        <text x="60.5" y="90" className="obj-t-black" fontSize="3" fill={teal} textAnchor="middle" letterSpacing="1">
          A DUNGEON CRAWLER
        </text>
        <rect x="9" y="1.5" width="103" height="2" fill={coral} />
        <Paper grain={`${id}g`} x={9} y={1.5} w={103} h={97} rx={1} />
        <rect x="8.5" y=".5" width="104" height="99" rx="1.6" fill={`url(#${id}p)`} stroke="#fff" strokeOpacity=".4" strokeWidth=".5" />
        <Glint clip={`url(#${id}lc)`} x={-6} y={0} w={9} h={100} travel={160} opacity={0.14} />
        <path d="M9.5 6 V94" stroke="#fff" strokeOpacity=".45" strokeWidth=".6" />
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------------------- */
/* GBA-style cartridge: Project Minamoto                                                     */
/* ---------------------------------------------------------------------------------------- */

const GBA_SHAPE =
  "M4 .5 H76 a3.5 3.5 0 0 1 3.5 3.5 V49 a2.5 2.5 0 0 1 -2.5 2.5 H46 L44.5 50 H35.5 L34 51.5 H3 a2.5 2.5 0 0 1 -2.5 -2.5 V4 a3.5 3.5 0 0 1 3.5 -3.5Z";

function GbaCart({ p, id, size, label }: DrawProps) {
  const own = p.slug === "project-minamoto";
  const rr = roles(p.palette, OBJECT_PALETTES["project-minamoto"]);
  const shell = own ? "#65028b" : rr.acc(1);
  const violet = own ? "#8b05a0" : rr.acc(0);
  const white = rr.light;
  const lilac = own ? "#b560c2" : rr.acc(2);
  const maroon = own ? "#40100a" : rr.dark;
  const px = size / 80;
  return (
    <svg viewBox="0 0 80 52" className="obj-svg" aria-hidden="true">
      <defs>
        <Grain id={`${id}g`} pxPerUnit={px} />
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".3" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".15" />
        </linearGradient>
      </defs>
      <g data-part="shell">
        <path d={GBA_SHAPE} fill={shell} stroke={maroon} strokeOpacity=".6" strokeWidth=".7" />
        <rect x="9" y="2.4" width="56" height="4.6" rx="1.4" fill="#000" opacity=".18" />
        {[3.8, 5.6].map((y) => (
          <path key={y} d={`M12 ${y} H62`} stroke="#000" strokeOpacity=".3" strokeWidth=".5" />
        ))}
        {/* the edge LED: dark at rest, lit when the cart seats */}
        <rect x="69" y="3" width="4" height="2" rx=".4" fill={maroon} />
        <rect data-part="led" x="69" y="3" width="4" height="2" rx=".4" fill={lilac} visibility="hidden" />
        <rect data-idle="led" x="69" y="3" width="4" height="2" rx=".4" fill={lilac} opacity="0" />
        {/* label */}
        <rect x="5.4" y="8.6" width="69.2" height="38.8" rx="1.6" fill="#000" opacity=".3" />
        <rect x="6.2" y="9.4" width="67.6" height="37.2" rx="1" fill={white} />
        <LabelImage art={label} x={9} y={11} w={62} h={24.6} />
        <rect x="6.2" y="37.2" width="67.6" height="9.4" fill={violet} />
        <rect x="6.2" y="37.2" width="67.6" height=".7" fill={lilac} />
        <text x="40" y="43.7" className="obj-t-black" fontSize="4.4" fill={white} textAnchor="middle" letterSpacing=".35">
          {p.title.toUpperCase()}
        </text>
        <Paper grain={`${id}g`} x={6.2} y={9.4} w={67.6} h={37.2} rx={1} />
        <path d={GBA_SHAPE} fill={`url(#${id}h)`} />
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------------------- */
/* Deck box: Holon, a typeset label with a δ emblem (Holon: the EX-era delta region)          */
/* ---------------------------------------------------------------------------------------- */

/** A small δ emblem: a ring with the letter drawn as a bowl and a hooked stem */
export function Delta({ x, y, r, ring, ink, bg }: { x: number; y: number; r: number; ring: string; ink: string; bg: string }) {
  const k = r / 10;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <circle r="10" fill={ring} />
      <circle r="8.2" fill={bg} />
      <circle cx="0" cy="2.4" r="3.6" fill="none" stroke={ink} strokeWidth="2.1" />
      <path d="M2.2 -0.6 C -2.2 -2.8 -3.2 -4.6 -1.8 -6 C -0.6 -7.1 1.8 -6.8 3.4 -5.6" fill="none" stroke={ink} strokeWidth="2.1" strokeLinecap="round" />
    </g>
  );
}

function DeckBox({ p, r, id, size }: DrawProps) {
  const box = r.dark;
  const paper = r.light;
  const gold = r.acc(0);
  const violet = r.acc(1);
  const px = size / 64;
  const title = p.title.toUpperCase();
  return (
    <svg viewBox="0 0 64 92" className="obj-svg" aria-hidden="true">
      <defs>
        <Grain id={`${id}g`} pxPerUnit={px} />
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".3" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".18" />
        </linearGradient>
        <clipPath id={`${id}lc`}>
          <rect x="2.5" y="4" width="59" height="30" rx="2.2" />
        </clipPath>
      </defs>
      {/* inside of the box */}
      <rect data-part="inside" x="5" y="30" width="54" height="60" rx="1.5" fill="#000" opacity=".5" />
      {/* the top card, back up; it turns face up as it rises */}
      <g data-part="card">
        <g data-part="card-back">
          <rect x="9" y="34" width="46" height="52" rx="2" fill={violet} />
          <rect x="11.5" y="36.5" width="41" height="47" rx="1.2" fill="none" stroke={gold} strokeWidth=".7" />
          <Delta x={32} y={60} r={9} ring={gold} ink={gold} bg={box} />
        </g>
        <g data-part="card-front" visibility="hidden">
          <rect x="9" y="34" width="46" height="52" rx="2" fill={paper} />
          <rect x="11.5" y="36.5" width="41" height="25" fill={box} />
          <Delta x={32} y={49} r={8} ring={gold} ink={paper} bg={violet} />
          <text x="32" y="69" className="obj-t-black" fontSize="6.4" fill={box} textAnchor="middle" letterSpacing=".4">
            {title}
          </text>
          <text x="32" y="73.6" className="obj-t-kana" fontSize="2.8" fill={box} textAnchor="middle" opacity=".75">
            {p.titleJp}
          </text>
          {[77.5, 81].map((y) => (
            <path key={y} d={`M13 ${y} H51`} stroke={box} strokeOpacity=".3" strokeWidth=".5" />
          ))}
          <Paper grain={`${id}g`} x={9} y={34} w={46} h={52} rx={2} />
        </g>
      </g>
      {/* box front: the printed label */}
      <g data-part="box">
        <rect x="4" y="30" width="56" height="61" rx="1.8" fill={box} />
        <rect x="8.5" y="38" width="47" height="49" rx="1" fill={paper} />
        <rect x="8.5" y="38" width="47" height="6.4" fill={violet} />
        <text x="32" y="42.4" className="obj-t-black" fontSize="2.6" fill={paper} textAnchor="middle" letterSpacing=".7">
          UNITY · TCG
        </text>
        <rect x="8.5" y="44.4" width="47" height=".8" fill={gold} />
        <Delta x={32} y={55} r={7} ring={gold} ink={paper} bg={box} />
        <text x="32" y="72" className="obj-t-black" fontSize="10.6" fill={box} textAnchor="middle" letterSpacing=".3">
          {title}
        </text>
        <text x="32" y="77" className="obj-t-kana" fontSize="3.4" fill={box} textAnchor="middle" opacity=".8">
          {p.titleJp}
        </text>
        <path d="M12 80.4 H52" stroke={box} strokeOpacity=".3" strokeWidth=".4" />
        <text x="32" y="84.4" className="obj-t-black" fontSize="2.4" fill={violet} textAnchor="middle" letterSpacing=".6">
          DECK BOX
        </text>
        <Paper grain={`${id}g`} x={8.5} y={38} w={47} h={49} rx={1} />
        <rect x="4" y="30" width="56" height="61" rx="1.8" fill={`url(#${id}h)`} />
      </g>
      {/* lid: gold, with the emblem pressed into it */}
      <g data-part="lid">
        <rect x="2.5" y="4" width="59" height="30" rx="2.2" fill={gold} />
        <rect x="2.5" y="28.6" width="59" height="5.4" fill="#000" opacity=".2" />
        <circle cx="32" cy="16.4" r="6.6" fill="#000" opacity=".14" />
        <circle cx="32" cy="15.9" r="6.6" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth=".5" />
        <Delta x={32} y={16.2} r={5.4} ring={gold} ink={box} bg={gold} />
        <rect x="2.5" y="4" width="59" height="30" rx="2.2" fill={`url(#${id}h)`} />
        <path d="M4.6 4.6 H59.4" stroke="#fff" strokeOpacity=".5" strokeWidth=".5" />
        <Glint clip={`url(#${id}lc)`} x={-6} y={3} w={6} h={32} travel={82} opacity={0.2} />
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------------------- */
/* DS-style game card in a clear case clip: Cremisi Portals                                  */
/* ---------------------------------------------------------------------------------------- */

const DS_CARD = "M7 9 H35 a2 2 0 0 1 2 2 V44 a1.5 1.5 0 0 1 -1.5 1.5 H8.5 A1.5 1.5 0 0 1 7 44 V14 L9.5 11.5 V11 a2 2 0 0 0 -2.5 -2Z";

function DsCard({ p, id, size, label }: DrawProps) {
  const own = p.slug === "cremisi-portals";
  const rr = roles(p.palette, OBJECT_PALETTES["cremisi-portals"]);
  const shell = own ? "#241e41" : rr.dark;
  const purple = own ? "#3c2e76" : rr.acc(1);
  const crimson = own ? "#d10053" : rr.acc(0);
  const white = rr.light;
  const px = size / 44;
  return (
    <svg viewBox="0 0 44 52" className="obj-svg" aria-hidden="true">
      <defs>
        <Grain id={`${id}g`} pxPerUnit={px} />
        <clipPath id={`${id}c`}>
          <rect x="10.6" y="14.4" width="23.4" height="19.6" rx=".6" />
        </clipPath>
        <clipPath id={`${id}k`}>
          <path d={DS_CARD} />
        </clipPath>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".26" />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* the case clip behind */}
      <g data-part="case">
        <rect x="2" y="22" width="40" height="29" rx="2.4" fill="#fff" opacity=".12" stroke="#fff" strokeOpacity=".5" strokeWidth=".5" />
        <rect x="4" y="24" width="36" height="25" rx="1.6" fill={purple} opacity=".35" />
      </g>
      <g data-part="card">
        <path d={DS_CARD} fill={shell} stroke="#000" strokeOpacity=".4" strokeWidth=".4" />
        <rect x="10" y="13.8" width="24.6" height="27.6" rx="1" fill={white} />
        <rect x="10.6" y="14.4" width="23.4" height="19.6" rx=".6" fill={purple} />
        {/* the title screen's logo region (emblem + CREMISI PORTALS), letterboxed in space */}
        <g clipPath={`url(#${id}c)`}>
          {[
            [12.4, 16.4],
            [31.6, 17.2],
            [14, 31.6],
            [30.4, 32.4],
          ].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width=".5" height=".5" fill={white} opacity=".7" />
          ))}
          {label && (
            <svg x="10.6" y="14.4" width="23.4" height="19.6" viewBox="118 18 251 109" preserveAspectRatio="xMidYMid meet">
              <image href={asset(label.src)} x="0" y="0" width="480" height="270" />
            </svg>
          )}
        </g>
        <rect x="10.6" y="35" width="23.4" height="1" fill={crimson} />
        <text x="22.3" y="39.4" className="obj-t-black" fontSize="2.2" fill={shell} textAnchor="middle" textLength={Math.min(22, p.title.length * 1.7)} lengthAdjust="spacingAndGlyphs">
          {p.title.toUpperCase()}
        </text>
        <Paper grain={`${id}g`} x={10} y={13.8} w={24.6} h={27.6} rx={1} />
        <path d={DS_CARD} fill={`url(#${id}h)`} />
        <Glint clip={`url(#${id}k)`} x={0} y={8} w={4} h={38} travel={52} opacity={0.18} />
      </g>
      {/* the clip's front lip, over the card's lower edge */}
      <g data-part="clip">
        <rect x="2" y="40" width="40" height="11" rx="2.4" fill="#fff" opacity=".16" />
        <path d="M4 40.4 H40" stroke="#fff" strokeOpacity=".8" strokeWidth=".5" />
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------------------- */
/* 3.5" floppy: SpaceRim, a typeset label with a castle-and-planet emblem (a castle jam game) */
/* ---------------------------------------------------------------------------------------- */

const FLOPPY = "M2.5 .5 H82 L89.5 8 V91.5 a2 2 0 0 1 -2 2 H2.5 a2 2 0 0 1 -2 -2 V2.5 a2 2 0 0 1 2 -2Z";

/** SpaceRim's emblem: a castle wall under a ringed planet (centre 25, 58.6; r 9.4) */
export function CastlePlanet({ shell, accent, paper, metal }: { shell: string; accent: string; paper: string; metal: string }) {
  return (
    <g>
      <circle cx="25" cy="58.6" r="9.4" fill={shell} />
      <circle cx="28.4" cy="55.4" r="3.4" fill={accent} />
      <ellipse cx="28.4" cy="55.4" rx="6" ry="1.5" fill="none" stroke={paper} strokeWidth=".6" transform="rotate(-18 28.4 55.4)" />
      <rect x="19.6" y="52.4" width=".7" height=".7" fill={paper} />
      <rect x="22.6" y="57.2" width=".6" height=".6" fill={paper} />
      <path
        d="M16.4 67.2 V60.6 h2 v-1.6 h1.8 v1.6 h1.4 v-4.4 h1.6 v-1.6 h1.8 v1.6 h1.6 v4.4 h1.4 v-1.6 h1.8 v1.6 h2 V67.2 Z"
        fill={metal}
      />
      <rect x="24" y="62.6" width="2" height="3" rx="1" fill={shell} />
    </g>
  );
}

function Floppy({ p, r, id, size }: DrawProps) {
  const shell = r.dark;
  const paper = r.light;
  // the shutter is the palette's cool grey-blue when there is one; the accent is the warm tone
  const cool = p.palette.find((c) => /^#8fa3c7$/i.test(c));
  const metal = cool ?? r.acc(1);
  const accent = r.acc(0) === cool ? r.acc(1) : r.acc(0);
  const px = size / 90;
  const words = p.title.toUpperCase().match(/^(SPACE)(RIM)$/) ? ["SPACE", "RIM"] : [p.title.toUpperCase()];
  return (
    <svg viewBox="0 0 90 94" className="obj-svg" aria-hidden="true">
      <defs>
        <Grain id={`${id}g`} pxPerUnit={px} />
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".2" />
          <stop offset=".3" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".15" />
        </linearGradient>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity=".25" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".18" />
        </linearGradient>
        <clipPath id={`${id}sc`}>
          <rect x="22" y=".5" width="46" height="31" rx=".8" />
        </clipPath>
      </defs>
      <g data-part="shell">
        <path d={FLOPPY} fill={shell} stroke="#000" strokeOpacity=".4" strokeWidth=".6" />
        {/* the media under the shutter */}
        <rect x="38" y="4" width="11" height="22" rx="1" fill="#000" opacity=".55" />
        <rect x="38" y="4" width="11" height="22" rx="1" fill={accent} opacity=".25" />
        {/* label */}
        <rect x="11" y="40" width="68" height="53.5" rx="1.4" fill={paper} />
        <rect x="11" y="40" width="68" height="7" fill={accent} />
        <text x="45" y="45" className="obj-t-black" fontSize="3" fill={shell} textAnchor="middle" letterSpacing=".8">
          GODOT · GAME JAM
        </text>
        {/* emblem: a castle wall under a ringed planet */}
        <CastlePlanet shell={shell} accent={accent} paper={paper} metal={metal} />
        {words.map((w, i) => (
          <text key={w} x="38" y={words.length > 1 ? 57 + i * 9.4 : 62} className="obj-t-black" fontSize={words.length > 1 ? 10.4 : 7.6} fill={shell} letterSpacing=".2">
            {w}
          </text>
        ))}
        <text x="38.4" y={words.length > 1 ? 71.4 : 67} className="obj-t-kana" fontSize="3.3" fill={shell} opacity=".75">
          {p.titleJp}
        </text>
        {[78, 84, 90].map((y) => (
          <path key={y} d={`M15 ${y} H75`} stroke={shell} strokeOpacity=".25" strokeWidth=".5" />
        ))}
        <text x="15" y="83" className="obj-t-black" fontSize="2.2" fill={shell} opacity=".5" letterSpacing=".4">
          DISK 1 / 1
        </text>
        <Paper grain={`${id}g`} x={11} y={40} w={68} h={53.5} rx={1.4} />
        {/* write-protect and hole */}
        <rect x="4" y="84" width="4" height="5" fill="#000" opacity=".5" />
        <rect x="82" y="84" width="4" height="5" fill="#000" opacity=".5" />
        <path d={FLOPPY} fill={`url(#${id}h)`} />
      </g>
      <g data-part="shutter">
        <rect x="22" y=".5" width="46" height="31" rx=".8" fill={metal} />
        <rect x="22" y=".5" width="46" height="31" rx=".8" fill={`url(#${id}m)`} />
        <rect x="38" y="4" width="11" height="22" rx="1" fill={shell} opacity=".85" />
        <path d="M22.5 1.2 H67.5" stroke="#fff" strokeOpacity=".7" strokeWidth=".5" />
        <Glint clip={`url(#${id}sc)`} x={16} y={0} w={5} h={32} travel={66} opacity={0.3} />
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------------------- */

const SPEC: Record<ObjectKind, { left: number; right: number; top: number }> = {
  "trainer-card": { left: 4, right: 4, top: 4 },
  booster: { left: 4, right: 4, top: 15 },
  cassette: { left: 4, right: 4, top: 0.8 },
  "gb-cart": { left: 4.5, right: 20, top: 0.7 },
  cd: { left: 8.5, right: 1.5, top: 0.5 },
  "gba-cart": { left: 5, right: 5, top: 1 },
  "deck-box": { left: 5, right: 5, top: 4.4 },
  "ds-card": { left: 18, right: 18, top: 17.5 },
  floppy: { left: 3, right: 10, top: 0.6 },
};

const FALLBACK: Record<ObjectKind, string[]> = {
  "trainer-card": OBJECT_PALETTES.omar,
  booster: OBJECT_PALETTES["ptcg-cube"],
  cassette: OBJECT_PALETTES.crossfader,
  "gb-cart": OBJECT_PALETTES["galactic-news"],
  cd: OBJECT_PALETTES["haunt-record"],
  "gba-cart": OBJECT_PALETTES["project-minamoto"],
  "deck-box": ["#1d1a2f", "#e8e4d8", "#c8a24a", "#6b5ca5"],
  "ds-card": OBJECT_PALETTES["cremisi-portals"],
  floppy: ["#14182b", "#8fa3c7", "#e9e4d4", "#c9a66b"],
};

/** The object's palette: the sampled livery when we have one, else the project's own */
export function objectPalette(project: StudioProject): string[] {
  return OBJECT_PALETTES[project.slug] ?? (project.palette.length >= 2 ? project.palette : FALLBACK[project.kind]);
}

export default function ObjectArt({ project, size, side = "A" }: ObjectArtProps) {
  const id = useSvgId();
  const kind = project.kind;
  const box = OBJECT_BOX[kind];
  const palette = objectPalette(project);
  const r = roles(palette, FALLBACK[kind]);
  const label = LABEL_OVERRIDE[project.slug] ?? project.art.label;
  const props: DrawProps = { p: { ...project, palette }, r, id, size, side, label };
  let drawing: ReactNode;
  switch (kind) {
    case "trainer-card":
      drawing = <TrainerCard {...props} />;
      break;
    case "booster":
      drawing = <Booster {...props} />;
      break;
    case "cassette":
      drawing = <Cassette {...props} />;
      break;
    case "gb-cart":
      drawing = <GbCart {...props} />;
      break;
    case "cd":
      drawing = <Cd {...props} />;
      break;
    case "gba-cart":
      drawing = <GbaCart {...props} />;
      break;
    case "deck-box":
      drawing = <DeckBox {...props} />;
      break;
    case "ds-card":
      drawing = <DsCard {...props} />;
      break;
    case "floppy":
      drawing = <Floppy {...props} />;
      break;
  }
  const style = { width: size, height: (size * box.h) / box.w } as CSSProperties;
  return (
    <div className={`obj obj--${kind}`} data-kind={kind} data-slug={project.slug} data-side={side} aria-hidden="true" style={style}>
      {drawing}
      <Spec {...SPEC[kind]} />
    </div>
  );
}
