// Motion setting: FULL or SOFT (P2: the retro layer has a quiet setting).
// SOFT is the default only when the system asks for reduced motion; a stored choice wins.
// SOFT still animates: springs, fades, half the frames. It drops static, flashes,
// pointer specular and type-on. The resolved value lives on <html data-motion>.

import { useSyncExternalStore } from "react";
import gsap from "gsap";
import { MOTION_KEY as KEY } from "./motionInit";

export type Motion = "full" | "soft";

const EVENT = "afterimage:motion";

function stored(): Motion | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "full" || v === "soft" ? v : null;
  } catch {
    return null;
  }
}

export function systemAsksSoft(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function getMotion(): Motion {
  if (typeof window === "undefined") return "full";
  return stored() ?? (systemAsksSoft() ? "soft" : "full");
}

export function isSoft(): boolean {
  return getMotion() === "soft";
}

export function setMotion(m: Motion) {
  try {
    localStorage.setItem(KEY, m);
  } catch {}
  document.documentElement.dataset.motion = m;
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(fn: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onSystem = () => {
    document.documentElement.dataset.motion = getMotion();
    fn();
  };
  mq.addEventListener("change", onSystem);
  window.addEventListener(EVENT, fn);
  return () => {
    mq.removeEventListener("change", onSystem);
    window.removeEventListener(EVENT, fn);
  };
}

export function useMotion(): Motion {
  return useSyncExternalStore(subscribe, getMotion, () => "full");
}

// A damped spring (stiffness k, damping c, unit mass) as a GSAP ease plus its settle time,
// so interface motion runs on springs (P6) with GSAP's timing control
export function springEase(k: number, c: number) {
  const samples: number[] = [];
  let x = 0,
    v = 0,
    t = 0;
  const dt = 1 / 600;
  while (t < 3) {
    v += (k * (1 - x) - c * v) * dt;
    x += v * dt;
    t += dt;
    samples.push(x);
    if (t > 0.2 && Math.abs(1 - x) < 0.0015 && Math.abs(v) < 0.02) break;
  }
  const last = samples.length - 1;
  const ease = (p: number) => {
    if (p >= 1) return 1;
    const f = p * last,
      i = Math.floor(f);
    return samples[i] + (samples[Math.min(i + 1, last)] - samples[i]) * (f - i);
  };
  return { ease, duration: t };
}

export const UI_SPRING = springEase(420, 32);
export const SHEET_SPRING = springEase(260, 26);

/** Diegetic motion runs at 12fps on stepped frames (P6) */
export function frames(n: number) {
  return { duration: n / 12, ease: `steps(${Math.max(1, n)})` };
}

/** ?speed=0.25 slows every GSAP animation, for review */
export function applySpeedParam() {
  try {
    const s = Number(new URLSearchParams(window.location.search).get("speed"));
    if (s > 0 && s <= 4) gsap.globalTimeline.timeScale(s);
  } catch {}
}
