"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { lineFor, onUtterance, type Choice, type Utterance } from "@/studio/lib/narrator";
import { useMotion } from "@/studio/lib/motion";
import { nameTags } from "@/studio/data/lines";

// The narrator: the AI wearing Omar's voice, speaking from Omar's logo.
// "tv": a dialogue box across the bottom of the glass (under the TV on phones).
// "dock": in a guide, the logo docks bottom-right and lines are a one-line toast.
// Every line is skippable; the × turns the narrator off (P2).

const ABOUT_OMAR = /\b(omar|he|him|his|me)\b/gi;

/** Where focus goes when the box closes under it: the thing the visitor was on */
function focusHome() {
  const el =
    document.querySelector<HTMLElement>(".save-file[data-active]") ??
    document.querySelector<HTMLElement>('.shelf-item[aria-selected="true"]') ??
    document.querySelector<HTMLElement>(".dock-logo");
  el?.focus({ preventScroll: true });
}

function Voice({ text, stage }: { text: string; stage: number }) {
  if (stage !== 1) return <>{text}</>;
  // Stage 1: nouns about Omar slip into the machine's face
  const parts = text.split(ABOUT_OMAR);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <span key={i} className="voice-slip">
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}

export function NameTag({ stage, override, tagRef }: { stage: number; override?: string | null; tagRef?: React.Ref<HTMLSpanElement> }) {
  const t = nameTags[Math.min(stage, 3) as 0 | 1 | 2 | 3];
  return (
    <span ref={tagRef} className="name-tag" data-stage={stage}>
      {t.ariaLabel && <span className="sr-only">Speaker: {t.ariaLabel}. </span>}
      <span className="tag-text" aria-hidden>
        {override ?? t.tag}
      </span>
      {t.redBlock && <span className="tag-block" aria-hidden />}
    </span>
  );
}

