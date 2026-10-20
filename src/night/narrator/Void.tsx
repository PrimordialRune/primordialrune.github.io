"use client";
// The corrupted file: a glimpse of later. The desk is gone (objects, card, the CRT's
// light); only the empty mat and one pixel line remain. After 2.6s, or any click or key,
// a 200ms glitch brings the desk back, and the narrator says it shouldn't have happened.
// QUIET: hard cuts both ways.
import { useCallback, useEffect, useRef, useState } from "react";
import { emitStory } from "../bus";
import { glitch } from "./glitch";
import { BEATS, cleanLine } from "./lines";
import styles from "./void.module.css";

const BEAT_MS = 700;
const STAY_MS = 2600;

export default function Void({ onExit }: { onExit(): void }) {
  const ref = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);
  const [lineOn, setLineOn] = useState(false);

  const exit = useCallback(async () => {
    if (leaving.current) return;
    leaving.current = true;
    await glitch(ref.current, 200);
    emitStory({ type: "void-exit" });
    onExit();
  }, [onExit]);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    const show = setTimeout(() => setLineOn(true), BEAT_MS);
    const leave = setTimeout(exit, BEAT_MS + STAY_MS);
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      exit();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(show);
      clearTimeout(leave);
      window.removeEventListener("keydown", onKey);
    };
  }, [exit]);

  return (
    <div
      ref={ref}
      className={styles.void}
      role="dialog"
      aria-modal="true"
      aria-label="The desk is empty. Press any key to return."
      tabIndex={-1}
      onClick={exit}
    >
      <p className={styles.line} data-on={lineOn ? "1" : undefined}>
        {BEATS.voidLine}
      </p>
      <p className={styles.srOnly} aria-live="polite">
        {lineOn ? cleanLine(BEATS.voidLine) : ""}
      </p>
    </div>
  );
}
