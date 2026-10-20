"use client";

// Crossfader: the tape goes into a walkman (P3: the medium decides the transition).
// Beats, 12fps frames (F = 83ms):
//   F1      the tape lifts (its shadow grows); the camera springs in
//   F3-F4   the lid pops open in 2 frames (past vertical: we see its inside)
//   F5-F7   the tape drops into the well in 3 frames
//   F8-F9   the lid closes in 2 frames
//   F10     PLAY goes down (1 frame) and latches
//   F10-F19 the reels turn on a 6-frame cycle (10 deg a frame on a 6-tooth hub), then stop
// TapeFlip (used by the manual's SIDE switch) turns the tape over: eject 2 frames, flip on
// Y in 4 (scaleX 1, .5, -.5, -1, the label swapping at the edge), reinsert 3, PLAY 1.
import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";
import { isQuiet } from "@/lib/motion";
import { SPRING_UI } from "../motion/spring";
import { useCeremony } from "../motion/ceremony";
import { FRAME as F, stepTo } from "../motion/stepped";
import type { DeviceProps, Side } from "../types";
import { LID_HINGE, TAPE_CENTER, WALKMAN_VIEW, WalkmanArt } from "./art/WalkmanArt";
import { DEVICE_CLOSING_DESCRIPTIONS, DEVICE_DESCRIPTIONS } from "./descriptions";
import { Stage, snap, useStageSize } from "./Stage";
import s from "./devices.module.css";

const ORIGIN = `${TAPE_CENTER.x} ${TAPE_CENTER.y}`;
type Q = (sel: string) => Element[];

function parts(q: Q) {
  const [held] = q("[data-p=held]");
  return {
    held,
    sh0: held?.getAttribute("data-sh0") ?? "",
    sh1: held?.getAttribute("data-sh1") ?? "",
    seat: q("[data-p=seat]"),
    lid: q("[data-p=lid]"),
    lidOut: q("[data-p=lid-out]"),
    lidIn: q("[data-p=lid-in]"),
    play: q("[data-p=key-play]"),
    reels: q("[data-p=seat-reel]"),
    face: (copy: "held" | "seat", f: "A" | "B" | "Am" | "Bm") => q(`[data-p=${copy}-${f}]`),
  };
}

/** Show exactly one face on a cassette copy */
function faceVars(p: ReturnType<typeof parts>, copy: "held" | "seat", on: "A" | "B" | "Am" | "Bm") {
  return (["A", "B", "Am", "Bm"] as const).map((f) => [p.face(copy, f), { visibility: f === on ? "inherit" : "hidden" }] as const);
}

function setFace(tl: gsap.core.Timeline | null, p: ReturnType<typeof parts>, copy: "held" | "seat", on: "A" | "B" | "Am" | "Bm", at = 0) {
  for (const [els, vars] of faceVars(p, copy, on)) {
    if (tl) tl.set(els, vars, at);
    else gsap.set(els, vars);
  }
}

export function CrossfaderDevice(props: DeviceProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const size = useStageSize(stageRef);
  const v = WALKMAN_VIEW;
  const w = size ? Math.min(size.w * 0.9, ((size.h * 0.84) / v.h) * v.w) : 0;
  const h = (w / v.w) * v.h;

  useCeremony(
    stageRef,
    props,
    (tl, { q }) => {
      const [cam] = q("[data-p=cam]");
      const p = parts(q);
      gsap.set(cam, { xPercent: -7, yPercent: -5, scale: 0.88, transformOrigin: "50% 50%" });
      gsap.set(p.held, { visibility: "visible", x: -34, y: -78, scale: 1.16, svgOrigin: ORIGIN, attr: { filter: p.sh0 } });
      gsap.set(p.seat, { visibility: "hidden" });
      gsap.set(p.lid, { scaleY: 1, svgOrigin: LID_HINGE });
      gsap.set(p.play, { y: 0 });
      setFace(null, p, "held", "A");
      setFace(null, p, "seat", "A");
      p.reels.forEach((r) => gsap.set(r, { rotation: 0, transformOrigin: "50% 50%" }));

      // F1: lift, camera
      tl.set(p.held, { scale: 1.2, attr: { filter: p.sh1 } }, F);
      tl.to(cam, { xPercent: 0, yPercent: 0, scale: 1, duration: SPRING_UI.duration, ease: SPRING_UI.ease }, F);
      // F3-F4: lid pops open
      tl.set(p.lid, { scaleY: 0.42 }, 3 * F);
      tl.set(p.lid, { scaleY: -0.32 }, 4 * F);
      tl.set(p.lidOut, { visibility: "hidden" }, 4 * F);
      tl.set(p.lidIn, { visibility: "visible" }, 4 * F);
      // F5-F7: the tape drops in
      tl.set(p.held, { x: -22, y: -50, scale: 1.12 }, 5 * F);
      tl.set(p.held, { x: -10, y: -22, scale: 1.05, attr: { filter: p.sh0 } }, 6 * F);
      tl.set(p.held, { visibility: "hidden" }, 7 * F);
      tl.set(p.seat, { visibility: "visible" }, 7 * F);
      // F8-F9: lid closes
      tl.set(p.lid, { scaleY: 0.42 }, 8 * F);
      tl.set(p.lidIn, { visibility: "hidden" }, 8 * F);
      tl.set(p.lidOut, { visibility: "visible" }, 8 * F);
      tl.set(p.lid, { scaleY: 1 }, 9 * F);
      // F10: PLAY, then the reels
      tl.set(p.play, { y: 10 }, 10 * F);
      p.reels.forEach((r) => tl.add(stepTo(r, { rotation: 90 }, 9), 10 * F));
      tl.set({}, {}, 20 * F);
    },
    !!size,
  );

  const label = (props.reverse ? DEVICE_CLOSING_DESCRIPTIONS : DEVICE_DESCRIPTIONS)[props.id];
  return (
    <Stage ref={stageRef} label={label}>
      {size && (
        <div data-p="cam" className={s.scene} style={{ width: w, height: h, left: snap((size.w - w) / 2, size.dpr), top: snap((size.h - h) / 2, size.dpr) }}>
          <WalkmanArt side="A" />
        </div>
      )}
    </Stage>
  );
}

