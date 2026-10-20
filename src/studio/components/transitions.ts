// Open transitions: each object does what its medium physically did (P3), on stepped
// frames at 12fps (P6). The object leaves the shelf as a fixed "ghost" (a clone of its
// .obj, so shelf overflow and stacking never clip it), plays its action and ends inside
// the TV. SOFT = about half the frames, no click or bounce, no static; still visible motion.
//
// The returned timeline plays at once. progress(1) skips to the end; revert() (or kill())
// removes every temporary element and restores the original object's inline styles.

import { gsap } from "gsap";
import type { ObjectKind } from "../types";

const FPS = 12;
const fr = (n: number) => n / FPS;

type El = HTMLElement | SVGElement;

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
  rect: DOMRect;
  tv: DOMRect;
  soft: boolean;
  /** frames: full count, or about half in SOFT (never below 1) */
  F: (n: number) => number;
  temps: Element[];
}

/** A tween that moves on `n` held frames */
function step(s: Stage, targets: El | El[] | null, vars: gsap.TweenVars, n: number, at: number) {
  if (!targets || (Array.isArray(targets) && !targets.length) || n <= 0) return at;
  s.tl.to(targets, { ...vars, duration: fr(n), ease: `steps(${n})` }, at);
  return at + fr(n);
}

/** Explicit key frames: one set per frame */
function keys(s: Stage, target: El | El[] | null, frames: gsap.TweenVars[], at: number) {
  if (!target) return at;
  frames.forEach((v, i) => s.tl.set(target, v, at + fr(i + 1)));
  return at + fr(frames.length);
}

/** A card-like flip by scaleX over n frames; `swap` runs on the edge-on frame */
function flip(s: Stage, target: El | null, n: number, at: number, from: 1 | -1, to: 1 | -1, swap: (t: number) => void) {
  if (!target) return at;
  const frames: gsap.TweenVars[] = [];
  let swapped = false;
  for (let i = 1; i <= n; i++) {
    const v = from + ((to - from) * i) / n;
    frames.push({ scaleX: Math.abs(v) < 1e-6 ? 0.001 : v });
    if (!swapped && Math.sign(v) !== Math.sign(from)) {
      swapped = true;
      swap(at + fr(i));
    }
  }
  return keys(s, target, frames, at);
}

const topRoom = (s: Stage, h: number) => s.tv.top >= h * 0.6;

/**
 * Seat a part into the TV's top edge (moving down) or bottom edge (moving up). The part's
 * screen box is `pr` (defaults to the whole ghost); whatever passes the edge is clipped.
 */
function slot(s: Stage, edge: "top" | "bottom", travel: number, insert: number, depth: number, at: number, pr: { left: number; top: number; width: number; height: number } = s.rect) {
  const { ghost, rect, tv } = s;
  const dx = tv.left + tv.width / 2 - (pr.left + pr.width / 2);
  const bottomGap = rect.bottom - (pr.top + pr.height);
  const topGap = pr.top - rect.top;
  const d = pr.height * depth;
  s.tl.set(ghost, { clipPath: "inset(0px 0px 0px 0px)" }, at);
  // a slot on the top edge needs room above the TV to be seen; else use the bottom edge
  if (edge === "top" && !topRoom(s, pr.height)) edge = "bottom";
  if (edge === "top") {
    const dy = tv.top - (pr.top + pr.height);
    at = step(s, ghost, { x: dx, y: dy }, travel, at);
    s.tl.set(ghost, { clipPath: `inset(0px 0px ${bottomGap}px 0px)` }, at);
    return step(s, ghost, { y: dy + d, clipPath: `inset(0px 0px ${bottomGap + d}px 0px)` }, insert, at);
  }
  const dy = tv.bottom - pr.top;
  at = step(s, ghost, { x: dx, y: dy }, travel, at);
  s.tl.set(ghost, { clipPath: `inset(${topGap}px 0px 0px 0px)` }, at);
  return step(s, ghost, { y: dy - d, clipPath: `inset(${topGap + d}px 0px 0px 0px)` }, insert, at);
}

/** Move a part's centre onto the TV glass centre over n frames, then cut it */
function toGlass(s: Stage, n: number, at: number, pr: { left: number; top: number; width: number; height: number } = s.rect) {
  const dx = s.tv.left + s.tv.width / 2 - (pr.left + pr.width / 2);
  const dy = s.tv.top + s.tv.height / 2 - (pr.top + pr.height / 2);
  at = step(s, s.ghost, { x: dx, y: dy }, n, at);
  s.tl.set(s.ghost, { opacity: 0 }, at + fr(1));
  return at + fr(1);
}

