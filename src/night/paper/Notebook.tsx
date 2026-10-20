"use client";

// About: Omar's notebook. The cover opens in 3 stepped frames (a diegetic object, P6), then
// the spread springs to the reading width (interface). Two spreads; page turns are stepped
// too. Text is Omar's voice in Grotesk (P5), clean on paper (P1). Reading the last page
// tells the story bus (the narrator's stage 2 trigger).

import gsap from "gsap";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Ref } from "react";
import { springEase } from "@/lib/motion";
import { emitStory } from "../bus";
import { CONTACT_EMAIL } from "../content/projects";
import { FRAME_MS, useDialogKeys, useFocusOnMount, useIsoLayoutEffect, useQuiet } from "../manual/hooks";
import Portrait from "./Portrait";
import s from "./Paper.module.css";

const OPEN = springEase(170, 22);

const FAVOURITES = [
  "Persona and Shin Megami Tensei",
  "Pokémon, up to the DS era",
  "Gris",
  "Undertale and Deltarune",
  "Ace Attorney",
  "Danganronpa",
  "EarthBound",
  "Hollow Knight",
];

const INSPIRATIONS: [string, string][] = [
  ["Vital Lacerda", "board games"],
  ["Cole Wehrle", "board games"],
  ["Toby Fox", "Undertale, Deltarune"],
  ["Daniel Mullins", "Inscryption"],
  ["Carl Chudyk", "card games"],
  ["Jesper Juul", "game studies"],
];

// cover hinge, 3 frames at 12fps
const COVER_FRAMES = ["rotateY(0deg)", "rotateY(-62deg)", "rotateY(-128deg)"];
// page leaf, 3 frames; content swaps on the middle one
const LEAF_FRAMES = ["rotateY(0deg)", "rotateY(-90deg)", "rotateY(-170deg)"];

function Label({ en, jp }: { en: string; jp: string }) {
  return (
    <p className={s.label}>
      <span>{en}</span>
      <span className={s.kana} lang="ja">
        {jp}
      </span>
    </p>
  );
}

