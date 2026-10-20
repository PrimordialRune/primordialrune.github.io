// Where things sit on the mat. Hand-placed positions in percent of the mat (desktop), snapped
// to the 8px grid at render. The Trinitron is the only light: every object's shadow falls
// along the unit vector away from it (--lx, --ly).
import type { ProjectId } from "../types";

export type ArtKind = "cassette" | "gb-cart" | "cd" | "booster" | "gba-cart";

export const ART_KIND: Record<ProjectId, ArtKind> = {
  "galactic-news": "gb-cart",
  "project-minamoto": "gba-cart",
  crossfader: "cassette",
  "haunt-record": "cd",
  "ptcg-cube": "booster",
};

/**
 * Each object's footprint in desk units (roughly millimetres, idealised). The GB cart's width
 * is overridden at render: it is sized from its 160x144 label so the cover shows whole (P1).
 */
export const ART_SIZE: Record<ArtKind | "notebook" | "card", { w: number; h: number }> = {
  cassette: { w: 100, h: 64 },
  "gb-cart": { w: 64, h: 72 },
  cd: { w: 92, h: 92 },
  "gba-cart": { w: 80, h: 52 },
  booster: { w: 104, h: 112 },
  notebook: { w: 92, h: 120 },
  card: { w: 140, h: 84 },
};

export interface Spot {
  /** left / top in % of the mat */
  x: number;
  y: number;
  /** resting rotation, degrees (0 for anything carrying pixel art: rotation would resample it) */
  rot: number;
}

/** Desktop (>= 720px): the objects loosely across the centre and right */
export const DESK_SPOTS: Record<ProjectId | "notebook" | "card", Spot> = {
  "galactic-news": { x: 32, y: 6, rot: 0 },
  "project-minamoto": { x: 55, y: 7, rot: 4 },
  crossfader: { x: 75, y: 17, rot: -3 },
  "haunt-record": { x: 37, y: 56, rot: 0 },
  "ptcg-cube": { x: 57, y: 41, rot: 3 },
  notebook: { x: 7, y: 54, rot: -2 },
  card: { x: 74, y: 64, rot: 0 },
};

/** The Trinitron: top-left, about 24vw wide; its glass centre is the light source */
export const TRINITRON = { x: 2.2, y: 3.5, w: 24 };

/** Desk units -> px: one size rule for every object, from the viewport */
export function deskUnit(vw: number, vh: number): number {
  return Math.max(1.1, Math.min(vw * 0.0015, (vh - 56) * 0.0026));
}

/** Snap a px value to the mat's 8px grid */
export const snap8 = (px: number) => Math.round(px / 8) * 8;

/**
 * Unit vector from the light (CRT glass centre) to a point, both in px. On phones the light
 * comes from the top strip and falls straight down.
 */
export function awayFromLight(px: number, py: number, lx: number, ly: number): { x: number; y: number } {
  const dx = px - lx;
  const dy = py - ly;
  const d = Math.hypot(dx, dy) || 1;
  return { x: dx / d, y: dy / d };
}

/** Integer scale for pixel art (P1): never fractional */
export const intScale = (native: number, avail: number) => Math.max(1, Math.floor(avail / native));
