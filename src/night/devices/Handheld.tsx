"use client";

// Carts into handhelds (P3: carts insert). One pipeline, two skins:
//   GB   Galactic News: portrait handheld, 160x144 screen in the game's 4 tones
//   GBA  Project Minamoto: landscape handheld, 240x160 screen in 6 tones from the logo
// Beats (full mode, 12fps frames, F = 83ms):
//   F1        the cart lifts (its shadow grows), the camera springs toward the mat corner
//   F1-F4     the handheld steps in from the lower right
//   F5-F7     the cart steps into the slot; F7 is the clack (impact marks, 1-unit jolt)
//   F8        power switch frame, LED on; the camera springs in on the screen
//   F9-       boot, strictly inside the declared palette, at integer scale
// Only the camera springs; everything diegetic is stepped (P6).
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { asset } from "../asset";
import { SPRING_UI } from "../motion/spring";
import { useCeremony } from "../motion/ceremony";
import { FRAME as F, stepFrames, stepTo } from "../motion/stepped";
import { SCREEN_PALETTES } from "../content/palettes";
import type { DeviceProps } from "../types";
import { GB_CART, GBA_CART, GbCartArt, GbaCartArt } from "./art/Carts";
import { GB_BODY, GBA_BODY, GbShellArt, GbaShellArt } from "./art/Handhelds";
import { DEVICE_CLOSING_DESCRIPTIONS, DEVICE_DESCRIPTIONS } from "./descriptions";
import { Stage, pixelUnit, snap, useStageSize } from "./Stage";
import s from "./devices.module.css";

type Skin = "gb" | "gba";

const SKIN = {
  gb: { body: GB_BODY, cart: GB_CART, screen: { w: 160, h: 144 }, lift: 250 },
  gba: { body: GBA_BODY, cart: GBA_CART, screen: { w: 240, h: 160 }, lift: 190 },
} as const;

const SHADOW_REST = "drop-shadow(2px 4px 3px rgba(0,0,0,.45))";
const SHADOW_LIFT = "drop-shadow(10px 22px 14px rgba(0,0,0,.32))";

const GN = SCREEN_PALETTES["galactic-news"].tones; // dark, red, teal, light
const MI = SCREEN_PALETTES["project-minamoto"].tones; // white, lilac, magenta, purple, deep, outline

