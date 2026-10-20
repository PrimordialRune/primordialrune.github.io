"use client";

// Contact: Omar's business card. On the desk it is a real card with the details printed
// plainly (P2: contact in zero clicks; the links work from the desk). Clicking the card,
// not a link, turns it over: 4 stepped frames (a diegetic object, P6). The back has big
// links and a copy-email button. Esc or ✕ turns it back, then calls onClose.

import { useEffect, useId, useRef, useState } from "react";
import type { Ref } from "react";
import { LOGO_INNER, LOGO_OUTER } from "@/lib/logo";
import { emitStory } from "../bus";
import { CONTACT_EMAIL, CONTACT_LINKS } from "../content/projects";
import { FRAME_MS, focusById, useDialogKeys, useQuiet } from "../manual/hooks";
import s from "./Paper.module.css";

interface CardProps {
  variant: "desk" | "open";
  onOpen?(): void;
  onClose?(): void;
  titleRef?: Ref<HTMLHeadingElement>;
}

// scaleX per frame and which face shows: front, edge, back
const FLIP: { sx: number; face: "front" | "back" }[] = [
  { sx: 1, face: "front" },
  { sx: 0.45, face: "front" },
  { sx: 0.45, face: "back" },
  { sx: 1, face: "back" },
];

function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 554.72 555" width={size} height={size} aria-hidden="true" className={s.cardLogo}>
      <path d={LOGO_OUTER} fill="var(--peacock-blue, #102f41)" />
      <path d={LOGO_INNER} fill="var(--blood-orange, #ec563b)" />
    </svg>
  );
}

function Front({ tabbable }: { tabbable: boolean }) {
  return (
    <div className={s.cardFace}>
      <div className={s.cardTop}>
        <Logo />
        <span className={s.cardBrand}>PRIMORDIALRUNE</span>
      </div>
      <p className={s.cardName}>Omar Golinelli</p>
      <p className={s.cardRole}>
        <span>Game designer</span>
        <span className={s.kana} lang="ja">
          ゲームデザイナー
        </span>
      </p>
      <ul className={s.cardLinks}>
        {CONTACT_LINKS.map((l) => (
          <li key={l.id}>
            <span className={s.cardKey}>{l.label}</span>
            <a
              href={l.href}
              className={s.cardLink}
              tabIndex={tabbable ? undefined : -1}
              {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {l.value}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeskCard({ onOpen }: { onOpen?(): void }) {
  return (
    <article className={s.card} aria-label="Omar's business card" onPointerEnter={(e) => e.pointerType !== "touch" && emitStory({ type: "hover", id: "card" })}>
      {/* the card body is the button; the links sit above it */}
      <button type="button" className={s.cardTurn} onClick={onOpen} aria-label="Turn the business card over">
        <span className={s.cardTurnHint} aria-hidden="true">
          ↻
        </span>
      </button>
      <Front tabbable />
    </article>
  );
}

function OpenCard({ onClose, titleRef }: { onClose?(): void; titleRef?: Ref<HTMLHeadingElement> }) {
  const quiet = useQuiet();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState(() => (quiet ? 3 : 0));
  const [closing, setClosing] = useState(false);
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // turn over on open; focus lands on the back's heading once it faces up
  useEffect(() => {
    if (quiet) {
      setFrame(3);
      requestAnimationFrame(() => focusById(titleId));
      emitStory({ type: "flip", id: "card" });
      return;
    }
    // focus the dialog itself straight away, so keys work during the flip
    panelRef.current?.focus({ preventScroll: true });
    [1, 2, 3].forEach((f) =>
      timers.current.push(
        window.setTimeout(() => {
          setFrame(f);
          if (f === 3) {
            focusById(titleId);
            emitStory({ type: "flip", id: "card" });
          }
        }, FRAME_MS * f),
      ),
    );
    // once, on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (closing) return;
    if (quiet) {
      onClose?.();
      return;
    }
    setClosing(true);
    [2, 1, 0].forEach((f, i) =>
      timers.current.push(window.setTimeout(() => setFrame(f), FRAME_MS * (i + 1))),
    );
    timers.current.push(window.setTimeout(() => onClose?.(), FRAME_MS * 4));
  };
  const onKeyDown = useDialogKeys(panelRef, close);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    timers.current.push(window.setTimeout(() => setCopied(""), 2400));
  };

  const f = FLIP[frame];
  const back = f.face === "back";

  return (
    <div className={s.root}>
      <div className={s.scrim} onClick={close} aria-hidden="true" />
      <div
        ref={panelRef}
        className={s.openWrap}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <button type="button" className={s.close} onClick={close} aria-label="Turn the card back over and close">
          <span aria-hidden="true">✕</span>
        </button>
        <div className={`${s.card} ${s.cardBig}`} style={{ transform: `scaleX(${f.sx})` }}>
          <div className={s.cardFront} hidden={back} aria-hidden={back || undefined}>
            <Front tabbable={false} />
          </div>
          <div className={`${s.cardFace} ${s.cardBack}`} hidden={!back}>
            <h1 id={titleId} ref={titleRef} tabIndex={-1} className={s.backTitle}>
              <span>Contact</span>
              <span className={s.kana} lang="ja">
                コンタクト
              </span>
            </h1>
            <ul className={s.bigLinks}>
              {CONTACT_LINKS.map((l) => (
                <li key={l.id}>
                  <a
                    href={l.href}
                    className={s.bigLink}
                    {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    <span className={s.bigKey}>{l.label}</span>
                    <span className={s.bigValue}>{l.value}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className={s.copyRow}>
              <button type="button" className={s.copyBtn} onClick={copy}>
                Copy email
              </button>
              <span className={s.copyStatus} role="status" aria-live="polite">
                {copied === "ok" ? "Copied to the clipboard." : copied === "fail" ? `Couldn't copy. It's ${CONTACT_EMAIL}.` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Card({ variant, onOpen, onClose, titleRef }: CardProps) {
  return variant === "desk" ? <DeskCard onOpen={onOpen} /> : <OpenCard onClose={onClose} titleRef={titleRef} />;
}
