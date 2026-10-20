"use client";

// The case study as a 攻略本 (strategy guide) page: clean editorial in Omar's voice (P2, P5).
// Hero (P7): the object on the cover. Chapters carry huge Black numbers; screens are
// annotated with numbered callouts; DESIGN NOTES sits in a sidebar. No scanlines, glow or
// pixel type in the body. Esc is handled by the caller.

import { useEffect, useRef, useState } from "react";
import type { Shot, StudioProject } from "../types";
import { guideFor } from "../data/projects";
import { ui } from "../data/script";
import ObjectArt, { OBJECT_BOX } from "./ObjectArt";
import Pixel from "./Pixel";
import { asset } from "../lib/asset";
import "../styles/guide.css";

interface Label {
  en: string;
  jp: string;
}

type Kind = "chapter" | "walkthrough" | "designNotes" | "credits";

interface Chapter {
  id: string;
  kind: Kind;
  number?: number;
  title: Label;
  body: readonly string[];
  list: readonly { label: Label; value: string }[];
  shots: Shot[];
}

interface Props {
  project: StudioProject;
  onBack: () => void;
  onNext?: () => void;
}

const kindOf = (heading: string): Kind =>
  /design notes/i.test(heading) ? "designNotes" : /walkthrough/i.test(heading) ? "walkthrough" : /credits/i.test(heading) ? "credits" : "chapter";

/** Chapters from the writer's guide when it exists, else from project.guide */
function chaptersFor(project: StudioProject): Chapter[] {
  const g = guideFor(project.slug);
  let chapters: Chapter[] = g
    ? g.chapters.map((c) => ({
        id: c.id,
        kind: c.kind,
        number: c.number,
        title: c.title,
        body: c.body,
        list: c.list,
        shots: c.shots,
      }))
    : project.guide.map((s, i) => ({
        id: `s${i}`,
        kind: kindOf(s.heading),
        title: { en: s.heading, jp: s.headingJp },
        body: s.body,
        list: [],
        shots: [],
      }));
  // screens nobody placed go to the walkthrough, else the last numbered chapter
  const placed = new Set(chapters.flatMap((c) => c.shots.map((s) => s.src)));
  const loose = project.art.shots.filter((s) => !placed.has(s.src));
  if (loose.length) {
    const host =
      chapters.find((c) => c.kind === "walkthrough") ??
      [...chapters].reverse().find((c) => c.kind === "chapter") ??
      null;
    if (host) chapters = chapters.map((c) => (c === host ? { ...c, shots: [...c.shots, ...loose] } : c));
    else chapters = [...chapters, { id: "screens", kind: "walkthrough", title: ui.guide.screens, body: [], list: [], shots: loose }];
  }
  // number the main chapters when the guide did not
  let n = 0;
  return chapters.map((c) => (c.kind === "chapter" || c.kind === "walkthrough" ? { ...c, number: c.number ?? ++n } : c));
}

function factsFor(project: StudioProject): { label: Label; value: string }[] {
  const g = guideFor(project.slug);
  const medium = { label: { en: "Medium", jp: "メディア" }, value: project.medium };
  if (g?.facts.length) return [medium, ...g.facts];
  const out = [medium];
  if (project.year) out.push({ label: { en: "Year", jp: "ねん" }, value: String(project.year) });
  if (project.role) out.push({ label: { en: "Role", jp: "やくわり" }, value: project.role });
  if (project.tools?.length) out.push({ label: { en: "Tools", jp: "ツール" }, value: project.tools.join(", ") });
  if (project.team) out.push({ label: { en: "Team", jp: "チーム" }, value: project.team });
  return out;
}

/** The WALKTHROUGH kicker, unless the chapter is already titled that */
const walk = (c: Chapter) => c.kind === "walkthrough" && c.title.en.toLowerCase() !== ui.guide.walkthrough.en.toLowerCase();

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Pixel shots whose subject is small in a big frame: show only the subject, at the largest
 * integer scale that fits (P1), and move the callouts with it. Keys match the end of the src.
 */
const CROPS: Record<string, { x: number; y: number; w: number; h: number }> = {
  // the GBJAM 11 boot icon sits 36x40 in the middle of a 160x144 plum screen
  "galactic-news/logo-starfield.png": { x: 54, y: 46, w: 52, h: 52 },
};
const cropFor = (src: string) => Object.entries(CROPS).find(([k]) => src.endsWith(k))?.[1];

