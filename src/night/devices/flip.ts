// The object you clicked is the one that goes into the device (P3). The desk publishes
// where its object sat (desk/originRect); a device starts its own copy of that object
// exactly there, rotated as it lay on the mat, and the camera spring carries it into the
// scene. Played backwards (closing), the same tween puts it back in its slot.
// Only the travel is a spring (it is the camera following the hand); everything the
// object does on arrival stays on stepped frames.
import { ART_KIND, ART_SIZE, DESK_SPOTS } from "../content/layout";
import { getOriginRect } from "../desk/originRect";
import type { ProjectId } from "../types";

export interface DeskPose {
  /** centre, viewport px */
  cx: number;
  cy: number;
  /** unrotated width, viewport px */
  w: number;
  /** resting rotation on the mat, degrees */
  rot: number;
}

/**
 * Where the object lies on the mat, or null (deep link with no desk, or not measurable).
 * The desk rect is the rotated object's bounding box; the unrotated width comes back out
 * of it through the object's aspect ratio.
 */
export function deskPose(id: ProjectId): DeskPose | null {
  if (typeof window === "undefined") return null;
  let r: DOMRect | null = null;
  try {
    r = getOriginRect(id);
  } catch {
    r = null;
  }
  if (!r || r.width < 2 || r.height < 2) return null;
  const { w: aw, h: ah } = ART_SIZE[ART_KIND[id]];
  // phones lay every object straight (Desk.module.css)
  const phone = window.matchMedia("(max-width: 719.98px)").matches;
  const rot = phone ? 0 : DESK_SPOTS[id].rot;
  const t = (Math.abs(rot) * Math.PI) / 180;
  const a = aw / ah;
  const w = r.width / (Math.cos(t) + Math.sin(t) / a);
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w, rot };
}

/**
 * The shell may be springing the whole device box (a transform on an ancestor) while a
 * ceremony builds, e.g. moving it back from beside the manual on close. The ceremony ends
 * with that spring at rest, so measure as if it already were: undo the ancestor transform
 * by comparing the stage's layout box (offsets ignore transforms) with its on-screen box.
 */
function untransformed(r: DOMRect, stage: HTMLElement | null): { left: number; top: number; width: number; height: number } {
  if (!stage || !stage.offsetWidth) return r;
  let x = 0;
  let y = 0;
  for (let el: HTMLElement | null = stage; el; el = el.offsetParent as HTMLElement | null) {
    x += el.offsetLeft;
    y += el.offsetTop;
    if (getComputedStyle(el).position === "fixed") break;
  }
  const g = stage.getBoundingClientRect();
  const s = g.width / stage.offsetWidth;
  if (!s || (Math.abs(s - 1) < 1e-3 && Math.abs(g.left - x) < 0.5 && Math.abs(g.top - y) < 0.5)) return r;
  const tx = g.left - s * x;
  const ty = g.top - s * y;
  return { left: (r.left - tx) / s, top: (r.top - ty) / s, width: r.width / s, height: r.height / s };
}

export interface FlipVars {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

/**
 * The transform that puts a device's copy of the object onto its desk pose.
 * `box`: an element covering exactly the object's art box, measured now (start pose).
 * `localW`: that box's width in the units the transform is applied in (SVG user units of
 * the moving group's parent, or CSS px for HTML). The transform is meant to be applied
 * around the box's centre (svgOrigin / transformOrigin), which the caller knows.
 */
export function flipFromDesk(pose: DeskPose | null, box: Element | null | undefined, localW: number): FlipVars | null {
  if (!pose || !box) return null;
  const r0 = untransformed(box.getBoundingClientRect(), box.closest("[data-stage]") as HTMLElement | null);
  if (r0.width < 1) return null;
  const S = r0.width / localW; // viewport px per local unit
  return {
    x: (pose.cx - (r0.left + r0.width / 2)) / S,
    y: (pose.cy - (r0.top + r0.height / 2)) / S,
    scale: pose.w / r0.width,
    rotation: pose.rot,
  };
}

/** Rest pose of the travelling wrapper */
export const FLIP_REST = { x: 0, y: 0, scale: 1, rotation: 0 } as const;