function Handheld({ skin, ...props }: DeviceProps & { skin: Skin }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = useStageSize(stageRef);
  const k = SKIN[skin];
  const unit = size ? pixelUnit(k.screen.w, k.screen.h, size) : null;
  const u = unit?.u ?? 1;

  // focus (screen centre) sits on the stage centre at camera scale 1
  const fx = k.body.screenX + k.screen.w / 2;
  const fy = k.body.screenY + k.screen.h / 2;
  const left = size ? snap(size.w / 2 - fx * u, size.dpr) : 0;
  const top = size ? snap(size.h / 2 - fy * u, size.dpr) : 0;

  const measured = !!size;
  useEffect(() => {
    if (skin === "gba" && measured && canvasRef.current) drawMinamotoScreen(canvasRef.current);
  }, [skin, measured]);

  useCeremony(
    stageRef,
    props,
    (tl, { q }) => {
      if (!size) return;
      const [rig] = q("[data-p=rig]");
      const [body] = q("[data-p=body]");
      const [cart] = q("[data-p=cart]");
      const knob = q("[data-p=knob]");
      const led = q("[data-p=led-on]");
      const clack = q("[data-p=clack]");

      // wide shot: the whole scene (the lifted cart above the body) fits the stage
      const sceneTop = k.body.cartY - k.lift;
      const sceneH = k.body.h - sceneTop;
      const s0 = Math.min(1, (size.w * 0.9) / (k.body.w * u), (size.h * 0.86) / (sceneH * u));
      const wideY = ((fy - (sceneTop + sceneH / 2)) * s0 * 100) / k.body.h;

      gsap.set(rig, { xPercent: -8, yPercent: wideY - 6, scale: s0 * 0.92, transformOrigin: `${(fx / k.body.w) * 100}% ${(fy / k.body.h) * 100}%` });
      gsap.set(body, { xPercent: 240, yPercent: 64 });
      gsap.set(cart, { y: -k.lift * u, filter: SHADOW_REST });

      // F1: lift, and the camera moves toward the open corner of the mat
      tl.set(cart, { filter: SHADOW_LIFT }, F);
      tl.to(rig, { xPercent: 0, yPercent: wideY, scale: s0, duration: SPRING_UI.duration, ease: SPRING_UI.ease }, F);
      // F1-F4: the handheld steps in
      tl.add(stepFrames(body, [{ xPercent: 150, yPercent: 40 }, { xPercent: 76, yPercent: 20 }, { xPercent: 24, yPercent: 6 }, { xPercent: 0, yPercent: 0 }]), F);
      // F5-F7: into the slot, F7 clacks
      tl.add(stepFrames(cart, [{ y: (-k.lift * 2 * u) / 3 }, { y: (-k.lift * u) / 3 }, { y: 0, filter: SHADOW_REST }]), 5 * F);
      tl.set(clack, { visibility: "visible" }, 7 * F);
      tl.set(body, { y: u }, 7 * F);
      tl.set(clack, { visibility: "hidden" }, 8 * F);
      tl.set(body, { y: 0 }, 8 * F);
      // F8: power on, camera in on the screen
      tl.set(knob, { attr: { x: skin === "gb" ? 55 : 71 } }, 8 * F);
      tl.set(led, { visibility: "visible" }, 8 * F);
      tl.to(rig, { xPercent: 0, yPercent: 0, scale: 1, duration: SPRING_UI.duration, ease: SPRING_UI.ease }, 8 * F);

      if (skin === "gb") buildGbBoot(tl, q, u);
      else buildGbaBoot(tl, q, u);
    },
    !!size,
  );

  const label = (props.reverse ? DEVICE_CLOSING_DESCRIPTIONS : DEVICE_DESCRIPTIONS)[props.id];
  const px = (n: number) => `${n * u}px`;

  return (
    <Stage ref={stageRef} label={label}>
      {size && (
        <div
          data-p="rig"
          className={s.rig}
          style={{ left, top, width: px(k.body.w), height: px(k.body.h), ["--u" as string]: `${u}px` }}
        >
          <div data-p="cart" className={s.part} style={{ left: px(k.body.cartX), top: px(k.body.cartY), width: px(k.cart.w), height: px(k.cart.h) }}>
            {skin === "gb" ? <GbCartArt /> : <GbaCartArt />}
          </div>
          <div data-p="body" className={s.part} style={{ left: 0, top: 0, width: "100%", height: "100%", filter: SHADOW_REST }}>
            {skin === "gb" ? <GbShellArt /> : <GbaShellArt />}
            <div
              className={s.screen}
              style={{ left: px(k.body.screenX), top: px(k.body.screenY), width: px(k.screen.w), height: px(k.screen.h), background: skin === "gb" ? GN[0] : MI[5] }}
            >
              {skin === "gb" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img data-p="cover" className={s.pixel} src={asset("resources/desk/galactic-news-cover.png")} alt="" draggable={false} style={{ left: 0, top: 0, width: px(160), height: px(144), visibility: "hidden" }} />
                  {/* the wordmark rows of the cover (y 10-58), which drop in during the boot */}
                  <div data-p="strip" className={s.strip} style={{ top: px(10), height: px(48), visibility: "hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={s.pixel} src={asset("resources/desk/galactic-news-cover.png")} alt="" draggable={false} style={{ left: 0, top: px(-10), width: px(160), height: px(144) }} />
                  </div>
                </>
              ) : (
                <>
                  <canvas data-p="scene" ref={canvasRef} width={240} height={160} className={s.pixel} style={{ left: 0, top: 0, width: px(240), height: px(160), visibility: "hidden" }} />
                  <div data-p="white" className={s.flat} style={{ background: MI[0], visibility: "hidden" }} />
                  <div data-p="bar" className={s.bar} style={{ width: px(4), background: MI[2], visibility: "hidden" }} />
                  <div data-p="bar2" className={s.bar} style={{ width: px(2), background: MI[1], visibility: "hidden" }} />
                </>
              )}
              <div data-p="flash" className={s.flat} style={{ visibility: "hidden" }} />
            </div>
          </div>
        </div>
      )}
    </Stage>
  );
}

type Q = (sel: string) => Element[];

// Galactic News: power flash, the wordmark drops a screen pixel every 33ms, holds, a
// two-frame flash, then the cover. Every frame uses only the four tones.
function buildGbBoot(tl: gsap.core.Timeline, q: Q, u: number) {
  const flash = q("[data-p=flash]");
  const strip = q("[data-p=strip]");
  const cover = q("[data-p=cover]");
  const DROP = 14;
  gsap.set(strip, { y: -DROP * u });
  tl.set(flash, { visibility: "visible", backgroundColor: GN[3] }, 9 * F);
  tl.set(flash, { visibility: "hidden" }, 10 * F);
  tl.set(strip, { visibility: "visible" }, 10 * F);
  tl.add(stepTo(strip, { y: 0 }, DROP, 30), 10 * F);
  tl.set(flash, { visibility: "visible", backgroundColor: GN[3] }, 18 * F);
  tl.set(flash, { backgroundColor: GN[2] }, 19 * F);
  tl.set(flash, { visibility: "hidden" }, 20 * F);
  tl.set(cover, { visibility: "visible" }, 20 * F);
  tl.set(strip, { visibility: "hidden" }, 20 * F);
  tl.set({}, {}, 21 * F);
}

// Project Minamoto: the screen powers on white, a magenta edge sweeps across in 8 frames
// leaving the logo in its six tones behind it.
function buildGbaBoot(tl: gsap.core.Timeline, q: Q, u: number) {
  const white = q("[data-p=white]");
  const scene = q("[data-p=scene]");
  const bar = q("[data-p=bar]");
  const bar2 = q("[data-p=bar2]");
  gsap.set(white, { clipPath: "inset(0 0 0 0%)" });
  tl.set([white, scene], { visibility: "visible" }, 9 * F);
  for (let i = 1; i <= 8; i++) {
    const at = (10 + i) * F;
    const x = i * 30; // 240 / 8, whole screen pixels
    if (i < 8) {
      tl.set(white, { clipPath: `inset(0 0 0 ${(i / 8) * 100}%)` }, at);
      tl.set(bar, { visibility: "visible", x: (x - 4) * u }, at);
      tl.set(bar2, { visibility: "visible", x: (x - 6) * u }, at);
    } else {
      tl.set([white, bar, bar2], { visibility: "hidden" }, at);
    }
  }
  tl.set({}, {}, 20 * F);
}

// The Minamoto boot frame, drawn once into the 240x160 canvas and snapped to the six
// declared tones (nearest colour, no dithering): the logo plus the title.
function drawMinamotoScreen(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const tones = MI.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const bg = tones[4];
  const paint = () => {
    ctx.fillStyle = MI[4];
    ctx.fillRect(0, 0, 240, 160);
  };
  paint();
  const img = new Image();
  img.onload = async () => {
    try {
      await document.fonts?.ready;
    } catch {}
    paint();
    const w = 208;
    const h = Math.round((img.height / img.width) * w);
    const lx = Math.round((240 - w) / 2);
    const ly = 28;
    // logo on its own layer so its alpha can be thresholded
    const layer = document.createElement("canvas");
    layer.width = 240;
    layer.height = 160;
    const lc = layer.getContext("2d", { willReadFrequently: true });
    if (!lc) return;
    lc.imageSmoothingEnabled = true;
    lc.imageSmoothingQuality = "high";
    lc.drawImage(img, lx, ly, w, h);
    const fam = getComputedStyle(document.documentElement).getPropertyValue("--f-omar").trim() || "sans-serif";
    lc.font = `900 11px ${fam}`;
    lc.textAlign = "center";
    lc.textBaseline = "alphabetic";
    lc.fillStyle = MI[0];
    try {
      (lc as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "2px";
    } catch {}
    lc.fillText("PROJECT MINAMOTO", 120, ly + h + 22);
    const data = lc.getImageData(0, 0, 240, 160);
    const out = ctx.getImageData(0, 0, 240, 160);
    const d = data.data;
    const o = out.data;
    for (let i = 0; i < d.length; i += 4) {
      let c = bg;
      if (d[i + 3] >= 128) {
        let best = Infinity;
        for (const t of tones) {
          const dr = d[i] - t[0];
          const dg = d[i + 1] - t[1];
          const db = d[i + 2] - t[2];
          const dist = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
          if (dist < best) {
            best = dist;
            c = t;
          }
        }
      }
      o[i] = c[0];
      o[i + 1] = c[1];
      o[i + 2] = c[2];
      o[i + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
  };
  img.src = asset("resources/desk/minamoto-logo.png");
}

export function GalacticNewsDevice(props: DeviceProps) {
  return <Handheld skin="gb" {...props} />;
}

export function MinamotoDevice(props: DeviceProps) {
  return <Handheld skin="gba" {...props} />;
}
