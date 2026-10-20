// Where the clicked thing sits on the mat, so the device layer can start the very same object
// from there (FLIP) and put it back on close. The shell publishes; devices and paper read.
// Ids: the five projects, plus "notebook" and "card".
import type { StoryTarget } from "../types";

export type OriginId = StoryTarget;

const rects = new Map<OriginId, DOMRect | null>();
const els = new Map<OriginId, HTMLElement | null>();

/** The rect the object had when it was opened (null clears it) */
export function setOriginRect(id: OriginId, rect: DOMRect | null) {
  rects.set(id, rect);
}

/**
 * The object's rect on the mat, viewport px. The rect stored at open time when there is one,
 * else a live measurement (the original stays in layout while hidden, so this is always real).
 */
export function getOriginRect(id: OriginId): DOMRect | null {
  const r = rects.get(id);
  if (r) return r;
  const el = els.get(id);
  return el && el.isConnected ? el.getBoundingClientRect() : null;
}

/** The shell registers each object's art element so it can be measured at any time */
export function registerOrigin(id: OriginId, el: HTMLElement | null) {
  els.set(id, el);
}

/** Measure now and store (called by the shell on open, before the original is hidden) */
export function captureOrigin(id: OriginId): DOMRect | null {
  const el = els.get(id);
  const r = el && el.isConnected ? el.getBoundingClientRect() : null;
  rects.set(id, r);
  return r;
}
