"use client";

// PTCG Cube: the booster you clicked tears and its cards are dealt onto the playmat (P3:
// boosters tear). Beats, 12fps frames (F = 83ms):
//   F0-F2    the pack (with the card leaning on it) leaves its place on the mat (FLIP from
//            the desk rect) and the camera spring carries it in; the beats below run 2F later
//   F1       the pack lifts (shadow grows); the camera springs in; F1-F2 it straightens
//   F2-F5    the top crimp rips across, a quarter per frame, then flies off
//   F5-F7    the playmat steps up under the pack; the pack settles onto it
//   F8-      five cards, 60ms apart, each in 3 frames: the pulled card from where it leaned,
//            the other four out of the pack, beside it, onto their bench slots (the five
//            slots printed on the real playmat)
// The rulebook (the manual) is the shell's spring after onReady.
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { emitStory } from "../bus";
import { SPRING_UI } from "../motion/spring";
import { useCeremony } from "../motion/ceremony";
import { FRAME as F } from "../motion/stepped";
import type { DeviceProps } from "../types";
import { BENCH, BENCH_CARD_SCALE, BOOSTER_VIEW, BoosterScene, DESK_BOX, PACK, PACK_AT, PACK_LEAN, PULLED, PULLED_SLOT } from "./art/BoosterArt";
import { deskPose, flipFromDesk, FLIP_REST } from "./flip";
import { DEVICE_CLOSING_DESCRIPTIONS, DEVICE_DESCRIPTIONS } from "./descriptions";
import { layoutKey, Stage, snap, useStageSize } from "./Stage";
import s from "./devices.module.css";

const TRAVEL = 2 * F;

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
      const [fly] = q("[data-p=fly]");
      const [box] = q("[data-p=box]");
      const [pack] = q("[data-p=pack]");
      const [pulled] = q("[data-p=pulled]");
      const mat = q("[data-p=mat]");
      const cards = q("[data-p=card]");
      const rots = q("[data-p=card-rot]");
      const strips = [0, 1, 2, 3, 4].map((k) => q(`[data-p=strip-${k}]`));
      const sh0 = pack?.getAttribute("data-sh0") ?? "";
      const sh1 = pack?.getAttribute("data-sh1") ?? "";
      const K = PACK_AT.k;

      gsap.set(cam, { xPercent: -4, yPercent: -6, scale: 0.9, transformOrigin: "50% 40%" });
      gsap.set(fly, { ...FLIP_REST, svgOrigin: `${PACK_AT.x + (DESK_BOX.w * K) / 2} ${PACK_AT.y + (DESK_BOX.h * K) / 2}` });
      gsap.set(pack, { rotation: PACK_LEAN.rot, svgOrigin: PACK_LEAN.origin, attr: { filter: sh0 } });
      gsap.set(pulled, { x: 0, y: 0, scale: 1, rotation: 0, svgOrigin: `${PULLED.cx} ${PULLED.cy}` });
      gsap.set(mat, { y: 420 });
      strips.forEach((el, k) => gsap.set(el, { visibility: k === 0 ? "visible" : "hidden" }));
      cards.forEach((c) => gsap.set(c, { x: PACK.cx, y: 110, visibility: "hidden" }));
      rots.forEach((r) => gsap.set(r, { rotation: 0, svgOrigin: "0 0" }));
      // the very pack from the mat, measured in this start pose before any beat renders
      const flip = flipFromDesk(deskPose(props.id), box, DESK_BOX.w * K);

      tl.set(pack, { attr: { filter: sh1 } }, F);
      tl.to(cam, { xPercent: 0, yPercent: 0, scale: 1, duration: SPRING_UI.duration, ease: SPRING_UI.ease }, F);
      // F1-F2: it straightens in the hand
      tl.set(pack, { rotation: PACK_LEAN.rot / 2 }, F);
      tl.set(pack, { rotation: 0 }, 2 * F);
      // F2-F5: the tear
      for (let k = 1; k <= 4; k++) {
        tl.set(strips[k - 1], { visibility: "hidden" }, (1 + k) * F);
        tl.set(strips[k], { visibility: "visible" }, (1 + k) * F);
      }
      // F5-F7: the mat steps up under it, the pack lands on it
      [250, 110, 0].forEach((y, i) => tl.set(mat, { y }, (5 + i) * F));
      tl.set(pack, { attr: { filter: sh0 } }, 7 * F);
      // F8-: deal, 60ms apart, 3 frames each
      const others = BENCH.map((_, i) => i).filter((i) => i !== PULLED_SLOT);
      BENCH.forEach((b, i) => {
        const at = 8 * F + i * 0.06;
        if (i === PULLED_SLOT) {
          // the pulled card: from its lean on the pack to the middle slot (desk units)
          const dx = (b.x - PACK_AT.x) / K - PULLED.cx;
          const dy = (b.y - PACK_AT.y) / K - PULLED.cy;
          const end = BENCH_CARD_SCALE / K;
          tl.set(pulled, { y: -4, scale: 1.04 }, at);
          tl.set(pulled, { x: dx / 2, y: dy / 2 - 8, scale: (1 + end) / 2, rotation: (b.r - PULLED.rot) / 2 }, at + F);
          tl.set(pulled, { x: dx, y: dy, scale: end, rotation: b.r - PULLED.rot }, at + 2 * F);
          return;
        }
        const n = others.indexOf(i);
        const c = cards[n];
        const r = rots[n];
        const left = i < PULLED_SLOT;
        tl.set(c, { visibility: "visible", x: PACK.cx + (i - 2) * 9, y: -6 }, at);
        tl.set(r, { rotation: (i - 2) * 7 }, at);
        tl.set(c, { x: left ? 228 - (2 - i) * 34 : 412 + (i - 3) * 34, y: 150 + Math.abs(i - 2) * 22 }, at + F);
        tl.set(r, { rotation: left ? -14 : 14 }, at + F);
        tl.set(c, { x: b.x, y: b.y }, at + 2 * F);
        tl.set(r, { rotation: b.r }, at + 2 * F);
      });
      tl.set({}, {}, 8 * F + 4 * 0.06 + 3 * F);

      if (flip) {
        tl.shiftChildren(TRAVEL, true);
        gsap.set(pack, { attr: { filter: sh1 } });
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
          <BoosterScene />
        </div>
      )}
    </Stage>
  );
}
