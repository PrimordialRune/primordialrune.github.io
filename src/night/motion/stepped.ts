// Stepped motion for diegetic objects (P6: sprites move on frames, never tweened).
// Everything on the desk that is a thing (carts, tapes, discs, packs) animates at 12fps,
// either as explicit frame swaps (stepFrames) or as GSAP steps(n) eases (stepTo).
import gsap from "gsap";

export const FPS = 12;
/** One diegetic frame in seconds (83ms) */
export const FRAME = 1 / FPS;

type Target = gsap.TweenTarget;

/**
 * Frame swaps: frame i is applied at i/fps seconds (frame 0 lands at once).
 * Returns a timeline to nest with `tl.add(stepFrames(...), at)`.
 */
export function stepFrames(target: Target, frames: gsap.TweenVars[], fps = FPS) {
  const tl = gsap.timeline();
  frames.forEach((vars, i) => tl.set(target, vars, i / fps));
  return tl;
}

/**
 * Move to `vars` in n stepped frames: the value jumps at the end of each frame, so the
 * first new pose shows after one frame and the last lands exactly at n/fps.
 */
export function stepTo(target: Target, vars: gsap.TweenVars, nFrames: number, fps = FPS) {
  return gsap.to(target, { ...vars, duration: nFrames / fps, ease: `steps(${nFrames})` });
}

/** Seconds for n frames, for placing beats on a ceremony timeline */
export const frames = (n: number, fps = FPS) => n / fps;
