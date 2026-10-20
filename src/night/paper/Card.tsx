"use client";

// Contact: Omar's business card. On the desk it is a real card with the details printed
// plainly (P2: contact in zero clicks; the links work from the desk). Clicking the card,
// not a link, picks it up: it springs from its place on the mat to the centre (interface
// motion), then turns over in 4 stepped frames (a diegetic object, P6). The back has big
// links and a copy-email button. Esc or ✕ (on the card) turns it back and puts it down.

import gsap from "gsap";
import { useEffect, useId, useRef, useState } from "react";
import type { Ref } from "react";
import { LOGO_INNER, LOGO_OUTER } from "@/lib/logo";
import { springEase } from "@/lib/motion";
import { emitStory } from "../bus";
import { CONTACT_EMAIL, CONTACT_LINKS } from "../content/projects";
import { getOriginRect } from "../desk/originRect";
import { FRAME_MS, focusById, useDialogKeys, useIsoLayoutEffect, useQuiet, useTopInset } from "../manual/hooks";
import s from "./Paper.module.css";

const TRAVEL = springEase(190, 24);

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

/** the origin is usable only when the desk card is actually on screen */
function visibleRect(r: DOMRect | null): DOMRect | null {
  if (!r || r.width < 8 || r.height < 8) return null;
  if (r.bottom <= 0 || r.right <= 0 || r.top >= window.innerHeight || r.left >= window.innerWidth) return null;
  return r;
}

function OpenCard({ onClose, titleRef }: { onClose?(): void; titleRef?: Ref<HTMLHeadingElement> }) {
  const quiet = useQuiet();
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState(() => (quiet ? 3 : 0));
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const timers = useRef<number[]>([]);
  const closing = useRef(false);
  const ready = useRef(quiet);
  useTopInset(rootRef);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      if (cardRef.current) gsap.killTweensOf(cardRef.current);
    },
    [],
  );

  /** the transform that lays the big card exactly over the card on the desk */
  const fromOrigin = () => {
    const el = cardRef.current;
    const o = visibleRect(getOriginRect("card"));
    if (!el || !o) return null;
    const prev = el.style.transform;
    el.style.transform = "none";
    const R = el.getBoundingClientRect();
    el.style.transform = prev;
    return { x: o.left - R.left, y: o.top - R.top, scaleX: o.width / R.width, scaleY: o.height / R.height };
  };

  // open: the card springs from its place on the mat to the centre, face up, then turns
  // over in 4 stepped frames; focus lands on the back's heading once it faces up
  useIsoLayoutEffect(() => {
    if (quiet) {
      requestAnimationFrame(() => focusById(titleId));
      emitStory({ type: "flip", id: "card" });
      return;
    }
    // focus the dialog itself straight away, so keys work during the flip
    panelRef.current?.focus({ preventScroll: true });
    const turnOver = () =>
      [1, 2, 3].forEach((f) =>
        timers.current.push(
          window.setTimeout(() => {
            setFrame(f);
            if (f === 3) {
              ready.current = true;
              focusById(titleId);
              emitStory({ type: "flip", id: "card" });
            }
          }, FRAME_MS * f),
        ),
      );
    const el = cardRef.current;
    gsap.fromTo(`.${s.scrim}`, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none" });
    const from = fromOrigin();
    if (el && from) {
      gsap.fromTo(
        el,
        { ...from, transformOrigin: "0 0" },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: TRAVEL.duration, ease: TRAVEL.ease, onComplete: turnOver },
      );
    } else {
      if (el) gsap.fromTo(el, { y: 40, scale: 0.96 }, { y: 0, scale: 1, duration: TRAVEL.duration, ease: TRAVEL.ease });
      turnOver();
    }
    // once, on open
     
  }, []);

  // close: turn back over (4 frames), then the card springs back to its place on the mat
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const el = cardRef.current;
    if (quiet || !ready.current || !el) {
      onClose?.();
      return;
    }
    [2, 1, 0].forEach((f, i) => timers.current.push(window.setTimeout(() => setFrame(f), FRAME_MS * (i + 1))));
    timers.current.push(
      window.setTimeout(() => {
        const to = fromOrigin();
        if (!to) {
          onClose?.();
          return;
        }
        gsap.to(`.${s.scrim}`, { opacity: 0, duration: 0.2, ease: "none" });
        gsap.to(el, { ...to, transformOrigin: "0 0", duration: TRAVEL.duration * 0.8, ease: TRAVEL.ease, onComplete: () => onClose?.() });
      }, FRAME_MS * 4),
    );
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
    <div className={s.root} ref={rootRef}>
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
        {/* the travelling card; its inner face turns over on stepped frames */}
        <div ref={cardRef} className={s.cardMover}>
          <div className={`${s.card} ${s.cardBig}`} style={{ transform: `scaleX(${f.sx})` }} data-face={f.face}>
            <div className={s.cardFront} hidden={back} aria-hidden={back || undefined}>
              <Front tabbable={false} />
            </div>
            <div className={`${s.cardFace} ${s.cardBack}`} hidden={!back}>
              <button type="button" className={`${s.close} ${s.cardClose}`} onClick={close} aria-label="Turn the card back over and close">
                <span aria-hidden="true">✕</span>
              </button>
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
    </div>
  );
}

export default function Card({ variant, onOpen, onClose, titleRef }: CardProps) {
  return variant === "desk" ? <DeskCard onOpen={onOpen} /> : <OpenCard onClose={onClose} titleRef={titleRef} />;
}