export default function Notebook({ onClose, titleRef }: { onClose(): void; titleRef: Ref<HTMLHeadingElement> }) {
  const quiet = useQuiet();
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);
  const onKeyDown = useDialogKeys(panelRef, onClose);
  useFocusOnMount(titleId);

  const [coverFrame, setCoverFrame] = useState<number | null>(() => (quiet ? null : 0));
  const [spread, setSpread] = useState(0);
  const [leaf, setLeaf] = useState<{ frame: number; dir: 1 | -1 } | null>(null);
  const timers = useRef<number[]>([]);
  const toldLast = useRef(false);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // cover: 3 stepped frames, then the spread springs to full size
  useIsoLayoutEffect(() => {
    if (quiet) {
      setCoverFrame(null);
      return;
    }
    later(() => setCoverFrame(1), FRAME_MS);
    later(() => setCoverFrame(2), FRAME_MS * 2);
    later(() => {
      setCoverFrame(null);
      if (spreadRef.current)
        gsap.fromTo(spreadRef.current, { scale: 0.94 }, { scale: 1, duration: OPEN.duration, ease: OPEN.ease });
    }, FRAME_MS * 3);
    // once, on open
     
  }, []);

  useEffect(() => {
    if (spread === 1 && !toldLast.current) {
      toldLast.current = true;
      emitStory({ type: "notebook-last-page" });
    }
  }, [spread]);

  const turn = useCallback(
    (to: number) => {
      if (to < 0 || to > 1 || to === spread || leaf) return;
      if (quiet) {
        setSpread(to);
        return;
      }
      const dir = to > spread ? 1 : -1;
      setLeaf({ frame: 0, dir });
      later(() => {
        setLeaf({ frame: 1, dir });
        setSpread(to);
      }, FRAME_MS);
      later(() => setLeaf({ frame: 2, dir }), FRAME_MS * 2);
      later(() => setLeaf(null), FRAME_MS * 3);
    },
     
    [spread, leaf, quiet],
  );

  const keys = (e: React.KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (!t.closest("a, button")) {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        turn(spread + 1);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        turn(spread - 1);
        return;
      }
    }
    onKeyDown(e);
  };

  return (
    <div className={s.root} ref={rootRef}>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={s.notebook}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={keys}
      >
        <button type="button" className={s.close} onClick={onClose} aria-label="Close the notebook">
          <span aria-hidden="true">✕</span>
        </button>

        <header className={s.head}>
          <h1 id={titleId} ref={titleRef} tabIndex={-1} className={s.h1}>
            <span>About Omar</span>
            <span className={s.kana} lang="ja">
              プロフィール
            </span>
          </h1>
        </header>

        <div className={s.spread} ref={spreadRef} data-spread={spread}>
          {spread === 0 ? (
            <>
              <section className={`${s.page} ${s.pageLeft}`} aria-label="Portrait">
                <Portrait max={256} />
                <p className={s.caption}>No photo yet: the logo stands in for my face.</p>
              </section>
              <section className={`${s.page} ${s.pageRight}`}>
                <h2 className={s.h2}>Omar Golinelli</h2>
                <p className={s.p}>Game designer. Online I go by PrimordialRune.</p>
                <p className={s.p}>
                  I love metaphor and storytelling, and I use them to explain my games. Everything on this desk arrives in
                  its own medium: a cassette you flip, a cartridge you slot in, a disc, a booster you tear open. The medium
                  is the metaphor.
                </p>
                <p className={s.p}>
                  A lot of my work starts by re-reading a game I love: Generation 1 again on a GBA, the Pokémon TCG as a
                  cube.
                </p>
              </section>
            </>
          ) : (
            <>
              <section className={`${s.page} ${s.pageLeft}`} aria-labelledby={`${titleId}-fav`}>
                <Label en="Favourites" jp="おきにいり" />
                <h2 id={`${titleId}-fav`} className={s.h2}>
                  Games I keep going back to
                </h2>
                <ul className={s.list}>
                  {FAVOURITES.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </section>
              <section className={`${s.page} ${s.pageRight}`} aria-labelledby={`${titleId}-insp`}>
                <Label en="Inspirations" jp="インスピレーション" />
                <h2 id={`${titleId}-insp`} className={s.h2}>
                  Designers I learn from
                </h2>
                <ul className={s.list}>
                  {INSPIRATIONS.map(([n, w]) => (
                    <li key={n}>
                      <span className={s.strong}>{n}</span> <span className={s.muted}>· {w}</span>
                    </li>
                  ))}
                </ul>
                <p className={s.p}>
                  Write to me: <a className={s.link} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </p>
              </section>
            </>
          )}

          {leaf && (
            <span
              className={s.leaf}
              data-dir={leaf.dir}
              style={{ transform: leaf.dir === 1 ? LEAF_FRAMES[leaf.frame] : LEAF_FRAMES[leaf.frame].replace("-", "") }}
              aria-hidden="true"
            />
          )}
          {coverFrame !== null && (
            <span className={s.cover} style={{ transform: COVER_FRAMES[coverFrame] }} aria-hidden="true">
              <span className={s.coverLabel}>
                <span>Notebook</span>
                <span className={s.kana} lang="ja">
                  ノート
                </span>
              </span>
            </span>
          )}
        </div>

        <nav className={s.pager} aria-label="Pages">
          <button type="button" className={s.pageBtn} onClick={() => turn(spread - 1)} disabled={spread === 0}>
            ← Previous page
          </button>
          <span className={s.pageNum} aria-live="polite">
            {spread * 2 + 1}–{spread * 2 + 2} / 4
          </span>
          <button type="button" className={s.pageBtn} onClick={() => turn(spread + 1)} disabled={spread === 1}>
            Next page →
          </button>
        </nav>
      </div>
    </div>
  );
}
