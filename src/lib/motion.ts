// Motion setting: AUTO follows the system's reduced-motion preference, FULL and QUIET
// override it (P2: the retro layer has a quiet setting). The resolved value lives on
// <html data-motion="full|quiet"> so CSS can follow it too.

export type MotionSetting = "auto" | "full" | "quiet";

export const MOTION_KEY = "primordialrune:motion";
export const MOTION_EVENT = "primordialrune:motion-change";

export function readMotionSetting(): MotionSetting {
  try {
    const v = localStorage.getItem(MOTION_KEY);
    if (v === "full" || v === "quiet") return v;
  } catch {}
  return "auto";
}

export function systemReducesMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isQuiet(): boolean {
  if (typeof window === "undefined") return false;
  const setting = readMotionSetting();
  return setting === "quiet" || (setting === "auto" && systemReducesMotion());
}

export function writeMotionSetting(setting: MotionSetting) {
  try {
    if (setting === "auto") localStorage.removeItem(MOTION_KEY);
    else localStorage.setItem(MOTION_KEY, setting);
  } catch {}
  document.documentElement.dataset.motion = isQuiet() ? "quiet" : "full";
  window.dispatchEvent(new Event(MOTION_EVENT));
}

export function subscribeMotion(fn: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onSystem = () => {
    document.documentElement.dataset.motion = isQuiet() ? "quiet" : "full";
    fn();
  };
  mq.addEventListener("change", onSystem);
  window.addEventListener(MOTION_EVENT, fn);
  return () => {
    mq.removeEventListener("change", onSystem);
    window.removeEventListener(MOTION_EVENT, fn);
  };
}

// Runs in <head> before first paint, so CSS sees the right mode from the start
export const MOTION_INIT_SCRIPT = `try{var s=localStorage.getItem("${MOTION_KEY}");document.documentElement.dataset.motion=s==="quiet"||(s!=="full"&&matchMedia("(prefers-reduced-motion: reduce)").matches)?"quiet":"full"}catch(e){}`;

// A damped spring (stiffness k, damping c, unit mass) as a GSAP ease plus the time it
// takes to settle, so interface motion runs on springs (P6) with GSAP's timing control
export function springEase(k: number, c: number) {
  const samples: number[] = [];
  let x = 0, v = 0, t = 0;
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
    const f = p * last, i = Math.floor(f);
    return samples[i] + (samples[Math.min(i + 1, last)] - samples[i]) * (f - i);
  };
  return { ease, duration: t };
}
