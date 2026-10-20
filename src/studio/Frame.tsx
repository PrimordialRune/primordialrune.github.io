"use client";

// The frame: Omar's own handwriting around the TV. The AI can't touch it (data-protected), so
// WORK and CONTACT are always one click away, in every act, even after the ending.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useGame } from "./ctx";
import { FrameLogo } from "./Logo";
import {
  readMotionSetting,
  subscribeMotion,
  systemReducesMotion,
  writeMotionSetting,
  type MotionSetting,
} from "@/lib/motion";
import { say } from "./narrator/narrator";
import { eraseAll } from "./persist";
import { SLUGS } from "./story";

const noop = () => () => {};

export function useMotionSetting() {
  const setting = useSyncExternalStore(subscribeMotion, readMotionSetting, () => "auto" as MotionSetting);
  const sys = useSyncExternalStore(
    (fn) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", fn);
      return () => mq.removeEventListener("change", fn);
    },
    systemReducesMotion,
    () => false,
  );
  return { setting, sys };
}

/** The strip's markup, shared with the static first paint (links are plain hash links there) */
export function FrameIdentity() {
  return (
    <div className="strip-id">
      <FrameLogo size={24} />
      <p className="strip-name">
        <span className="strip-omar" data-frame-name>
          Omar Golinelli
        </span>
        <span className="strip-role"> · Game designer &amp; developer</span>
      </p>
    </div>
  );
}

export function Label({ en, jp }: { en: string; jp: string }) {
  return (
    <span className="lbl">
      <span className="lbl-en">{en}</span>
      <span className="lbl-jp" lang="ja">
        {jp}
      </span>
    </span>
  );
}

export default function Frame() {
  const { story, dispatch, go, openRecord, view } = useGame();
  const { setting, sys } = useMotionSetting();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);

  const motionLabel = setting === "auto" ? `AUTO (${sys ? "QUIET" : "FULL"})` : setting.toUpperCase();
  const direct = story.mode === "direct";

  const cycleMotion = () => {
    const next: MotionSetting = setting === "auto" ? "full" : setting === "full" ? "quiet" : "auto";
    writeMotionSetting(next);
    if (story.act >= 1) say(`motion.${next}`);
  };

  const toggleStory = () => {
    const mode = direct ? "story" : "direct";
    dispatch({ type: "SET_MODE", mode });
    say(mode === "direct" ? "story.off" : "story.on", { force: true, interrupt: true });
  };

  const work = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setMenu(false);
    const focus = view.kind === "record" ? view.focus : view.kind === "manual" ? view.slug : SLUGS[0];
    if (view.kind === "manual") window.dispatchEvent(new Event("studio:eject"));
    else openRecord(focus);
  };
  const contact = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setMenu(false);
    go({ kind: "contact" });
    say("contact.enter");
  };

  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof PointerEvent && menuRef.current?.contains(e.target as Node)) return;
      setMenu(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [menu]);

  const erase = () => {
    eraseAll();
    window.location.replace(window.location.pathname);
  };

  return (
    <>
      <a className="skip" href="#works" onClick={work}>
        Skip to work
      </a>
      <a className="skip" href="#contact" onClick={contact}>
        Skip to contact
      </a>
      <header className="frame" data-protected>
        <div className="stripe" aria-hidden="true" />
        <div className="strip">
          <FrameIdentity />
          <nav aria-label="Portfolio" className="strip-nav">
            <a href="#works" className="strip-btn" onClick={work}>
              <Label en="WORK" jp="ワーク" />
            </a>
            <a href="#contact" className="strip-btn" onClick={contact}>
              <Label en="CONTACT" jp="コンタクト" />
            </a>
            <button type="button" className="strip-btn wide-only" onClick={toggleStory} aria-pressed={!direct} aria-label={`Story ${direct ? "off" : "on"}`}>
              <Label en={`STORY: ${direct ? "OFF" : "ON"}`} jp="ストーリー" />
            </button>
            <button type="button" className="strip-btn wide-only" onClick={cycleMotion} aria-label={`Motion: ${motionLabel}. Change motion setting`}>
              <Label en={`MOTION: ${hydrated ? motionLabel : "AUTO"}`} jp="モーション" />
            </button>
            <div className="strip-more" ref={menuRef} data-popover>
              <button type="button" className="strip-btn" aria-expanded={menu} aria-haspopup="true" aria-label="More settings" onClick={() => setMenu((m) => !m)}>
                <span className="lbl-en" aria-hidden="true">
                  ⋯
                </span>
              </button>
              {menu && (
                <div className="pop" role="group" aria-label="Settings">
                  <button type="button" className="pop-btn narrow-only" onClick={toggleStory} aria-pressed={!direct}>
                    <Label en={`STORY: ${direct ? "OFF" : "ON"}`} jp="ストーリー" />
                  </button>
                  <button type="button" className="pop-btn narrow-only" onClick={cycleMotion}>
                    <Label en={`MOTION: ${motionLabel}`} jp="モーション" />
                  </button>
                  <button type="button" className="pop-btn pop-erase" onClick={erase}>
                    Erase save data
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