/** The original stays on the shelf from here, minus the parts that travel */
function leaveBehind(s: Stage, at: number, travelling: string[], staying: string[]) {
  s.tl.set(s.orig, { opacity: 1 }, at);
  for (const name of travelling) s.tl.set(parts(s.orig, name), { visibility: "hidden" }, at);
  for (const name of staying) s.tl.set(parts(s.ghost, name), { visibility: "hidden" }, at);
}

const shiftRect = (r: DOMRect, dx: number, dy: number) => ({ left: r.left + dx, top: r.top + dy, width: r.width, height: r.height });

/* ---------------------------------------------------------------------------------------- */

const OPEN: Record<ObjectKind, (s: Stage, ppu: number) => number> = {
  // Slides up out of its clear sleeve, turns over to show its back, goes home again
  "trainer-card": (s) => {
    const card = part(s.ghost, "card");
    const front = part(s.ghost, "card-front");
    const back = part(s.ghost, "card-back");
    if (card) s.tl.set(card, { transformOrigin: "50% 50%" }, 0);
    let t = step(s, card, { y: -30 }, s.F(3), 0);
    t = flip(s, card, s.F(6), t, 1, -1, (at) => {
      s.tl.set(front, { visibility: "hidden" }, at);
      s.tl.set(back, { visibility: "inherit" }, at);
    });
    if (!s.soft) t += fr(1);
    const n = s.F(4);
    step(s, card, { y: 0 }, n, t);
    t = flip(s, card, n, t, -1, 1, (at) => {
      s.tl.set(front, { visibility: "inherit" }, at);
      s.tl.set(back, { visibility: "hidden" }, at);
    });
    s.tl.set(s.orig, { opacity: 1 }, t);
    s.tl.set(s.ghost, { opacity: 0 }, t);
    return t;
  },

  // The crimp tears left to right along a jagged edge, three cards fan out, then go in
  booster: (s, ppu) => {
    const tear = [part(s.ghost, "tear-keep"), part(s.ghost, "tear-off")].filter(Boolean) as El[];
    const off = part(s.ghost, "foil-off");
    const n = s.F(6);
    if (off) s.tl.set(off, { transformOrigin: "0% 100%" }, 0);
    step(s, tear, { x: 66 }, n, 0);
    let t = step(s, off, { y: -5, rotation: -10 }, n, 0);
    s.tl.set(off, { visibility: "hidden" }, t);
    const cards = parts(s.ghost, "card");
    const fan = s.F(4);
    cards.forEach((c, i) => {
      s.tl.set(c, { transformOrigin: "50% 100%" }, 0);
      step(s, c, { y: i === 1 ? -42 : -34, rotation: (i - 1) * 16 }, fan, t);
    });
    t += fr(fan);
    // the fanned hand, roughly: the pack box raised by the rise of the cards
    const rise = 40 * ppu;
    return toGlass(s, s.soft ? 1 : 3, t, { left: s.rect.left, top: s.rect.top - rise, width: s.rect.width, height: s.rect.height });
  },

  // Turns over A→B (the label now reads SIDE B), the reels tick, it slides into the deck
  cassette: (s) => {
    const fromB = s.ghost.dataset.side === "B";
    const [show, hide] = fromB ? ["side-a", "side-b"] : ["side-b", "side-a"];
    s.tl.set(s.ghost, { transformOrigin: "50% 50%" }, 0);
    const frames = s.soft ? [0.001, 1] : [0.5, 0.001, 0.5, 1];
    frames.forEach((v, i) => s.tl.set(s.ghost, { scaleX: v }, fr(i + 1)));
    const swapAt = fr(frames.indexOf(0.001) + 1);
    s.tl.set(parts(s.ghost, hide), { visibility: "hidden" }, swapAt);
    s.tl.set(parts(s.ghost, show), { visibility: "inherit" }, swapAt);
    let t = fr(frames.length);
    const reels = parts(s.ghost, "reel");
    reels.forEach((r) => s.tl.set(r, { transformOrigin: "50% 50%" }, 0));
    const tick = s.F(4);
    t = step(s, reels, { rotation: `+=${15 * tick}` }, tick, t);
    return slot(s, "top", s.F(2), s.F(2), 1, t);
  },

  // Drops into the TV's top edge a sixth of its height per frame, then one click frame
  "gb-cart": (s) => {
    let t = slot(s, "top", s.F(3), s.F(6), 0.72, 0);
    if (!s.soft && topRoom(s, s.rect.height)) {
      const d = s.rect.height * 0.72;
      const y = s.tv.top - s.rect.bottom + d;
      s.tl.set(s.ghost, { y: y + 2, clipPath: `inset(0px 0px ${d + 2}px 0px)` }, t + fr(1));
      s.tl.set(s.ghost, { y, clipPath: `inset(0px 0px ${d}px 0px)` }, t + fr(2));
      t += fr(2);
    }
    return t + fr(1);
  },

  // Case hinges open, the disc lifts, a tray slides out of the TV base, the disc drops in,
  // the tray closes while the disc label turns
  cd: (s, ppu) => {
    const lid = part(s.ghost, "lid");
    const disc = part(s.ghost, "disc");
    const discRect = part(s.orig, "disc")?.getBoundingClientRect();
    if (!disc || !discRect) return toGlass(s, s.F(3), 0);
    const hinge = s.soft ? [{ scaleX: 0.001 }, { visibility: "hidden" }] : [{ scaleX: 0.5 }, { scaleX: 0.001 }, { visibility: "hidden" }];
    if (lid) s.tl.set(lid, { svgOrigin: "9 50" }, 0);
    let t = keys(s, lid, hinge, 0);
    // the case stays on the shelf, open and empty
    leaveBehind(s, t, ["disc", "lid"], ["case", "lid"]);
    const lift = 6 * ppu;
    if (!s.soft) t = step(s, disc, { y: -6 }, 1, t);
    const lifted = s.soft ? 0 : lift;

    // the tray, part of the TV: dark teal plastic with a peacock well
    const D = discRect.width;
    const box = document.createElement("div");
    box.setAttribute("aria-hidden", "true");
    const trayW = Math.round(D * 1.16);
    const trayH = Math.round(D * 1.1);
    Object.assign(box.style, {
      position: "fixed",
      left: `${Math.round(s.tv.left + s.tv.width / 2 - trayW / 2)}px`,
      top: `${Math.round(s.tv.bottom - 2)}px`,
      width: `${trayW}px`,
      height: `${trayH}px`,
      overflow: "hidden",
      zIndex: "89",
      pointerEvents: "none",
    });
    const tray = document.createElement("div");
    Object.assign(tray.style, {
      position: "absolute",
      inset: "0",
      background: "#256069",
      borderRadius: "0 0 10px 10px",
      boxShadow: "inset 0 1px 0 rgba(252,232,205,.3)",
    });
    gsap.set(tray, { yPercent: -100 });
    const well = document.createElement("div");
    Object.assign(well.style, {
      position: "absolute",
      left: `${(trayW - D * 1.04) / 2}px`,
      top: `${(trayH - D * 1.04) / 2}px`,
      width: `${D * 1.04}px`,
      height: `${D * 1.04}px`,
      borderRadius: "50%",
      background: "#102f41",
    });
    tray.appendChild(well);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "16.5 6 88 88");
    svg.setAttribute("width", `${D}`);
    svg.setAttribute("height", `${D}`);
    Object.assign(svg.style, { position: "absolute", left: `${(trayW - D) / 2}px`, top: `${(trayH - D) / 2}px`, overflow: "visible", visibility: "hidden" });
    const copy = disc.cloneNode(true) as SVGGElement;
    copy.removeAttribute("data-part");
    svg.appendChild(copy);
    tray.appendChild(svg);
    box.appendChild(tray);
    document.body.appendChild(box);
    s.temps.push(box);

    // the disc travels to just above the tray's well while the tray opens
    const wellCx = s.tv.left + s.tv.width / 2;
    const wellCy = s.tv.bottom - 2 + trayH / 2;
    const dx = wellCx - (discRect.left + D / 2);
    const dy = wellCy - (discRect.top + D / 2 - lifted) - D * 0.12;
    const open = s.F(3);
    step(s, s.ghost, { x: dx, y: dy }, open, t);
    t = step(s, tray, { yPercent: 0 }, open, t);
    // drop: the disc is in the tray now
    s.tl.set(s.ghost, { opacity: 0 }, t + fr(1));
    s.tl.set(svg, { visibility: "inherit" }, t + fr(1));
    t += fr(1);
    const close = s.F(3);
    s.tl.set(copy, { svgOrigin: "60.5 50" }, 0);
    step(s, copy, { rotation: 30 * close }, close, t);
    t = step(s, tray, { yPercent: -100 }, close, t);
    return t;
  },

  // Travels over the TV, tilts back two frames, inserts top-down, the LED pixel lights
  "gba-cart": (s) => {
    const travel = s.F(3);
    if (!topRoom(s, s.rect.height)) {
      s.tl.set(s.ghost, { transformOrigin: "50% 100%" }, 0);
      let t = step(s, s.ghost, { scaleY: 0.86, skewX: -6 }, s.F(2), 0);
      t = slot(s, "bottom", travel, s.F(5), 0.7, t);
      s.tl.set(part(s.ghost, "led"), { visibility: "inherit" }, t);
      return t + fr(1);
    }
    const dx = s.tv.left + s.tv.width / 2 - (s.rect.left + s.rect.width / 2);
    const dy = s.tv.top - s.rect.bottom;
    s.tl.set(s.ghost, { transformOrigin: "50% 100%", clipPath: "inset(0px 0px 0px 0px)" }, 0);
    let t = step(s, s.ghost, { x: dx, y: dy }, travel, 0);
    t = step(s, s.ghost, { scaleY: 0.86, skewX: -6 }, s.F(2), t);
    const n = s.F(5);
    const d = s.rect.height * 0.7;
    t = step(s, s.ghost, { y: dy + d, clipPath: `inset(0px 0px ${d}px 0px)` }, n, t);
    s.tl.set(part(s.ghost, "led"), { visibility: "inherit" }, t);
    return t + fr(1);
  },

  // The lid lifts, the top card rises and turns face up, and is played onto the glass
  "deck-box": (s, ppu) => {
    const lid = part(s.ghost, "lid");
    const card = part(s.ghost, "card");
    const lidPose = { x: -10, y: -18, rotation: -18 };
    if (lid) s.tl.set(lid, { transformOrigin: "0% 100%" }, 0);
    let t = step(s, lid, lidPose, s.F(3), 0);
    const n = s.F(4);
    if (card) s.tl.set(card, { transformOrigin: "50% 50%" }, 0);
    step(s, card, { y: -44 }, n, t);
    // turns face up: edge-on at the middle frame, the front never shown mirrored
    const turn = s.soft ? [0.001, 1] : [0.5, 0.001, 0.5, 1];
    const at0 = t;
    t = keys(s, card, turn.map((v) => ({ scaleX: v })), t);
    const edge = at0 + fr(turn.indexOf(0.001) + 1);
    s.tl.set(part(s.ghost, "card-back"), { visibility: "hidden" }, edge);
    s.tl.set(part(s.ghost, "card-front"), { visibility: "inherit" }, edge);
    leaveBehind(s, t, ["card"], ["box", "lid", "inside"]);
    const lidOrig = part(s.orig, "lid");
    if (lidOrig) {
      s.tl.set(lidOrig, { transformOrigin: "0% 100%" }, t);
      s.tl.set(lidOrig, lidPose, t);
    }
    const cr = part(s.orig, "card")?.getBoundingClientRect();
    const pr = cr ? shiftRect(cr, 0, -44 * ppu) : s.rect;
    return toGlass(s, s.F(3), t, pr);
  },

  // Snaps out of its case clip, then slides down into the slot on the TV's top edge
  "ds-card": (s, ppu) => {
    const card = part(s.ghost, "card");
    if (card) s.tl.set(card, { transformOrigin: "50% 100%" }, 0);
    const snap = s.soft ? [{ y: -12 }] : [{ y: -3, rotation: -4 }, { y: -12, rotation: 0 }];
    let t = keys(s, card, snap, 0);
    leaveBehind(s, t, ["card"], ["case", "clip"]);
    const cr = part(s.orig, "card")?.getBoundingClientRect();
    const pr = cr ? shiftRect(cr, 0, -12 * ppu) : s.rect;
    t = slot(s, "top", s.F(2), s.F(4), 1, t, pr);
    return t;
  },

  // The metal shutter slides open, the disk goes up into the drive, the drive light blinks
  floppy: (s) => {
    let t = step(s, part(s.ghost, "shutter"), { x: 16 }, s.F(3), 0);
    t = slot(s, "bottom", s.F(2), s.F(4), 1, t);
    const led = document.createElement("div");
    led.setAttribute("aria-hidden", "true");
    Object.assign(led.style, {
      position: "fixed",
      left: `${Math.round(s.tv.right - 28)}px`,
      top: `${Math.round(s.tv.bottom - 10)}px`,
      width: "8px",
      height: "4px",
      background: "#fadb68",
      boxShadow: "0 0 8px rgba(250,219,104,.8)",
      zIndex: "91",
      pointerEvents: "none",
      visibility: "hidden",
    });
    document.body.appendChild(led);
    s.temps.push(led);
    s.tl.set(led, { visibility: "inherit" }, t);
    const on = s.F(2);
    s.tl.set(led, { visibility: "hidden" }, t + fr(on));
    return t + fr(on);
  },
};

