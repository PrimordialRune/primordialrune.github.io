"use client";

// MOTION [AUTO] [FULL] [QUIET]: the retro layer's quiet setting (P2), always in view.
// When AUTO resolves to quiet because the system asked, it says so and FULL is one click away.
import { useRef, type KeyboardEvent } from "react";
import { writeMotionSetting, type MotionSetting } from "@/lib/motion";
import { useMotionLevel, useMotionSetting } from "../useMotionLevel";
import s from "./TopBar.module.css";

const OPTIONS: { id: MotionSetting; label: string }[] = [
  { id: "auto", label: "AUTO" },
  { id: "full", label: "FULL" },
  { id: "quiet", label: "QUIET" },
];

export default function MotionToggle() {
  const setting = useMotionSetting();
  const level = useMotionLevel();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const autoQuiet = setting === "auto" && level === "quiet";

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + OPTIONS.length) % OPTIONS.length;
    writeMotionSetting(OPTIONS[n].id);
    refs.current[n]?.focus();
  };

  return (
    <div className={s.motion}>
      <span className={s.motionLabel} id="nd-motion-label">
        <span>MOTION</span>
        <span className={s.kana}>モーション</span>
      </span>
      <div className={s.segments} role="radiogroup" aria-labelledby="nd-motion-label" aria-describedby={autoQuiet ? "nd-motion-note" : undefined}>
        {OPTIONS.map((o, i) => {
          const checked = setting === o.id;
          return (
            <button
              key={o.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              className={s.segment}
              data-checked={checked ? "" : undefined}
              data-suggest={autoQuiet && o.id === "full" ? "" : undefined}
              onClick={() => writeMotionSetting(o.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {autoQuiet && (
        <span className={s.motionNote} id="nd-motion-note">
          AUTO · your system asked for less motion
        </span>
      )}
    </div>
  );
}
