"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { isQuiet } from "@/lib/motion";
import { NARRATE_EVENT, TOPICS, nextLine } from "@/lib/narrator";
import { LOGO_INNER, LOGO_OUTER } from "@/lib/logo";

export const SPEAKING_EVENT = "primordialrune:narrator-speaking";


const CPS = 42; // characters per second
const HOLD_AFTER_TYPED = 2600; // before moving to the next queued line
const TOAST_LINGER = 4200; // a reaction off the hero fades after this
const IDLE_MS = 25000;

// The narrator's dialogue box. Docked on the hero (always there, the intro plays in it);
// everywhere else it pops up to react to what the visitor does, then goes away.
// Reactions interrupt immediately; a click finishes the line or skips to the next.
export default function Narrator({ docked }: { docked: boolean }) {
  const [queue, setQueue] = useState<string[]>([]);
  const [line, setLine] = useState("");
  const [typed, setTyped] = useState({ line: "", n: 0 });
  const [visible, setVisible] = useState(false);
  const [quiet] = useState(isQuiet);
  const typer = useRef<gsap.core.Tween | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const shown = quiet ? line : typed.line === line ? line.slice(0, typed.n) : "";
  const typing = visible && shown.length < line.length;

  const say = useCallback((lines: string[]) => {
    if (!lines.length) return;
    clearTimeout(timer.current);
    setLine(lines[0]);
    setQueue(lines.slice(1));
    setVisible(true);
  }, []);

  // Events from anywhere on the site
  useEffect(() => {
    const onNarrate = (e: Event) => {
      const { topic, script } = (e as CustomEvent<{ topic: string; script: boolean }>).detail;
      if (script) {
        const lines: string[] = [];
        for (let i = 0; i < (TOPICS[topic]?.numbered.length ?? 0); i++) {
          const l = nextLine(topic);
          if (l) lines.push(l);
        }
        say(lines);
      } else {
        const l = nextLine(topic);
        if (l) say([l]);
      }
    };
    window.addEventListener(NARRATE_EVENT, onNarrate);
    return () => window.removeEventListener(NARRATE_EVENT, onNarrate);
  }, [say]);

  // Typewriter
  useEffect(() => {
    if (!visible || !line || quiet) return;
    const count = { n: 0 };
    typer.current = gsap.to(count, {
      n: line.length,
      duration: line.length / CPS,
      ease: "none",
      onUpdate: () => setTyped({ line, n: Math.round(count.n) }),
    });
    return () => {
      typer.current?.kill();
    };
  }, [visible, line, quiet]);

  // After a line: the next one, or (off the hero) fade away
  useEffect(() => {
    if (!visible || typing) return;
    clearTimeout(timer.current);
    if (queue.length) timer.current = setTimeout(() => say(queue), HOLD_AFTER_TYPED);
    else if (!docked) timer.current = setTimeout(() => setVisible(false), TOAST_LINGER);
    return () => clearTimeout(timer.current);
  }, [visible, typing, queue, docked, say]);

  // The emblem (and anything else) can follow along while it talks
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(SPEAKING_EVENT, { detail: typing }));
  }, [typing]);

  // On the hero, it notices when nobody does anything for a while
  useEffect(() => {
    if (!docked) return;
    let id = setTimeout(function idle() {
      window.dispatchEvent(new CustomEvent(NARRATE_EVENT, { detail: { topic: "idle", script: false } }));
      id = setTimeout(idle, IDLE_MS * 2);
    }, IDLE_MS);
    const reset = () => {
      clearTimeout(id);
      id = setTimeout(function idle() {
        window.dispatchEvent(new CustomEvent(NARRATE_EVENT, { detail: { topic: "idle", script: false } }));
      }, IDLE_MS);
    };
    window.addEventListener("pointerdown", reset);
    window.addEventListener("keydown", reset);
    return () => {
      clearTimeout(id);
      window.removeEventListener("pointerdown", reset);
      window.removeEventListener("keydown", reset);
    };
  }, [docked]);

  const advance = () => {
    if (typing) typer.current?.progress(1);
    else if (queue.length) say(queue);
    else if (!docked) setVisible(false);
  };

  const open = visible || docked;

  return (
    <button
      className="narrator"
      data-docked={docked}
      data-in={open && Boolean(line)}
      onClick={advance}
      tabIndex={open && line ? 0 : -1}
      aria-label={line ? line.replace(/^\* /, "") : "Narrator"}
    >
      <span className="narrator-tag">
        <svg viewBox="0 0 555 555" aria-hidden="true">
          <path d={LOGO_OUTER} fill="currentColor" />
          <path d={LOGO_INNER} fill="var(--blood-orange)" />
        </svg>
        OMAR
      </span>
      <span className="narrator-text" aria-hidden="true">
        {shown}
        <span className="narrator-ghost">{line.slice(shown.length)}</span>
      </span>
      {!typing && queue.length > 0 && <span className="narrator-more" aria-hidden="true">▼</span>}
      <span className="sr-only" aria-live="polite">{typing ? "" : line}</span>
    </button>
  );
}
