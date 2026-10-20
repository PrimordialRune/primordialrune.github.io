"use client";

// RECORD (works). Hero: the selected object, held up to the glass like evidence. The others wait
// in a row underneath; cycling shifts the row in 4 stepped frames and steps the held object up
// in 3. Light is free (P4): a specular glint follows the pointer across the plastic.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGame } from "../ctx";
import { getProject, neighbour, PROJECTS, projectIndex } from "../projects";
import { MANUALS } from "../script";
import { loadLabel, type Slug } from "../story";
import ObjectArt, { ART_SIZE } from "../objects/art";
import { frames, quiet } from "../fx";
import { Label } from "../Frame";

function useSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export default function Record({ focus }: { focus: Slug }) {
  const { story, go, loadProject, headingRef } = useGame();
  const root = useRef<HTMLDivElement>(null);
  const held = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLUListElement>(null);
  const dir = useRef(0);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const { w, h } = useSize(root);
  const p = getProject(focus);
  const man = MANUALS[focus];
  const idx = projectIndex(focus);
  const others = [1, 2, 3, 4].map((d) => PROJECTS[(idx + d) % PROJECTS.length]);

  const narrow = w > 0 && w < 720;
  // the held object: as big as the glass allows, a little less on phones
  const art = ART_SIZE[p.kind];
  const maxH = narrow ? Math.min(h * 0.34, 240) : Math.min(h * 0.56, 340);
  const maxW = narrow ? w * 0.78 : Math.min(w * 0.42, 440);
  const heldW = Math.max(80, Math.min(maxW, (maxH * art.w) / art.h));
  const smallFor = (kind: keyof typeof ART_SIZE) => {
    const a = ART_SIZE[kind];
    const cap = narrow ? Math.min(w / 4 - 18, 64) : 96;
    return Math.min(cap, (Math.min(maxH * 0.4, cap) * a.w) / a.h);
  };

  const select = (slug: Slug, d: number) => {
    if (slug === focus) return;
    dir.current = d;
    go({ kind: "record", focus: slug }, { replace: true });
  };

  // stepped row shift + held object scale-up
  useLayoutEffect(() => {
    const d = dir.current;
    dir.current = 0;
    if (!d || !held.current || !row.current) return;
    if (quiet()) {
      gsap.fromTo(held.current, { scale: 0.4 }, { scale: 1, duration: 0.16, ease: "steps(1)" });
      return;
    }
    const step = (row.current.firstElementChild as HTMLElement | null)?.offsetWidth ?? 80;
    gsap.fromTo(row.current, { x: d * (step + 16) }, { x: 0, ...frames(4) });
    gsap.fromTo(held.current, { scale: 0.4 }, { scale: 1, ...frames(3) });
  }, [focus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") select(neighbour(focus, 1), 1);
      else if (e.key === "ArrowLeft") select(neighbour(focus, -1), -1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const glint = (e: React.PointerEvent<HTMLDivElement>) => {
    if (quiet()) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--gx", `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty("--gy", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div
      className="view record"
      ref={root}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") swipe.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const s = swipe.current;
        swipe.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) select(neighbour(focus, dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      }}
    >
      <div className="rec-main">
        <div className="rec-held" ref={held} onPointerMove={glint} data-kind={p.kind}>
          {w > 0 && (
            <button type="button" className="rec-held-btn" onClick={() => loadProject(focus)} aria-label={`${p.title}, ${p.medium}. ${loadLabel(story)}`}>
              <ObjectArt kind={p.kind} width={Math.round(heldW)} />
              <span className="glint" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="rec-info">
          <p className="rec-count v-machine" aria-hidden="true">
            {String(idx + 1).padStart(2, "0")}/{String(PROJECTS.length).padStart(2, "0")}
          </p>
          <h1 className="rec-title" tabIndex={-1} ref={headingRef}>
            {man.title}
            <span className="rec-jp v-sub" lang="ja">
              {man.titleJp}
            </span>
          </h1>
          <p className="rec-pitch">{man.pitch}</p>
          <div className="rec-actions">
            <button type="button" className="btn-load" onClick={() => loadProject(focus)}>
              <Label en={loadLabel(story)} jp="ロード" />
            </button>
            <span className="rec-arrows">
              <button type="button" className="btn-arrow" onClick={() => select(neighbour(focus, -1), -1)} aria-label="Previous object">
                ◀
              </button>
              <button type="button" className="btn-arrow" onClick={() => select(neighbour(focus, 1), 1)} aria-label="Next object">
                ▶
              </button>
            </span>
          </div>
        </div>
      </div>
      <div className="rec-row-wrap">
        <ul className="rec-row" ref={row} aria-label="Other works">
          {others.map((o, i) => (
            <li key={o.slug}>
              <button type="button" className="rec-small" onClick={() => select(o.slug, i < 2 ? 1 : -1)} aria-label={`${MANUALS[o.slug].title}, ${o.medium}`}>
                {w > 0 && <ObjectArt kind={o.kind} width={Math.round(smallFor(o.kind))} />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
