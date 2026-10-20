"use client";

// PTCG Cube: the booster tears and the cards are dealt onto the playmat (P3: boosters tear).
// Beats, 12fps frames (F = 83ms):
//   F1       the pack lifts (shadow grows); the camera springs in
//   F2-F5    the tear strip rips across the top, a quarter per frame, then flies off
//   F5-F7    the playmat steps up under the pack; the pack settles onto it
//   F8-      five cards, 60ms apart, each in 3 frames: out of the pack, beside it, onto
//            its bench slot (the five slots printed on the real playmat)
// The rulebook (the manual) is the shell's spring after onReady.
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { emitStory } from "../bus";
import { SPRING_UI } from "../motion/spring";
import { useCeremony } from "../motion/ceremony";
import { FRAME as F } from "../motion/stepped";
import type { DeviceProps } from "../types";
import { BENCH, BOOSTER_VIEW, BoosterScene, PACK } from "./art/BoosterArt";
import { DEVICE_CLOSING_DESCRIPTIONS, DEVICE_DESCRIPTIONS } from "./descriptions";
import { Stage, snap, useStageSize } from "./Stage";
import s from "./devices.module.css";

export function PtcgCubeDevice(props: DeviceProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const size = useStageSize(stageRef);
  const v = BOOSTER_VIEW;
  const w = size ? Math.min(size.w * 0.96, ((size.h * 0.86) / v.h) * v.w) : 0;
  const h = (w / v.w) * v.h;

  useEffect(() => {
    if (!props.reverse) emitStory({ type: "tear", id: "ptcg-cube" });
  }, [props.reverse]);

  useCeremony(
    stageRef,
    props,
    (tl, { q }) => {
      const [cam] = q("[data-p=cam]");
      const [pack] = q("[data-p=pack]");
      const mat = q("[data-p=mat]");
      const cards = q("[data-p=card]");
      const rots = q("[data-p=card-rot]");
      const strips = [0, 1, 2, 3, 4].map((k) => q(`[data-p=strip-${k}]`));
      const sh0 = pack?.getAttribute("data-sh0") ?? "";
      const sh1 = pack?.getAttribute("data-sh1") ?? "";
      const origin = `${PACK.cx} ${PACK.cy}`;

      gsap.set(cam, { xPercent: -4, yPercent: -6, scale: 0.9, transformOrigin: "50% 40%" });
      gsap.set(pack, { scale: 1.12, svgOrigin: origin, attr: { filter: sh0 } });
      gsap.set(mat, { y: 420 });
      strips.forEach((el, k) => gsap.set(el, { visibility: k === 0 ? "visible" : "hidden" }));
      cards.forEach((c) => gsap.set(c, { x: PACK.cx, y: 110, visibility: "hidden" }));
      rots.forEach((r) => gsap.set(r, { rotation: 0, svgOrigin: "0 0" }));

      tl.set(pack, { scale: 1.16, attr: { filter: sh1 } }, F);
      tl.to(cam, { xPercent: 0, yPercent: 0, scale: 1, duration: SPRING_UI.duration, ease: SPRING_UI.ease }, F);
      // F2-F5: the tear
      for (let k = 1; k <= 4; k++) {
        tl.set(strips[k - 1], { visibility: "hidden" }, (1 + k) * F);
        tl.set(strips[k], { visibility: "visible" }, (1 + k) * F);
      }
      // F5-F7: the mat steps up under it, the pack lands on it
      [250, 110, 0].forEach((y, i) => tl.set(mat, { y }, (5 + i) * F));
      tl.set(pack, { scale: 1.06 }, 6 * F);
      tl.set(pack, { scale: 1, attr: { filter: sh0 } }, 7 * F);
      // F8-: deal, 60ms apart, 3 frames each
      cards.forEach((c, i) => {
        const b = BENCH[i];
        const r = rots[i];
        const at = 8 * F + i * 0.06;
        const left = i <= 2;
        tl.set(c, { visibility: "visible", x: PACK.cx + (i - 2) * 9, y: -6 }, at);
        tl.set(r, { rotation: (i - 2) * 7 }, at);
        tl.set(c, { x: left ? 228 - (2 - i) * 34 : 412 + (i - 3) * 34, y: 150 + Math.abs(i - 2) * 22 }, at + F);
        tl.set(r, { rotation: left ? -14 : 14 }, at + F);
        tl.set(c, { x: b.x, y: b.y }, at + 2 * F);
        tl.set(r, { rotation: b.r }, at + 2 * F);
      });
      tl.set({}, {}, 8 * F + 4 * 0.06 + 3 * F);
    },
    !!size,
  );

  const label = (props.reverse ? DEVICE_CLOSING_DESCRIPTIONS : DEVICE_DESCRIPTIONS)[props.id];
  return (
    <Stage ref={stageRef} label={label}>
      {size && (
        <div data-p="cam" className={s.scene} style={{ width: w, height: h, left: snap((size.w - w) / 2, size.dpr), top: snap((size.h - h) / 2, size.dpr) }}>
          <BoosterScene />
        </div>
      )}
    </Stage>
  );
}
