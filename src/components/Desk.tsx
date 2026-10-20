"use client";

// The Desk (Glass Desktop): each project is a physical object sitting straight on the
// CRT glass. No menu bar, no windows, but every desktop gesture works: drag to move,
// drag a box on empty glass to select several, double-click (double-tap) to open,
// right-click (long-press) for a menu the narrator writes. Keyboard: Tab or the arrow
// keys move between objects, Enter opens, Space selects, Shift+F10 opens the menu.

import "./desk/desk.css";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { isQuiet } from "@/lib/motion";
import { getSection } from "@/lib/sections";
import {
  getDeskProjects,
  deskIntro,
  deskEmptyLine,
  deskGlassLine,
  deskMultiLine,
  type DeskProject,
} from "@/lib/desk";
import { narrateLine } from "@/lib/narrator";
import { seededRandom } from "@/lib/utils";
import DeskArt, { ART_SIZE } from "./desk/DeskArt";

interface DeskProps {
  sectionId: string;
  onOpen: (slug: string) => void;
}

interface Placed {
  project: DeskProject;
  /** centre of the object's footprint, px from the desk's top left */
  cx: number;
  cy: number;
  w: number;
  h: number;
  rot: number;
}

interface Menu {
  x: number;
  y: number;
  slug: string | null;
  count: number;
}

const CAPTION = 26; // px under each object for its name
const DRAG_THRESHOLD = 5;
const DOUBLE_MS = 420;
const LONG_PRESS_MS = 550;
const SHADOW_REST = "drop-shadow(0px 2px 1.5px rgba(0,0,0,0.55)) drop-shadow(0px 10px 12px rgba(0,0,0,0.35))";
const SHADOW_LIFT = "drop-shadow(0px 8px 5px rgba(0,0,0,0.28)) drop-shadow(0px 26px 22px rgba(0,0,0,0.42))";

const subscribeCoarse = (fn: () => void) => {
  const mq = window.matchMedia("(pointer: coarse)");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};
const readCoarse = () => window.matchMedia("(pointer: coarse)").matches;

function rotatedBox(w: number, h: number, deg: number) {
  const r = (Math.abs(deg) * Math.PI) / 180;
  return { bw: w * Math.cos(r) + h * Math.sin(r), bh: w * Math.sin(r) + h * Math.cos(r) };
}

function tilt(slug: string, kind: DeskProject["kind"]) {
  let seed = 0;
  for (const ch of slug) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
  const range = kind === "cd" ? 20 : 5;
  return (seededRandom(seed + 1) - 0.5) * 2 * range;
}

// Deterministic layout: split the objects into rows (every row count is tried), size them
// with one shared scale so the largest arrangement wins, space them evenly, then nudge each
// (seeded) by less than half the gap around it, so nothing overlaps. The top band stays
// clear for the pause menu's corner and the bottom band for the narrator.
function layout(projects: DeskProject[], W: number, H: number) {
  const top = Math.max(56, H * 0.1);
  const bottom = Math.max(56, H * 0.12);
  const side = Math.max(16, W * 0.035);
  const aw = W - side * 2;
  const ah = H - top - bottom;
  const gapX = Math.max(20, aw * 0.035);
  const gapY = Math.max(14, ah * 0.04);
  const n = projects.length;
  const items = projects.map((p) => {
    const size = ART_SIZE[p.kind];
    const rot = tilt(p.slug, p.kind);
    // a disc turns inside its own footprint
    const box = p.kind === "cd" ? { bw: size.w, bh: size.h } : rotatedBox(size.w, size.h, rot);
    return { p, size, rot, ...box };
  });
  const split = (cols: number) => {
    const rows: (typeof items)[] = [];
    for (let i = 0; i < n; i += cols) rows.push(items.slice(i, i + cols));
    return rows;
  };
  let best = { rows: split(n), s: 0 };
  let bestScore = 0;
  for (let cols = 1; cols <= n; cols++) {
    const rows = split(cols);
    let s = (ah - rows.length * CAPTION - (rows.length - 1) * gapY) / rows.reduce((t, r) => t + Math.max(...r.map((it) => it.bh)), 0);
    for (const r of rows) s = Math.min(s, (aw - (r.length - 1) * gapX) / r.reduce((t, it) => t + it.bw, 0));
    // a lone object in a short last row reads as left over: prefer even rows unless much smaller
    const score = s * (rows[rows.length - 1].length < cols ? 0.88 : 1);
    if (score > bestScore + 1e-6) {
      best = { rows, s };
      bestScore = score;
    }
  }
  // Never bigger than an object would plausibly be on this screen (one object alone stays an object)
  const s = Math.max(0.5, Math.min(best.s, Math.min(aw, ah) / 190));
  const rowH = best.rows.map((r) => Math.max(...r.map((it) => it.bh)) * s + CAPTION);
  const vGap = (ah - rowH.reduce((t, h) => t + h, 0)) / (best.rows.length + 1);
  const placed: Placed[] = [];
  let y = top + vGap;
  best.rows.forEach((r, ri) => {
    const hGap = (aw - r.reduce((t, it) => t + it.bw * s, 0)) / (r.length + 1);
    let x = side + hGap;
    r.forEach((it) => {
      const i = items.indexOf(it);
      const jx = (seededRandom(i * 137.508 + 3) - 0.5) * 2 * hGap * 0.3;
      const slackY = (rowH[ri] - CAPTION - it.bh * s) / 2;
      const jy = (seededRandom(i * 137.508 + 7) - 0.5) * 2 * (slackY * 0.7 + vGap * 0.25);
      placed.push({
        project: it.p,
        cx: Math.round(x + (it.bw * s) / 2 + jx),
        cy: Math.round(y + (rowH[ri] - CAPTION) / 2 + jy),
        w: Math.round(it.size.w * s),
        h: Math.round(it.size.h * s),
        rot: it.rot,
      });
      x += it.bw * s + hGap;
    });
    y += rowH[ri] + vGap;
  });
  return { placed, scale: s };
}