/**
 * The open transition for an object. `objectEl` is the shelf element holding the
 * ObjectArt (or the .obj itself); `tvEl` is the TV. Ends with the object inside the TV:
 * the original stays hidden until revert() (CD, deck box and DS card leave their case on
 * the shelf). The trainer card plays in place and returns to rest.
 */
export function openTimeline(kind: ObjectKind, objectEl: HTMLElement, tvEl: HTMLElement, soft: boolean): gsap.core.Timeline {
  const orig = findObj(objectEl);
  const rect = orig.getBoundingClientRect();
  const tv = tvEl.getBoundingClientRect();
  const ghost = orig.cloneNode(true) as HTMLElement;
  uniquifyIds(ghost, `-g${++seq}`);
  ghost.setAttribute("aria-hidden", "true");
  ghost.removeAttribute("id");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: "0",
    zIndex: "90",
    pointerEvents: "none",
    opacity: "0",
  });
  document.body.appendChild(ghost);

  const tl = gsap.timeline();
  const s: Stage = {
    tl,
    orig,
    ghost,
    rect,
    tv,
    soft,
    F: (n) => (soft ? Math.max(1, Math.round(n / 2)) : n),
    temps: [ghost],
  };
  // roots are cut with opacity (a hard set, never a fade), so a part shown inside can't leak
  tl.set(orig, { opacity: 0 }, 0);
  tl.set(ghost, { opacity: 1 }, 0);
  const box = orig.querySelector("svg")?.viewBox.baseVal;
  const ppu = box && box.width ? rect.width / box.width : 1;
  const end = OPEN[kind](s, ppu);

  const cleanup = () => {
    s.temps.forEach((n) => n.remove());
    s.temps.length = 0;
  };
  tl.call(cleanup, undefined, Math.max(end, fr(1)));

  const revert = tl.revert.bind(tl);
  tl.revert = () => {
    cleanup();
    return revert();
  };
  const kill = tl.kill.bind(tl);
  tl.kill = (...args: Parameters<gsap.core.Timeline["kill"]>) => {
    cleanup();
    return kill(...args);
  };
  return tl;
}