/** A cropped pixel shot at an integer scale (k >= 1, at most 6) */
function CroppedPixel({ shot, crop, width }: { shot: Shot; crop: { x: number; y: number; w: number; h: number }; width: number }) {
  const k = Math.max(1, Math.min(6, Math.floor(width / crop.w)));
  return (
    <span style={{ position: "relative", display: "block", overflow: "hidden", width: crop.w * k, height: crop.h * k, margin: "0 auto", borderRadius: 2 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset(shot.src)}
        alt={shot.alt}
        width={shot.w * k}
        height={shot.h * k}
        draggable={false}
        style={{ position: "absolute", left: -crop.x * k, top: -crop.y * k, width: shot.w * k, height: shot.h * k, maxWidth: "none", imageRendering: "pixelated", borderRadius: 0 }}
      />
    </span>
  );
}

/** One annotated screen: integer-scale pixel art (or a plain image) with ①②③ on top */
function Figure({ shot }: { shot: Shot }) {
  const ref = useRef<HTMLElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || !shot.pixel) return;
    const measure = () => setW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [shot.pixel]);
  const crop = shot.pixel ? cropFor(shot.src) : undefined;
  const callouts = shot.callouts ?? [];
  // callout positions are in % of the whole shot; a crop moves them into its own frame
  const at = (c: { x: number; y: number }) =>
    crop ? { x: (((c.x / 100) * shot.w - crop.x) / crop.w) * 100, y: (((c.y / 100) * shot.h - crop.y) / crop.h) * 100 } : c;
  return (
    <figure ref={ref} className={`guide-shot${shot.pixel ? " guide-shot--pixel" : ""}`}>
      <div className="guide-shot-frame">
        {shot.pixel ? (
          w > 0 && (crop ? <CroppedPixel shot={shot} crop={crop} width={w} /> : <Pixel art={shot} maxW={w} maxH={Math.max(shot.h, Math.round(w * 1.2))} />)
        ) : (
          <Pixel art={shot} />
        )}
        {callouts.map((c, i) => (
          <span key={i} className="guide-callout-dot" style={{ left: `${at(c).x}%`, top: `${at(c).y}%` }} aria-hidden="true">
            {i + 1}
          </span>
        ))}
      </div>
      {(shot.caption || callouts.length > 0) && (
        <figcaption>
          {shot.caption && <p className="guide-caption">{shot.caption}</p>}
          {callouts.length > 0 && (
            <ol className="guide-callouts">
              {callouts.map((c, i) => (
                <li key={i}>
                  <span className="guide-callout-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="sr-only">{i + 1}. </span>
                  {c.text}
                </li>
              ))}
            </ol>
          )}
        </figcaption>
      )}
    </figure>
  );
}

function Heading({ title, level = 2 }: { title: Label; level?: 2 | 3 }) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <div className="guide-heading">
      <H className="guide-h">{title.en}</H>
      <span className="guide-kana" lang="ja">
        {title.jp}
      </span>
    </div>
  );
}