const introduced = new Set<string>();

export default function Desk({ sectionId, onOpen }: DeskProps) {
  const projects = useMemo(() => getDeskProjects(sectionId), [sectionId]);
  const section = getSection(sectionId);
  const coarse = useSyncExternalStore(subscribeCoarse, readCoarse, () => false);

  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const objRefs = useRef(new Map<string, HTMLButtonElement>());
  const liftRefs = useRef(new Map<string, HTMLSpanElement>());
  const artRefs = useRef(new Map<string, HTMLSpanElement>());

  const [size, setSize] = useState({ w: 0, h: 0 });
  // Where the visitor left things, as fractions of the desk, so a resize keeps them
  const [moved, setMoved] = useState<Record<string, { fx: number; fy: number }>>({});
  const [order, setOrder] = useState<string[]>(() => projects.map((p) => p.slug));
  const [selected, setSelected] = useState<string[]>([]);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [band, setBand] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { placed, scale } = useMemo(
    () => (size.w && size.h && projects.length ? layout(projects, size.w, size.h) : { placed: [], scale: 1 }),
    [projects, size.w, size.h]
  );

  // Final centre of each object: the visitor's position if they moved it, clamped on the glass
  const centres = useMemo(() => {
    const out = new Map<string, { x: number; y: number }>();
    for (const o of placed) {
      const m = moved[o.project.slug];
      const x = m ? m.fx * size.w : o.cx;
      const y = m ? m.fy * size.h : o.cy;
      out.set(o.project.slug, {
        x: Math.min(Math.max(x, o.w / 2), size.w - o.w / 2),
        y: Math.min(Math.max(y, o.h / 2), size.h - o.h / 2 - CAPTION),
      });
    }
    return out;
  }, [placed, moved, size.w, size.h]);

  // After a drop is committed to left/top, clear the drag offset in the same frame
  useLayoutEffect(() => {
    objRefs.current.forEach((el) => gsap.set(el, { x: 0, y: 0 }));
  }, [centres]);

  const say = useCallback((line: string) => narrateLine(line), []);

  // Arriving at the desk: how to handle the objects, after whatever the narrator is saying
  useEffect(() => {
    const intro = deskIntro[sectionId];
    if (intro && !introduced.has(sectionId)) {
      introduced.add(sectionId);
      narrateLine(coarse ? intro.touch : intro.pointer, { append: true });
    }
  }, [sectionId, coarse]);

  const menuState = useRef<Menu | null>(null);
  useEffect(() => {
    menuState.current = menu;
  }, [menu]);
  const closeMenu = useCallback((refocus = false) => {
    const m = menuState.current;
    if (!m) return;
    menuState.current = null;
    setMenu(null);
    if (refocus && m.slug) objRefs.current.get(m.slug)?.focus({ preventScroll: true });
  }, []);

  const raise = useCallback((slugs: string[]) => {
    setOrder((o) => [...o.filter((s) => !slugs.includes(s)), ...slugs]);
  }, []);

  const openMenuAt = useCallback(
    (clientX: number, clientY: number, slug: string | null) => {
      const r = rootRef.current?.getBoundingClientRect();
      if (!r) return;
      let count = 0;
      if (slug) {
        const sel = selectedRef.current.includes(slug) ? selectedRef.current : [slug];
        if (sel !== selectedRef.current) setSelected(sel);
        count = sel.length;
      } else {
        setSelected([]);
      }
      setMenu({ x: clientX - r.left, y: clientY - r.top, slug, count });
    },
    []
  );

  // ---------- lift and drop (GSAP springs; quiet mode skips them) ----------
  const lift = useCallback((slugs: string[]) => {
    if (isQuiet()) return;
    for (const s of slugs) {
      const el = liftRefs.current.get(s);
      if (!el) continue;
      gsap.to(el, { y: -12, scale: 1.06, duration: 0.32, ease: "back.out(2.2)", overwrite: "auto" });
      gsap.to(el, { filter: SHADOW_LIFT, duration: 0.25, ease: "power2.out" });
    }
  }, []);

  const drop = useCallback((slugs: string[]) => {
    for (const s of slugs) {
      const el = liftRefs.current.get(s);
      if (!el) continue;
      if (isQuiet()) {
        gsap.set(el, { y: 0, scale: 1, rotation: 0, filter: SHADOW_REST });
        continue;
      }
      gsap.to(el, { y: 0, scale: 1, rotation: 0, duration: 0.6, ease: "elastic.out(1, 0.42)", overwrite: "auto" });
      gsap.to(el, { filter: SHADOW_REST, duration: 0.3, ease: "power2.out" });
    }
  }, []);

  // ---------- pointer on an object ----------
  const press = useRef<{
    id: number;
    slug: string;
    group: string[];
    x: number;
    y: number;
    lastX: number;
    starts: Map<string, { x: number; y: number; w: number; h: number }>;
    dragging: boolean;
    longFired: boolean;
    timer: number;
  } | null>(null);
  const lastTap = useRef<{ slug: string; t: number } | null>(null);

  const onObjectPointerDown = (e: React.PointerEvent<HTMLButtonElement>, slug: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    closeMenu();
    const el = e.currentTarget;
    el.focus({ preventScroll: true });
    el.setPointerCapture(e.pointerId);

    let sel = selectedRef.current;
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      sel = sel.includes(slug) ? sel.filter((s) => s !== slug) : [...sel, slug];
    } else if (!sel.includes(slug)) {
      sel = [slug];
    }
    setSelected(sel);
    selectedRef.current = sel;
    const group = sel.includes(slug) ? sel : [slug];
    raise(group);

    const starts = new Map<string, { x: number; y: number; w: number; h: number }>();
    for (const s of group) {
      const c = centres.get(s);
      const o = placed.find((p) => p.project.slug === s);
      if (c && o) starts.set(s, { x: c.x, y: c.y, w: o.w, h: o.h });
    }
    const timer =
      e.pointerType === "mouse"
        ? 0
        : window.setTimeout(() => {
            const p = press.current;
            if (!p || p.dragging) return;
            p.longFired = true;
            openMenuAt(p.x, p.y, slug);
          }, LONG_PRESS_MS);
    press.current = {
      id: e.pointerId,
      slug,
      group,
      x: e.clientX,
      y: e.clientY,
      lastX: e.clientX,
      starts,
      dragging: false,
      longFired: false,
      timer,
    };
  };

  const onObjectPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!p.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD * (e.pointerType === "mouse" ? 1 : 2)) return;
      if (p.longFired) return;
      p.dragging = true;
      clearTimeout(p.timer);
      setDragging(true);
      lift(p.group);
    }
    for (const [s, st] of p.starts) {
      const el = objRefs.current.get(s);
      if (!el) continue;
      const x = Math.min(Math.max(st.x + dx, st.w / 2), size.w - st.w / 2) - st.x;
      const y = Math.min(Math.max(st.y + dy, st.h / 2), size.h - st.h / 2 - CAPTION) - st.y;
      gsap.set(el, { x, y });
    }
    if (!isQuiet()) {
      const lifted = liftRefs.current.get(p.slug);
      const vx = Math.max(-14, Math.min(14, e.clientX - p.lastX));
      if (lifted) gsap.to(lifted, { rotation: vx * 0.55, duration: 0.25, ease: "power2.out", overwrite: false });
    }
    p.lastX = e.clientX;
  };

  const endPress = (e: React.PointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    press.current = null;
    clearTimeout(p.timer);
    if (p.dragging) {
      setDragging(false);
      const next: Record<string, { fx: number; fy: number }> = {};
      for (const [s] of p.starts) {
        const el = objRefs.current.get(s);
        const c = centres.get(s);
        if (!el || !c) continue;
        const x = c.x + Number(gsap.getProperty(el, "x"));
        const y = c.y + Number(gsap.getProperty(el, "y"));
        next[s] = { fx: x / size.w, fy: y / size.h };
      }
      setMoved((m) => ({ ...m, ...next }));
      drop(p.group);
      lastTap.current = null;
      return;
    }
    if (cancelled || p.longFired) return;
    const now = e.timeStamp;
    const last = lastTap.current;
    if (last && last.slug === p.slug && now - last.t < DOUBLE_MS) {
      lastTap.current = null;
      onOpen(p.slug);
    } else {
      lastTap.current = { slug: p.slug, t: now };
    }
  };

  // ---------- marquee on empty glass ----------
  const bandStart = useRef<{ id: number; x: number; y: number; base: string[] } | null>(null);

  const onGlassPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (menuRef.current?.contains(e.target as Node)) return;
    closeMenu();
    const r = e.currentTarget.getBoundingClientRect();
    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    const base = additive ? selectedRef.current : [];
    if (!additive) setSelected([]);
    bandStart.current = { id: e.pointerId, x: e.clientX - r.left, y: e.clientY - r.top, base };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onGlassPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const b = bandStart.current;
    if (!b || b.id !== e.pointerId) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - r.left, 0), r.width);
    const y = Math.min(Math.max(e.clientY - r.top, 0), r.height);
    const rect = { x: Math.min(x, b.x), y: Math.min(y, b.y), w: Math.abs(x - b.x), h: Math.abs(y - b.y) };
    setBand(rect);
    const hits = new Set(b.base);
    artRefs.current.forEach((el, slug) => {
      const a = el.getBoundingClientRect();
      const ax = a.left - r.left;
      const ay = a.top - r.top;
      if (ax < rect.x + rect.w && ax + a.width > rect.x && ay < rect.y + rect.h && ay + a.height > rect.y) hits.add(slug);
    });
    const next = projects.map((p) => p.slug).filter((s) => hits.has(s));
    if (next.join() !== selectedRef.current.join()) {
      selectedRef.current = next;
      setSelected(next);
    }
  };

  const onGlassPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const b = bandStart.current;
    if (!b || b.id !== e.pointerId) return;
    bandStart.current = null;
    setBand(null);
    const n = selectedRef.current.length;
    if (n > 1) say(deskMultiLine(n));
  };

  // ---------- keyboard ----------
  const focusNeighbour = (from: string, dx: number, dy: number) => {
    const a = centres.get(from);
    if (!a) return;
    let best: string | null = null;
    let bestScore = Infinity;
    centres.forEach((c, slug) => {
      if (slug === from) return;
      const vx = c.x - a.x;
      const vy = c.y - a.y;
      const along = vx * dx + vy * dy;
      if (along <= 1) return;
      const across = Math.abs(vx * dy - vy * dx);
      const score = along + across * 2;
      if (score < bestScore) {
        bestScore = score;
        best = slug;
      }
    });
    if (!best) {
      // nothing that way: wrap around in reading order
      const list = [...centres.entries()].sort((p, q) => p[1].y - q[1].y || p[1].x - q[1].x).map(([s]) => s);
      const i = list.indexOf(from);
      best = list[(i + (dx + dy > 0 ? 1 : -1) + list.length) % list.length];
    }
    objRefs.current.get(best)?.focus();
  };

  const onObjectKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, slug: string) => {
    const dirs: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (dirs[e.key]) {
      e.preventDefault();
      focusNeighbour(slug, ...dirs[e.key]);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onOpen(slug);
    } else if (e.key === " ") {
      e.preventDefault();
      const sel = selectedRef.current;
      setSelected(sel.includes(slug) ? sel.filter((s) => s !== slug) : [...sel, slug]);
    } else if (e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) {
      e.preventDefault();
      const r = artRefs.current.get(slug)?.getBoundingClientRect();
      if (r) openMenuAt(r.left + r.width / 2, r.top + r.height / 2, slug);
    } else if ((e.key === "a" || e.key === "A") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      const all = projects.map((p) => p.slug);
      setSelected(all);
      if (all.length > 1) say(deskMultiLine(all.length));
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menu) {
        e.preventDefault();
        closeMenu(true);
      } else if (selectedRef.current.length && rootRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        setSelected([]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu, closeMenu]);

  // ---------- the narrator's menu ----------
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!menu || !el) return;
    const pad = 8;
    const x = Math.min(Math.max(menu.x, pad), size.w - el.offsetWidth - pad);
    const y = Math.min(Math.max(menu.y, pad), size.h - el.offsetHeight - pad);
    gsap.set(el, { left: x, top: y });
    el.querySelector<HTMLElement>("[role=menuitem]")?.focus({ preventScroll: true });
    if (!isQuiet()) {
      gsap.fromTo(
        el,
        { scale: 0.86, opacity: 0, transformOrigin: "0% 0%" },
        { scale: 1, opacity: 1, duration: 0.34, ease: "back.out(2)" }
      );
    }
  }, [menu, size.w, size.h]);

  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      items[e.key === "Home" ? 0 : items.length - 1]?.focus();
    } else if (e.key === "Tab") {
      e.preventDefault();
      closeMenu(true);
    }
  };

  const menuProject = menu?.slug ? projects.find((p) => p.slug === menu.slug) : null;
  const menuLine = !menu ? "" : !menuProject ? deskGlassLine : menu.count > 1 ? deskMultiLine(menu.count) : menuProject.narrator;
  const z = (slug: string) => order.indexOf(slug) + 1;

  return (
    <div
      ref={rootRef}
      className="desk"
      role="region"
      aria-label={`${section.label} desk`}
      data-dragging={dragging || undefined}
      onPointerDown={onGlassPointerDown}
      onPointerMove={onGlassPointerMove}
      onPointerUp={onGlassPointerUp}
      onPointerCancel={onGlassPointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        if (projects.length) openMenuAt(e.clientX, e.clientY, null);
      }}
    >
      <p id="desk-help" className="desk-sr">
        Enter opens. Space selects. Shift F10 opens the menu. Arrow keys move between objects.
      </p>

      {placed.map((o) => {
          const { slug } = o.project;
          const c = centres.get(slug)!;
          const isSel = selected.includes(slug);
          return (
            <button
              key={slug}
              ref={(el) => {
                if (el) objRefs.current.set(slug, el);
                else objRefs.current.delete(slug);
              }}
              type="button"
              className="desk-obj"
              data-kind={o.project.kind}
              data-selected={isSel || undefined}
              aria-pressed={isSel}
              aria-label={`${o.project.title}, ${o.project.medium}`}
              aria-describedby="desk-help"
              style={{
                left: c.x - o.w / 2,
                top: c.y - o.h / 2,
                width: o.w,
                height: o.h + CAPTION,
                zIndex: z(slug),
              }}
              onPointerDown={(e) => onObjectPointerDown(e, slug)}
              onPointerMove={onObjectPointerMove}
              onPointerUp={(e) => endPress(e, false)}
              onPointerCancel={(e) => endPress(e, true)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                raise([slug]);
                openMenuAt(e.clientX, e.clientY, slug);
              }}
              onKeyDown={(e) => onObjectKeyDown(e, slug)}
            >
              <span
                className="desk-art"
                ref={(el) => {
                  if (el) artRefs.current.set(slug, el);
                  else artRefs.current.delete(slug);
                }}
                style={{ width: o.w, height: o.h, transform: `rotate(${o.rot.toFixed(2)}deg)` }}
              >
                <span
                  className="desk-lift"
                  ref={(el) => {
                    if (el) liftRefs.current.set(slug, el);
                    else liftRefs.current.delete(slug);
                  }}
                  style={{ filter: SHADOW_REST }}
                >
                  <DeskArt kind={o.project.kind} scale={scale} />
                </span>
              </span>
              <span className="desk-caption">{o.project.title}</span>
            </button>
          );
        })}

      {band && (
        <div className="desk-band" style={{ left: band.x, top: band.y, width: band.w, height: band.h }} aria-hidden="true" />
      )}

      {projects.length === 0 && <p className="desk-empty">{deskEmptyLine}</p>}

      {menu && (
        <div
          ref={menuRef}
          className="desk-menu"
          role="menu"
          aria-label={menuProject ? `${menuProject.title} menu` : "Desk menu"}
          style={{ left: menu.x, top: menu.y }}
          onKeyDown={onMenuKeyDown}
          onPointerDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {menuProject && (
            <>
              <p className="desk-menu-head">{menu.count > 1 ? `${menu.count} OBJECTS` : menuProject.title.toUpperCase()}</p>
              <button
                type="button"
                role="menuitem"
                className="desk-menu-item desk-menu-open"
                onClick={() => {
                  closeMenu();
                  onOpen(menuProject.slug);
                }}
              >
                <span className="desk-menu-en">OPEN</span>
                <span className="desk-menu-jp">オープン</span>
              </button>
            </>
          )}
          <button
            type="button"
            role="menuitem"
            className="desk-menu-item desk-menu-say"
            onClick={() => {
              say(menuLine);
              closeMenu(true);
            }}
          >
            {menuLine}
          </button>
        </div>
      )}
    </div>
  );
}
