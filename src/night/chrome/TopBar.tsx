"use client";

// The one flat strip: wordmark, WORK / ABOUT / CONTACT, MOTION, and the CRT power switch.
// Neutral and quiet (P3): the objects carry the period detail, not the chrome.
import type { Ref } from "react";
import MotionToggle from "./MotionToggle";
import PowerButton from "./PowerButton";
import s from "./TopBar.module.css";

interface Props {
  indexOpen: boolean;
  workRef: Ref<HTMLButtonElement>;
  powered: boolean;
  onWork(): void;
  onAbout(): void;
  onContact(): void;
  onPower(): void;
  onHome(): void;
}

export default function TopBar({ indexOpen, workRef, powered, onWork, onAbout, onContact, onPower, onHome }: Props) {
  return (
    <header className={s.bar}>
      <a
        className={s.wordmark}
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onHome();
        }}
        aria-label="PrimordialRune, Omar Golinelli: back to the desk"
      >
        <span className={s.wmA}>PRIMORDIAL</span>
        <span className={s.wmB}>RUNE</span>
      </a>
      <nav className={s.nav} aria-label="Main">
        <button type="button" ref={workRef} className={s.navItem} aria-expanded={indexOpen} aria-controls="nd-index" onClick={onWork}>
          <span>WORK</span>
          <span className={s.kana}>ワーク</span>
        </button>
        <button type="button" className={s.navItem} onClick={onAbout}>
          <span>ABOUT</span>
          <span className={s.kana}>アバウト</span>
        </button>
        <button type="button" className={s.navItem} onClick={onContact}>
          <span>CONTACT</span>
          <span className={s.kana}>コンタクト</span>
        </button>
      </nav>
      <div className={s.right}>
        <MotionToggle />
        <PowerButton powered={powered} onToggle={onPower} />
      </div>
    </header>
  );
}
