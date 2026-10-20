"use client";

import { useCallback, useEffect, useRef } from "react";
import { sections } from "@/lib/sections";
import { prefersReducedMotion } from "@/lib/crt";

export type PauseMotion = "slash" | "cutin" | "ribbon";

interface PauseMenuProps {
  activeId: string;
  motion: PauseMotion;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCategoryChange?: (id: string) => void;
}

type Rect = { x: number; y: number; w: number; h: number };
type Frame = Keyframe & Record<string, string | number | null | undefined>;

const SKEW = -12;
const TAN = Math.tan(12 * (Math.PI / 180));
// Literal hex: WAAPI keyframes interpolate these, and var() inside them isn't reliable
const SHADOW_ON = "7px 7px 0 #102f41, 13px 13px 0 #fadb68";
const SHADOW_PEAK = "11px 11px 0 #102f41, 20px 20px 0 #fadb68";
const SHADOW_OFF = "0px 0px 0 #102f41, 0px 0px 0 #fadb68";
const OUT = "cubic-bezier(.2,.8,.2,1)";
const IN = "cubic-bezier(.6,0,.8,.4)";

// A damped spring sampled into a CSS linear() easing (cubic-bezier where linear() isn't supported)
function spring(k: number, c: number, fallback: string, fallbackMs: number) {
  if (typeof CSS === "undefined" || !CSS.supports("animation-timing-function", "linear(0, 1)")) {
    return { easing: fallback, dur: fallbackMs };
  }
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
  const n = 36;
  const pts = Array.from({ length: n + 1 }, (_, i) =>
    i === n ? 1 : +samples[Math.round((i / n) * (samples.length - 1))].toFixed(4)
  );
  return { easing: `linear(${pts.join(",")})`, dur: Math.round(t * 1000) };
}

const css = (r: Rect) => ({ left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });

function settle(el: HTMLElement, frame: Frame) {
  for (const k in frame) {
    if (k === "offset" || k === "easing" || k === "composite") continue;
    el.style.setProperty(k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`), String(frame[k]));
  }
}

// Keyframes, then the end state written onto the element so nothing is left filling
function run(el: HTMLElement, frames: Frame[], opts: KeyframeAnimationOptions) {
  const a = el.animate(frames, { fill: "both", ...opts });
  a.finished.then(() => { settle(el, frames[frames.length - 1]); a.cancel(); }).catch(() => {});
  return a;
}

// Freeze running animations where they are, so the next motion starts from there
function freeze(el: HTMLElement) {
  el.getAnimations().forEach((a) => {
    if (a.id === "bob") return;
    if (a.id !== "flash") {
      try { (a as Animation).commitStyles(); } catch {}
    }
    a.cancel();
  });
}

// The scanlines in the corner are the pause menu: picking them pauses the screen and the
// same five elements become slanted Persona-style bars. Three choreographies for that
// morph are being A/B tested (slash, cut-in, ribbon); selection and picking are shared.
export default function PauseMenu({ activeId, motion, disabled, onOpenChange, onCategoryChange }: PauseMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLButtonElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const pauseRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const wipeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const state = useRef({ open: false, hi: 0, active: 0, lh: 8 });
  const springs = useRef<{ snap: ReturnType<typeof spring>; soft: ReturnType<typeof spring> } | null>(null);
  const props = useRef({ motion, onOpenChange, onCategoryChange });
  props.current = { motion, onOpenChange, onCategoryChange };

  const activeIndex = Math.max(0, sections.findIndex((s) => s.id === activeId));
  state.current.active = activeIndex;

  const geometry = useCallback(() => {
    const root = rootRef.current!;
    const W = root.clientWidth, H = root.clientHeight, portrait = H > W;
    const pad = Math.max(12, Math.min(W, H) * 0.045);
    const lineW = Math.min(W * (portrait ? 0.5 : 0.28), 260);
    const lh = Math.max(6, Math.min(11, H * 0.015));
    const lg = lh * 0.8;
    state.current.lh = lh;
    const closed = sections.map((_, i) => ({ x: pad, y: pad + i * (lh + lg), w: lineW, h: lh }));
    const top = portrait ? pad + Math.min(80, H * 0.1) : pad * 1.2;
    const g = Math.max(6, H * 0.018);
    const bh = Math.min(portrait ? 62 : 92, (H - top - pad - 4 * g) / 5);
    const y0 = top + Math.max(0, (H - top - pad - (5 * bh + 4 * g)) / 2);
    const left = pad + bh * TAN + 6;
    const bar = (i: number, hi: number): Rect => {
      const slide = (4 - i) * (bh + g) * TAN * (portrait ? 0.3 : 0.9);
      const x = left + slide + (i === hi ? Math.min(portrait ? 12 : 28, W * 0.03) : 0);
      const w = portrait ? W - x - pad - bh * TAN - (i === hi ? 0 : 10) : Math.min(W * (i === hi ? 0.62 : 0.54), 760 + (i === hi ? 60 : 0));
      return { x, y: y0 + i * (bh + g), w: Math.min(w, W - x - pad - bh * TAN), h: bh };
    };
    root.style.setProperty("--bh", `${bh}px`);
    root.dataset.portrait = String(portrait);
    root.dataset.tight = String(bh < 46);
    return { W, H, pad, closed, bar, stack: { x: pad - 6, y: pad - 6, w: lineW + 12, h: 5 * lh + 4 * lg + 12 } };
  }, []);

  const pill = () => `${state.current.lh / 2}px`;
  const items = () => itemRefs.current.filter(Boolean) as HTMLButtonElement[];
  const reduced = () => prefersReducedMotion();

  const paintActive = useCallback((hi: number, animate: boolean, delay = 0) => {
    items().forEach((b, i) => {
      const on = i === hi;
      b.classList.toggle("is-active", on || (hi < 0 && i === state.current.active));
      if (!on) { b.style.boxShadow = "none"; return; }
      if (!animate || reduced()) { b.style.boxShadow = SHADOW_ON; return; }
      run(b, [{ boxShadow: SHADOW_OFF }, { boxShadow: SHADOW_PEAK, offset: 0.45 }, { boxShadow: SHADOW_ON }], { duration: 420, delay, easing: "ease-out" });
    });
  }, []);

  const moveCursor = useCallback((i: number, appear: boolean) => {
    const cursor = cursorRef.current!;
    const r = geometry().bar(i, i), s = Math.max(9, r.h * 0.2);
    cursor.style.borderWidth = `${s}px 0 ${s}px ${s * 1.3}px`;
    const to = { left: `${r.x - (r.h * TAN) / 2 - s * 1.3 - Math.max(12, r.h * 0.2)}px`, top: `${r.y + r.h / 2 - s}px` };
    freeze(cursor);
    if (appear || reduced()) {
      settle(cursor, { ...to, opacity: 1 });
      if (!reduced()) cursor.animate([{ transform: "translateX(-12px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 200, easing: OUT });
      return;
    }
    const snap = springs.current!.snap;
    run(cursor, [{ left: cursor.style.left, top: cursor.style.top, opacity: 1 }, { ...to, opacity: 1 }], { duration: snap.dur, easing: snap.easing });
  }, [geometry]);

  const placeClosed = useCallback(() => {
    const G = geometry();
    items().forEach((b, i) => {
      settle(b, { ...css(G.closed[i]), transform: "skewX(0deg)", borderRadius: pill(), boxShadow: "none" });
      (b.firstChild as HTMLElement).style.opacity = "0";
      b.classList.toggle("is-active", i === state.current.active);
      b.tabIndex = -1;
    });
    settle(hitRef.current!, css(G.stack));
    dimRef.current!.style.opacity = "0";
    pauseRef.current!.style.opacity = "0";
    cursorRef.current!.style.opacity = "0";
  }, [geometry]);

  const placeOpen = useCallback(() => {
    const G = geometry(), hi = state.current.hi;
    items().forEach((b, i) => {
      settle(b, { ...css(G.bar(i, hi)), transform: `skewX(${SKEW}deg)`, borderRadius: "6px" });
      (b.firstChild as HTMLElement).style.opacity = "1";
      b.tabIndex = 0;
    });
    dimRef.current!.style.opacity = "1";
    pauseRef.current!.style.opacity = "1";
    moveCursor(hi, true);
    paintActive(hi, false);
  }, [geometry, moveCursor, paintActive]);

  const stopAll = () => {
    [...items(), ...items().map((b) => b.firstChild as HTMLElement), cursorRef.current!, dimRef.current!, pauseRef.current!, ...(wipeRefs.current as HTMLElement[])].forEach(freeze);
  };

  const textIn = (b: HTMLElement, delay: number) =>
    run(b.firstChild as HTMLElement, [{ opacity: 0, clipPath: "inset(0 100% 0 0)" }, { opacity: 1, clipPath: "inset(0 0% 0 0)" }], { duration: 220, delay, easing: OUT });
  const textOut = (b: HTMLElement) => run(b.firstChild as HTMLElement, [{ opacity: 1 }, { opacity: 0 }], { duration: 80 });
  const now = (b: HTMLElement): Frame => ({ ...css({ x: parseFloat(b.style.left), y: parseFloat(b.style.top), w: parseFloat(b.style.width), h: parseFloat(b.style.height) }), transform: b.style.transform || "skewX(0deg)", borderRadius: b.style.borderRadius || pill() });
  const rectOf = (b: HTMLElement): Rect => ({ x: parseFloat(b.style.left), y: parseFloat(b.style.top), w: parseFloat(b.style.width), h: parseFloat(b.style.height) });

  const setOpen = useCallback((open: boolean) => {
    const s = state.current;
    if (open === s.open) return;
    s.open = open;
    s.hi = s.active;
    stopAll();
    const G = geometry();
    rootRef.current!.dataset.open = String(open);
    props.current.onOpenChange?.(open);
    items().forEach((b) => (b.tabIndex = open ? 0 : -1));
    if (!open && rootRef.current!.contains(document.activeElement)) hitRef.current!.focus({ preventScroll: true });
    if (reduced()) { if (open) placeOpen(); else placeClosed(); return; }

    const { snap, soft } = springs.current!;
    const tilt = `skewX(${SKEW}deg)`, flat = "skewX(0deg)";
    const m = props.current.motion;
    if (open) {
      items().forEach((b, i) => {
        const c = G.closed[i], r = G.bar(i, s.hi);
        if (m === "slash") {
          // Shoot across as a thin line, then thicken and lean into the bar
          const d = i * 45;
          run(b, [
            { ...css(c), transform: flat, borderRadius: pill(), easing: OUT },
            { ...css({ x: r.x, y: r.y + r.h / 2 - c.h / 2, w: r.w, h: c.h }), transform: flat, borderRadius: pill(), offset: 0.42, easing: snap.easing },
            { ...css(r), transform: tilt, borderRadius: "6px" },
          ], { duration: 560, delay: d });
          textIn(b, d + 380);
        } else if (m === "cutin") {
          // Whip off to the right behind the slash, slam back in from the right edge
          const d = 60 + i * 40;
          run(b, [
            { ...css(c), transform: flat, borderRadius: pill(), easing: IN },
            { ...css({ x: G.W + 20, y: c.y, w: c.w * 2, h: c.h }), transform: flat, borderRadius: pill(), offset: 0.28 },
            { ...css({ x: G.W + 20, y: r.y, w: r.w, h: r.h }), transform: tilt, borderRadius: "6px", offset: 0.38, easing: "cubic-bezier(.2,1.5,.4,1)" },
            { ...css(r), transform: tilt, borderRadius: "6px" },
          ], { duration: 620, delay: d });
          textIn(b, d + 460);
        } else {
          // One spring from line to bar, leaning on the way
          const d = i * 32;
          run(b, [{ ...css(c), transform: flat, borderRadius: pill() }, { ...css(r), transform: tilt, borderRadius: "6px" }], { duration: soft.dur, delay: d, easing: soft.easing });
          textIn(b, d + 300);
        }
      });
      if (m === "cutin") {
        wipeRefs.current.forEach((w, k) => w && run(w, [
          { transform: "translateX(-160%) skewX(-16deg)", opacity: 1 },
          { transform: `translateX(${G.W * (k ? 11 : 3.2)}px) skewX(-16deg)`, opacity: 1, offset: 0.99 },
          { transform: "translateX(-400%) skewX(-16deg)", opacity: 0 },
        ], { duration: 420, delay: 80 + k * 40, easing: "cubic-bezier(.7,0,.3,1)" }));
      }
      paintActive(s.hi, true, m === "cutin" ? 640 : m === "slash" ? 520 : 420);
      run(dimRef.current!, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: "ease-out" });
      run(pauseRef.current!, [
        { opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, offset: 0.2 }, { opacity: 0.2, offset: 0.35 },
        { opacity: 1, offset: 0.5, transform: "translateY(0)" }, { opacity: 1, transform: "translateY(0)" },
      ], { duration: 520, delay: 120 });
      window.setTimeout(() => { if (state.current.open) moveCursor(state.current.hi, true); }, m === "cutin" ? 520 : 420);
    } else {
      items().forEach((b, i) => {
        const c = G.closed[i], from = now(b), r = rectOf(b);
        textOut(b);
        if (m === "slash") {
          run(b, [
            { ...from, easing: OUT },
            { ...css({ x: r.x, y: r.y + r.h / 2 - c.h / 2, w: r.w, h: c.h }), transform: flat, borderRadius: pill(), offset: 0.4, easing: "cubic-bezier(.3,1.2,.5,1)" },
            { ...css(c), transform: flat, borderRadius: pill() },
          ], { duration: 440, delay: (4 - i) * 35 });
        } else if (m === "cutin") {
          run(b, [
            { ...from, easing: IN },
            { ...from, left: `${-r.w - 60}px`, offset: 0.45 },
            { ...css({ x: c.x, y: c.y, w: 0, h: c.h }), transform: flat, borderRadius: pill(), offset: 0.46, easing: OUT },
            { ...css(c), transform: flat, borderRadius: pill() },
          ], { duration: 520, delay: i * 30 });
        } else {
          run(b, [from, { ...css(c), transform: flat, borderRadius: pill() }], { duration: snap.dur, delay: (4 - i) * 26, easing: snap.easing });
        }
      });
      paintActive(-1, false);
      run(dimRef.current!, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-out" });
      run(pauseRef.current!, [{ opacity: 1 }, { opacity: 0 }], { duration: 120 });
      run(cursorRef.current!, [{ opacity: 1 }, { opacity: 0 }], { duration: 100 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stopAll/now read refs only
  }, [geometry, moveCursor, paintActive, placeClosed, placeOpen]);

  // Selection: the bar slides out on a spring, the number ticks, the cursor follows
  const highlight = useCallback((i: number) => {
    const s = state.current;
    if (!s.open || i === s.hi) return;
    const prev = s.hi;
    s.hi = i;
    const G = geometry(), all = items();
    [prev, i].forEach((k) => {
      const b = all[k];
      freeze(b);
      // Full target rect: a bar caught mid-entry still lands where it belongs
      const to = { ...css(G.bar(k, i)), transform: `skewX(${SKEW}deg)`, borderRadius: "6px" };
      if (reduced()) settle(b, to);
      else run(b, [now(b), to], { duration: springs.current!.snap.dur, easing: springs.current!.snap.easing });
    });
    if (!reduced()) all[i].querySelector(".pause-num")?.animate([{ transform: "translateY(-30%)", opacity: 0.4 }, { transform: "none", opacity: 1 }], { duration: 220, easing: OUT });
    paintActive(i, true);
    moveCursor(i, false);
    all[i].focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- now() reads the element only
  }, [geometry, moveCursor, paintActive]);

  // Picking: the bar flashes, the game resumes, then the channel changes
  const pick = useCallback((i: number) => {
    highlight(i);
    const b = items()[i];
    if (!reduced()) b.animate([{ backgroundColor: "#fce8cd" }, { backgroundColor: "#ec563b" }], { id: "flash", duration: 160 });
    window.setTimeout(() => {
      setOpen(false);
      const id = sections[i].id;
      window.setTimeout(() => props.current.onCategoryChange?.(id), reduced() ? 0 : 200);
    }, reduced() ? 0 : 170);
  }, [highlight, setOpen]);

  // Mount: springs, resting place, the cursor's idle bob, and re-layout on resize
  useEffect(() => {
    springs.current = {
      snap: spring(260, 20, "cubic-bezier(.3,1.35,.5,1)", 520),
      soft: spring(170, 19, "cubic-bezier(.3,1.2,.5,1)", 620),
    };
    placeClosed();
    const cursor = cursorRef.current!;
    const bob = prefersReducedMotion() ? null : cursor.animate([{ translate: "0 0" }, { translate: "-4px 0" }, { translate: "0 0" }], { id: "bob", duration: 700, iterations: Infinity, easing: "ease-in-out" });
    const ro = new ResizeObserver(() => {
      stopAll();
      if (state.current.open) placeOpen(); else placeClosed();
    });
    ro.observe(rootRef.current!);
    return () => { ro.disconnect(); bob?.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The current section's scanline stays lit while closed
  useEffect(() => {
    if (!state.current.open) items().forEach((b, i) => b.classList.toggle("is-active", i === activeIndex));
  }, [activeIndex]);

  // Close if something else takes over (a project modal)
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled, setOpen]);

  // Keys in the capture phase, so screens underneath leave them alone while paused.
  // Esc (gamepad B) pauses and resumes, like a game.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled || e.metaKey || e.ctrlKey || e.altKey) return;
      const s = state.current;
      if (!s.open) {
        if (e.key === "Escape") { e.preventDefault(); setOpen(true); }
        return;
      }
      if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        highlight((s.hi + (e.key === "ArrowDown" ? 1 : -1) + sections.length) % sections.length);
      } else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(s.hi); }
      else if (/^[1-5]$/.test(e.key)) { e.preventDefault(); pick(Number(e.key) - 1); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [disabled, setOpen, highlight, pick]);

  return (
    <div ref={rootRef} className="pause-menu" data-open="false">
      <div ref={dimRef} className="pause-dim" onClick={() => setOpen(false)} aria-hidden="true" />
      <div ref={pauseRef} className="pause-label" aria-hidden="true">
        PAUSE<small>ポーズ</small>
      </div>
      <div ref={(el) => { wipeRefs.current[0] = el; }} className="pause-wipe pause-wipe-a" aria-hidden="true" />
      <div ref={(el) => { wipeRefs.current[1] = el; }} className="pause-wipe pause-wipe-b" aria-hidden="true" />
      <button ref={hitRef} className="pause-hit" onClick={() => setOpen(true)} aria-label="Pause and open the menu" />
      <nav aria-label="Sections">
        {sections.map((s, i) => (
          <button
            key={s.id}
            ref={(el) => { itemRefs.current[i] = el; }}
            className="pause-item"
            aria-label={`${s.number} ${s.label}`}
            aria-current={i === activeIndex ? "page" : undefined}
            style={{ "--i": i } as React.CSSProperties}
            onClick={() => (state.current.open ? pick(i) : setOpen(true))}
            onMouseEnter={() => highlight(i)}
          >
            <span className="pause-in">
              <span className="pause-num">{s.number}</span>
              <span className="pause-lbl">{s.label}</span>
              <span className="pause-jp">{s.labelJp}</span>
            </span>
          </button>
        ))}
      </nav>
      <div ref={cursorRef} className="pause-cursor" aria-hidden="true" />
    </div>
  );
}
