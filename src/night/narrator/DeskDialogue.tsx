"use client";
// Stage 3: the AI has left the CRT and talks from the mat. The box is pinned to a clear
// spot: as close to the dark Trinitron as it can be without covering any object, the card,
// the notebook or the set itself (measured from the [data-spot] elements and the screen).
// It only moves when the layout changes or something comes to sit under it. It glitches
// out of the tube once (<=250ms), then moves on a spring.
// The box steps away a few seconds after a line ends; the next line brings it back.
// Screen readers hear the line from NarratorScreen's aria-live region, not from here.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { isQuiet, springEase } from "@/lib/motion";
import { crtElement } from "./dom";
import { glitch } from "./glitch";
import { NAME_TAG_LABELS } from "./lines";
import { LineText, NarratorLogo, PixelText } from "./Speaker";
import { usePoweredOff, useStory } from "./story";
import { useLine } from "./useLine";
import styles from "./deskDialogue.module.css";

const MARGIN = 16;
/** clearance kept around every object */
const PAD = 12;
const STEP = 8;
const LINGER_MS = 6000;
const SPRING = springEase(170, 22);

interface Box {
  l: number;
  t: number;
  r: number;
  b: number;
}

const toBox = (r: DOMRect, pad = 0): Box => ({ l: r.left - pad, t: r.top - pad, r: r.right + pad, b: r.bottom + pad });

function overlap(a: Box, b: Box) {
  const w = Math.min(a.r, b.r) - Math.max(a.l, b.l);
  const h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
  return w > 0 && h > 0 ? w * h : 0;
}

/** What the box must not cover: every object on the mat, and the dark set it came out of */
function obstacles(): Box[] {
  const out: Box[] = [];
  document.querySelectorAll<HTMLElement>("[data-spot]").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width && r.height) out.push(toBox(r, PAD));
  });
  const set = crtElement();
  if (set) out.push(toBox(set.getBoundingClientRect(), PAD));
  return out;
}

/** Below the top bar (the chrome's header), whatever its height on this screen */
function topLimit() {
  const header = document.querySelector("header");
  return Math.round((header?.getBoundingClientRect().bottom ?? 56) + MARGIN);
}

/** The free spot nearest the dark Trinitron (or the last-touched object), on the 8px grid */
function place(w: number, h: number, near: DOMRect | null) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const obs = obstacles();
  const screen = crtElement()?.getBoundingClientRect() ?? near;
  const tx = screen ? screen.left + screen.width / 2 : MARGIN;
  const ty = screen ? screen.bottom : vh;
  const top = topLimit();
  let best = { x: MARGIN, y: Math.max(top, vh - h - MARGIN), cost: Infinity };
  for (let y = top; y + h <= vh - MARGIN; y += STEP) {
    for (let x = MARGIN; x + w <= vw - MARGIN; x += STEP) {
      const box = { l: x, t: y, r: x + w, b: y + h };
      let covered = 0;
      for (const o of obs) covered += overlap(box, o);
      const dist = Math.hypot(x + w / 2 - tx, y - ty);
      // covering anything costs far more than distance
      const cost = covered * 1000 + dist;
      if (cost < best.cost) best = { x, y, cost };
    }
  }
  return { x: best.x, y: best.y, clear: best.cost < 1000 };
}

/** No clear spot (a phone: the objects fill the width): dock on the dead set's glass, which stays put */
function dock(w: number, h: number) {
  const set = crtElement()?.getBoundingClientRect();
  if (!set) return null;
  return {
    x: Math.round(set.left + (set.width - w) / 2),
    y: Math.round(Math.max(topLimit() - MARGIN, set.top + (set.height - h) / 2)),
  };
}

/** Whether something on the mat now sits under the box (the page scrolled, or it moved) */
function isCovering(el: HTMLElement) {
  const box = toBox(el.getBoundingClientRect());
  return obstacles().some((o) => overlap(box, o) > 0);
}

export default function DeskDialogue({ anchor }: { anchor: DOMRect | null }) {
  const story = useStory();
  const off = usePoweredOff();
  const play = useLine(story);
  const ref = useRef<HTMLButtonElement>(null);
  const placed = useRef(false);
  const shownBefore = useRef(false);
  const [restedId, setRestedId] = useState(-1);
  const [viewport, setViewport] = useState(0);

  const visible = Boolean(story.line) && !off && !story.inCrt && restedId !== story.lineId;

  // The box steps away once the line has had its time
  useEffect(() => {
    if (!visible || play.typing || play.more) return;
    const id = story.lineId;
    const t = setTimeout(() => setRestedId(id), LINGER_MS);
    return () => clearTimeout(t);
  }, [visible, play.typing, play.more, story.lineId]);

  useEffect(() => {
    const onResize = () => setViewport((v) => v + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // On a phone the desk scrolls: move only if the box ends up over an object
  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (ref.current && isCovering(ref.current)) setViewport((v) => v + 1);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, [visible]);

  // Pin to a clear spot; move on a spring when the layout changes
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !visible) return;
    // measured in its full shape first; docked, it is a shorter row (set on the DOM, not in state)
    delete el.dataset.docked;
    const spot = place(el.offsetWidth, el.offsetHeight, anchor);
    let { x, y } = spot;
    if (!spot.clear) {
      el.dataset.docked = "1";
      const d = dock(el.offsetWidth, el.offsetHeight);
      if (d) ({ x, y } = d);
      else delete el.dataset.docked;
    }
    if (!placed.current || isQuiet()) {
      gsap.set(el, { x, y });
      placed.current = true;
      return;
    }
    const tween = gsap.to(el, { x, y, duration: SPRING.duration, ease: SPRING.ease, overwrite: "auto" });
    return () => {
      tween.kill();
    };
  }, [anchor, visible, play.chunk, viewport]);

  // In and out: a glitch the first time it leaves the tube, springs after that
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // a fade-out still running must not win over the line that just arrived
    gsap.killTweensOf(el, "opacity,scale");
    if (isQuiet()) {
      gsap.set(el, { opacity: visible ? 1 : 0, scale: 1 });
      return;
    }
    if (visible) {
      if (!shownBefore.current) {
        shownBefore.current = true;
        gsap.set(el, { opacity: 1, scale: 1 });
        glitch(el, 250);
      } else {
        gsap.fromTo(el, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: SPRING.duration, ease: SPRING.ease });
      }
    } else {
      gsap.to(el, { opacity: 0, scale: 0.96, duration: 0.18, ease: "power2.in" });
    }
  }, [visible]);

  if (story.inCrt) return null;

  return (
    <button
      ref={ref}
      type="button"
      className={styles.box}
      data-visible={visible ? "1" : undefined}
      aria-hidden={visible ? undefined : true}
      tabIndex={visible ? 0 : -1}
      onClick={play.skip}
      aria-label={play.typing ? "Show the whole line" : play.more ? "Next line" : "Narrator"}
    >
      <span className={styles.head}>
        <span className={styles.logo}>
          <NarratorLogo inner={story.inner} />
        </span>
        <span className={styles.tag} role="img" aria-label={NAME_TAG_LABELS[story.stage]}>
          <span aria-hidden="true">
                <PixelText text={story.nameTag} />
              </span>
        </span>
      </span>
      <span className={styles.line}>
        <LineText chunk={play.chunk} shown={play.shown} machine={story.voice === "machine"} />
      </span>
      {play.more && !play.typing && (
        <span className={styles.more} aria-hidden="true">
          <PixelText text="▼" />
        </span>
      )}
    </button>
  );
}
