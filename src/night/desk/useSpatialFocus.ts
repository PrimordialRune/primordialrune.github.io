"use client";

// Arrow keys move focus spatially across the desk: the nearest item in that direction,
// favouring straight lines. Roving tabindex: one tab stop for all the objects.
import { useCallback, useState, type KeyboardEvent, type RefObject } from "react";

const DIRS: Record<string, [number, number]> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
};

function focusSpot(el: HTMLElement) {
  if (el.matches("button, a, [tabindex]")) el.focus();
  else el.querySelector<HTMLElement>("button, a[href], [tabindex]")?.focus();
}

export function useSpatialFocus(container: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState<string>("galactic-news");

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const dir = DIRS[e.key];
      const root = container.current;
      if (!dir || !root) return;
      const spots = Array.from(root.querySelectorAll<HTMLElement>("[data-spot]"));
      const cur = spots.find((el) => el.contains(document.activeElement));
      if (!cur) return;
      e.preventDefault();
      const c = cur.getBoundingClientRect();
      const cx = c.left + c.width / 2, cy = c.top + c.height / 2;
      let best: HTMLElement | null = null;
      let bestScore = Infinity;
      for (const el of spots) {
        if (el === cur) continue;
        const r = el.getBoundingClientRect();
        const dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy;
        const along = dx * dir[0] + dy * dir[1];
        if (along <= 4) continue;
        const across = Math.abs(dx * dir[1] - dy * dir[0]);
        const score = along + across * 2.2;
        if (score < bestScore) {
          bestScore = score;
          best = el;
        }
      }
      if (best) {
        setActive(best.dataset.spot!);
        focusSpot(best);
      }
    },
    [container],
  );

  return { active, setActive, onKeyDown };
}
