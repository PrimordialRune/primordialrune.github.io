"use client";

// Shared by the manual and the paper views: modal focus handling, ref merging, the motion
// level and the integer-scale rule for pixel art (P1).

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import type { RefObject } from "react";
import { isQuiet, subscribeMotion } from "@/lib/motion";

export const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** "quiet" when the visitor (or the OS, under AUTO) asked for less motion */
export function useQuiet(): boolean {
  return useSyncExternalStore(
    (fn) => subscribeMotion(fn),
    () => isQuiet(),
    () => false,
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Modal behaviour for role="dialog": Tab stays inside, Esc calls onEscape. The handler is
 * meant for the dialog element's onKeyDown, so it stops Esc there and the shell's own
 * window listener does not close twice.
 */
export function useDialogKeys(ref: RefObject<HTMLElement | null>, onEscape: () => void) {
  return useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onEscape();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = active && ref.current.contains(active);
      if (e.shiftKey && (active === first || !inside || active === ref.current.querySelector("h1"))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    },
    [ref, onEscape],
  );
}

/** Focus lands on the dialog's h1 once it is on screen (a11y: the reader hears the title) */
export function useFocusOnMount(id: string, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const raf = requestAnimationFrame(() => document.getElementById(id)?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(raf);
  }, [id, enabled]);
}

export const focusById = (id: string) => document.getElementById(id)?.focus({ preventScroll: true });

export type ScaleFit = "pixel" | "halves" | "shrink";

/**
 * How wide to draw an image (CSS px, never a percentage), measured against the box it
 * sits in (the box must not grow with the image: give it width:100%, min-width:0).
 *  - pixel: the largest whole multiple of the native width, in device pixels, that fits (P1)
 *  - halves: anti-aliased art with a pixel-styled part: native size, or exactly 1/2, 1/3...
 *  - shrink: photographs and vector-made art: native size at most, shrunk to fit
 */
export function useIntScaleWidth(native: number, fit: ScaleFit | boolean, max?: number) {
  const mode: ScaleFit = fit === true ? "pixel" : fit === false ? "shrink" : fit;
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(native);
  useIsoLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const dpr = window.devicePixelRatio || 1;
      const cs = getComputedStyle(el);
      const inner = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const avail = Math.max(1, Math.min(inner, max ?? Infinity));
      if (mode === "shrink") setWidth(Math.min(native, avail));
      else if (mode === "halves") setWidth(native / Math.max(1, Math.ceil(native / avail)));
      else {
        const k = Math.max(1, Math.floor((avail * dpr) / native));
        setWidth((native * k) / dpr);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [native, mode, max]);
  return { box, width };
}

/**
 * Overlays (notebook, card, manual) sit below the top bar, whatever height it has today:
 * the bar's bottom edge is written to --nd-top on the overlay's root.
 */
export function useTopInset(ref: RefObject<HTMLElement | null>) {
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const bar = document.querySelector("header");
      const r = bar?.getBoundingClientRect();
      const bottom = r && r.height > 0 && r.top <= 1 ? Math.max(0, Math.round(r.bottom)) : null;
      if (bottom !== null) el.style.setProperty("--nd-top", `${bottom}px`);
      else el.style.removeProperty("--nd-top");
    };
    measure();
    const bar = document.querySelector("header");
    const ro = new ResizeObserver(measure);
    if (bar) ro.observe(bar);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ref]);
}

/** 12fps, the frame rate of every diegetic object (P6) */
export const FRAME_MS = 83;
