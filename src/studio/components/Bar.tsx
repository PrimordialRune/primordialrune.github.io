"use client";

import { useRef } from "react";
import gsap from "gsap";
import Logo from "./Logo";
import { UI_SPRING, useMotion } from "@/studio/lib/motion";

// The bar (P2): live from the first frame. Plain chrome (P3): text buttons, no period detail.
export default function Bar({
  stage,
  ceremony,
  onHome,
  onWork,
  onContact,
  onMotion,
  onOptions,
  onSkip,
  onSkipLink,
  optionsOpen,
}: {
  stage: number;
  ceremony: boolean;
  onHome: () => void;
  onWork: () => void;
  onContact: () => void;
  onMotion: () => void;
  onOptions: (trigger: HTMLElement) => void;
  onSkip: () => void;
  onSkipLink: () => void;
  optionsOpen: boolean;
}) {
  const motion = useMotion();
  const knob = useRef<HTMLSpanElement>(null);

  const toggleMotion = () => {
    onMotion();
    // The knob springs to its side (UI on springs, in both modes)
    if (knob.current) gsap.fromTo(knob.current, { x: motion === "full" ? 0 : 14 }, { x: motion === "full" ? 14 : 0, duration: UI_SPRING.duration, ease: UI_SPRING.ease });
  };

  return (
    <header className="bar">
      <a
        href="#shelf"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          onSkipLink();
        }}
      >
        Skip to work
      </a>
      <button className="bar-mark" onClick={onHome} aria-label="PrimordialRune, back to the shelf">
        <Logo stage={stage === 3 ? 0 : stage} size={28} />
        <span className="bar-word" aria-hidden>
          <i>PRIMORDIAL</i>
          <b>RUNE</b>
        </span>
      </button>
      <nav className="bar-nav" aria-label="Main">
        {ceremony && (
          <button className="bar-btn bar-skip" onClick={onSkip}>
            <span>SKIP ▸</span>
            <small lang="ja">スキップ</small>
          </button>
        )}
        <button className="bar-btn bar-work" onClick={onWork}>
          <span>WORK</span>
          <small lang="ja">ゲーム</small>
        </button>
        <button className="bar-btn" onClick={onContact}>
          <span>CONTACT</span>
          <small lang="ja">コンタクト</small>
        </button>
        <button
          className="motion-chip"
          onClick={toggleMotion}
          aria-label={`Motion: ${motion}. Switch to ${motion === "full" ? "soft" : "full"}`}
          aria-pressed={motion === "full"}
        >
          <span className="motion-label">
            <span className="motion-now">
              <span className="motion-word">MOTION </span>
              {motion === "full" ? "FULL" : "SOFT"}
            </span>
            <small lang="ja">モーション</small>
          </span>
          <span className="motion-track" aria-hidden>
            <span ref={knob} className="motion-knob" style={{ transform: `translateX(${motion === "full" ? 14 : 0}px)` }} />
          </span>
        </button>
        <button
          className="bar-btn bar-options"
          onClick={(e) => onOptions(e.currentTarget)}
          aria-expanded={optionsOpen}
          aria-haspopup="dialog"
        >
          <span className="bar-options-word">OPTIONS</span>
          <span className="bar-options-icon" aria-hidden>
            ☰
          </span>
          <small lang="ja">オプション</small>
        </button>
      </nav>
    </header>
  );
}
