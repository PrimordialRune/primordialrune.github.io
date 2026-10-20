"use client";

// Crossfader's SIDE switch. Flipping the side is the game's own mechanic, so the manual
// flips a tape too: eject (2 frames), turn over on Y (4 frames, the label swaps at the
// edge), reinsert (3), PLAY (1). The body swaps on the PLAY frame. Stepped at 12fps (P6),
// never a fade (P3). Quiet mode: hard cut to the same end state.

import { useEffect, useRef, useState } from "react";
import { emitStory } from "../bus";
import type { Side } from "../types";
import { FRAME_MS, useQuiet } from "./hooks";
import s from "./Manual.module.css";

interface Frame {
  y: number;
  sx: number;
  label: "from" | "to";
  play?: boolean;
}

const FRAMES: Frame[] = [
  { y: -3, sx: 1, label: "from" },
  { y: -7, sx: 1, label: "from" },
  { y: -7, sx: 0.5, label: "from" },
  { y: -7, sx: 0.12, label: "from" },
  { y: -7, sx: 0.5, label: "to" },
  { y: -7, sx: 1, label: "to" },
  { y: -5, sx: 1, label: "to" },
  { y: -2, sx: 1, label: "to" },
  { y: 0, sx: 1, label: "to" },
  { y: 0, sx: 1, label: "to", play: true },
];

const LABELS: Record<Side, { title: string; jp?: string }> = {
  A: { title: "The Game" },
  B: { title: "Making Of", jp: "メイキング" },
};

// Crossfader's own cassette colours (from its label art; object palette, P4)
function Tape({ side }: { side: Side }) {
  return (
    <svg viewBox="0 0 50 32" className={s.tape} aria-hidden="true" shapeRendering="crispEdges">
      <rect x="0" y="0" width="50" height="32" rx="2" fill="#ebc84a" />
      <rect x="3" y="2" width="44" height="20" rx="1" fill="#f1ead6" />
      <rect x="3" y="10" width="44" height="1.5" fill="#e0459b" />
      <rect x="3" y="11.5" width="44" height=".8" fill="#53b3c9" />
      <text x="7" y="9" fontSize="7" fontWeight="900" fill="#e0459b" fontFamily="var(--f-omar)">
        {side}
      </text>
      <rect x="13" y="13" width="24" height="7" rx="3.5" fill="#2e2828" />
      <circle cx="18" cy="16.5" r="2" fill="#f1ead6" />
      <circle cx="32" cy="16.5" r="2" fill="#f1ead6" />
      <path d="M10 32 L12.5 25 H37.5 L40 32 Z" fill="#d7b23a" />
    </svg>
  );
}

export default function SideSwitch({ side, onSide }: { side: Side; onSide(s: Side): void }) {
  const quiet = useQuiet();
  const [frame, setFrame] = useState<number | null>(null);
  const [target, setTarget] = useState<Side>(side);
  const timer = useRef<number | null>(null);
  const busy = frame !== null;

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const flip = (to: Side) => {
    if (to === side || busy) return;
    emitStory({ type: "flip", id: "crossfader" });
    if (quiet) {
      onSide(to);
      return;
    }
    setTarget(to);
    let i = 0;
    setFrame(0);
    const tick = () => {
      i += 1;
      if (i < FRAMES.length) {
        setFrame(i);
        if (FRAMES[i].play) onSide(to);
        timer.current = window.setTimeout(tick, FRAME_MS);
      } else {
        setFrame(null);
      }
    };
    timer.current = window.setTimeout(tick, FRAME_MS);
  };

  const f = frame !== null ? FRAMES[frame] : null;
  const shown: Side = f ? (f.label === "from" ? (target === "A" ? "B" : "A") : target) : side;

  return (
    <div className={s.sideSwitch}>
      <div className={s.deck} aria-hidden="true">
        <span
          className={s.tapeHolder}
          style={{ transform: f ? `translateY(${f.y}px) scaleX(${f.sx})` : undefined }}
        >
          <Tape side={shown} />
        </span>
        <span className={s.playKey} data-down={f?.play ? "true" : undefined}>
          ▶
        </span>
      </div>
      <div role="radiogroup" aria-label="Cassette side" className={s.sides}>
        {(["A", "B"] as Side[]).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={side === k}
            className={s.sideBtn}
            onClick={() => flip(k)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                const next: Side = side === "A" ? "B" : "A";
                flip(next);
                (e.currentTarget.parentElement?.querySelector(`[data-side="${next}"]`) as HTMLElement | null)?.focus();
              }
            }}
            tabIndex={side === k ? 0 : -1}
            data-side={k}
          >
            <span className={s.sideName}>SIDE {k}</span>
            <span className={s.sideTitle}>{LABELS[k].title}</span>
            {LABELS[k].jp && (
              <span className={s.kana} lang="ja">
                {LABELS[k].jp}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
