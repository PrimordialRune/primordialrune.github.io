"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { sections } from "@/lib/sections";
import { isQuiet, readMotionSetting, springEase, subscribeMotion, writeMotionSetting } from "@/lib/motion";

export type PauseMotion = "slash" | "cutin" | "ribbon";

interface PauseMenuProps {
  activeId: string;
  motion: PauseMotion;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCategoryChange?: (id: string) => void;
}

type Rect = { x: number; y: number; w: number; h: number };

const SKEW = -12;
const TAN = Math.tan(12 * (Math.PI / 180));
const SHADOW_ON = "7px 7px 0px #102f41, 13px 13px 0px #fadb68";
const SHADOW_PEAK = "11px 11px 0px #102f41, 20px 20px 0px #fadb68";
const SHADOW_OFF = "0px 0px 0px #102f41, 0px 0px 0px #fadb68";
const GEO = "x,y,width,height,skewX,borderRadius";
// Springs (stiffness, damping): snap for selection, soft for the ribbon unfurl
const SNAP = springEase(260, 20);
const SOFT = springEase(170, 19);

// The scanlines in the corner are the pause menu: picking them pauses the screen and the
// same five elements morph into slanted Persona-style bars. Three choreographies for that
// morph are A/B tested (slash, cut-in, ribbon); selection and picking are shared.
// Everything runs on GSAP, so it can be interrupted mid-flight and slowed down for review.
export default function PauseMenu({ activeId, motion, disabled, onOpenChange, onCategoryChange }: PauseMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLButtonElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const pauseRef = useRef<HTMLDivElement>(null);
  const optRef = useRef<HTMLButtonElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const wipeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const state = useRef({ open: false, hi: 0, active: 0, lh: 8 });
  const props = useRef({ motion, onOpenChange, onCategoryChange });
  props.current = { motion, onOpenChange, onCategoryChange };
  const motionSetting = useSyncExternalStore(subscribeMotion, readMotionSetting, () => "auto" as const);
  const quietNow = useSyncExternalStore(subscribeMotion, isQuiet, () => false);

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
    const bh = Math.min(portrait ? 62 : 92, (H - top - pad * 2.2 - 4 * g) / 5);
    const y0 = top + Math.max(0, (H - top - pad * 2.2 - (5 * bh + 4 * g)) / 2);
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

  const items = () => itemRefs.current.filter(Boolean) as HTMLButtonElement[];
  const inner = (b: HTMLElement) => b.firstChild as HTMLElement;
  const line = (r: Rect) => ({ x: r.x, y: r.y, width: r.w, height: r.h, skewX: 0, borderRadius: state.current.lh / 2 });
  const slab = (r: Rect) => ({ x: r.x, y: r.y, width: r.w, height: r.h, skewX: SKEW, borderRadius: 6 });

  const paintActive = useCallback((hi: number, animate: boolean, delay = 0) => {
    items().forEach((b, i) => {
      const on = i === hi;
      b.classList.toggle("is-active", on || (hi < 0 && i === state.current.active));
      gsap.killTweensOf(b, "boxShadow");
      if (!on) gsap.set(b, { boxShadow: "none" });
      else if (!animate || isQuiet()) gsap.set(b, { boxShadow: SHADOW_ON });
      else gsap.fromTo(b, { boxShadow: SHADOW_OFF }, {
        delay, keyframes: [{ boxShadow: SHADOW_PEAK, duration: 0.18, ease: "power2.out" }, { boxShadow: SHADOW_ON, duration: 0.24, ease: "power2.inOut" }],
      });
    });
  }, []);

  const moveCursor = useCallback((i: number, appear: boolean) => {
    const cursor = cursorRef.current!;
    const r = geometry().bar(i, i), s = Math.max(9, r.h * 0.2);
    cursor.style.borderWidth = `${s}px 0 ${s}px ${s * 1.3}px`;
    const to = { left: r.x - (r.h * TAN) / 2 - s * 1.3 - Math.max(12, r.h * 0.2), top: r.y + r.h / 2 - s };
    gsap.killTweensOf(cursor, "left,top,opacity,xPercent");
    if (appear || isQuiet()) {
      gsap.set(cursor, { ...to, opacity: 1 });
      if (!isQuiet()) gsap.from(cursor, { xPercent: -120, opacity: 0, duration: 0.2, ease: "power3.out" });
    } else {
      gsap.to(cursor, { ...to, opacity: 1, duration: SNAP.duration, ease: SNAP.ease });
    }
  }, [geometry]);

  const placeClosed = useCallback(() => {
    const G = geometry();
    items().forEach((b, i) => {
      gsap.set(b, { ...line(G.closed[i]), boxShadow: "none", opacity: 1 });
      gsap.set(inner(b), { opacity: 0 });
      b.classList.toggle("is-active", i === state.current.active);
      b.tabIndex = -1;
    });
    gsap.set(hitRef.current!, { left: G.stack.x, top: G.stack.y, width: G.stack.w, height: G.stack.h });
    gsap.set([dimRef.current!, pauseRef.current!, cursorRef.current!, optRef.current!], { opacity: 0 });
    gsap.set(wipeRefs.current, { opacity: 0, xPercent: -400 });
  }, [geometry]);

  const placeOpen = useCallback(() => {
    const G = geometry(), hi = state.current.hi;
    items().forEach((b, i) => {
      gsap.set(b, { ...slab(G.bar(i, hi)), opacity: 1 });
      gsap.set(inner(b), { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" });
      b.tabIndex = 0;
    });
    gsap.set([dimRef.current!, pauseRef.current!, optRef.current!], { opacity: 1, y: 0 });
    moveCursor(hi, true);
    paintActive(hi, false);
  }, [geometry, moveCursor, paintActive]);

  const stopAll = () => {
    const all = items();
    gsap.killTweensOf([...all, ...all.map(inner), cursorRef.current, dimRef.current, pauseRef.current, optRef.current, ...wipeRefs.current]);
  };

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
    optRef.current!.tabIndex = open ? 0 : -1;
    if (!open && rootRef.current!.contains(document.activeElement)) hitRef.current!.focus({ preventScroll: true });

    // Quiet: no travel, a short cross-fade between the two states
    if (isQuiet()) {
      const all = items();
      gsap.to(all, {
        opacity: 0, duration: 0.07, ease: "none",
        onComplete: () => {
          if (open) placeOpen(); else placeClosed();
          gsap.fromTo(all, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "none" });
          if (open) gsap.fromTo([dimRef.current, pauseRef.current, optRef.current], { opacity: 0 }, { opacity: 1, duration: 0.15 });
        },
      });
      if (!open) gsap.to([dimRef.current, pauseRef.current, optRef.current, cursorRef.current], { opacity: 0, duration: 0.12 });
      return;
    }

    const m = props.current.motion;
    const tl = gsap.timeline();
    if (open) {
      items().forEach((b, i) => {
        const c = G.closed[i], r = G.bar(i, s.hi), mid = r.y + r.h / 2;
        const txt = inner(b);
        gsap.set(txt, { opacity: 0, clipPath: "inset(0% 100% 0% 0%)" });
        if (m === "slash") {
          // The line shoots out thin and overlong, then snaps to the bar's thickness and leans in
          const d = i * 0.045;
          tl.to(b, { x: r.x, y: mid - c.h * 0.35, width: r.w * 1.12, height: c.h * 0.7, duration: 0.2, ease: "power3.in" }, d)
            .to(b, { y: r.y, width: r.w, height: r.h, skewX: SKEW, borderRadius: 6, duration: SNAP.duration, ease: SNAP.ease }, d + 0.2)
            .to(txt, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.22, ease: "power3.out" }, d + 0.32);
        } else if (m === "cutin") {
          // Whip off right behind the wipe, then slam back in from the right edge already leaning
          const d = 0.05 + i * 0.04;
          tl.to(b, { x: G.W + 40, width: c.w * 2.2, duration: 0.17, ease: "power2.in" }, d)
            .set(b, { y: r.y, width: r.w, height: r.h, skewX: SKEW, borderRadius: 6 }, d + 0.17)
            .fromTo(b, { x: G.W + 40 }, { x: r.x, duration: 0.42, ease: "back.out(1.5)", immediateRender: false }, d + 0.24)
            .to(txt, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.2, ease: "power3.out" }, d + 0.42);
        } else {
          // Ribbon: the line drops into place and fattens first, its length unfurls a beat behind
          const d = i * 0.035;
          tl.to(b, { y: r.y, height: r.h, skewX: SKEW, borderRadius: 6, duration: SOFT.duration, ease: SOFT.ease }, d)
            .to(b, { x: r.x, width: r.w, duration: SOFT.duration, ease: SOFT.ease }, d + 0.07)
            .to(txt, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.24, ease: "power3.out" }, d + 0.26);
        }
      });
      if (m === "cutin") {
        wipeRefs.current.forEach((w, k) => w && tl.fromTo(w,
          { xPercent: -160, x: 0, skewX: -16, opacity: 1 },
          { x: G.W * (k ? 1.6 : 1.4), xPercent: 0, duration: 0.4, ease: "expo.inOut", onComplete: () => { gsap.set(w, { opacity: 0, xPercent: -400, x: 0 }); } },
          0.06 + k * 0.04));
      }
      const settled = m === "cutin" ? 0.62 : m === "slash" ? 0.5 : 0.42;
      tl.add(() => paintActive(state.current.hi, true), settled)
        .add(() => moveCursor(state.current.hi, true), settled - 0.08)
        .fromTo(dimRef.current, { opacity: 0 }, { opacity: 1, duration: 0.26, ease: "power1.out" }, 0)
        .fromTo(pauseRef.current, { opacity: 0, y: -6 }, {
          keyframes: [{ opacity: 1, duration: 0.1 }, { opacity: 0.2, duration: 0.08 }, { opacity: 1, y: 0, duration: 0.08 }],
        }, 0.12)
        .fromTo(optRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 }, settled);
    } else {
      items().forEach((b, i) => {
        const c = G.closed[i];
        const r = { x: gsap.getProperty(b, "x") as number, y: gsap.getProperty(b, "y") as number, w: b.offsetWidth, h: b.offsetHeight };
        tl.to(inner(b), { opacity: 0, duration: 0.08 }, 0);
        if (m === "slash") {
          const d = (4 - i) * 0.035;
          tl.to(b, { y: r.y + r.h / 2 - c.h / 2, height: c.h, skewX: 0, borderRadius: state.current.lh / 2, duration: 0.16, ease: "power3.out" }, d)
            .to(b, { ...line(c), duration: 0.28, ease: "back.out(1.3)" }, d + 0.16);
        } else if (m === "cutin") {
          const d = i * 0.03;
          tl.to(b, { x: -r.w - 60, duration: 0.22, ease: "power2.in" }, d)
            .set(b, { ...line(c), width: 0 }, d + 0.22)
            .to(b, { width: c.w, duration: 0.26, ease: "power3.out" }, d + 0.23);
        } else {
          tl.to(b, { ...line(c), duration: SNAP.duration, ease: SNAP.ease }, (4 - i) * 0.026);
        }
      });
      paintActive(-1, false);
      tl.to(dimRef.current, { opacity: 0, duration: 0.22, ease: "power1.out" }, 0)
        .to([pauseRef.current, optRef.current], { opacity: 0, duration: 0.12 }, 0)
        .to(cursorRef.current, { opacity: 0, duration: 0.1 }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stopAll/line/slab read refs only
  }, [geometry, moveCursor, paintActive, placeClosed, placeOpen]);

  // Selection: both bars spring to their new rects from wherever they are, the number ticks, the cursor follows
  const highlight = useCallback((i: number) => {
    const s = state.current;
    if (!s.open || i === s.hi) return;
    const prev = s.hi;
    s.hi = i;
    const G = geometry(), all = items();
    [prev, i].forEach((k) => {
      const b = all[k];
      gsap.killTweensOf(b, GEO);
      if (isQuiet()) gsap.set(b, slab(G.bar(k, i)));
      else gsap.to(b, { ...slab(G.bar(k, i)), duration: SNAP.duration, ease: SNAP.ease });
      gsap.set(inner(b), { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" });
    });
    const num = all[i].querySelector(".pause-num");
    if (num && !isQuiet()) gsap.fromTo(num, { yPercent: -35, opacity: 0.4 }, { yPercent: 0, opacity: 1, duration: 0.22, ease: "power3.out" });
    paintActive(i, true);
    moveCursor(i, false);
    all[i].focus({ preventScroll: true });
  }, [geometry, moveCursor, paintActive]);

  // Picking: the bar flashes, the game resumes, then the channel changes
  const pick = useCallback((i: number) => {
    highlight(i);
    const b = items()[i];
    const quiet = isQuiet();
    if (!quiet) gsap.fromTo(b, { backgroundColor: "#fce8cd" }, { backgroundColor: "#ec563b", duration: 0.16, clearProps: "backgroundColor" });
    gsap.delayedCall(quiet ? 0 : 0.17, () => {
      setOpen(false);
      const id = sections[i].id;
      gsap.delayedCall(quiet ? 0 : 0.2, () => props.current.onCategoryChange?.(id));
    });
  }, [highlight, setOpen]);

  // Mount: resting place, the cursor's idle bob, and re-layout on resize
  useEffect(() => {
    placeClosed();
    const bob = gsap.to(cursorRef.current, { x: -4, duration: 0.35, ease: "sine.inOut", repeat: -1, yoyo: true, paused: isQuiet() });
    const ro = new ResizeObserver(() => {
      stopAll();
      if (state.current.open) placeOpen(); else placeClosed();
    });
    ro.observe(rootRef.current!);
    const off = subscribeMotion(() => (isQuiet() ? bob.pause(0) : bob.play()));
    return () => { ro.disconnect(); bob.kill(); off(); stopAll(); };
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
      } else if ((e.key === "Enter" || e.key === " ") && document.activeElement !== optRef.current) { e.preventDefault(); pick(s.hi); }
      else if (/^[1-5]$/.test(e.key)) { e.preventDefault(); pick(Number(e.key) - 1); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [disabled, setOpen, highlight, pick]);

  const motionLabel = quietNow ? "QUIET" : "FULL";

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
      <button
        ref={optRef}
        className="pause-opt"
        tabIndex={-1}
        aria-label={`Motion: ${motionLabel.toLowerCase()}. Switch to ${quietNow ? "full" : "quiet"}`}
        onClick={() => writeMotionSetting(quietNow ? "full" : "quiet")}
      >
        MOTION <b>{motionLabel}</b>
        {motionSetting === "auto" && quietNow && <i> · SYSTEM</i>}
        <small>モーション</small>
      </button>
      <div ref={cursorRef} className="pause-cursor" aria-hidden="true" />
    </div>
  );
}