/** Shelf focus: the object lifts (or settles) by one held frame, 8px */
export function liftFrame(el: HTMLElement, lifted: boolean, soft: boolean): void {
  const y = lifted ? -8 : 0;
  if (soft) gsap.set(el, { y, overwrite: "auto" });
  else gsap.to(el, { y, duration: fr(1), ease: "steps(1)", overwrite: "auto" });
}

/**
 * Static on a state change (FULL only): SVG feTurbulence noise at 0.35 plus two tear bars,
 * three frames, then removed from the DOM (250ms). SOFT: a no-op (a hard cut).
 */
export function staticBurst(el: HTMLElement, soft: boolean): void {
  if (soft || typeof document === "undefined") return;
  const fid = `static-${++seq}`;
  const restorePos = getComputedStyle(el).position === "static";
  if (restorePos) el.style.position = "relative";
  const wrap = document.createElement("div");
  wrap.setAttribute("aria-hidden", "true");
  Object.assign(wrap.style, { position: "absolute", inset: "0", pointerEvents: "none", overflow: "hidden", zIndex: "20", borderRadius: "inherit" });
  wrap.innerHTML =
    `<svg width="100%" height="100%" style="position:absolute;inset:0;opacity:.35;display:block">` +
    `<filter id="${fid}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="1" seed="1"/>` +
    `<feColorMatrix type="matrix" values=".33 .33 .33 0 0  .33 .33 .33 0 0  .33 .33 .33 0 0  0 0 0 0 1"/></filter>` +
    `<rect width="100%" height="100%" filter="url(#${fid})"/></svg>`;
  const bars = [0, 1].map((i) => {
    const b = document.createElement("div");
    Object.assign(b.style, {
      position: "absolute",
      left: "-10%",
      width: "120%",
      height: i ? "5%" : "9%",
      background: i ? "rgba(16,47,65,.55)" : "rgba(252,232,205,.4)",
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
          b.style.top = `${(18 + f * 23 + i * 41) % 90}%`;
          b.style.transform = `translateX(${(i ? -1 : 1) * (4 + f * 3)}%)`;
        });
      },
      undefined,
      fr(f),
    );
  }
  tl.set({}, {}, 0.25);
}
