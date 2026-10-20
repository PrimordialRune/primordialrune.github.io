"use client";

// The manual's cover: the game's own booklet. English title in Grotesk Black, katakana
// under it, the real art (pixel art at integer scale only, P1), medium and year. The game's
// palette is used here and only here (P4); the body stays cream and peacock.

import type { CSSProperties, Ref } from "react";
import { asset } from "../asset";
import type { NightProject } from "../content/projects";
import type { Side } from "../types";
import { useIntScaleWidth } from "./hooks";
import s from "./Manual.module.css";

export default function ManualCover({
  project,
  side,
  titleId,
  titleRef,
}: {
  project: NightProject;
  side: Side;
  titleId: string;
  titleRef: Ref<HTMLHeadingElement>;
}) {
  const { cover, coverPalette: pal } = project;
  const native = cover.w ?? 320;
  // pixel art takes the largest whole multiple; other art is shown at most at its own size
  const { box, width } = useIntScaleWidth(native, !!cover.pixel, 480);
  const vars = {
    "--c-paper": pal.paper,
    "--c-ink": pal.ink,
    "--c-accent": pal.accent,
    "--c-accent2": pal.accent2,
  } as CSSProperties;
  const meta = [project.medium, project.year].filter(Boolean).join(" · ");

  return (
    <header className={s.cover} style={vars} data-id={project.id}>
      <div className={s.coverBand} aria-hidden="true">
        <span className={s.coverStripe} />
        <span className={s.coverStripe2} />
      </div>
      <p className={s.coverEyebrow}>
        <span>Instruction Manual</span>
        <span className={s.kana}>マニュアル</span>
      </p>

      <div className={s.coverArt} ref={box}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset(cover.src)}
          alt={cover.alt}
          width={width}
          height={cover.h && cover.w ? (width * cover.h) / cover.w : undefined}
          className={cover.pixel ? `${s.coverImg} nd-pixel` : s.coverImg}
          style={{ width }}
          draggable={false}
        />
      </div>

      <div className={s.coverTitles}>
        <h1 id={titleId} ref={titleRef} tabIndex={-1} className={s.coverTitle}>
          {project.title}
        </h1>
        <p className={`${s.kana} ${s.coverKana}`} lang="ja">
          {project.titleJp}
        </p>
      </div>

      <p className={s.coverMeta}>
        <span>{meta}</span>
        {project.sideB && (
          <span className={s.coverSide} aria-label={`Side ${side}`}>
            SIDE {side}
          </span>
        )}
      </p>
    </header>
  );
}
