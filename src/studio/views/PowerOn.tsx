"use client";

// STANDBY → POWER-ON: the gold standby dot, then a horizontal phosphor line opens into the
// picture (≤ 1.2 s). Any key, click or tap skips straight to the title.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGame } from "../ctx";
import { quiet } from "../fx";
import { writePowered } from "../persist";

export default function PowerOn() {
  const { go, story, headingRef } = useGame();
  const root = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const finish = () => {
      if (done.current) return;
      done.current = true;
      writePowered(true);
      go(story.act === 4 ? { kind: "void" } : { kind: "title" }, { replace: true });
    };
    const line = el.querySelector(".po-line");
    const dot = el.querySelector(".po-dot");
    let tl: gsap.core.Timeline;
    if (quiet()) {
      tl = gsap.timeline({ onComplete: finish }).set(line, { scaleX: 1, scaleY: 1, autoAlpha: 1 }, 0.3).set({}, {}, 0.6);
    } else {
      tl = gsap
        .timeline({ onComplete: finish, delay: 0.25 })
        .to(dot, { autoAlpha: 0, duration: 0.05 })
        .fromTo(line, { scaleX: 0, scaleY: 0.004, autoAlpha: 1 }, { scaleX: 1, duration: 0.3, ease: "expo.out" })
        .to(line, { scaleY: 1, duration: 0.3, ease: "expo.inOut" })
        .to(line, { autoAlpha: 0, duration: 0.25 });
    }
    const skip = (e: Event) => {
      if (e instanceof KeyboardEvent && (e.key === "Tab" || e.key === "Shift")) return;
      tl.kill();
      finish();
    };
    window.addEventListener("keydown", skip);
    el.addEventListener("pointerdown", skip);
    return () => {
      tl.kill();
      window.removeEventListener("keydown", skip);
      el.removeEventListener("pointerdown", skip);
    };
  }, [go, story.act]);

  return (
    <div className="view po" ref={root}>
      <h1 className="sr-only" tabIndex={-1} ref={headingRef}>
        Turning the TV on. Press any key to skip.
      </h1>
      <span className="po-dot" aria-hidden="true" />
      <span className="po-line" aria-hidden="true" />
      <span className="po-hint v-machine" aria-hidden="true">
        PRESS ANY KEY
      </span>
    </div>
  );
}
