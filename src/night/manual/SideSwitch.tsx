"use client";

// Crossfader's SIDE switch. Flipping the side is the game's own mechanic, so choosing a side
// turns the BIG tape over in the walkman that stays on the desk beside the manual (the
// walkman listens on src/night/tape.ts and answers on its PLAY frame). The manual body
// swaps when the walkman says PLAY: a hard swap on a frame, never a fade (P3). If the
// walkman doesn't answer (not mounted, or a phone where it is hidden), the body swaps after
// a fallback. Quiet mode: the request still goes out, and the body swaps at once.

import { useEffect, useRef, useState } from "react";
import { emitStory } from "../bus";
import { onTapeFlipDone, requestTapeFlip } from "../tape";
import type { Side } from "../types";
import { useQuiet } from "./hooks";
import s from "./Manual.module.css";

/** the walkman's flip takes about 0.9s; past this the manual swaps on its own */
const FALLBACK_MS = 1500;

const LABELS: Record<Side, { title: string; jp: string }> = {
  A: { title: "The Game", jp: "ゲーム" },
  B: { title: "Making Of", jp: "メイキング" },
};

export default function SideSwitch({ side, onSide }: { side: Side; onSide(s: Side): void }) {
  const quiet = useQuiet();
  const [pending, setPending] = useState<Side | null>(null);
  const fallback = useRef<number | null>(null);
  const onSideRef = useRef(onSide);
  useEffect(() => {
    onSideRef.current = onSide;
  }, [onSide]);

  // the walkman answers on its PLAY frame: that is when the page turns over
  useEffect(() => {
    if (!pending) return;
    const done = (to: Side) => {
      if (to !== pending) return;
      if (fallback.current) window.clearTimeout(fallback.current);
      fallback.current = null;
      setPending(null);
      onSideRef.current(to);
    };
    const off = onTapeFlipDone(done);
    fallback.current = window.setTimeout(() => done(pending), FALLBACK_MS);
    return () => {
      off();
      if (fallback.current) window.clearTimeout(fallback.current);
      fallback.current = null;
    };
  }, [pending]);

  const flip = (to: Side) => {
    if (to === side || pending) return;
    emitStory({ type: "flip", id: "crossfader" });
    requestTapeFlip(to);
    if (quiet) onSide(to);
    else setPending(to);
  };

  const shown = pending ?? side;

  return (
    <div className={s.sideSwitch} data-pending={pending ? "" : undefined}>
      <p className={s.sideNow} aria-hidden="true">
        <span className={s.sideStamp}>{side}</span>
        <span className={s.sideHint}>
          {pending ? "Turning the tape over…" : "Turn the tape over in the walkman"}
          <span className={s.kana} lang="ja">
            カセット
          </span>
        </span>
      </p>
      <div role="radiogroup" aria-label="Cassette side" aria-busy={pending ? true : undefined} className={s.sides}>
        {(["A", "B"] as Side[]).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={shown === k}
            className={s.sideBtn}
            onClick={() => flip(k)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                const next: Side = shown === "A" ? "B" : "A";
                flip(next);
                (e.currentTarget.parentElement?.querySelector(`[data-side="${next}"]`) as HTMLElement | null)?.focus();
              }
            }}
            tabIndex={shown === k ? 0 : -1}
            data-side={k}
          >
            <span className={s.sideName}>SIDE {k}</span>
            <span className={s.sideTitle}>{LABELS[k].title}</span>
            <span className={s.kana} lang="ja">
              {LABELS[k].jp}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
