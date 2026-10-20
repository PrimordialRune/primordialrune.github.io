"use client";

// WORK: the plain index. Every project, About and Contact as a list, for recruiters,
// keyboard and screen-reader users. Springs in under the top strip (P6).
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { isQuiet } from "@/lib/motion";
import { SPRING_UI } from "../motion/spring";
import { PROJECTS } from "../content/projects";
import { PROJECT_IDS, type ProjectId } from "../types";
import s from "./TopBar.module.css";

interface Props {
  onClose(): void;
  onProject(id: ProjectId): void;
  onAbout(): void;
  onContact(): void;
}

export default function ProjectIndex({ onClose, onProject, onAbout, onContact }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelector<HTMLElement>("button")?.focus();
    if (isQuiet()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el, { yPercent: -6, opacity: 0 }, { yPercent: 0, opacity: 1, duration: SPRING_UI.duration, ease: SPRING_UI.ease });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div className={s.index} ref={ref} id="nd-index" role="dialog" aria-modal="false" aria-labelledby="nd-index-title">
        <h2 className={s.indexTitle} id="nd-index-title">
          <span>Work</span>
          <span className={s.kana}>ワーク</span>
        </h2>
        <ul className={s.indexList}>
          {PROJECT_IDS.map((id, i) => {
            const p = PROJECTS[id];
            return (
              <li key={id}>
                <button type="button" className={s.indexItem} onClick={() => onProject(id)}>
                  <span className={s.indexNum} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={s.indexText}>
                    <span className={s.indexName}>{p.title}</span>
                    <span className={s.kana}>{p.titleJp}</span>
                  </span>
                  <span className={s.indexMedium}>{p.medium}</span>
                </button>
              </li>
            );
          })}
          <li className={s.indexSep}>
            <button type="button" className={s.indexItem} onClick={onAbout}>
              <span className={s.indexNum} aria-hidden="true">06</span>
              <span className={s.indexText}>
                <span className={s.indexName}>About</span>
                <span className={s.kana}>アバウト</span>
              </span>
              <span className={s.indexMedium}>Omar&apos;s notebook</span>
            </button>
          </li>
          <li>
            <button type="button" className={s.indexItem} onClick={onContact}>
              <span className={s.indexNum} aria-hidden="true">07</span>
              <span className={s.indexText}>
                <span className={s.indexName}>Contact</span>
                <span className={s.kana}>コンタクト</span>
              </span>
              <span className={s.indexMedium}>Email, Telegram, GitHub</span>
            </button>
          </li>
        </ul>
      </div>
    </>
  );
}
