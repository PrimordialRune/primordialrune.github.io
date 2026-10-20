"use client";

// Haunt Record: the jewel case opens and the disc goes into the deck (P3).
// Beats, 12fps frames (F = 83ms):
//   F1-F4    the case hinge opens in 4 perspective frames (past vertical: the inside)
//   F5-F6    the disc lifts off the rosette (2 frames); the tray steps out (F5-F7)
//   F7-F9    the disc steps over to the tray and seats
//   F10-F12  the tray steps in, carrying the disc under the window; the display lights
//   F13-F20  spin-up: 8 steps of the specular wedge, 45 degrees each
// The booklet sliding out of the lid is the manual itself (the shell's spring).
import gsap from "gsap";
import { useRef } from "react";
import { SPRING_UI } from "../motion/spring";
import { useCeremony } from "../motion/ceremony";
import { FRAME as F, stepTo } from "../motion/stepped";
import type { DeviceProps } from "../types";
import { CASE_HINGE, DISC_HOME, DISC_VIEW, DiscScene, TRAY_SEAT, TRAY_TRAVEL } from "./art/DiscArt";
import { DEVICE_CLOSING_DESCRIPTIONS, DEVICE_DESCRIPTIONS } from "./descriptions";
import { Stage, snap, useStageSize } from "./Stage";
import s from "./devices.module.css";

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
      const [disc] = q("[data-p=disc]");
      const tray = q("[data-p=tray]");
      const lid = q("[data-p=lid]");
      const lidOut = q("[data-p=lid-out]");
      const lidIn = q("[data-p=lid-in]");
      const wedge = q("[data-p=wedge]");
      const lit = q("[data-p=lit]");
      const led = q("[data-p=led]");
      const sh0 = disc?.getAttribute("data-sh0") ?? "";
      const sh1 = disc?.getAttribute("data-sh1") ?? "";

      gsap.set(cam, { xPercent: 6, yPercent: 5, scale: 0.9, transformOrigin: "30% 70%" });
      gsap.set(lid, { scaleX: 1, svgOrigin: CASE_HINGE });
      gsap.set(lidIn, { visibility: "hidden" });
      gsap.set(lidOut, { visibility: "visible" });
      gsap.set(disc, { x: DISC_HOME.x, y: DISC_HOME.y, scale: 1, attr: { filter: sh0 } });
      gsap.set(tray, { y: -TRAY_TRAVEL });
      gsap.set(wedge, { rotation: 0, svgOrigin: "0 0" });
      gsap.set(lit, { visibility: "hidden" });
      gsap.set(led, { attr: { fill: "#3a3a46" } });

      tl.to(cam, { xPercent: 0, yPercent: 0, scale: 1, duration: SPRING_UI.duration, ease: SPRING_UI.ease }, F);
      // F1-F4: the hinge
      tl.set(lid, { scaleX: 0.62 }, F);
      tl.set(lid, { scaleX: 0.22 }, 2 * F);
      tl.set(lid, { scaleX: -0.2 }, 3 * F);
      tl.set(lidOut, { visibility: "hidden" }, 3 * F);
      tl.set(lidIn, { visibility: "visible" }, 3 * F);
      tl.set(lid, { scaleX: -0.6 }, 4 * F);
      // F5-F6: lift; F5-F7: tray out
      tl.set(disc, { scale: 1.05, attr: { filter: sh1 } }, 5 * F);
      tl.set(disc, { scale: 1.1 }, 6 * F);
      [-110, -55, 0].forEach((y, i) => tl.set(tray, { y }, (5 + i) * F));
      // F7-F9: over to the tray and seat
      const path = [1 / 3, 2 / 3, 1];
      path.forEach((t, i) => {
        tl.set(
          disc,
          {
            x: DISC_HOME.x + (TRAY_SEAT.x - DISC_HOME.x) * t,
            y: DISC_HOME.y + (TRAY_SEAT.y - DISC_HOME.y) * t - (i === 0 ? 10 : i === 1 ? 6 : 0),
            scale: [1.08, 1.05, 1][i],
            attr: { filter: i === 2 ? sh0 : sh1 },
          },
          (7 + i) * F,
        );
      });
      // F10-F12: tray in, with the disc on it
      [1, 2, 3].forEach((n) => {
        tl.set(tray, { y: (-TRAY_TRAVEL * n) / 3 }, (9 + n) * F);
        tl.set(disc, { y: TRAY_SEAT.y - (TRAY_TRAVEL * n) / 3 }, (9 + n) * F);
      });
      tl.set(lit, { visibility: "visible" }, 12 * F);
      tl.set(led, { attr: { fill: "#48a9a6" } }, 12 * F);
      // F13-F20: spin-up
      tl.add(stepTo(wedge, { rotation: 360 }, 8), 12 * F);
      tl.set({}, {}, 21 * F);
    },
    !!size,
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
