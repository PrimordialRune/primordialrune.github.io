"use client";

// A project's instruction manual (the J-card for Crossfader, the booklet for Haunt Record,
// the rulebook insert for PTCG Cube). The cover is the hero (P7); inside, the text leads.
// The panel opens on a spring (P6, interface). role="dialog" with a focus trap; Esc and ✕
// call onClose, which lets the shell run the ceremony backwards.

import gsap from "gsap";
import { useCallback, useId, useRef } from "react";
import { springEase } from "@/lib/motion";
import { PROJECTS } from "../content/projects";
import type { ManualProps } from "../types";
import ManualBody, { Contents } from "./ManualBody";
import ManualCover from "./ManualCover";
import SideSwitch from "./SideSwitch";
import { useDialogKeys, useFocusOnMount, useIsoLayoutEffect, useQuiet, useTopInset } from "./hooks";
import s from "./Manual.module.css";

const OPEN = springEase(170, 22);
const JUMP = springEase(120, 20);

export default function Manual({ id, side, onClose, onSide, titleRef }: ManualProps) {
  const project = PROJECTS[id];
  const quiet = useQuiet();
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onKeyDown = useDialogKeys(panelRef, onClose);
  useFocusOnMount(titleId);
  useTopInset(rootRef);

  const effSide = project.sideB ? side : "A";
  const sections = effSide === "B" && project.sideB ? project.sideB : project.sections;

  // open: the manual slides out on a spring (it comes from under the device)
  useIsoLayoutEffect(() => {
    if (quiet || !panelRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(panelRef.current, { y: 72, scale: 0.97 }, { y: 0, scale: 1, duration: OPEN.duration, ease: OPEN.ease });
      gsap.fromTo(`.${s.scrim}`, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none" });
    }, rootRef);
    return () => ctx.revert();
    // run once per opening, not when motion changes mid-read
     
  }, [id]);

  const jump = useCallback(
    (target: string) => {
      const box = scrollRef.current;
      const el = box?.querySelector<HTMLElement>(`#${CSS.escape(target)}`);
      if (!box || !el) return;
      const to = el.offsetTop - 16;
      if (quiet) box.scrollTop = to;
      else {
        const p = { y: box.scrollTop };
        gsap.to(p, {
          y: to,
          duration: JUMP.duration,
          ease: JUMP.ease,
          onUpdate: () => {
            box.scrollTop = p.y;
          },
        });
      }
      el.querySelector<HTMLElement>("h2")?.setAttribute("tabindex", "-1");
      el.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    },
    [quiet],
  );

  return (
    <div className={s.root} ref={rootRef}>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={s.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        data-side={effSide}
      >
        <button type="button" className={s.close} onClick={onClose} aria-label={`Close the ${project.title} manual`}>
          <span aria-hidden="true">✕</span>
        </button>
        <div className={s.scroll} ref={scrollRef}>
          <ManualCover project={project} side={effSide} titleId={titleId} titleRef={titleRef} />
          {project.sideB && <SideSwitch side={effSide} onSide={onSide} />}
          <Contents projectId={project.id} sections={sections} onJump={jump} />
          <ManualBody key={effSide} project={project} sections={sections} />
          <footer className={s.foot}>
            <button type="button" className={s.backBtn} onClick={onClose}>
              Back to the desk
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
