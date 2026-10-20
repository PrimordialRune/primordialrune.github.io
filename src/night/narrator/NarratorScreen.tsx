"use client";
// What the small Trinitron shows: Omar's logo, the name tag and one line of dialogue.
// On the first power-on of a browser session it switches on (<=900ms, any key or click
// skips) and shows the save select instead. At stage 3 the AI has left: the screen
// shows 250ms of static and goes dark. The single aria-live region for the narrator lives
// here, so keep this mounted even when the screen is dark or off.
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { isQuiet } from "@/lib/motion";
import { emitStory } from "../bus";
import { glitch } from "./glitch";
import { NAME_TAG_LABELS, cleanLine } from "./lines";
import SaveSelect from "./SaveSelect";
import { LineText, NarratorLogo, PixelText } from "./Speaker";
import { getSaveSelect, usePoweredOff, useSaveSelect, useStageShift, useStory } from "./story";
import { useLine } from "./useLine";
import styles from "./narratorScreen.module.css";

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

export default function NarratorScreen() {
  const mounted = useMounted();
  const story = useStory();
  const { open: saveOpen } = useSaveSelect();
  const off = usePoweredOff();
  const shift = useStageShift();
  const play = useLine(story);

  const warmRef = useRef<HTMLDivElement>(null);
  const staticRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLSpanElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);
  const wasOff = useRef(false);

  // Switch-on: the first power-on of the session warms the tube, then the narrator boots
  useLayoutEffect(() => {
    if (!mounted) return;
    const warm = warmRef.current;
    if (!getSaveSelect().open || isQuiet() || !warm) {
      emitStory({ type: "boot" });
      return;
    }
    const line = warm.firstElementChild as HTMLElement;
    const tl = gsap.timeline({ onComplete: () => emitStory({ type: "boot" }) });
    tl.set(warm, { opacity: 1 })
      .fromTo(line, { scaleX: 0, scaleY: 0.012, opacity: 1 }, { scaleX: 1, duration: 0.16, ease: "power2.out" }, 0.12)
      .to(line, { scaleY: 1, duration: 0.3, ease: "power3.in" })
      .to(warm, { opacity: 0, duration: 0.3, ease: "power1.out" });
    const skip = () => tl.progress(1);
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      tl.progress(1).kill();
    };
  }, [mounted]);

  // Back on after the visitor switched it off: a quick warm-up
  useEffect(() => {
    if (off) {
      wasOff.current = true;
      return;
    }
    if (!wasOff.current) return;
    wasOff.current = false;
    const warm = warmRef.current;
    if (!warm || isQuiet()) return;
    const tween = gsap.fromTo(warm, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power2.out" });
    return () => {
      tween.kill();
      gsap.set(warm, { opacity: 0 });
    };
  }, [off]);

  // The mask slips: mark it (P6: glitch only at a state change, with a reason)
  useEffect(() => {
    if (!shift.id || isQuiet()) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (shift.to === 1) {
      const svg = logoRef.current?.querySelector("svg");
      if (svg) {
        svg.dataset.flicker = "1";
        timers.push(setTimeout(() => delete svg.dataset.flicker, 220));
      }
    }
    if (shift.to < 3) glitch(tagRef.current, 200);
    if (shift.to === 3 && staticRef.current) {
      const el = staticRef.current;
      el.dataset.on = "1";
      timers.push(setTimeout(() => delete el.dataset.on, 250));
    }
    return () => timers.forEach(clearTimeout);
  }, [shift]);

  const live = !off && story.line ? cleanLine(story.line) : "";
  const showSave = mounted && !off && saveOpen;
  const showSpeaker = mounted && !off && !saveOpen && story.inCrt;

  return (
    <div className={styles.root} data-night-screen="" data-off={off || !mounted || !story.inCrt ? "1" : undefined}>
      {showSave && <SaveSelect />}
      {showSpeaker && (
        <div className={styles.speaker}>
          <div className={styles.top}>
            <span ref={logoRef} className={styles.logoWrap}>
              <NarratorLogo inner={story.inner} />
            </span>
            <span ref={tagRef} className={styles.tag} role="img" aria-label={NAME_TAG_LABELS[story.stage]}>
              <span aria-hidden="true">
                <PixelText text={story.nameTag} />
              </span>
            </span>
          </div>
          <button
            type="button"
            className={styles.box}
            data-voice={story.voice}
            onClick={play.skip}
            tabIndex={story.line ? 0 : -1}
            aria-label={play.typing ? "Show the whole line" : play.more ? "Next line" : "Narrator"}
          >
            <LineText chunk={play.chunk} shown={play.shown} machine={story.voice === "machine"} />
            {play.more && !play.typing && (
              <span className={styles.more} aria-hidden="true">
                <PixelText text="▼" />
              </span>
            )}
          </button>
        </div>
      )}
      <div ref={staticRef} className={styles.static} aria-hidden="true" />
      <div ref={warmRef} className={styles.warm} aria-hidden="true">
        <span className={styles.warmLine} />
      </div>
      <p className={styles.srOnly} aria-live="polite">
        {live}
      </p>
    </div>
  );
}