export interface TapeFlipProps {
  /** The side that should be playing. Changing it plays the flip from the previous side. */
  side: Side;
  /** Optional: on mount, flip from this side to `side` straight away */
  from?: Side;
  /** Called once per flip, on the PLAY frame (swap the manual body here) */
  onDone(): void;
  className?: string;
}

/**
 * The A/B flip, as a self-contained walkman that fills its container's width
 * (aspect 380:370). Stepped at 12fps, never a fade; QUIET is a hard cut (onDone on the
 * next frame). It does not emit story events: the caller emits { type: "flip" }.
 */
export function TapeFlip({ side, from, onDone, className }: TapeFlipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef<Side>(from ?? side);
  const onDoneRef = useRef(onDone);
  useLayoutEffect(() => {
    onDoneRef.current = onDone;
  });

  useLayoutEffect(() => {
    const a = prev.current;
    const b = side;
    prev.current = side;
    if (a === b || !ref.current) return;
    let raf = 0;
    let completed = false;
    const done = () => {
      completed = true;
      onDoneRef.current();
    };
    const ctx = gsap.context((self) => {
      const q = (sel: string) => (self.selector ? (self.selector(sel) as Element[]) : []);
      const p = parts(q);
      // start from the old side, at rest
      gsap.set(p.held, { visibility: "hidden", x: 0, y: 0, scaleX: 1, scaleY: 1, svgOrigin: ORIGIN, attr: { filter: p.sh0 } });
      gsap.set(p.seat, { visibility: "visible" });
      gsap.set(p.lid, { scaleY: 1, svgOrigin: LID_HINGE });
      gsap.set(p.lidIn, { visibility: "hidden" });
      gsap.set(p.lidOut, { visibility: "visible" });
      gsap.set(p.play, { y: 10 });
      setFace(null, p, "seat", a);
      setFace(null, p, "held", a);
      if (isQuiet()) {
        setFace(null, p, "seat", b);
        setFace(null, p, "held", b);
        raf = requestAnimationFrame(done);
        return;
      }
      const tl = gsap.timeline({ onComplete: done });
      // eject: lid pops and PLAY releases, then the tape comes up out of the well
      tl.set(p.lid, { scaleY: 0.42 }, 0);
      tl.set(p.play, { y: 0 }, 0);
      tl.set(p.lid, { scaleY: -0.32 }, F);
      tl.set(p.lidOut, { visibility: "hidden" }, F);
      tl.set(p.lidIn, { visibility: "visible" }, F);
      tl.set(p.seat, { visibility: "hidden" }, F);
      tl.set(p.held, { visibility: "visible", y: -18, scaleX: 1.08, scaleY: 1.08, attr: { filter: p.sh1 } }, F);
      // flip on Y: 1 (held at F), .5, -.5 (the other label), -1
      tl.set(p.held, { scaleX: 0.54 }, 2 * F);
      tl.set(p.held, { scaleX: -0.54 }, 3 * F);
      setFace(tl, p, "held", `${b}m`, 3 * F);
      tl.set(p.held, { scaleX: -1.08 }, 4 * F);
      // reinsert: down, seated, lid shut
      tl.set(p.held, { scaleX: 1.04, scaleY: 1.04, y: -8, attr: { filter: p.sh0 } }, 5 * F);
      setFace(tl, p, "held", b, 5 * F);
      setFace(tl, p, "seat", b, 6 * F);
      tl.set(p.held, { visibility: "hidden" }, 6 * F);
      tl.set(p.seat, { visibility: "visible" }, 6 * F);
      tl.set(p.lid, { scaleY: 0.42 }, 6 * F);
      tl.set(p.lidIn, { visibility: "hidden" }, 6 * F);
      tl.set(p.lidOut, { visibility: "visible" }, 6 * F);
      tl.set(p.lid, { scaleY: 1 }, 7 * F);
      // PLAY
      tl.set(p.play, { y: 10 }, 8 * F);
    }, ref);
    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
      // an interrupted flip never happened (also keeps StrictMode's re-run honest)
      if (!completed) prev.current = a;
    };
  }, [side]);

  return (
    <div ref={ref} className={`${s.flip} ${className ?? ""}`} aria-hidden="true">
      <WalkmanArt side={side} />
    </div>
  );
}
