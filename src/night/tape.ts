// Side A/B channel between the Crossfader manual's switch and the walkman that stays on
// the desk while the manual is open: the switch asks, the walkman flips the big tape and
// answers on its PLAY frame (where the manual swaps its body).
import type { Side } from "./types";

const REQUEST = "night:tape-flip";
const DONE = "night:tape-flip-done";

export function requestTapeFlip(side: Side) {
  window.dispatchEvent(new CustomEvent<Side>(REQUEST, { detail: side }));
}
export function onTapeFlipRequest(fn: (side: Side) => void) {
  const h = (e: Event) => fn((e as CustomEvent<Side>).detail);
  window.addEventListener(REQUEST, h);
  return () => window.removeEventListener(REQUEST, h);
}
export function tapeFlipDone(side: Side) {
  window.dispatchEvent(new CustomEvent<Side>(DONE, { detail: side }));
}
export function onTapeFlipDone(fn: (side: Side) => void) {
  const h = (e: Event) => fn((e as CustomEvent<Side>).detail);
  window.addEventListener(DONE, h);
  return () => window.removeEventListener(DONE, h);
}