export default function Narrator({
  variant,
  stage,
  enabled,
  onTurnOff,
  onLogo,
  tagRef,
  tagOverride,
}: {
  variant: "tv" | "dock";
  stage: number;
  enabled: boolean;
  onTurnOff: () => void;
  onLogo: () => void;
  tagRef?: React.Ref<HTMLSpanElement>;
  tagOverride?: string | null;
}) {
  const motion = useMotion();
  const [utt, setUtt] = useState<Utterance | null>(null);
  const [index, setIndex] = useState(0);
  const [typedRaw, setTyped] = useState(0);
  const [visible, setVisible] = useState(false);
  const last = useRef<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const root = useRef<HTMLDivElement>(null);
  // Called before the box closes: if focus was inside, bring it back out (P2)
  const release = useCallback(() => {
    const r = root.current;
    if (r && r.contains(document.activeElement)) window.setTimeout(focusHome, 0);
  }, []);
  const [wasEnabled, setWasEnabled] = useState(enabled);

  // Turning the narrator off: one farewell line, then silence (the logo stays)
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled);
    if (!enabled) {
      setUtt({ lines: [lineFor("narratorOff") ?? "* fine. i'll be quiet. i'm still here."], script: false });
      setIndex(0);
      setTyped(0);
      setVisible(true);
    }
  }

  const line = utt?.lines[index] ?? null;
  // Type-on at 40 chars/s (FULL); SOFT shows the whole line
  const typed = motion === "soft" && line ? line.length : typedRaw;
  const done = line !== null && typed >= line.length;
  const isLast = utt ? index >= utt.lines.length - 1 : true;
  const choices: Choice[] | undefined = isLast && done ? utt?.choices : undefined;

  useEffect(
    () =>
      onUtterance((u) => {
        setUtt(u);
        setIndex(0);
        setTyped(0);
        setVisible(true);
      }),
    [],
  );

  useEffect(() => {
    if (!line || typed >= line.length) return;
    const id = window.setTimeout(() => setTyped((n) => n + 1), 25);
    return () => window.clearTimeout(id);
  }, [line, typed, motion]);

  useEffect(() => {
    if (line) last.current = line;
  }, [line]);

  const finish = useCallback(() => {
    const u = utt;
    release();
    setVisible(false);
    setUtt(null);
    if (u && !u.choices) u.onDone?.();
  }, [utt, release]);

  const advance = useCallback(() => {
    if (!utt || !line) return;
    if (typed < line.length) return setTyped(line.length);
    if (!isLast) {
      setIndex((i) => i + 1);
      setTyped(0);
      return;
    }
    if (!utt.choices) finish();
  }, [utt, line, typed, isLast, finish]);

  // Scripts move on by themselves; single lines fade after a while
  useEffect(() => {
    window.clearTimeout(timer.current);
    if (!utt || !done || choices) return;
    const wait = utt.script ? 1600 + line!.length * 30 : variant === "dock" || !enabled ? 4000 : 6000;
    timer.current = window.setTimeout(advance, wait);
    return () => window.clearTimeout(timer.current);
  }, [utt, done, choices, line, advance, variant, enabled]);

  const skipAll = () => {
    if (!utt) return;
    if (utt.choices) {
      setIndex(utt.lines.length - 1);
      setTyped(utt.lines[utt.lines.length - 1].length);
      return;
    }
    finish();
  };

  const choose = (c: Choice) => {
    const u = utt;
    release();
    setVisible(false);
    setUtt(null);
    u?.onChoice?.(c.value);
  };

  const pixelType = stage >= 2;
  const open = visible && !!line;
  // One announcement per line, whole, from a region that is always there (no per-character
  // updates, and never inside the inert box)
  const live = (
    <span className="sr-only" aria-live="polite">
      {open ? line : ""}
    </span>
  );

  if (variant === "dock") {
    return (
      <div className="narrator-dock" ref={root}>
        {live}
        {visible && line && (
          <div className="dock-toast" data-pixel={pixelType || undefined}>
            <NameTag stage={stage} />
            <button className="dock-line" onClick={advance}>
              <span className="sr-only">{line}</span>
              <span aria-hidden>
                <Voice text={line.slice(0, typed)} stage={stage} />
              </span>
            </button>
            {choices && (
              <span className="nar-choices">
                {choices.map((c) => (
                  <button key={c.value} onClick={() => choose(c)}>
                    {c.label}
                  </button>
                ))}
              </span>
            )}
          </div>
        )}
        <button
          className="dock-logo"
          aria-label={enabled ? "Narrator: show the last line again" : "Narrator is off"}
          onClick={() => {
            if (!enabled) return onLogo();
            const again = last.current;
            if (again && !visible) {
              setUtt({ lines: [again], script: false });
              setIndex(0);
              setTyped(again.length);
              setVisible(true);
            } else onLogo();
          }}
        >
          <Logo stage={stage} size={40} outer="var(--cream)" title={stage >= 2 ? "a reflection" : undefined} />
        </button>
      </div>
    );
  }

  return (
    <>
      {live}
      <div ref={root} className="narrator" data-open={open ? "" : undefined} data-pixel={pixelType || undefined}>
        <div className="nar-box" inert={!open || undefined}>
          <button className="nar-face" onClick={onLogo} aria-label="The narrator's logo">
            <Logo stage={stage} size={36} outer="var(--cream)" title={stage >= 2 ? "a reflection" : undefined} />
          </button>
          <div className="nar-main">
            <NameTag stage={stage} tagRef={tagRef} override={tagOverride} />
            <div className="nar-text" onClick={advance}>
              <span aria-hidden>
                <Voice text={line ? line.slice(0, typed) : ""} stage={stage} />
              </span>
            </div>
            {choices && (
              <div className="nar-choices">
                {choices.map((c) => (
                  <button key={c.value} onClick={() => choose(c)}>
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="nar-ctl">
            <button className="nar-skip" onClick={skipAll}>
              SKIP ▸
            </button>
            {enabled && (
              <button
                className="nar-off"
                onClick={(e) => {
                  // × unmounts; keep focus in the box on the face while the farewell plays
                  if (e.currentTarget === document.activeElement) root.current?.querySelector<HTMLElement>(".nar-face")?.focus();
                  onTurnOff();
                }}
                aria-label="Turn off narrator"
                title="TURN OFF NARRATOR"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
