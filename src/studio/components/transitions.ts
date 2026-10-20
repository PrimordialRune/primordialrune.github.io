// Open transitions: each object does what its medium physically did (P3), on stepped
// frames at 12fps (P6). Every open is staged like a pair of hands would do it:
//   1. lift: the object leaves the shelf (one frame up)
//   2. travel: 3 stepped frames to a staging point in front of the TV, growing to ~2x
//   3. action: the medium's own gesture, big enough to read (flip, tear, hinge, snap...)
//   4. insert: into the TV (a tray that slides out of the TV base, a slot in the bezel,
//      or played onto the glass); cases go back to the shelf, closed and empty.
// The object travels as fixed "ghosts" (clones of its .obj), so shelf overflow and stacking
// never clip it. FULL <=1.4s; SOFT <=0.7s with about half the frames, no click or bounce.
//
// The returned timeline plays at once. progress(1) skips to the end; revert() or kill()
// removes every temporary element and restores the shelf object's inline styles.

import { gsap } from "gsap";
import type { ObjectKind } from "../types";

const FPS = 12;
const fr = (n: number) => n / FPS;

type El = HTMLElement | SVGElement;
interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}
/** A ghost's transform: translation from its shelf box, and its scale around its centre */
interface Pose {
  x: number;
  y: number;
  s: number;
}
const HOME: Pose = { x: 0, y: 0, s: 1 };

let seq = 0;

/** The .obj drawing inside (or at) the element the caller passes */
function findObj(el: HTMLElement): HTMLElement {
  if (el.classList.contains("obj")) return el;
  return el.querySelector<HTMLElement>(".obj") ?? el;
}

const parts = (root: Element, name: string) => Array.from(root.querySelectorAll<SVGElement | HTMLElement>(`[data-part="${name}"]`));
const part = (root: Element, name: string) => root.querySelector<SVGElement | HTMLElement>(`[data-part="${name}"]`);

