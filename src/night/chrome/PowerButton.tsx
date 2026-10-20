"use client";

// The Trinitron's power switch, in the chrome: switching the set off mutes the narrator
// (a diegetic mute) and leaves the desk in moonlight.
import s from "./TopBar.module.css";

export default function PowerButton({ powered, onToggle }: { powered: boolean; onToggle(): void }) {
  return (
    <button
      type="button"
      className={s.power}
      aria-pressed={powered}
      aria-label={powered ? "Screen on. Switch it off to mute the narrator" : "Screen off. Switch it on"}
      title={powered ? "Switch the screen off (mutes the narrator)" : "Switch the screen on"}
      data-on={powered ? "" : undefined}
      onClick={onToggle}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M12 3v8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M7.1 6.2a7.5 7.5 0 1 0 9.8 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </svg>
    </button>
  );
}
