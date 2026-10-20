"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { SPEAKING_EVENT } from "@/components/Narrator";
import { isQuiet } from "@/lib/motion";
import { narrate } from "@/lib/narrator";
import { LOGO_INNER, LOGO_OUTER } from "@/lib/logo";

gsap.registerPlugin(DrawSVGPlugin);

const SKILLS = ["Game Design", "Board Games", "RPGs", "UI/UX", "Pixel Art", "Strategy"];
const CONTACTS = [
  { label: "Email", note: "serious stuff", url: "mailto:primordialrune@gmail.com" },
  { label: "Telegram", note: "quick chat", url: "https://t.me/PrimordialRune" },
  { label: "GitHub", note: "the code", url: "https://github.com/PrimordialRune" },
  { label: "Instagram", note: "rare posts", url: "https://instagram.com/primordialrune" },
];

let introPlayed = false;

// The emblem is the narrator's face: its inner shape moves while it talks
function Emblem() {
  const innerRef = useRef<SVGPathElement>(null);
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    let flap: gsap.core.Timeline | null = null;
    const onSpeaking = (e: Event) => {
      const speaking = (e as CustomEvent<boolean>).detail;
      flap?.kill();
      flap = null;
      if (speaking && !isQuiet()) {
        flap = gsap.timeline({ repeat: -1 });
        [1.05, 1.0, 1.035, 1.0, 1.05, 1.01].forEach((s, i) =>
          flap!.to(inner, { scale: s, duration: 0.07 + (i % 3) * 0.025, ease: "power1.inOut", svgOrigin: "380 260" })
        );
      } else {
        gsap.to(inner, { scale: 1, duration: 0.15, svgOrigin: "380 260" });
      }
    };
    window.addEventListener(SPEAKING_EVENT, onSpeaking);
    return () => {
      flap?.kill();
      window.removeEventListener(SPEAKING_EVENT, onSpeaking);
    };
  }, []);
  return (
    <svg viewBox="-10 -10 575 575" className="hero-logo" aria-hidden="true">
      <path className="hero-logo-outer" d={LOGO_OUTER} />
      <path ref={innerRef} className="hero-logo-inner" d={LOGO_INNER} />
    </svg>
  );
}

// Channel 01: Omar, introduced like a JRPG party member. Emblem and name lead, a status
// window holds the facts (class, skills, contact), and the narrator reacts to what you poke.
export default function HeroScreen({ hasSave }: { hasSave: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [quiet] = useState(isQuiet);

  // Entrance: the emblem draws itself, the inner shape lands, the name rises, the status window
  // slides in. About a second; any key or click jumps to the end.
  useEffect(() => {
    const root = rootRef.current!;
    const intro = () => {
      if (introPlayed) return;
      introPlayed = true;
      narrate(hasSave ? "returning" : "newGame", { script: true });
    };
    if (quiet) {
      intro();
      return;
    }
    const q = gsap.utils.selector(root);
    const tl = gsap.timeline({ onComplete: intro });
    tl.fromTo(q(".hero-logo-outer"), { drawSVG: "0%", fillOpacity: 0 }, { drawSVG: "100%", duration: 0.6, ease: "power2.inOut" }, 0)
      .to(q(".hero-logo-outer"), { fillOpacity: 1, duration: 0.25, ease: "power1.out" }, 0.42)
      .fromTo(q(".hero-logo-inner"), { scale: 1.7, rotation: -14, opacity: 0, svgOrigin: "380 260" },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.5, ease: "back.out(2.2)", svgOrigin: "380 260" }, 0.34)
      .fromTo(q(".hero-name-line > span"), { yPercent: 110 }, { yPercent: 0, duration: 0.55, ease: "power4.out", stagger: 0.08 }, 0.4)
      .fromTo(q(".hero-role"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.06 }, 0.7)
      .fromTo(q(".hero-status"), { opacity: 0, x: 40, skewX: -6 }, { opacity: 1, x: 0, skewX: 0, duration: 0.5, ease: "back.out(1.6)" }, 0.55)
      .fromTo(q(".hero-status-row"), { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out", stagger: 0.07 }, 0.75);
    const skip = () => tl.progress(1);
    window.addEventListener("keydown", skip, { once: true, capture: true });
    root.addEventListener("pointerdown", skip, { once: true });
    return () => {
      tl.progress(1).kill();
      window.removeEventListener("keydown", skip, { capture: true });
      root.removeEventListener("pointerdown", skip);
    };
  }, [hasSave, quiet]);

  // Idle: the emblem floats and leans toward the pointer
  useEffect(() => {
    const el = rootRef.current!.querySelector<HTMLElement>(".hero-emblem-tilt");
    if (!el || quiet) return;
    const float = gsap.to(el, { y: -6, duration: 1.6, ease: "sine.inOut", repeat: -1, yoyo: true });
    if (!matchMedia("(hover: hover)").matches) return () => { float.kill(); };
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
    };
  }, [quiet]);

  // Clicking empty screen: the narrator notices that too
  const onBackground = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) narrate("background");
  };

  return (
    <div ref={rootRef} className="hero-screen" onClick={onBackground}>
      <section className="hero-id" aria-label="Omar Golinelli" onClick={onBackground}>
        <button className="hero-emblem" onClick={() => narrate("logo")} aria-label="The logo">
          <span className="hero-emblem-tilt">
            <Emblem />
          </span>
        </button>
        <div className="hero-text">
          <h1 className="hero-name">
            <button className="hero-name-btn" onClick={() => narrate("name")}>
              <span className="hero-name-line"><span>OMAR</span></span>
              <span className="hero-name-line"><span>GOLINELLI</span></span>
            </button>
          </h1>
          <button className="hero-role" onClick={() => narrate("title")}>Game designer &amp; developer</button>
          <button className="hero-role hero-role-jp" onClick={() => narrate("japaneseText")}>ゲームデザイナー</button>
        </div>
      </section>

      <aside className="hero-status" aria-label="Status">
        <div className="hero-status-row">
          <span className="hero-key">CLASS<small>クラス</small></span>
          <span className="hero-val">Game Designer / Developer</span>
        </div>
        <div className="hero-status-row">
          <button className="hero-key" onClick={() => narrate("skills")}>SKILLS<small>スキル</small></button>
          <ul className="hero-skills">
            {SKILLS.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
        <div className="hero-status-row">
          <button className="hero-key" onClick={() => narrate("contact")}>CONTACT<small>コンタクト</small></button>
          <ul className="hero-contacts">
            {CONTACTS.map((c) => (
              <li key={c.label}>
                <a href={c.url} target={c.url.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  {c.label}
                </a>
                <span>{c.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