/** Clone ids get a suffix, and every url(#id) / #id reference inside follows them */
function uniquifyIds(root: Element, suffix: string) {
  const map = new Map<string, string>();
  root.querySelectorAll("[id]").forEach((n) => {
    const next = n.id + suffix;
    map.set(n.id, next);
    n.id = next;
  });
  if (!map.size) return;
  const attrs = ["clip-path", "filter", "fill", "stroke", "mask", "href", "xlink:href"];
  root.querySelectorAll("*").forEach((n) => {
    for (const a of attrs) {
      const v = n.getAttribute(a);
      if (!v) continue;
      const nv = v
        .replace(/url\(#([^)]+)\)/g, (m, id: string) => (map.has(id) ? `url(#${map.get(id)})` : m))
        .replace(/^#(.+)$/, (m, id: string) => (map.has(id) ? `#${map.get(id)}` : m));
      if (nv !== v) n.setAttribute(a, nv);
    }
  });
}

interface Stage {
  tl: gsap.core.Timeline;
  orig: HTMLElement;
  ghost: HTMLElement;
  /** the object's box on the shelf (scale 1) */
  rect: DOMRect;
  /** the TV glass */
  tv: DOMRect;
  soft: boolean;
  /** frames: full count, or about half in SOFT (never below 1) */
  F: (n: number) => number;
  /** scale at the staging point */
  S: number;
  /** SVG user units to CSS px at scale 1 */
  ppu: number;
  temps: Element[];
  /** shelf-side elements whose inline opacity/visibility we set */
  touched: Set<Element>;
}

/* ---------------------------------------------------------------------------------------- */
/* Frame helpers                                                                             */
/* ---------------------------------------------------------------------------------------- */

/** A tween that moves on `n` held frames */
function step(s: Stage, targets: El | El[] | null, vars: gsap.TweenVars, n: number, at: number) {
  if (!targets || (Array.isArray(targets) && !targets.length) || n <= 0) return at;
  s.tl.to(targets, { ...vars, duration: fr(n), ease: `steps(${n})` }, at);
  return at + fr(n);
}

/** Explicit key frames: one set per frame, the first one frame after `at` */
function keys(s: Stage, target: El | El[] | null, frames: gsap.TweenVars[], at: number) {
  if (!target || (Array.isArray(target) && !target.length)) return at + fr(frames.length);
  frames.forEach((v, i) => s.tl.set(target, v, at + fr(i + 1)));
  return at + fr(frames.length);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const cx = (b: Box) => b.left + b.width / 2;
const cy = (b: Box) => b.top + b.height / 2;

/** The pose that puts the ghost's centre at (x, y) at scale k */
const poseAt = (s: Stage, x: number, y: number, k: number): Pose => ({ x: x - cx(s.rect), y: y - cy(s.rect), s: k });
/** Screen centre of the ghost in a pose */
const centreOf = (s: Stage, p: Pose) => ({ x: cx(s.rect) + p.x, y: cy(s.rect) + p.y });

/** Stepped travel between two poses, one key per frame; `arc` lifts the middle frames */
function travel(s: Stage, el: El, from: Pose, to: Pose, n: number, at: number, arc = 0) {
  const frames: gsap.TweenVars[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    frames.push({
      x: lerp(from.x, to.x, t),
      y: lerp(from.y, to.y, t) - arc * Math.sin(Math.PI * t),
      scale: lerp(from.s, to.s, t),
    });
  }
  return keys(s, el, frames, at);
}

/** A card-like flip by scaleX, one key per value; `swap` runs on the first frame past edge-on */
function flip(s: Stage, target: El | null, values: number[], at: number, swap: (t: number) => void) {
  let swapped = false;
  const from = Math.sign(values[values.length - 1]) === 1 ? -1 : 1;
  values.forEach((v, i) => {
    if (!swapped && (Math.abs(v) < 0.01 || Math.sign(v) !== from)) {
      swapped = true;
      swap(at + fr(i + 1));
    }
  });
  return keys(
    s,
    target,
    values.map((v) => ({ scaleX: Math.abs(v) < 0.01 ? 0.001 : v })),
    at,
  );
}

/** A temporary fixed element (removed by cleanup) */
function temp(s: Stage, style: Partial<CSSStyleDeclaration>, z = 89): HTMLDivElement {
  const d = document.createElement("div");
  d.setAttribute("aria-hidden", "true");
  Object.assign(d.style, { position: "fixed", pointerEvents: "none", zIndex: String(z), ...style });
  document.body.appendChild(d);
  s.temps.push(d);
  return d;
}

/** A fresh clone of the shelf object, at rest, laid over its shelf box (hidden until shown) */
function cloneObj(s: Stage): HTMLElement {
  const c = s.orig.cloneNode(true) as HTMLElement;
  uniquifyIds(c, `-g${++seq}`);
  c.setAttribute("aria-hidden", "true");
  c.removeAttribute("id");
  Object.assign(c.style, {
    position: "fixed",
    left: `${s.rect.left}px`,
    top: `${s.rect.top}px`,
    width: `${s.rect.width}px`,
    height: `${s.rect.height}px`,
    margin: "0",
    zIndex: "90",
    pointerEvents: "none",
    opacity: "0",
    // a cream rim and a soft shadow: light, so the object reads on any title screen (P4)
    filter: "drop-shadow(0 0 1px rgba(252,232,205,.9)) drop-shadow(0 10px 12px rgba(16,47,65,.35))",
  });
  document.body.appendChild(c);
  s.temps.push(c);
  gsap.set(c, { transformOrigin: "50% 50%" });
  return c;
}

/** Hide parts of the shelf object (restored by revert/kill) */
function hideOnShelf(s: Stage, names: string[], at: number) {
  for (const name of names)
    parts(s.orig, name).forEach((p) => {
      s.touched.add(p);
      s.tl.set(p, { visibility: "hidden" }, at);
    });
}

/* ---------------------------------------------------------------------------------------- */
/* Choreography pieces                                                                       */
/* ---------------------------------------------------------------------------------------- */

/** Where the bezel slot is: just under the glass, inside the bezel */
const slotY = (s: Stage) => s.tv.bottom + 6;

/** The staging pose: in front of the lower TV, ~2x. `bottomAt` puts the ghost's bottom there */
function stagePose(s: Stage, bottomAt?: number): Pose {
  const h = s.rect.height * s.S;
  let y = bottomAt !== undefined ? bottomAt - h / 2 : Math.min(s.tv.top + s.tv.height * 0.56, s.tv.bottom - 6 - h / 2);
  const vh = window.innerHeight;
  y = clamp(y, h / 2 + 8, Math.max(h / 2 + 8, vh - h / 2 - 8));
  return poseAt(s, cx(s.tv), y, s.S);
}

/** 1 + 2: lift off the shelf (FULL: one frame), then 3 stepped frames (SOFT 2) to the stage */
function liftAndTravel(s: Stage, to: Pose, at = 0): number {
  let from = HOME;
  if (!s.soft) {
    from = { x: 0, y: -10, s: 1 };
    s.tl.set(s.ghost, { y: -10 }, at + fr(1));
    at += fr(1);
  }
  return travel(s, s.ghost, from, to, s.F(3), at, 18);
}

/** A case goes home to the shelf, closed and empty: a fresh clone at rest, minus `gone` */
function caseGoesHome(s: Stage, from: Pose, gone: string[], awayInGhost: string[], at: number, shelfHides: string[] = []): number {
  const home = cloneObj(s);
  home.style.zIndex = "88"; // behind the part that goes on to the TV
  for (const name of gone) parts(home, name).forEach((p) => p.setAttribute("visibility", "hidden"));
  s.tl.set(home, { opacity: 1, x: from.x, y: from.y, scale: from.s }, at);
  for (const name of awayInGhost) s.tl.set(parts(s.ghost, name), { visibility: "hidden" }, at);
  const t = travel(s, home, from, HOME, s.F(3), at, -10);
  s.tl.set(s.orig, { opacity: 1 }, t);
  hideOnShelf(s, shelfHides, t);
  s.tl.set(home, { opacity: 0 }, t);
  return t;
}

/** Played onto the glass: the ghost's `focus` point goes to the glass centre and recedes */
function ontoGlass(s: Stage, from: Pose, focusDy: number, n: number, at: number): number {
  const target = poseAt(s, cx(s.tv), cy(s.tv) - focusDy * from.s * 0.5, from.s * 0.5);
  const t = travel(s, s.ghost, from, target, n, at, 0);
  s.tl.set(s.ghost, { opacity: 0 }, t + fr(1));
  return t + fr(1);
}

/** The bezel slot: a dark slit that opens under the glass (stepped), above the ghost */
function makeSlot(s: Stage, width: number, at: number, n: number): HTMLDivElement {
  const w = Math.round(width);
  const slot = temp(
    s,
    {
      left: `${Math.round(cx(s.tv) - w / 2)}px`,
      top: `${Math.round(slotY(s) - 3)}px`,
      width: `${w}px`,
      height: "6px",
      borderRadius: "3px",
      background: "#102f41",
      boxShadow: "inset 0 2px 0 rgba(0,0,0,.45), 0 1px 0 rgba(252,232,205,.35)",
    },
    91,
  );
  gsap.set(slot, { scaleX: 0 });
  const frames = n <= 1 ? [{ scaleX: 1 }] : Array.from({ length: n }, (_, i) => ({ scaleX: (i + 1) / n }));
  keys(s, slot, frames, at);
  return slot;
}

/** The ghost goes down into the slot: per frame, it moves and is clipped at the slot line */
function intoSlot(s: Stage, from: Pose, depthPx: number, n: number, at: number, el: HTMLElement = s.ghost): { at: number; pose: Pose } {
  const line = slotY(s);
  const h = s.rect.height;
  const frames: gsap.TweenVars[] = [];
  let pose = from;
  for (let i = 1; i <= n; i++) {
    pose = { ...from, y: from.y + (depthPx * i) / n };
    frames.push({ y: pose.y, clipPath: clipAbove(s, pose, line, h) });
  }
  s.tl.set(el, { clipPath: clipAbove(s, from, line, h) }, at);
  return { at: keys(s, el, frames, at), pose };
}

/** A clip-path that keeps what is above screen-y `line` for a ghost in `pose` */
function clipAbove(s: Stage, pose: Pose, line: number, h: number) {
  const top = centreOf(s, pose).y - (h * pose.s) / 2;
  const y = Math.round(((line - top) / pose.s) * 10) / 10;
  return `polygon(-300% -300%, 400% -300%, 400% ${y}px, -300% ${y}px)`;
}

/** One "click" frame: short cream marks at both ends of the slot */
function clickMarks(s: Stage, width: number, at: number) {
  const y = slotY(s);
  const mk = (side: -1 | 1) => {
    const x = cx(s.tv) + side * (width / 2 + 6);
    const d = temp(s, { left: `${Math.round(x - 9)}px`, top: `${Math.round(y - 18)}px`, width: "18px", height: "18px", visibility: "hidden" }, 92);
    const a = side < 0 ? "M15 14 L5 6 M14 9 L9 1 M16 17 L2 15" : "M3 14 L13 6 M4 9 L9 1 M2 17 L16 15";
    d.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18"><path d="${a}" stroke="#fce8cd" stroke-width="2" stroke-linecap="square" fill="none"/></svg>`;
    s.tl.set(d, { visibility: "inherit" }, at);
    s.tl.set(d, { visibility: "hidden" }, at + fr(1));
  };
  mk(-1);
  mk(1);
}

/** A drawer that slides down out of the TV base (dark teal plastic); clipped at the base */
function makeTray(s: Stage, w: number, h: number) {
  const W = Math.round(w);
  const H = Math.round(h);
  const top = Math.round(s.tv.bottom - 2);
  const box = temp(s, { left: `${Math.round(cx(s.tv) - W / 2)}px`, top: `${top}px`, width: `${W}px`, height: `${H}px`, overflow: "hidden" }, 89);
  const tray = document.createElement("div");
  Object.assign(tray.style, {
    position: "absolute",
    inset: "0",
    background: "#256069",
    borderRadius: "0 0 12px 12px",
    boxShadow: "inset 0 1px 0 rgba(252,232,205,.3), inset 0 -3px 0 rgba(0,0,0,.25)",
  });
  gsap.set(tray, { yPercent: -100 });
  box.appendChild(tray);
  return { box, tray, top, W, H, wellX: cx(s.tv), wellY: top + H / 2 };
}

/** Stepped open or close of a tray (yPercent -100 = inside the TV) */
function slideTray(s: Stage, tray: HTMLElement, open: boolean, n: number, at: number) {
  const frames = Array.from({ length: n }, (_, i) => ({ yPercent: open ? -100 + (100 * (i + 1)) / n : -(100 * (i + 1)) / n }));
  return keys(s, tray, frames, at);
}

/* ---------------------------------------------------------------------------------------- */

const OPEN: Record<ObjectKind, (s: Stage) => number> = {
  // Out of the binder: up to the TV, slides out of its clear sleeve, turns over to show its
  // back (the logo), holds, and goes home again. Does not enter the TV.
  "trainer-card": (s) => {
    const card = part(s.ghost, "card");
    const front = part(s.ghost, "card-front");
    const back = part(s.ghost, "card-back");
    if (card) s.tl.set(card, { transformOrigin: "50% 50%" }, 0);
    const stage = stagePose(s);
    let t = liftAndTravel(s, stage);
    t = keys(s, card, s.soft ? [{ y: -26 }] : [{ y: -12 }, { y: -26 }], t);
    t = flip(s, card, s.soft ? [0, -1] : [0.5, 0, -0.5, -1], t, (at) => {
      s.tl.set(front, { visibility: "hidden" }, at);
      s.tl.set(back, { visibility: "inherit" }, at);
    });
    t += fr(s.soft ? 1 : 3);
    // home: edge-on and back to its front on the way, into the sleeve as it lands
    const n = s.F(3);
    s.tl.set(front, { visibility: "inherit" }, t + fr(1));
    s.tl.set(back, { visibility: "hidden" }, t + fr(1));
    t = travel(s, s.ghost, stage, HOME, n, t, -12);
    keys(s, card, n >= 3 ? [{ scaleX: 0.001 }, { scaleX: 1, y: -12 }, { y: 0 }] : [{ scaleX: 0.001 }, { scaleX: 1, y: 0 }], t - fr(n));
    s.tl.set(s.orig, { opacity: 1 }, t);
    s.tl.set(s.ghost, { opacity: 0 }, t);
    return t;
  },

  // Up to the TV; the crimp tears left to right along its jagged edge, three cards fan out
  // of the foil, and the hand is played onto the glass
  booster: (s) => {
    const stage = stagePose(s);
    let t = liftAndTravel(s, stage);
    const tear = [part(s.ghost, "tear-keep"), part(s.ghost, "tear-off")].filter(Boolean) as El[];
    const off = part(s.ghost, "foil-off");
    const n = s.F(4);
    if (off) s.tl.set(off, { transformOrigin: "0% 100%" }, 0);
    step(s, tear, { x: 66 }, n, t);
    t = step(s, off, { y: -6, rotation: -14 }, n, t);
    s.tl.set(off, { visibility: "hidden" }, t);
    const cards = parts(s.ghost, "card");
    const fan = s.F(3);
    cards.forEach((c, i) => {
      s.tl.set(c, { transformOrigin: "50% 100%" }, 0);
      step(s, c, { y: i === 1 ? -46 : -36, rotation: (i - 1) * 18 }, fan, t);
    });
    t += fr(fan);
    // the empty foil drops away; the hand (centre ~30 units above the pack's centre) goes in
    s.tl.set([part(s.ghost, "pack"), part(s.ghost, "foil")].filter(Boolean) as El[], { visibility: "hidden" }, t + fr(1));
    return ontoGlass(s, stage, -30 * s.ppu, s.F(2), t);
  },

  // Up to the TV, turns over A→B (the label now reads SIDE B) while a tape tray slides out
  // of the TV base; the tape drops into the tray, the tray closes, the reels tick
  cassette: (s) => {
    const stage = stagePose(s);
    let t = liftAndTravel(s, stage);
    const fromB = s.ghost.dataset.side === "B";
    const [show, hide] = fromB ? ["side-a", "side-b"] : ["side-b", "side-a"];
    s.tl.set(s.ghost, { transformOrigin: "50% 50%" }, 0);
    const W = s.rect.width * s.S;
    const H = s.rect.height * s.S;
    const tr = makeTray(s, W * 1.12, H * 1.16);
    // the tray's well and the tape copy that rides it home
    const well = document.createElement("div");
    Object.assign(well.style, {
      position: "absolute",
      left: `${(tr.W - W * 1.04) / 2}px`,
      top: `${(tr.H - H * 1.06) / 2}px`,
      width: `${W * 1.04}px`,
      height: `${H * 1.06}px`,
      borderRadius: "8px",
      background: "#102f41",
    });
    tr.tray.appendChild(well);
    const copy = s.orig.cloneNode(true) as HTMLElement;
    uniquifyIds(copy, `-t${++seq}`);
    copy.removeAttribute("id");
    parts(copy, hide).forEach((p) => p.setAttribute("visibility", "hidden"));
    parts(copy, show).forEach((p) => p.removeAttribute("visibility"));
    Object.assign(copy.style, {
      position: "absolute",
      left: `${(tr.W - W) / 2}px`,
      top: `${(tr.H - H) / 2}px`,
      width: `${s.rect.width}px`,
      height: `${s.rect.height}px`,
      margin: "0",
      transform: `scale(${s.S})`,
      transformOrigin: "0 0",
      visibility: "hidden",
    });
    copy.style.opacity = "1";
    tr.tray.appendChild(copy);

    const values = s.soft ? [0, 1] : [0.5, 0, 0.5, 1];
    const at0 = t;
    t = keys(
      s,
      s.ghost,
      values.map((v) => ({ scaleX: (Math.abs(v) < 0.01 ? 0.001 : v) * s.S })),
      t,
    );
    const swapAt = at0 + fr(values.indexOf(0) + 1);
    s.tl.set(parts(s.ghost, hide), { visibility: "hidden" }, swapAt);
    s.tl.set(parts(s.ghost, show), { visibility: "inherit" }, swapAt);
    // the tray comes out while the tape turns
    slideTray(s, tr.tray, true, s.F(3), s.soft ? at0 : at0 + fr(1));
    // drop: over the well, then in
    const over = poseAt(s, tr.wellX, tr.wellY - H * 0.18, s.S);
    const inWell = poseAt(s, tr.wellX, tr.wellY, s.S);
    const drop = s.soft ? [inWell] : [over, inWell];
    drop.forEach((p, i) => s.tl.set(s.ghost, { x: p.x, y: p.y, scaleX: s.S, scaleY: s.S }, t + fr(i + 1)));
    t += fr(drop.length);
    s.tl.set(s.ghost, { opacity: 0 }, t);
    s.tl.set(copy, { visibility: "inherit" }, t);
    const reels = parts(copy, "reel");
    reels.forEach((r) => s.tl.set(r, { transformOrigin: "50% 50%" }, 0));
    const close = s.F(3);
    step(s, reels, { rotation: 30 * close }, close, t);
    return slideTray(s, tr.tray, false, close, t);
  },

  // Up to the TV over the bezel slot; drops in a step per frame, then one click frame
  "gb-cart": (s) => {
    const stage = stagePose(s, slotY(s) - 4);
    const travelEnd = liftAndTravel(s, stage);
    const sw = s.rect.width * s.S + 10;
    makeSlot(s, sw, travelEnd - fr(2), 2);
    const { at, pose } = intoSlot(s, stage, s.rect.height * s.S * 0.62 + 4, s.F(5), travelEnd);
    let t = at;
    if (!s.soft) {
      s.tl.set(s.ghost, { y: pose.y + 3, clipPath: clipAbove(s, { ...pose, y: pose.y + 3 }, slotY(s), s.rect.height) }, t + fr(1));
      clickMarks(s, sw, t + fr(1));
      s.tl.set(s.ghost, { y: pose.y, clipPath: clipAbove(s, pose, slotY(s), s.rect.height) }, t + fr(2));
      t += fr(2);
    }
    return t + fr(1);
  },

  // Up to the TV; the case hinges open, the disc lifts, the empty case closes and goes home,
  // a tray slides out of the TV base, the disc drops in, the tray closes while it turns
  cd: (s) => {
    const stage = stagePose(s);
    let t = liftAndTravel(s, stage);
    const lid = part(s.ghost, "lid");
    const disc = part(s.ghost, "disc");
    const discBox = part(s.orig, "disc")?.getBoundingClientRect();
    if (!disc || !discBox) return ontoGlass(s, stage, 0, s.F(3), t);
    if (lid) s.tl.set(lid, { svgOrigin: "9 50" }, 0);
    t = keys(s, lid, s.soft ? [{ scaleX: 0.001 }, { visibility: "hidden" }] : [{ scaleX: 0.5 }, { scaleX: 0.001 }, { visibility: "hidden" }], t);
    const lift = s.soft ? 0 : 7;
    if (lift) t = step(s, disc, { y: -lift }, 1, t);
    // the case goes home closed, without its disc
    caseGoesHome(s, stage, ["disc"], ["case", "lid"], t);

    const D = discBox.width * s.S;
    const tr = makeTray(s, D * 1.18, D * 1.1);
    const well = document.createElement("div");
    Object.assign(well.style, {
      position: "absolute",
      left: `${(tr.W - D * 1.04) / 2}px`,
      top: `${(tr.H - D * 1.04) / 2}px`,
      width: `${D * 1.04}px`,
      height: `${D * 1.04}px`,
      borderRadius: "50%",
      background: "#102f41",
    });
    tr.tray.appendChild(well);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "16.5 6 88 88");
    svg.setAttribute("width", `${D}`);
    svg.setAttribute("height", `${D}`);
    Object.assign(svg.style, { position: "absolute", left: `${(tr.W - D) / 2}px`, top: `${(tr.H - D) / 2}px`, overflow: "visible", visibility: "hidden" });
    const copy = disc.cloneNode(true) as SVGGElement;
    copy.removeAttribute("data-part");
    svg.appendChild(copy);
    tr.tray.appendChild(svg);

    // the disc travels over the well while the tray opens, then drops in
    const discOff = { x: cx(discBox) - cx(s.rect), y: cy(discBox) - cy(s.rect) };
    const ghostAt = (x: number, y: number) => poseAt(s, x - discOff.x * s.S, y - discOff.y * s.S + lift * s.ppu * s.S, s.S);
    const over = ghostAt(tr.wellX, tr.wellY - D * 0.14);
    const open = s.F(3);
    travel(s, s.ghost, { ...stage }, over, open, t, 0);
    t = slideTray(s, tr.tray, true, open, t);
    if (!s.soft) {
      const inWell = ghostAt(tr.wellX, tr.wellY);
      s.tl.set(s.ghost, { x: inWell.x, y: inWell.y }, t + fr(1));
      t += fr(1);
    }
    s.tl.set(s.ghost, { opacity: 0 }, t);
    s.tl.set(svg, { visibility: "inherit" }, t);
    const close = s.F(3);
    s.tl.set(copy, { svgOrigin: "60.5 50" }, 0);
    step(s, copy, { rotation: 30 * close }, close, t);
    return slideTray(s, tr.tray, false, close, t);
  },

  // Up to the TV over the slot; tilts back two frames, inserts top-down, the LED lights
  "gba-cart": (s) => {
    const stage = stagePose(s, slotY(s) - 4);
    const travelEnd = liftAndTravel(s, stage);
    makeSlot(s, s.rect.width * s.S + 10, travelEnd - fr(2), 2);
    // tilt back around the centre; y keeps the bottom edge on its mark
    const tilt = (skewX: number, k: number) => ({ skewX, scaleY: s.S * k, y: stage.y + (s.rect.height * s.S * (1 - k)) / 2 });
    let t = keys(s, s.ghost, s.soft ? [tilt(-7, 0.86)] : [tilt(-4, 0.93), tilt(-7, 0.86)], travelEnd);
    s.tl.set(s.ghost, { skewX: 0, scaleY: s.S, y: stage.y }, t + fr(1));
    const r = intoSlot(s, stage, s.rect.height * s.S * 0.7 + 4, s.F(4), t);
    t = r.at;
    s.tl.set(part(s.ghost, "led"), { visibility: "inherit" }, t);
    return t + fr(s.soft ? 1 : 2);
  },

  // Up to the TV; the lid lifts, the top card rises and turns face up, the box closes and
  // goes home, and the card is played onto the glass
  "deck-box": (s) => {
    const stage = stagePose(s);
    let t = liftAndTravel(s, stage);
    const lid = part(s.ghost, "lid");
    const card = part(s.ghost, "card");
    if (lid) s.tl.set(lid, { transformOrigin: "0% 100%" }, 0);
    t = keys(s, lid, s.soft ? [{ x: -2, y: -9, rotation: -6 }, { x: -4, y: -17, rotation: -12 }] : [{ y: -5, rotation: -3 }, { x: -2, y: -11, rotation: -7 }, { x: -4, y: -17, rotation: -12 }], t);
    if (card) s.tl.set(card, { transformOrigin: "50% 50%" }, 0);
    const turn = s.soft ? [0, 1] : [0.5, 0, 0.5, 1];
    const rise = s.soft ? [-48, -48] : [-20, -38, -48, -48];
    const at0 = t;
    t = keys(
      s,
      card,
      turn.map((v, i) => ({ scaleX: Math.abs(v) < 0.01 ? 0.001 : v, y: rise[i] })),
      t,
    );
    const edge = at0 + fr(turn.indexOf(0) + 1);
    s.tl.set(part(s.ghost, "card-back"), { visibility: "hidden" }, edge);
    s.tl.set(part(s.ghost, "card-front"), { visibility: "inherit" }, edge);
    caseGoesHome(s, stage, ["card"], ["box", "lid", "inside"], t);
    // card centre: y 60 of 92 at rest, risen 48 → 12; the box centre is 46
    return ontoGlass(s, stage, -34 * s.ppu, s.F(2), t);
  },

  // Up to the TV; snaps out of its case clip, the case goes home, the card slides into the slot
  "ds-card": (s) => {
    // stage so that the snapped card's bottom (y 45.5 - 14 of 52) sits just over the slot
    const lift = 14;
    const cardBottom = (45.5 - lift - 26) * s.ppu * s.S; // below the ghost centre
    const h = s.rect.height * s.S;
    const stage = stagePose(s, slotY(s) - 4 - cardBottom + h / 2);
    let t = liftAndTravel(s, stage);
    makeSlot(s, 32 * s.ppu * s.S + 10, t - fr(2), 2);
    const card = part(s.ghost, "card");
    if (card) s.tl.set(card, { transformOrigin: "50% 100%" }, 0);
    t = keys(s, card, s.soft ? [{ y: -lift }] : [{ y: -4, rotation: -5 }, { y: -lift, rotation: 0 }], t);
    caseGoesHome(s, stage, ["card"], ["case", "clip"], t, ["card"]);
    const r = intoSlot(s, stage, (45.5 - 9) * s.ppu * s.S * 0.8 + 4, s.F(4), t + fr(s.soft ? 0 : 1));
    return r.at + fr(1);
  },

  // Up to the TV over the drive slot; the metal shutter slides open, the disk goes in,
  // the drive light blinks
  floppy: (s) => {
    const stage = stagePose(s, slotY(s) - 4);
    const travelEnd = liftAndTravel(s, stage);
    const sw = s.rect.width * s.S + 14;
    makeSlot(s, sw, travelEnd - fr(2), 2);
    let t = step(s, part(s.ghost, "shutter"), { x: 21 }, s.F(3), travelEnd);
    t = intoSlot(s, stage, s.rect.height * s.S * 0.7 + 4, s.F(4), t).at;
    const led = temp(
      s,
      {
        left: `${Math.round(cx(s.tv) + sw / 2 + 8)}px`,
        top: `${Math.round(slotY(s) - 2)}px`,
        width: "10px",
        height: "4px",
        background: "#fadb68",
        boxShadow: "0 0 8px rgba(250,219,104,.8)",
        visibility: "hidden",
      },
      92,
    );
    s.tl.set(led, { visibility: "inherit" }, t);
    const on = s.F(2);
    s.tl.set(led, { visibility: "hidden" }, t + fr(on));
    return t + fr(on);
  },
};

/** Stage scale: about 2x, so the action reads; smaller when the glass is small */
function stageScale(kind: ObjectKind, rect: DOMRect, tv: DOMRect, pixel: boolean): number {
  // small objects (the DS card, a GBA cart) may grow more, so their action still reads
  let k = clamp((0.36 * tv.height) / rect.height, 2, rect.height < 70 ? 3.6 : 2.6);
  k = Math.min(k, (0.6 * tv.width) / rect.width, (0.62 * tv.height) / rect.height);
  if (kind === "cassette" || kind === "cd") {
    // the tray must fit under the TV on screen
    const room = (window.innerHeight - tv.bottom - 4) / (rect.height * (kind === "cd" ? 0.95 : 1.16));
    if (room > 1) k = Math.min(k, Math.max(room, 1.4));
  }
  k = Math.max(1, k);
  // pixel art inside: integer scales only (P1)
  return pixel ? Math.max(1, Math.floor(k)) : Math.round(k * 100) / 100;
}

/**
 * The open transition for an object. `objectEl` is the shelf element holding the
 * ObjectArt (or the .obj itself); `tvEl` is the TV glass. Ends with the object inside the
 * TV: the shelf object stays hidden until revert()/kill() (the CD case, deck box and DS case
 * go back to the shelf). The trainer card plays in front of the TV and returns to rest.
 */
export function openTimeline(kind: ObjectKind, objectEl: HTMLElement, tvEl: HTMLElement, soft: boolean): gsap.core.Timeline {
  const orig = findObj(objectEl);
  const rect = orig.getBoundingClientRect();
  const tv = tvEl.getBoundingClientRect();
  const box = orig.querySelector("svg")?.viewBox.baseVal;
  const tl = gsap.timeline();
  const s: Stage = {
    tl,
    orig,
    ghost: orig,
    rect,
    tv,
    soft,
    F: (n) => (soft ? Math.max(1, Math.round(n / 2)) : n),
    S: stageScale(kind, rect, tv, !!orig.querySelector(".obj-pixel")),
    ppu: box && box.width ? rect.width / box.width : 1,
    temps: [],
    touched: new Set([orig]),
  };
  s.ghost = cloneObj(s);
  // roots are cut with opacity (a hard set, never a fade), so a part shown inside can't leak
  tl.set(orig, { opacity: 0 }, 0);
  tl.set(s.ghost, { opacity: 1 }, 0);
  const end = OPEN[kind](s);

  let restored = false;
  const cleanup = () => {
    s.temps.forEach((n) => n.remove());
    s.temps.length = 0;
  };
  /** the shelf object back exactly as it was (belt and braces after GSAP's own revert) */
  const restore = () => {
    cleanup();
    if (restored) return;
    restored = true;
    gsap.set([...s.touched], { clearProps: "opacity,visibility" });
  };
  tl.call(cleanup, undefined, Math.max(end, fr(1)));

  const revert = tl.revert.bind(tl);
  tl.revert = (...args: Parameters<gsap.core.Timeline["revert"]>) => {
    cleanup();
    const r = revert(...args);
    restore();
    return r;
  };
  const kill = tl.kill.bind(tl);
  tl.kill = (...args: Parameters<gsap.core.Timeline["kill"]>) => {
    const r = kill(...args);
    restore();
    return r;
  };
  return tl;
}

/** Shelf focus: the object lifts (or settles) by one held frame, 8px */
export function liftFrame(el: HTMLElement, lifted: boolean, soft: boolean): void {
  const y = lifted ? -8 : 0;
  if (soft) gsap.set(el, { y, overwrite: "auto" });
  else gsap.to(el, { y, duration: fr(1), ease: "steps(1)", overwrite: "auto" });
}

/* ---------------------------------------------------------------------------------------- */
/* Static                                                                                    */
/* ---------------------------------------------------------------------------------------- */

const BURST_MS = 250;
/** at most one burst in this window, anywhere on the page (no flashing: WCAG 2.3.1) */
const BURST_GAP_MS = 400;
let lastBurst = -Infinity;
let suppressedUntil = -Infinity;

/** Hold all static for `ms` (e.g. during power-on and boot, which have their own motion) */
export function suppressStatic(ms: number): void {
  suppressedUntil = Math.max(suppressedUntil, performance.now() + ms);
}

/**
 * Static on a state change (FULL only): SVG feTurbulence noise at 0.35 plus two tear bars,
 * three frames, then removed from the DOM (250ms). SOFT: a no-op (a hard cut).
 * Rate-limited to one burst per 400ms page-wide and skipped while suppressStatic() holds;
 * `force` (story beats) bypasses both.
 */
export function staticBurst(el: HTMLElement, soft: boolean, opts: { force?: boolean } = {}): void {
  if (soft || typeof document === "undefined") return;
  const now = performance.now();
  if (!opts.force && (now < suppressedUntil || now - lastBurst < BURST_GAP_MS)) return;
  lastBurst = now;
  const fid = `static-${++seq}`;
  const restorePos = getComputedStyle(el).position === "static";
  if (restorePos) el.style.position = "relative";
  const wrap = document.createElement("div");
  wrap.setAttribute("aria-hidden", "true");
  Object.assign(wrap.style, { position: "absolute", inset: "0", pointerEvents: "none", overflow: "hidden", zIndex: "20", borderRadius: "inherit", contain: "strict" });
  wrap.innerHTML =
    `<svg width="100%" height="100%" style="position:absolute;inset:0;opacity:.35;display:block">` +
    `<filter id="${fid}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="1" seed="1"/>` +
    `<feColorMatrix type="matrix" values=".33 .33 .33 0 0  .33 .33 .33 0 0  .33 .33 .33 0 0  0 0 0 0 1"/></filter>` +
    `<rect width="100%" height="100%" filter="url(#${fid})"/></svg>`;
  // bars sit at top:0 and move by transform only (no layout shift)
  const heights = [9, 5];
  const bars = heights.map((h, i) => {
    const b = document.createElement("div");
    Object.assign(b.style, {
      position: "absolute",
      top: "0",
      left: "-10%",
      width: "120%",
      height: `${h}%`,
      background: i ? "rgba(16,47,65,.55)" : "rgba(252,232,205,.15)",
      willChange: "transform",
    });
    wrap.appendChild(b);
    return b;
  });
  el.appendChild(wrap);
  const turb = wrap.querySelector("feTurbulence");
  const tl = gsap.timeline({
    onComplete: () => {
      wrap.remove();
      if (restorePos) el.style.position = "";
    },
  });
  for (let f = 0; f < 3; f++) {
    tl.call(
      () => {
        turb?.setAttribute("seed", String(f * 7 + 3));
        bars.forEach((b, i) => {
          const topPct = (18 + f * 23 + i * 41) % 90;
          b.style.transform = `translate(${(i ? -1 : 1) * (4 + f * 3)}%, ${(topPct / heights[i]) * 100}%)`;
        });
      },
      undefined,
      fr(f),
    );
  }
  tl.set({}, {}, BURST_MS / 1000);
}
