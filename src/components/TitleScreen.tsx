"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import SaveSelect from "@/components/SaveSelect";
import type { EmblemBackend } from "@/components/Emblem3D";
import { isQuiet } from "@/lib/motion";
import { readSave } from "@/lib/save";

gsap.registerPlugin(DrawSVGPlugin);

const Emblem3D = dynamic(() => import("@/components/Emblem3D"), { ssr: false });

export type EmblemKind = "flat" | "3d";

const LOGO_OUTER =
  "M260.32,454.02l-159.33-159.33c-8.33-8.33-8.33-21.82,0-30.15l168.17-168.17c4-4,9.42-6.24,15.08-6.24h159.92c5.17,0,6.81-6.96,2.19-9.27L289.14,2.25c-8.21-4.1-18.12-2.5-24.61,3.99L6.24,264.53c-8.33,8.33-8.33,21.82,0,30.15l254.08,254.08c8.33,8.33,21.82,8.33,30.15,0l260.8-260.79c3.08-3.08.9-8.36-3.46-8.36h-72.56c-6.63,0-13,2.64-17.69,7.33l-167.08,167.08c-8.33,8.33-21.82,8.33-30.15,0Z";
const LOGO_INNER =
  "M551.25,137.49h-263.74c-7.75,0-15.19,3.08-20.67,8.56l-125.39,125.39c-3.01,3.01-.88,8.16,3.38,8.16h101.34c16.14,0,29.23,13.09,29.23,29.23v101.34c0,4.26,5.15,6.39,8.16,3.38l270.14-270.14c2.19-2.19.64-5.92-2.45-5.92Z";

// The narrator is an AI wearing Omar's voice; it speaks from the logo. Early on it
// sounds exactly like him. (Lines in his own lowercase "* " style from the old hero.)
const FIRST_VISIT = [
  "* welcome to my corner of the internet.",
  "* i'm omar. i design games, the board kind and the screen kind.",
  "* pick a file and i'll show you around.",
];
const RETURNING = [
  "* oh. you're back.",
  "* i kept your file safe. right where you left it.",
];
const ON_LOGO = [
  "* that's my logo! designed it myself.",
  "* it's supposed to look like a rune. does it?",
  "* took me like 50 iterations to get it right.",
];

function FlatEmblem({ speaking }: { speaking: boolean }) {
  const innerRef = useRef<SVGPathElement>(null);
  useEffect(() => {
    const inner = innerRef.current;
    if (!speaking || !inner || isQuiet()) return;
    // A mouth flap: the inner shape pulses on an uneven beat while the line types
    const tl = gsap.timeline({ repeat: -1 });
    [1.05, 1.0, 1.035, 1.0, 1.05, 1.01].forEach((s, i) =>
      tl.to(inner, { scale: s, duration: 0.07 + (i % 3) * 0.025, ease: "power1.inOut", svgOrigin: "380 260" })
    );
    return () => {
      tl.kill();
      gsap.to(inner, { scale: 1, duration: 0.15, svgOrigin: "380 260" });
    };
  }, [speaking]);
  return (
    <svg viewBox="-10 -10 575 575" className="emblem-flat" aria-hidden="true">
      <path className="emblem-outer" d={LOGO_OUTER} />
      <path ref={innerRef} className="emblem-inner" d={LOGO_INNER} />
    </svg>
  );
}

