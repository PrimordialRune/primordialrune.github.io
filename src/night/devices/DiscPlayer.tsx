"use client";

// Haunt Record: the disc you clicked goes into the deck (P3).
// Beats, 12fps frames (F = 83ms):
//   F0-F2    the disc leaves its place on the mat (FLIP from the desk rect) and the camera
//            spring carries it over the deck's open tray; the beats below run 2F later
//   F1       the disc lifts (its shadow grows); the camera springs in
//   F1-F3    the tray steps out
//   F4-F6    the disc steps down onto the tray and seats
//   F7-F9    the tray steps in, carrying the disc under the window (the camera follows it
//            up onto the deck); the display lights
//   F10-F17  spin-up: 8 steps of the specular glints, 45 degrees each
// The booklet is the manual itself (the shell's spring).
import gsap from "gsap";
import { useRef } from "react";
import { SPRING_UI } from "../motion/spring";
import { useCeremony } from "../motion/ceremony";
import { FRAME as F, stepTo } from "../motion/stepped";
import type { DeviceProps } from "../types";
import { DISC_R, DISC_VIEW, DiscScene, TRAY_SEAT, TRAY_TRAVEL } from "./art/DiscArt";
import { DEVICE_CLOSING_DESCRIPTIONS, DEVICE_DESCRIPTIONS } from "./descriptions";
import { deskPose, flipFromDesk, FLIP_REST } from "./flip";
import { layoutKey, Stage, snap, useStageSize } from "./Stage";
import s from "./devices.module.css";

const TRAVEL = 2 * F;
/** the held disc's pose over the seat at the start (lifted) */
const HELD_SCALE = 1.1;

export function HauntRecordDevice(props: DeviceProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const size = useStageSize(stageRef);
  const v = DISC_VIEW;
  const w = size ? Math.min(size.w * 0.94, ((size.h * 0.86) / v.h) * v.w) : 0;
  const h = (w / v.w) * v.h;

  useCeremony(
    stageRef,
    props,
    (tl, { q }) => {
      const [cam] = q("[data-p=cam]");
      const [held] = q("[data-p=held]");
      const [fly] = q("[data-p=fly]");
      const [box] = q("[data-p=box]");
      const disc = q("[data-p=disc]");
      const tray = q("[data-p=tray]");
      const wedge = q("[data-p=wedge]");
      const lit = q("[data-p=lit]");
      const led = q("[data-p=led]");
      const sh0 = held?.getAttribute("data-sh0") ?? "";
      const sh1 = held?.getAttribute("data-sh1") ?? "";
      const seat = `${TRAY_SEAT.x} ${TRAY_SEAT.y}`;

      gsap.set(cam, { xPercent: 6, yPercent: 5, scale: 0.9, transformOrigin: "60% 70%" });
      gsap.set(fly, { ...FLIP_REST, svgOrigin: seat });
      gsap.set(held, { visibility: "visible", x: TRAY_SEAT.x, y: TRAY_SEAT.y, scale: HELD_SCALE, svgOrigin: seat, attr: { filter: sh0 } });
      gsap.set(disc, { visibility: "hidden", x: TRAY_SEAT.x, y: TRAY_SEAT.y - TRAY_TRAVEL });
      gsap.set(tray, { y: -TRAY_TRAVEL });
      gsap.set(wedge, { rotation: 0, transformOrigin: "50% 50%" });
      gsap.set(lit, { visibility: "hidden" });
      gsap.set(led, { attr: { fill: "#3a3a46" } });
      // the very disc from the mat, measured in this start pose before any beat renders
      const flip = flipFromDesk(deskPose(props.id), box, DISC_R * 2 * HELD_SCALE);

      // F1: lift, camera
      tl.set(held, { scale: HELD_SCALE + 0.04, attr: { filter: sh1 } }, F);
      tl.to(cam, { xPercent: 0, yPercent: 0, scale: 1, duration: SPRING_UI.duration, ease: SPRING_UI.ease }, F);
      // F1-F3: tray out
      [-110, -55, 0].forEach((y, i) => tl.set(tray, { y }, (1 + i) * F));
      // F4-F6: down onto the tray; on F6 it is the tray's disc
      tl.set(held, { scale: 1.07 }, 4 * F);
      tl.set(held, { scale: 1.03, attr: { filter: sh0 } }, 5 * F);
      tl.set(held, { visibility: "hidden" }, 6 * F);
      tl.set(disc, { visibility: "visible", y: TRAY_SEAT.y }, 6 * F);
      // F7-F9: tray in, with the disc on it
      [1, 2, 3].forEach((n) => {
        tl.set(tray, { y: (-TRAY_TRAVEL * n) / 3 }, (6 + n) * F);
        tl.set(disc, { y: TRAY_SEAT.y - (TRAY_TRAVEL * n) / 3 }, (6 + n) * F);
      });
      // F7: with the tray going in, the camera follows up onto the deck (the lower half of
      // the scene is empty once the tray is shut)
      tl.to(cam, { xPercent: -1.6, yPercent: 26.6, scale: 1, duration: SPRING_UI.duration, ease: SPRING_UI.ease }, 7 * F);
      tl.set(lit, { visibility: "visible" }, 9 * F);
      tl.set(led, { attr: { fill: "#48a9a6" } }, 9 * F);
      // F10-F17: spin-up
      tl.add(stepTo(wedge, { rotation: 360 }, 8), 9 * F);
      tl.set({}, {}, 18 * F);

      if (flip) {
        tl.shiftChildren(TRAVEL, true);
        gsap.set(held, { attr: { filter: sh1 } });
        tl.fromTo(fly, flip, { ...FLIP_REST, duration: SPRING_UI.duration, ease: SPRING_UI.ease, immediateRender: true }, 0);
      }
    },
    layoutKey(size),
  );

  const label = (props.reverse ? DEVICE_CLOSING_DESCRIPTIONS : DEVICE_DESCRIPTIONS)[props.id];
  return (
    <Stage ref={stageRef} label={label}>
      {size && (
        <div data-p="cam" className={s.scene} style={{ width: w, height: h, left: snap((size.w - w) / 2, size.dpr), top: snap((size.h - h) / 2, size.dpr) }}>
          <DiscScene />
        </div>
      )}
    </Stage>
  );
}
