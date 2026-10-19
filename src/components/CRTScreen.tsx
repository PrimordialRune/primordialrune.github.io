"use client";

import { useEffect, useRef, useState } from "react";
import { CRT_BURST_EVENT, CRTBurstDetail, prefersReducedMotion } from "@/lib/crt";

const NOISE_W = 128;
const NOISE_H = 96;

// The whole site lives in this tube. At rest it is a clean Trinitron
// (scanlines, aperture grille, vignette, glass glare); events trigger a
// short VHS burst via triggerBurst() from lib/crt.
export default function CRTScreen({ children }: { children: React.ReactNode }) {
  const tubeRef = useRef<HTMLDivElement>(null);
  const noiseRef = useRef<HTMLCanvasElement>(null);
  const [osd, setOsd] = useState("");

  // Animated static, drawn every other frame at low resolution
  useEffect(() => {
    const canvas = noiseRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const image = ctx.createImageData(NOISE_W, NOISE_H);
    const draw = () => {
      const d = image.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      ctx.putImageData(image, 0, 0);
    };
    draw();
    if (prefersReducedMotion()) return;

    let frame = 0;
    let raf = 0;
    const loop = () => {
      if (!document.hidden && frame++ % 2 === 0) draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Bursts: a quick tear plus the tape artefacts for a moment
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const onBurst = (e: Event) => {
      const tube = tubeRef.current;
      if (!tube) return;
      const { strength = 1, osd: text = "" } = (e as CustomEvent<CRTBurstDetail>).detail ?? {};
      setOsd(text);
      if (prefersReducedMotion()) {
        timers.push(setTimeout(() => setOsd(""), 900));
        return;
      }
      tube.classList.remove("is-static");
      void tube.offsetWidth; // restart the flash animation
      tube.classList.add("is-static", "is-burst");
      timers.push(setTimeout(() => tube.classList.remove("is-static"), 160 * Math.min(strength, 2)));
      timers.push(setTimeout(() => tube.classList.remove("is-burst"), 420 * strength));
      timers.push(setTimeout(() => setOsd(""), Math.max(900, 420 * strength + 300)));
    };
    window.addEventListener(CRT_BURST_EVENT, onBurst);
    return () => {
      window.removeEventListener(CRT_BURST_EVENT, onBurst);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={tubeRef} className="crt-tube">
      <div className="crt-content">{children}</div>
      <canvas
        ref={noiseRef}
        className="crt-fx crt-noise"
        width={NOISE_W}
        height={NOISE_H}
        aria-hidden="true"
      />
      <div className="crt-fx crt-grille" aria-hidden="true" />
      <div className="crt-fx crt-scan" aria-hidden="true" />
      <div className="crt-fx crt-track" aria-hidden="true" />
      <div className="crt-fx crt-headswitch" aria-hidden="true" />
      <div className="crt-fx crt-vignette" aria-hidden="true" />
      <div className="crt-fx crt-glass" aria-hidden="true" />
      <div className="crt-osd" aria-hidden="true">
        {osd}
      </div>
      <div className="crt-flash" aria-hidden="true" />
    </div>
  );
}
