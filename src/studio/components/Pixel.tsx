"use client";

// Pixel art at an integer scale only (P1): the largest n ≥ 1 that fits, nearest neighbour.
// If even 1× does not fit, it renders at 1× and crops around the centre; never fractional.
// Without maxW/maxH it measures its own box: width always; height only when the parent gives
// it a definite height (the image is out of flow, so it never feeds its own measurement).
// Non-pixel art is a plain contained <img>.

import { useLayoutEffect, useRef, useState } from "react";
import type { Art } from "../types";
import { asset } from "../lib/asset";

interface Props {
  art: Art;
  maxW?: number;
  maxH?: number;
  className?: string;
}

export function pixelScale(art: { w: number; h: number }, w: number, h: number): number {
  return Math.max(1, Math.floor(Math.min(w / art.w, h / art.h)));
}

export default function Pixel({ art, maxW, maxH, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  // "fill": the parent has a definite height we may use; "flow": height follows the image
  const [mode, setMode] = useState<"fill" | "flow" | null>(null);

  useLayoutEffect(() => {
    if (!art.pixel || (maxW !== undefined && maxH !== undefined)) return;
    const el = ref.current;
    if (!el) return;
    let m: "fill" | "flow" | null = null;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (m === null) {
        m = h > 0 ? "fill" : "flow";
        setMode(m);
      }
      setBox({ w, h: m === "fill" ? h : Infinity });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [art.pixel, maxW, maxH]);

  if (!art.pixel) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={className}
        src={asset(art.src)}
        alt={art.alt}
        width={art.w}
        height={art.h}
        loading="lazy"
        draggable={false}
        style={{ display: "block", width: "100%", height: "auto", maxWidth: maxW, maxHeight: maxH, objectFit: "contain" }}
      />
    );
  }

  const measured = maxW !== undefined && maxH !== undefined;
  const W = Math.min(maxW ?? Infinity, box?.w ?? Infinity);
  const H = Math.min(maxH ?? Infinity, box?.h ?? Infinity);
  const n = measured || box ? pixelScale(art, W, H) : 1;
  const iw = art.w * n;
  const ih = art.h * n;
  // the frame the image sits in, and integer offsets (never half a pixel)
  const fill = !measured && mode === "fill";
  const fw = measured ? Math.min(maxW, iw) : (box?.w ?? iw);
  const fh = measured || !fill ? Math.min(H, ih) : (box?.h ?? ih);
  const left = Math.round((fw - iw) / 2);
  const top = Math.round((fh - ih) / 2);
  const ready = measured || box !== null;

  return (
    <span
      ref={ref}
      className={className}
      style={{
        position: "relative",
        display: "block",
        overflow: "hidden",
        width: measured ? fw : "100%",
        height: !measured && mode !== "flow" ? "100%" : fh,
        maxWidth: "100%",
        margin: measured ? "0 auto" : undefined,
        visibility: ready ? undefined : "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset(art.src)}
        alt={art.alt}
        width={iw}
        height={ih}
        draggable={false}
        style={{
          position: "absolute",
          left,
          top,
          width: iw,
          height: ih,
          maxWidth: "none",
          imageRendering: "pixelated",
        }}
      />
    </span>
  );
}
