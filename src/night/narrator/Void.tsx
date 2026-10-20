"use client";
// The corrupted file: a glimpse of later. The desk is gone (objects, card, the CRT's
// light); only the empty mat remains, with clean footprints in the dust where each object
// used to sit and the Trinitron cold and dead. One pixel line in the centre, at 3x: "* this
// is later." After 2.6s, or any click or key, a 200ms glitch brings the desk back, and the
// narrator says it shouldn't have happened. QUIET: hard cuts both ways.
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { emitStory, onStory } from "../bus";
import { glitch } from "./glitch";
import { crtElement } from "./dom";
import { BEATS, cleanLine } from "./lines";
import { PixelText } from "./Speaker";
import styles from "./void.module.css";

const BEAT_MS = 700;
const STAY_MS = 2600;

interface Footprint {
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  /** the object's own art, copied at the moment it vanished: its silhouette is the clean spot */
  art?: string;
}

// The shell hides the desk when the void opens, so the footprints are measured at the
// moment of the corrupt event, while the objects are still on the mat. This listener goes up
// when the module loads, before the shell's own, so it always sees the full desk.
let footprints: Footprint[] = [];
let crt: Footprint | null = null;

function measure(el: HTMLElement): Footprint {
  const r = el.getBoundingClientRect();
  const w = el.offsetWidth || r.width;
  const h = el.offsetHeight || r.height;
  const rot = parseFloat(getComputedStyle(el).getPropertyValue("--rot")) || 0;
  return { x: r.left + r.width / 2 - w / 2, y: r.top + r.height / 2 - h / 2, w, h, rot };
}

function capture() {
  footprints = [];
  document.querySelectorAll<HTMLElement>("[data-spot]").forEach((spot) => {
    // a project or the notebook: the object's art is the button's first child; the card is the spot itself
    const art = spot.tagName === "BUTTON" && spot.firstElementChild instanceof HTMLElement ? spot.firstElementChild : null;
    const f = measure(art ?? spot);
    // the art rotates itself (var(--rot)); the copy keeps that, so the slot itself stays square
    if (art) f.art = art.outerHTML;
    if (f.w > 0 && f.h > 0) footprints.push(f);
  });
  crt = null;
  const set = crtElement();
  if (set) {
    const f = measure(set);
    if (f.w > 0) crt = f;
  }
}

if (typeof window !== "undefined") {
  onStory((ev) => {
    if (ev.type === "corrupt") capture();
  });
}

const placeStyle = (f: Footprint, rotate = true): CSSProperties =>
  ({
    left: Math.round(f.x),
    top: Math.round(f.y),
    width: Math.round(f.w),
    height: Math.round(f.h),
    transform: rotate && f.rot ? `rotate(${f.rot}deg)` : undefined,
    "--rot": `${f.rot}deg`,
  }) as CSSProperties;

export default function Void({ onExit }: { onExit(): void }) {
  const ref = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);
  const [lineOn, setLineOn] = useState(false);
  const [prints] = useState(() => ({ objects: footprints, crt }));

  const exit = useCallback(async () => {
    if (leaving.current) return;
    leaving.current = true;
    await glitch(ref.current, 200);
    emitStory({ type: "void-exit" });
    onExit();
  }, [onExit]);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    const show = setTimeout(() => setLineOn(true), BEAT_MS);
    const leave = setTimeout(exit, BEAT_MS + STAY_MS);
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      exit();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(show);
      clearTimeout(leave);
      window.removeEventListener("keydown", onKey);
    };
  }, [exit]);

  return (
    <div
      ref={ref}
      className={styles.void}
      role="dialog"
      aria-modal="true"
      aria-label="The desk is empty. Press any key to return."
      tabIndex={-1}
      onClick={exit}
    >
      <div className={styles.dust} aria-hidden="true" />
      {prints.objects.map((f, i) =>
        f.art ? (
          <span
            key={i}
            className={styles.silhouette}
            style={placeStyle(f, false)}
            aria-hidden="true"
            inert
            dangerouslySetInnerHTML={{ __html: f.art }}
          />
        ) : (
          <span key={i} className={styles.print} style={placeStyle(f)} aria-hidden="true" />
        )
      )}
      {prints.crt && (
        <span className={styles.deadCrt} style={placeStyle(prints.crt)} aria-hidden="true">
          <span className={styles.deadGlass} />
        </span>
      )}
      <p className={styles.line} data-on={lineOn ? "1" : undefined} aria-hidden="true">
        <PixelText text={BEATS.voidLine} />
      </p>
      <p className={styles.srOnly} aria-live="polite">
        {lineOn ? cleanLine(BEATS.voidLine) : ""}
      </p>
    </div>
  );
}
