// Motion vocabulary (P6): interface on springs, objects on stepped frames, glitches as
// punctuation (<= 300 ms, only at a state change). QUIET turns glitches into hard cuts,
// springs into 150 ms cuts and stepped travel into first frame -> last frame.

import { gsap } from "gsap";
import { isQuiet, springEase } from "@/lib/motion";

export const quiet = () => isQuiet();

export const FPS = 12;
export const frames = (n: number, fps = FPS) => ({ duration: n / fps, ease: `steps(${n})` });

const springCache = new Map<string, ReturnType<typeof springEase>>();
function getSpring(k: number, c: number) {
  const key = `${k}/${c}`;
  let s = springCache.get(key);
  if (!s) {
    s = springEase(k, c);
    springCache.set(key, s);
  }
  return s;
}

export const PANEL: [number, number] = [260, 24];
export const BOX: [number, number] = [180, 18];

/** Spring an interface element to `vars` (fromTo when `from` is given) */
export function spring(
  el: gsap.TweenTarget,
  vars: gsap.TweenVars,
  [k, c]: [number, number] = PANEL,
  from?: gsap.TweenVars,
) {
  if (quiet()) {
    const v = { ...vars, duration: 0.15, ease: "none" };
    return from ? gsap.fromTo(el, from, v) : gsap.to(el, v);
  }
  const s = getSpring(k, c);
  const v = { ...vars, duration: s.duration, ease: s.ease };
  return from ? gsap.fromTo(el, from, v) : gsap.to(el, v);
}

/** CSS linear() easing of the same spring, for layout properties CSS animates itself */
export function springCss(k: number, c: number) {
  const s = getSpring(k, c);
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) pts.push(s.ease(i / 40).toFixed(3));
  return { easing: `linear(${pts.join(",")})`, duration: Math.round(s.duration * 1000) };
}

// ---------- glitches ----------

let glass: HTMLElement | null = null;
let tube: HTMLElement | null = null;
export function registerTube(t: HTMLElement | null, g: HTMLElement | null) {
  tube = t;
  glass = g;
}

let noiseUrl = "";
function noise() {
  if (noiseUrl) return noiseUrl;
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 96;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(96, 96);
    // static in the brand's own values: cream, aquamarine and peacock specks
    const tones = [
      [252, 232, 205],
      [78, 185, 159],
      [16, 47, 65],
      [16, 47, 65],
    ];
    for (let i = 0; i < 96 * 96; i++) {
      const t = tones[(Math.random() * tones.length) | 0];
      img.data.set([t[0], t[1], t[2], 255], i * 4);
    }
    ctx.putImageData(img, 0, 0);
    noiseUrl = c.toDataURL();
  } catch {}
  return noiseUrl;
}

export type GlitchKind = "static" | "act" | "bezel";

/** Play a glitch on the glass; resolves when it is over. A no-op (hard cut) in QUIET. */
export function glitch(kind: GlitchKind): Promise<void> {
  if (quiet() || !glass || !tube) return Promise.resolve();
  const g = glass;
  const t = tube;
  return new Promise((resolve) => {
    if (kind === "static") {
      const layer = g.querySelector<HTMLElement>(".fx-static");
      if (!layer) return resolve();
      layer.style.backgroundImage = `url(${noise()})`;
      gsap.timeline({ onComplete: resolve })
        .set(layer, { autoAlpha: 0.9 })
        .to(layer, { backgroundPosition: "37px 61px", ...frames(3, 20) })
        .set(layer, { autoAlpha: 0 });
      return;
    }
    if (kind === "act") {
      const content = g.querySelector<HTMLElement>(".glass-content");
      const tear = g.querySelector<HTMLElement>(".fx-tear");
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set([content, tear], { clearProps: "transform,filter,visibility,opacity" });
          resolve();
        },
      });
      tl.set(content, { filter: "drop-shadow(4px 0 0 rgba(215,38,61,.85)) drop-shadow(-4px 0 0 rgba(51,153,153,.85))" })
        .set(tear, { autoAlpha: 1, y: () => gsap.utils.random(-120, 120) })
        .to(content, { keyframes: [{ x: -16 }, { x: 11 }, { x: -6 }, { x: 0 }], ...frames(4, 15) })
        .to(tear, { keyframes: [{ y: "+=40" }, { y: "-=90" }, { y: "+=30" }], ...frames(3, 12) }, 0)
        .set(tear, { autoAlpha: 0 });
      return;
    }
    // bezel: the ring tears where the box is about to cross it
    const bez = t.querySelector<HTMLElement>(".fx-bezel");
    if (!bez) return resolve();
    gsap.timeline({ onComplete: () => { gsap.set(bez, { clearProps: "all" }); resolve(); } })
      .set(bez, { autoAlpha: 1 })
      .to(bez, { keyframes: [{ x: 10 }, { x: -14 }, { x: 4 }], ...frames(3, 15) })
      .set(bez, { autoAlpha: 0 });
  });
}

/** A short, input-driven twitch on one element (the corrupted save file) */
export function twitch(el: HTMLElement | null) {
  if (!el || quiet() || gsap.isTweening(el)) return;
  const d = gsap.utils.random(0.12, 0.2);
  gsap.timeline({ onComplete: () => { gsap.set(el, { clearProps: "transform,clipPath" }); } })
    .set(el, { clipPath: `inset(${gsap.utils.random(10, 50) | 0}% 0 ${gsap.utils.random(10, 40) | 0}% 0)`, x: gsap.utils.random(-8, 8) | 0 })
    .to(el, { keyframes: [{ x: 5, clipPath: "inset(0% 0 60% 0)" }, { x: -3, clipPath: "inset(40% 0 0% 0)" }, { x: 0, clipPath: "inset(0% 0 0% 0)" }], duration: d, ease: "steps(3)" });
}
