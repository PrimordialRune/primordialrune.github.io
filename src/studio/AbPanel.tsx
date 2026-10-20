"use client";

// ?ab review panel: MOTION, act jump (0–4), SPEED (gsap.globalTimeline.timeScale), RESET.
// Dev and review only, hidden otherwise.

import { useState, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { useGame } from "./ctx";
import { useMotionSetting } from "./Frame";
import { writeMotionSetting, type MotionSetting } from "@/lib/motion";
import { eraseAll } from "./persist";
import type { Act } from "./story";

const noop = () => () => {};
const hasAb = () => new URLSearchParams(window.location.search).has("ab");

export default function AbPanel() {
  const on = useSyncExternalStore(noop, hasAb, () => false);
  const { story, dispatch, enterHub } = useGame();
  const { setting, sys } = useMotionSetting();
  const [speed, setSpeed] = useState(1);
  if (!on) return null;
  return (
    <aside className="ab" aria-label="Review panel">
      <div className="ab-row">
        <span>MOTION</span>
        {(["auto", "full", "quiet"] as MotionSetting[]).map((m) => (
          <button key={m} type="button" aria-pressed={setting === m} onClick={() => writeMotionSetting(m)}>
            {m}
          </button>
        ))}
        <small>system: {sys ? "reduce" : "no-preference"}</small>
      </div>
      <div className="ab-row">
        <span>ACT {story.act}</span>
        {([0, 1, 2, 3, 4] as Act[]).map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={story.act === a}
            onClick={() => {
              dispatch({ type: "DEBUG_ACT", act: a });
              if (a === 4 || a === 3) enterHub();
            }}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="ab-row">
        <span>SPEED</span>
        {[0.1, 0.25, 0.5, 1].map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={speed === s}
            onClick={() => {
              setSpeed(s);
              gsap.globalTimeline.timeScale(s);
            }}
          >
            {s}×
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            eraseAll();
            window.location.replace(window.location.pathname + "?ab");
          }}
        >
          RESET
        </button>
      </div>
    </aside>
  );
}
