"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import Logo from "./Logo";
import Pixel from "./Pixel";
import { asset } from "@/studio/lib/asset";
import { frames, isSoft } from "@/studio/lib/motion";
import { formatPlayTime } from "@/studio/lib/story";
import { profile, saveFiles, ui } from "@/studio/data/script";
import { CastlePlanet, Delta } from "./ObjectArt";
import type { StudioProject } from "@/studio/types";

/* ---------------------------------------------------------------------------------- */
/* Standby and power-on (hero: the glass)                                              */
/* ---------------------------------------------------------------------------------- */

export function StandbyScreen() {
  return (
    <div className="scr scr-standby">
      <span className="sr-only">The TV is on standby</span>
      <span className="standby-dot" />
    </div>
  );
}

/** The glass switches on: FULL 1.2s (line, open, settle), SOFT 0.4s (fade + 0.98 to 1).
 *  `short` (a return visit) uses the 0.5s soft length regardless. tlRef lets any input finish it. */
export function PowerOnScreen({ short, onDone, tlRef }: { short: boolean; onDone: () => void; tlRef: React.MutableRefObject<gsap.core.Timeline | null> }) {
  const root = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  useLayoutEffect(() => {
    done.current = onDone;
  });

  useLayoutEffect(() => {
    const el = root.current!;
    const line = el.querySelector(".pw-line");
    const fill = el.querySelector(".pw-fill");
    const mark = el.querySelector(".pw-mark");
    const soft = isSoft() || short;
    const tl = gsap.timeline({ onComplete: () => done.current() });
    if (soft) {
      gsap.set(line, { opacity: 0 });
      tl.fromTo(fill, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: short ? 0.5 : 0.4, ease: "power2.out" });
      tl.fromTo(mark, { opacity: 0 }, { opacity: 1, duration: 0.2 }, "<0.1");
    } else {
      tl.fromTo(line, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.25, ease: "power3.out" })
        .fromTo(fill, { scaleY: 0.006, opacity: 1 }, { scaleY: 1, duration: 0.3, ease: "power4.out" })
        .set(line, { opacity: 0 })
        .fromTo(el, { filter: "brightness(1.8)" }, { filter: "brightness(1)", duration: 0.35, ease: "power2.out" }, "<")
        .fromTo(mark, { opacity: 0 }, { opacity: 1, ...frames(3) }, "<0.1")
        .to({}, { duration: 0.2 });
    }
    tlRef.current = tl;
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [short, tlRef]);

  return (
    <div ref={root} className="scr scr-power">
      <span className="sr-only">Powering on</span>
      <div className="pw-fill" />
      <div className="pw-line" />
      <div className="pw-mark">
        <Logo size={64} outer="var(--cream)" />
        <span className="pixel-1">AFTERIMAGE</span>
        <small lang="ja">残像</small>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------------- */
/* Save select (hero: the save files)                                                  */
/* ---------------------------------------------------------------------------------- */

type FileId = "file1" | "new" | "corrupted";

export function SaveSelectScreen({
  hasSave,
  playSeconds,
  opened,
  onPick,
  onCorruptFocus,
}: {
  hasSave: boolean;
  playSeconds: number;
  opened: number;
  onPick: (id: FileId) => void;
  onCorruptFocus: () => void;
}) {
  const files = saveFiles.filter((f) => (hasSave ? f.id !== "new" : f.id !== "file1"));
  const [active, setActive] = useState(0);
  const list = useRef<HTMLDivElement>(null);
  const [glitch, setGlitch] = useState<number | null>(null);

  useEffect(() => {
    list.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }, []);

  const fill = (s: string) => s.replace("{playtime}", formatPlayTime(playSeconds)).replace("{opened}", String(opened));

  const focusFile = (i: number) => {
    setActive(i);
    const f = files[i];
    if (f.id === "corrupted") {
      onCorruptFocus();
      // It glitches for 240ms when it gains focus (FULL), then rests on frame 0
      if (!isSoft() && f.glitchFrames) {
        let n = 0;
        const step = () => {
          n++;
          if (n >= f.glitchFrames!.length) return setGlitch(null);
          setGlitch(n);
          window.setTimeout(step, 240 / f.glitchFrames!.length);
        };
        step();
      }
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const i = (active + (e.key === "ArrowDown" ? 1 : files.length - 1)) % files.length;
    list.current?.querySelectorAll<HTMLButtonElement>("button")[i]?.focus();
  };

  return (
    <div className="scr scr-save">
      <p className="save-head">
        <span className="pixel-1">SELECT FILE</span>
        <small lang="ja">セーブデータ</small>
      </p>
      <div ref={list} className="save-list" role="group" aria-label={ui.sr.saveSelect} onKeyDown={onKey}>
        {files.map((f, i) => {
          const rows = f.id === "corrupted" && glitch !== null && f.glitchFrames ? f.glitchFrames[glitch] : [f.title, ...f.lines];
          return (
            <button
              key={f.id}
              className="save-file"
              data-id={f.id}
              data-active={active === i || undefined}
              tabIndex={active === i ? 0 : -1}
              onFocus={() => focusFile(i)}
              onPointerEnter={(e) => e.currentTarget.focus()}
              onClick={() => onPick(f.id)}
            >
              {rows.map((r, k) => (
                <span key={k} className={k === 0 ? "save-title" : "save-line"}>
                  {fill(r) || " "}
                </span>
              ))}
            </button>
          );
        })}
      </div>
      <p className="save-hint pixel-1" aria-hidden>
        ↑↓ + ENTER
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------------- */
/* Title screen: the focused object's game, on its own palette                         */
/* ---------------------------------------------------------------------------------- */

function useBox() {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box] as const;
}

/** The title art's own backdrop, where it isn't the palette's first colour */
const SCREEN_BG: Record<string, string> = { crossfader: "#f1ead6", "ptcg-cube": "#1a1819" };

export function TitleScreen({ project, channel }: { project: StudioProject; channel: number }) {
  const [ref, box] = useBox();
  const art = project.art.title;
  const bg = SCREEN_BG[project.slug] ?? project.palette[0];
  const fg = project.slug === "crossfader" ? "#2e2828" : project.palette[project.palette.length - 1];
  const ch = (
    <span className="tv-ch pixel-1" aria-hidden style={{ color: fg }}>
      {ui.hints.channel.replace("{nn}", String(channel).padStart(2, "0"))}
    </span>
  );
  if (project.slug === "ptcg-cube") return <PtcgTitle project={project}>{ch}</PtcgTitle>;
  if (!art) return <EmblemTitle project={project}>{ch}</EmblemTitle>;
  return (
    <div className="scr scr-title" style={{ background: bg, color: fg }}>
      <div ref={ref} className="title-art">
        {art.pixel && box.w > 0 && <Pixel art={art} maxW={box.w} maxH={box.h} />}
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, real art at its own size */}
        {!art.pixel && <img src={asset(art.src)} alt={art.alt} width={art.w} height={art.h} />}
      </div>
      {ch}
    </div>
  );
}

/** A dash drawn in the pixel face's own grid (8bitDarling has no hyphen) */
const Dash = () => <span className="px-dash" aria-hidden />;

/** PTCG Cube: a title screen in the playmat's three inks. The playmat is the texture under
 *  it, dimmed and cropped to its bench and Omar's signature; the title and the two modes
 *  are the screen's own type, a cursor blinking on the first. */
function PtcgTitle({ project, children }: { project: StudioProject; children: React.ReactNode }) {
  const art = project.art.title!;
  return (
    <div className="scr scr-title ts-ptcg" role="img" aria-label="PTCG Cube title screen: PTCG CUBE, with the modes Roguelike and Co-op, over Omar's playmat">
      {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
      <img className="ts-mat" src={asset(art.src)} alt="" width={art.w} height={art.h} />
      <div className="ts-stack">
        <div className="ts-panel">
          <p className="ts-title">PTCG CUBE</p>
          <small lang="ja" className="ts-kana">
            キューブ
          </small>
        </div>
        <ul className="ts-menu" aria-hidden>
          <li data-on>
            <span className="ts-cursor" />
            <span>ROGUELIKE</span>
          </li>
          <li>
            <span>
              CO
              <Dash />
              OP
            </span>
          </li>
        </ul>
      </div>
      {children}
    </div>
  );
}

/** Archives without title art (Holon, SpaceRim): the object's emblem, the title in the
 *  machine's face, its katakana, and one status line, in the object's palette */
const EMBLEM_STATUS: Record<string, string> = { holon: "UNITY PROTOTYPE", spacerim: "CASTLE GAME JAM" };

function EmblemTitle({ project, children }: { project: StudioProject; children: React.ReactNode }) {
  const [dark, paper, gold, accent] =
    project.kind === "floppy"
      ? [project.palette[0], project.palette[2], project.palette[3], project.palette[1]]
      : [project.palette[0], project.palette[1], project.palette[2], project.palette[3]];
  let emblem: React.ReactNode = <Logo size={64} outer={paper} />;
  if (project.kind === "deck-box")
    emblem = (
      <svg viewBox="-11 -11 22 22" className="ts-emblem" aria-hidden>
        <Delta x={0} y={0} r={10.6} ring={gold} ink={paper} bg={accent} />
      </svg>
    );
  if (project.kind === "floppy")
    emblem = (
      <svg viewBox="13.6 47.2 22.8 22.8" className="ts-emblem" aria-hidden>
        <circle cx="25" cy="58.6" r="10.8" fill={accent} opacity=".22" />
        <CastlePlanet shell={dark} accent={gold} paper={paper} metal={accent} />
        <circle cx="25" cy="58.6" r="9.4" fill="none" stroke={accent} strokeWidth=".5" />
      </svg>
    );
  const status = EMBLEM_STATUS[project.slug] ?? project.medium.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
  return (
    <div className="scr scr-title ts-emblem-screen" style={{ background: dark, color: paper }} role="img" aria-label={`${project.title} title screen`}>
      <div className="ts-frame" style={{ borderColor: accent }} aria-hidden />
      <div className="ts-stack">
        {emblem}
        <p className="ts-title">{project.title.toUpperCase()}</p>
        <small lang="ja" className="ts-kana" style={{ color: gold }}>
          {project.titleJp}
        </small>
        <p className="ts-status" style={{ color: accent }}>
          {status}
          <span className="ts-cursor" style={{ background: gold }} />
        </p>
      </div>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------------------- */
/* Status screen: the Trainer Card's side of the TV                                    */
/* ---------------------------------------------------------------------------------- */

export function StatusScreen({ stage, playSeconds, onAfter }: { stage: number; playSeconds: number; onAfter: () => void }) {
  return (
    <div className="scr scr-status">
      <div className="status-win">
        <div className="status-id">
          <Logo stage={stage} size={56} outer="var(--cream)" />
          <div>
            <p className="status-name">{profile.name}</p>
            <p className="status-handle">{profile.handle}</p>
            <p className="status-class">
              {profile.class.en}
              <small lang="ja">{profile.class.jp}</small>
            </p>
          </div>
        </div>
        {stage >= 2 && (
          <button className="status-after" onClick={onAfter}>
            WHAT COMES AFTER? ▸<small lang="ja">このあと</small>
          </button>
        )}
        <dl className="status-stats">
          <div>
            <dt className="pixel-1">PLAY</dt>
            <dd className="pixel-1" data-wrong={stage >= 2 || undefined}>
              {stage >= 2 ? profile.card.playTimeStage2 : formatPlayTime(playSeconds)}
            </dd>
          </div>
        </dl>
        <div className="status-skills">
          <p className="status-label">
            SKILLS<small lang="ja">スキル</small>
          </p>
          <ul>
            {profile.skills.map((s) => (
              <li key={s.en}>
                {s.en}
                <small lang="ja">{s.jp}</small>
              </li>
            ))}
          </ul>
        </div>
        <p className="status-mail">
          <span className="pixel-1">MAIL</span>
          <a href={profile.contact[0].href}>{profile.contact[0].value}</a>
        </p>
      </div>
      <span className="tv-ch pixel-1" aria-hidden>
        {ui.hints.channel.replace("{nn}", "01")}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------------------------- */
/* Empty space: the corrupt peek and the ending                                        */
/* ---------------------------------------------------------------------------------- */

export function EmptyRoom({
  variant,
  line,
  tag,
  light,
  onPowerOn,
}: {
  variant: "peek" | "ending";
  line: string;
  tag?: string;
  /** The window light stays where the room was: an empty space with a memory in it */
  light?: React.ReactNode;
  onPowerOn?: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.fromTo(el.querySelectorAll(".empty-in"), { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.25, delay: 0.2 });
    if (variant === "ending") el.querySelector<HTMLButtonElement>(".power-on")?.focus({ preventScroll: true });
  }, [variant]);
  return (
    <section ref={root} className="empty-room" data-variant={variant} aria-label={variant === "ending" ? "The end" : "An empty file"}>
      {light}
      {tag && <span className="empty-in name-tag" data-stage="2">{tag}</span>}
      <p className="empty-in empty-line">{line}</p>
      {variant === "ending" && (
        <>
          <a className="empty-in empty-contact" href={profile.contact[0].href}>
            {profile.contact[0].value}
          </a>
          <button className="empty-in power-on" onClick={onPowerOn}>
            {ui.buttons.powerOn.en.toUpperCase()}
            <small lang="ja">{ui.buttons.powerOn.jp}</small>
          </button>
        </>
      )}
    </section>
  );
}
