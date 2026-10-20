"use client";

// The manual's inside: modern editorial (P2). Grotesk Thin body at 64–68ch, Black headings,
// katakana under each English heading (P5), real images at full size. No scanlines, no blur.

import { asset } from "../asset";
import type { ManualImage, ManualSection, NightProject } from "../content/projects";
import { useIntScaleWidth } from "./hooks";
import MarginNote from "./MarginNote";
import s from "./Manual.module.css";

export const sectionId = (projectId: string, i: number) => `nm-${projectId}-${i}`;

function Figure({ img }: { img: ManualImage }) {
  const native = img.w ?? 640;
  const { box, width } = useIntScaleWidth(native, img.pixel ? "pixel" : (img.fit ?? "shrink"));
  return (
    <figure className={s.figure} ref={box}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset(img.src)}
        alt={img.alt}
        width={width}
        height={img.h && img.w ? (width * img.h) / img.w : undefined}
        style={{ width }}
        className={img.pixel ? "nd-pixel" : undefined}
        loading="lazy"
        draggable={false}
      />
    </figure>
  );
}

export function Contents({
  projectId,
  sections,
  onJump,
}: {
  projectId: string;
  sections: ManualSection[];
  onJump(id: string): void;
}) {
  return (
    <nav className={s.contents} aria-label="Contents">
      <p className={s.contentsHead}>
        <span>Contents</span>
        <span className={s.kana}>もくじ</span>
      </p>
      <ol className={s.contentsList}>
        {sections.map((sec, i) => (
          <li key={sec.en}>
            <button type="button" className={s.contentsItem} onClick={() => onJump(sectionId(projectId, i))}>
              <span className={s.contentsNum}>{String(i + 1).padStart(2, "0")}</span>
              <span className={s.contentsLabel}>
                <span>{sec.en}</span>
                <span className={s.kana} lang="ja">
                  {sec.jp}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function ManualBody({ project, sections }: { project: NightProject; sections: ManualSection[] }) {
  const facts: [string, string][] = [
    ["Medium", project.medium],
    ...(project.year ? ([["Year", String(project.year)]] as [string, string][]) : []),
    ...(project.tools?.length ? ([["Made with", project.tools.join(", ")]] as [string, string][]) : []),
    ...(project.credits ? ([["Credits", project.credits]] as [string, string][]) : []),
  ];
  const images = project.images ?? [];
  // the AI's note sits beside Design Notes (or after the last section when there are none)
  const notesAt = sections.findIndex((x) => x.en === "Design Notes");
  const noteAt = notesAt >= 0 ? notesAt : sections.length - 1;

  return (
    <div className={s.body}>
      <p className={s.lede}>{project.pitch}</p>
      <dl className={s.facts}>
        {facts.map(([k, v]) => (
          <div key={k} className={s.fact}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      {sections.map((sec, i) => (
        <section key={sec.en} id={sectionId(project.id, i)} className={s.section} aria-labelledby={`${sectionId(project.id, i)}-h`}>
          <h2 id={`${sectionId(project.id, i)}-h`} className={s.h2}>
            <span>{sec.en}</span>
            <span className={s.kana} lang="ja">
              {sec.jp}
            </span>
          </h2>
          {sec.body.map((p, j) => (
            <p key={j} className={s.p}>
              {p}
            </p>
          ))}
          {i === 0 && images.map((img) => <Figure key={img.src} img={img} />)}
          {i === noteAt && <MarginNote id={project.id} />}
        </section>
      ))}
    </div>
  );
}
