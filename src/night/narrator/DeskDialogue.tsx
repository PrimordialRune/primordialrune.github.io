"use client";
// Stage 3: the AI has left the CRT and talks from the mat, beside whatever the visitor
// last touched. It glitches out of the tube once (<=250ms), then moves on a spring.
// The box steps away a few seconds after a line ends; the next line brings it back.
// Screen readers hear the line from NarratorScreen's aria-live region, not from here.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { isQuiet, springEase } from "@/lib/motion";
import { glitch } from "./glitch";
import { NAME_TAG_LABELS } from "./lines";
import { LineText, NarratorLogo } from "./Speaker";
import { usePoweredOff, useStory } from "./story";
import { useLine } from "./useLine";
import styles from "./deskDialogue.module.css";

const MARGIN = 16;
const GAP = 12;
const TOP_BAR = 64;
const LINGER_MS = 6000;
const SPRING = springEase(170, 22);

function place(anchor: DOMRect | null, w: number, h: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!anchor) return { x: (vw - w) / 2, y: vh - h - 24 };
  let y = anchor.top - h - GAP;
  if (y < TOP_BAR) y = anchor.bottom + GAP;
  if (y + h > vh - MARGIN) y = vh - h - MARGIN;
  const x = anchor.left + anchor.width / 2 - w / 2;
  return {
    x: Math.round(Math.min(Math.max(MARGIN, x), vw - w - MARGIN)),
    y: Math.round(Math.max(TOP_BAR, y)),
  };
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

  // Follow the anchor, on a spring
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !visible) return;
    const { x, y } = place(anchor, el.offsetWidth, el.offsetHeight);
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
          <span aria-hidden="true">{story.nameTag}</span>
        </span>
      </span>
      <span className={styles.line}>
        <LineText chunk={play.chunk} shown={play.shown} machine={story.voice === "machine"} />
      </span>
      {play.more && !play.typing && (
        <span className={styles.more} aria-hidden="true">
          ▼
        </span>
      )}
    </button>
  );
}
