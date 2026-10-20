"use client";
// TEMPORARY package-B harness. Delete before finishing.
import { useEffect, useState } from "react";
import gsap from "gsap";
import { DEVICES, TapeFlip } from "@/night/devices";
import type { CeremonyMode, ProjectId, Side } from "@/night/types";

export default function Lab() {
  const [p, setP] = useState<{ id: ProjectId; mode: CeremonyMode; reverse: boolean; slow: number; flip: boolean } | null>(null);
  const [skip, setSkip] = useState(0);
  const [ready, setReady] = useState(0);
  const [side, setSide] = useState<Side>("A");
  useEffect(() => {
    const u = new URLSearchParams(location.search);
    const slow = Number(u.get("slow") || 1);
    gsap.globalTimeline.timeScale(1 / slow);
    (window as unknown as { __skip: () => void }).__skip = () => setSkip((s) => s + 1);
    (window as unknown as { __flip: () => void }).__flip = () => setSide((s) => (s === "A" ? "B" : "A"));
    const go = () => setP({ id: (u.get("id") || "galactic-news") as ProjectId, mode: (u.get("mode") || "full") as CeremonyMode, reverse: u.has("reverse"), slow, flip: u.has("flip") });
    (window as unknown as { __go: () => void }).__go = go;
    if (!u.has("wait")) go();
  }, []);
  if (!p) return null;
  const D = DEVICES[p.id];
  return (
    <div style={{ position: "fixed", inset: 0, background: "#102f41" }}>
      <style>{`@font-face{font-family:"FK Grotesk";src:url("/fonts/FKGrotesk-Black.otf");font-weight:900}@font-face{font-family:"GN KillGothic";src:url("/fonts/GN-KillGothic-U-KanaNA.ttf")}`}</style>
      {p.flip ? (
        <div style={{ width: 360, margin: 40 }}>
          <TapeFlip side={side} onDone={() => setReady((r) => r + 1)} />
        </div>
      ) : (
        <D id={p.id} mode={p.mode} reverse={p.reverse} skipToken={skip} onReady={() => setReady((r) => r + 1)} />
      )}
      <div id="ready" style={{ position: "fixed", right: 8, bottom: 8, color: "#fce8cd", font: "12px monospace" }}>ready:{ready}</div>
    </div>
  );
}
