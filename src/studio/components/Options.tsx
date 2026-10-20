"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { UI_SPRING, useMotion } from "@/studio/lib/motion";
import { profile } from "@/studio/data/projects";
import { ui } from "@/studio/data/script";

// OPTIONS: a spring panel (P6: UI on springs). MOTION, NARRATOR, RESET STORY, plus WORK and
// the contacts, so both stay reachable from anywhere, even after the ending.
export default function Options({
  open,
  focusContact,
  narrator,
  onClose,
  onMotion,
  onNarrator,
  onReset,
  onWork,
}: {
  open: boolean;
  focusContact: boolean;
  narrator: boolean;
  onClose: () => void;
  onMotion: (m: "full" | "soft") => void;
  onNarrator: (on: boolean) => void;
  onReset: () => void;
  onWork: () => void;
}) {
  const motion = useMotion();
  const panel = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open || !panel.current) return;
    const el = panel.current;
    gsap.fromTo(el, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: UI_SPRING.duration, ease: UI_SPRING.ease });
    const first = focusContact ? contactRef.current : el.querySelector<HTMLElement>("button, a");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [...el.querySelectorAll<HTMLElement>("button, a")];
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && i === items.length - 1) {
        e.preventDefault();
        items[0].focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, focusContact, onClose]);

  if (!open) return null;

  return (
    <div className="options-scrim" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panel} className="options" role="dialog" aria-modal="true" aria-label="Options">
        <div className="options-head">
          <h2>
            OPTIONS<small lang="ja">オプション</small>
          </h2>
          <button className="options-close" onClick={onClose} aria-label="Close options">
            ×
          </button>
        </div>

        <div className="opt-row">
          <div className="opt-label">
            MOTION<small lang="ja">モーション</small>
          </div>
          <div className="opt-seg" role="radiogroup" aria-label="Motion">
            {(["full", "soft"] as const).map((m) => (
              <button key={m} role="radio" aria-checked={motion === m} onClick={() => onMotion(m)}>
                {m.toUpperCase()}
                <small lang="ja">{m === "full" ? "フル" : "ソフト"}</small>
              </button>
            ))}
          </div>
        </div>
        <p className="opt-note">{ui.sr.motionNote}</p>

        <div className="opt-row">
          <div className="opt-label">
            NARRATOR<small lang="ja">ナレーター</small>
          </div>
          <div className="opt-seg" role="radiogroup" aria-label="Narrator">
            {[true, false].map((on) => (
              <button key={String(on)} role="radio" aria-checked={narrator === on} onClick={() => onNarrator(on)}>
                {on ? "ON" : "OFF"}
                <small lang="ja">{on ? "オン" : "オフ"}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="opt-row">
          <div className="opt-label">
            STORY<small lang="ja">ストーリー</small>
          </div>
          <button className="opt-btn" onClick={onReset}>
            RESET STORY<small lang="ja">リセット</small>
          </button>
        </div>

        <div className="opt-row opt-work">
          <div className="opt-label">
            WORK<small lang="ja">ゲーム</small>
          </div>
          <button className="opt-btn" onClick={onWork}>
            TO THE SHELF ▸<small lang="ja">たな</small>
          </button>
        </div>

        <div className="opt-contact">
          <div className="opt-label">
            CONTACT<small lang="ja">コンタクト</small>
          </div>
          <ul>
            {profile.contact.map((c, i) => (
              <li key={c.id}>
                <a ref={i === 0 ? contactRef : undefined} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  <b>{c.label.en}</b> <span>{c.value}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