// Title screen: the hero is Omar (his emblem and name), the save files are its menu,
// and the narrator talks from the emblem in a dialogue box.
export default function TitleScreen({
  emblem,
  onContinue,
  onNewGame,
  onCorrupt,
  onBackend,
}: {
  emblem: EmblemKind;
  onContinue: (id: string) => void;
  onNewGame: () => void;
  onCorrupt: () => void;
  onBackend?: (b: EmblemBackend) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [script, setScript] = useState(() => (readSave() ? RETURNING : FIRST_VISIT));
  const [lineIndex, setLineIndex] = useState(0);
  const [typed, setTyped] = useState({ line: "", n: 0 });
  const [quiet] = useState(isQuiet);
  const [boxIn, setBoxIn] = useState(quiet);
  const [fallback, setFallback] = useState(false);
  const typer = useRef<gsap.core.Tween | null>(null);
  const logoTaps = useRef(0);
  const line = script[lineIndex] ?? "";
  const last = lineIndex >= script.length - 1;
  const shown = quiet ? line : typed.line === line ? line.slice(0, typed.n) : "";
  const typing = boxIn && shown.length < line.length;

  // Entrance: the emblem draws itself, the inner shape lands, the name rises, then the box opens.
  // About a second; any key or click jumps to the end.
  useEffect(() => {
    const root = rootRef.current!;
    const q = gsap.utils.selector(root);
    if (quiet) return;
    const tl = gsap.timeline({ onComplete: () => setBoxIn(true) });
    const outer = q(".emblem-outer"), inner = q(".emblem-inner"), emblem3d = q(".emblem-3d");
    if (outer.length) {
      tl.fromTo(outer, { drawSVG: "0%", fillOpacity: 0 }, { drawSVG: "100%", duration: 0.6, ease: "power2.inOut" }, 0)
        .to(outer, { fillOpacity: 1, duration: 0.25, ease: "power1.out" }, 0.42)
        .fromTo(inner, { scale: 1.7, rotation: -14, opacity: 0, svgOrigin: "380 260" },
          { scale: 1, rotation: 0, opacity: 1, duration: 0.5, ease: "back.out(2.2)", svgOrigin: "380 260" }, 0.34);
    }
    if (emblem3d.length) tl.fromTo(emblem3d, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.6)" }, 0);
    tl.fromTo(q(".title-name-line > span"), { yPercent: 110 }, { yPercent: 0, duration: 0.55, ease: "power4.out", stagger: 0.08 }, 0.4)
      .fromTo(q(".title-role"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.06 }, 0.7);
    const skip = () => tl.progress(1);
    window.addEventListener("keydown", skip, { once: true, capture: true });
    root.addEventListener("pointerdown", skip, { once: true });
    return () => {
      tl.kill();
      window.removeEventListener("keydown", skip, { capture: true });
      root.removeEventListener("pointerdown", skip);
    };
  }, [emblem, quiet]);

  // Idle: the emblem floats and leans toward the pointer
  useEffect(() => {
    const root = rootRef.current!;
    const el = root.querySelector<HTMLElement>(".title-emblem-tilt");
    if (!el || isQuiet()) return;
    const float = gsap.to(el, { y: -6, duration: 1.6, ease: "sine.inOut", repeat: -1, yoyo: true });
    if (emblem === "3d" || !matchMedia("(hover: hover)").matches) return () => { float.kill(); };
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      rx(gsap.utils.clamp(-14, 14, -((e.clientY - (r.top + r.height / 2)) / window.innerHeight) * 28));
      ry(gsap.utils.clamp(-18, 18, ((e.clientX - (r.left + r.width / 2)) / window.innerWidth) * 36));
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      float.kill();
      window.removeEventListener("pointermove", onMove);
      gsap.set(el, { rotationX: 0, rotationY: 0, y: 0 });
    };
  }, [emblem]);

  // Typewriter, skippable: a click on the box finishes the line, the next click advances
  useEffect(() => {
    if (!boxIn || quiet) return;
    const count = { n: 0 };
    typer.current = gsap.to(count, {
      n: line.length,
      duration: line.length / 42,
      ease: "none",
      onUpdate: () => setTyped({ line, n: Math.round(count.n) }),
    });
    return () => {
      typer.current?.kill();
    };
  }, [boxIn, line, quiet]);

  const advance = useCallback(() => {
    if (typing) {
      typer.current?.progress(1);
      return;
    }
    if (!last) setLineIndex((i) => i + 1);
  }, [typing, last]);

  // Poking the logo (the header one or the emblem) makes the narrator talk about it
  const talkAboutLogo = useCallback(() => {
    const n = logoTaps.current++ % ON_LOGO.length;
    setScript([ON_LOGO[n]]);
    setLineIndex(0);
    setBoxIn(true);
  }, []);
  useEffect(() => {
    window.addEventListener("primordialrune:logo-clicked", talkAboutLogo);
    return () => window.removeEventListener("primordialrune:logo-clicked", talkAboutLogo);
  }, [talkAboutLogo]);

  const backend = useCallback(
    (b: EmblemBackend) => {
      if (b === "none") setFallback(true);
      onBackend?.(b);
    },
    [onBackend]
  );

  const use3d = emblem === "3d" && !fallback;

  return (
    <div ref={rootRef} className="title-screen" data-emblem={use3d ? "3d" : "flat"}>
      <section className="title-hero" aria-label="Omar Golinelli, game designer">
        <button className="title-emblem" onClick={talkAboutLogo} aria-label="The logo. Ask about it">
          <span className="title-emblem-tilt">
            {use3d ? (
              <Emblem3D className="emblem-3d" speaking={typing} reduced={quiet} onBackend={backend} />
            ) : (
              <FlatEmblem speaking={typing} />
            )}
          </span>
        </button>
        <div className="title-text">
          <h1 className="title-name">
            <span className="title-name-line"><span>OMAR</span></span>
            <span className="title-name-line"><span>GOLINELLI</span></span>
          </h1>
          <p className="title-role">Game designer &amp; developer</p>
          <p className="title-role title-role-jp">ゲームデザイナー</p>
        </div>
      </section>

      <div className="title-files">
        <SaveSelect onContinue={onContinue} onNewGame={onNewGame} onCorrupt={onCorrupt} />
      </div>

      <button
        className="title-dialogue"
        data-in={boxIn}
        onClick={advance}
        aria-live="polite"
        aria-label={line.replace(/^\* /, "")}
      >
        <span className="title-dialogue-tag">
          <svg viewBox="0 0 555 555" aria-hidden="true">
            <path d={LOGO_OUTER} fill="currentColor" />
            <path d={LOGO_INNER} fill="var(--blood-orange)" />
          </svg>
          OMAR
        </span>
        <span className="title-dialogue-text" aria-hidden="true">
          {shown}
          <span className="title-dialogue-ghost">{line.slice(shown.length)}</span>
        </span>
        {!typing && !last && <span className="title-dialogue-more" aria-hidden="true">▼</span>}
      </button>
    </div>
  );
}