function List({ list }: { list: Chapter["list"] }) {
  if (!list.length) return null;
  return (
    <dl className="guide-list">
      {list.map((f, i) => (
        <div key={i}>
          <dt>
            {f.label.en}
            <span className="guide-kana" lang="ja">
              {f.label.jp}
            </span>
          </dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Cover object size: about 40% of the viewport height, within the width */
function useCoverSize(kind: StudioProject["kind"]) {
  const [size, setSize] = useState(240);
  useEffect(() => {
    const box = OBJECT_BOX[kind];
    const fit = () => {
      const phone = window.innerWidth < 720;
      const h = Math.min(phone ? 0.3 : 0.4, 1) * window.innerHeight;
      const byH = (Math.min(h, phone ? 260 : 380) * box.w) / box.h;
      setSize(Math.round(Math.min(byH, window.innerWidth - 64, phone ? 300 : 460)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [kind]);
  return size;
}

export default function Guide({ project, onBack, onNext }: Props) {
  const chapters = chaptersFor(project);
  const facts = factsFor(project);
  const g = guideFor(project.slug);
  const main = chapters.filter((c) => c.kind === "chapter" || c.kind === "walkthrough");
  const notes = chapters.filter((c) => c.kind === "designNotes");
  const credits = chapters.filter((c) => c.kind === "credits");
  const size = useCoverSize(project.kind);
  const lede = g?.oneLine ?? project.pitch;

  return (
    <article className="guide" aria-labelledby={`guide-title-${project.slug}`}>
      <header className="guide-cover">
        <div className="guide-cover-stage">
          <div className="guide-cover-object">
            <ObjectArt project={project} size={size} />
          </div>
        </div>
        <div className="guide-cover-text">
          <p className="guide-kicker">
            STRATEGY GUIDE
            <span className="guide-kana" lang="ja">
              こうりゃくほん
            </span>
          </p>
          <h1 className="guide-title" id={`guide-title-${project.slug}`}>
            {project.title}
          </h1>
          <p className="guide-title-kana" lang="ja">
            {project.titleJp}
          </p>
          <p className="guide-medium">
            {project.medium}
            <span className="guide-kana" lang="ja">
              {project.mediumJp}
            </span>
          </p>
        </div>
      </header>

      <section className="guide-facts" aria-label="Facts">
        <dl>
          {facts.map((f, i) => (
            <div key={i} className="guide-fact">
              <dt>
                {f.label.en}
                <span className="guide-kana" lang="ja">
                  {f.label.jp}
                </span>
              </dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="guide-body">
        <div className="guide-main">
          {lede && <p className="guide-lede">{lede}</p>}
          {main.map((c) => (
            <section key={c.id} className={`guide-chapter guide-chapter--${c.kind}`} aria-labelledby={`${project.slug}-${c.id}`}>
              <div className="guide-chapter-head">
                {c.number !== undefined && (
                  <span className="guide-number" aria-hidden="true">
                    {pad(c.number)}
                  </span>
                )}
                <div className="guide-heading">
                  <p className="guide-chapter-label">
                    {walk(c) ? ui.guide.walkthrough.en : `${ui.guide.chapter.en} ${c.number ?? ""}`}
                    <span className="guide-kana" lang="ja">
                      {walk(c) ? ui.guide.walkthrough.jp : ui.guide.chapter.jp}
                    </span>
                  </p>
                  <h2 className="guide-h" id={`${project.slug}-${c.id}`}>
                    {c.title.en}
                  </h2>
                  <span className="guide-kana" lang="ja">
                    {c.title.jp}
                  </span>
                </div>
              </div>
              {c.body.map((p, i) => (
                <p key={i} className="guide-p">
                  {p}
                </p>
              ))}
              <List list={c.list} />
              {c.shots.map((s, i) => (
                <Figure key={`${s.src}-${i}`} shot={s} />
              ))}
            </section>
          ))}
          {credits.map((c) => (
            <section key={c.id} className="guide-credits" aria-labelledby={`${project.slug}-${c.id}`}>
              <div className="guide-heading">
                <h2 className="guide-h guide-h--small" id={`${project.slug}-${c.id}`}>
                  {c.title.en}
                </h2>
                <span className="guide-kana" lang="ja">
                  {c.title.jp}
                </span>
              </div>
              {c.body.map((p, i) => (
                <p key={i} className="guide-p guide-p--small">
                  {p}
                </p>
              ))}
              <List list={c.list} />
            </section>
          ))}
          {project.links && project.links.length > 0 && (
            <section className="guide-credits" aria-label="Links">
              <Heading title={{ en: "Links", jp: "リンク" }} />
              <ul className="guide-links">
                {project.links.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noreferrer">
                      {l.label} ↗
                    </a>
                    {l.note && <span> {l.note}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        {notes.length > 0 && (
          <aside className="guide-notes" aria-label={ui.guide.designNotes.en}>
            {notes.map((c) => (
              <div key={c.id} className="guide-notes-card">
                <h2 className="guide-notes-label">
                  {ui.guide.designNotes.en}
                  <span className="guide-kana" lang="ja">
                    {ui.guide.designNotes.jp}
                  </span>
                </h2>
                {c.title.en.toLowerCase() !== ui.guide.designNotes.en.toLowerCase() && <h3 className="guide-h guide-h--small">{c.title.en}</h3>}
                {c.body.map((p, i) => (
                  <p key={i} className="guide-p guide-p--small">
                    {p}
                  </p>
                ))}
                <List list={c.list} />
                {c.shots.map((s, i) => (
                  <Figure key={`${s.src}-${i}`} shot={s} />
                ))}
              </div>
            ))}
          </aside>
        )}
      </div>

      <footer className="guide-footer">
        <button type="button" className="guide-btn" onClick={onBack}>
          {ui.buttons.backToShelf.en}
          <span className="guide-kana" lang="ja">
            {ui.buttons.backToShelf.jp}
          </span>
        </button>
        {onNext && (
          <button type="button" className="guide-btn guide-btn--next" onClick={onNext}>
            {ui.buttons.next.en}
            <span className="guide-kana" lang="ja">
              {ui.buttons.next.jp}
            </span>
          </button>
        )}
      </footer>
    </article>
  );
}
