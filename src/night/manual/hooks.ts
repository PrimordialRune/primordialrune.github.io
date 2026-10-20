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

/**
 * Integer scale for pixel art: the largest whole multiple of the native width, in device
 * pixels, that fits the box. Other images: native size, shrunk only to fit. Returns the CSS
 * width to set (never a percentage).
 */
export function useIntScaleWidth(native: number, pixel: boolean, max?: number) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(native);
  useIsoLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const dpr = window.devicePixelRatio || 1;
      const avail = Math.min(el.clientWidth, max ?? Infinity);
      if (!pixel) {
        // photographs and vector-made art: their own size at most, shrunk to fit
        setWidth(Math.min(native, avail));
        return;
      }
      const k = Math.max(1, Math.floor((avail * dpr) / native));
      setWidth((native * k) / dpr);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [native, pixel, max]);
  return { box, width };
}

/** 12fps, the frame rate of every diegetic object (P6) */
export const FRAME_MS = 83;
