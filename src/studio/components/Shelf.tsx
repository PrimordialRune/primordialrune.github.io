"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import ObjectArt from "./ObjectArt";
import { liftFrame } from "./transitions";
import { isSoft } from "@/studio/lib/motion";
import { SHELF_GROUPS } from "@/studio/data/projects";
import type { ObjectKind, StudioProject } from "@/studio/types";

// Real relative sizes (about 1.2px per mm on desktop): the cassette is the unit
const WIDTH: Record<ObjectKind, number> = {
  "trainer-card": 76,
  booster: 88,
  cassette: 120,
  "gb-cart": 68,
  cd: 150,
  "gba-cart": 70,
  "deck-box": 80,
  "ds-card": 62,
  floppy: 104,
};

const PHONE = "(max-width: 720px)";
function usePhone() {
  return useSyncExternalStore(
    (fn) => {
      const mq = window.matchMedia(PHONE);
      mq.addEventListener("change", fn);
      return () => mq.removeEventListener("change", fn);
    },
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
}

// The shelf: a grouped listbox (roving tabindex). Hero of the Room (P7): the focused
// object, lifted one stepped frame and lit by the TV.
export default function Shelf({
  projects,
  selected,
  inert,
  onSelect,
  onOpen,
  onKeyNav,
}: {
  projects: StudioProject[];
  selected: string;
  inert: boolean;
  onSelect: (slug: string, via: "pointer" | "key") => void;
  onOpen: (slug: string) => void;
  onKeyNav: () => void;
}) {
  const phone = usePhone();
  const root = useRef<HTMLDivElement>(null);
  const lifted = useRef<string | null>(null);
  // Touch: the first tap selects (and shows the card), the second opens. Decided from the
  // selection as it was at pointerdown, before focus re-selects it.
  const downWasSelected = useRef<boolean | null>(null);
  const order = SHELF_GROUPS.flatMap((g) => projects.filter((p) => p.shelf === g.id));

  // One stepped lift frame on focus; the previous object drops back
  useEffect(() => {
    const prev = lifted.current;
    if (prev === selected) return;
    const get = (slug: string) => document.querySelector<HTMLElement>(`#obj-${slug} .shelf-object`);
    const soft = isSoft();
    if (prev) {
      const el = get(prev);
      if (el) liftFrame(el, false, soft);
    }
    const el = get(selected);
    if (el) liftFrame(el, true, soft);
    lifted.current = selected;
    // Keep the focused object in view in the scrolling strip
    // (horizontally only: a page scroll here would fight CONTACT's scroll on phones)
    const row = root.current;
    const item = document.getElementById(`obj-${selected}`);
    if (row && item && row.scrollWidth > row.clientWidth) {
      const r = row.getBoundingClientRect();
      const i = item.getBoundingClientRect();
      const pad = 24;
      let dx = 0;
      if (i.left < r.left + pad) dx = i.left - r.left - pad;
      else if (i.right > r.right - pad) dx = i.right - r.right + pad;
      if (dx) row.scrollBy({ left: dx, behavior: soft ? "auto" : "smooth" });
    }
  }, [selected]);

  const move = (to: number) => {
    const p = order[(to + order.length) % order.length];
    onSelect(p.slug, "key");
    onKeyNav();
    document.getElementById(`obj-${p.slug}`)?.focus({ preventScroll: true });
  };

  const onKey = (e: React.KeyboardEvent) => {
    const i = order.findIndex((p) => p.slug === selected);
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        return move(i + 1);
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        return move(i - 1);
      case "Home":
        e.preventDefault();
        return move(0);
      case "End":
        e.preventDefault();
        return move(order.length - 1);
      case "Enter":
      case " ":
        e.preventDefault();
        return onOpen(selected);
    }
  };

  return (
    <div className="shelf" data-inert={inert || undefined} inert={inert || undefined}>
      <div ref={root} id="shelf" className="shelf-row" role="listbox" aria-label="Shelf" aria-orientation="horizontal" onKeyDown={onKey}>
        {SHELF_GROUPS.map((g) => {
          const items = projects.filter((p) => p.shelf === g.id);
          if (!items.length) return null;
          return (
            <div key={g.id} className="shelf-group" role="group" aria-label={g.label}>
              <div className="shelf-items">
                {items.map((p) => {
                  const on = p.slug === selected;
                  return (
                    <div
                      key={p.slug}
                      id={`obj-${p.slug}`}
                      className="shelf-item"
                      role="option"
                      aria-selected={on}
                      aria-label={`${p.title}, ${p.medium.toLowerCase()}`}
                      tabIndex={on ? 0 : -1}
                      data-on={on || undefined}
                      onPointerEnter={(e) => e.pointerType === "mouse" && onSelect(p.slug, "pointer")}
                      onPointerDown={() => {
                        downWasSelected.current = on;
                      }}
                      onFocus={() => !on && onSelect(p.slug, "key")}
                      onClick={() => {
                        const was = downWasSelected.current ?? on;
                        downWasSelected.current = null;
                        if (was) onOpen(p.slug);
                        else onSelect(p.slug, "pointer");
                      }}
                    >
                      <span className="shelf-pool" aria-hidden />
                      <div className="shelf-object" data-object={p.slug}>
                        <ObjectArt project={p} size={Math.round(WIDTH[p.kind] * (phone ? 0.72 : 1))} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="shelf-label" aria-hidden>
                <span>{g.label}</span>
                <small lang="ja">{g.jp}</small>
              </p>
            </div>
          );
        })}
      </div>
      <div className="shelf-plank" aria-hidden />
    </div>
  );
}
