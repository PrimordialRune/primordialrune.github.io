"use client";

// About: Omar's notebook, the same kraft notebook that lies on the mat (tan cover, NOTES
// label, elastic band). It opens from where it lies: the closed notebook starts at its desk
// rect and springs to the reading position (interface motion, P6), then the cover swings
// open on the spine in 3 stepped frames (a diegetic object). Closing runs it backwards and
// puts it back on the desk. Two spreads; page turns are stepped too. Text is Omar's voice in
// Grotesk (P5), clean on paper (P1). Reading the last page tells the story bus (stage 2).

import gsap from "gsap";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Ref } from "react";
import { springEase } from "@/lib/motion";
import { emitStory } from "../bus";
import { CONTACT_EMAIL } from "../content/projects";
import { getOriginRect } from "../desk/originRect";
import MarginNote from "../manual/MarginNote";
import { FRAME_MS, useDialogKeys, useFocusOnMount, useIsoLayoutEffect, useQuiet, useTopInset } from "../manual/hooks";
import Portrait from "./Portrait";
import s from "./Paper.module.css";

const TRAVEL = springEase(190, 24);

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

// the cover on its spine hinge, 3 frames at 12fps: shut, swinging, nearly flat
const COVER_FRAMES = ["rotateY(0deg)", "rotateY(-72deg)", "rotateY(-138deg)"];
// page leaf, 3 frames; content swaps on the middle one
const LEAF_FRAMES = ["rotateY(0deg)", "rotateY(-90deg)", "rotateY(-170deg)"];

type Phase = "shut" | 1 | 2 | "open";

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

/** the origin is usable only when the desk notebook is actually on screen */
function visibleRect(r: DOMRect | null): DOMRect | null {
  if (!r || r.width < 8 || r.height < 8) return null;
  if (r.bottom <= 0 || r.right <= 0 || r.top >= window.innerHeight || r.left >= window.innerWidth) return null;
  return r;
}

export default function Notebook({ onClose, titleRef }: { onClose(): void; titleRef: Ref<HTMLHeadingElement> }) {
  const quiet = useQuiet();
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLSpanElement>(null);
  useFocusOnMount(titleId);
  useTopInset(rootRef);

  const [phase, setPhase] = useState<Phase>(() => (quiet ? "open" : "shut"));
  const [spread, setSpread] = useState(0);
  const [leaf, setLeaf] = useState<{ frame: number; dir: 1 | -1 } | null>(null);
  const timers = useRef<number[]>([]);
  const toldLast = useRef(false);
  const closing = useRef(false);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      if (panelRef.current) gsap.killTweensOf(panelRef.current);
    },
    [],
  );

  /** the transform that puts the shut cover exactly over the desk notebook */
  const fromOrigin = () => {
    const el = panelRef.current;
    const cover = coverRef.current;
    const o = visibleRect(getOriginRect("notebook"));
    if (!el || !cover || !o) return null;
    const prev = el.style.transform;
    el.style.transform = "none";
    const R = el.getBoundingClientRect();
    const C = cover.getBoundingClientRect();
    el.style.transform = prev;
    const sx = o.width / C.width;
    const sy = o.height / C.height;
    return { x: o.left - R.left - (C.left - R.left) * sx, y: o.top - R.top - (C.top - R.top) * sy, scaleX: sx, scaleY: sy };
  };

  // open: travel from the desk on a spring, then the cover swings open in 3 frames
  useIsoLayoutEffect(() => {
    if (quiet) return;
    const el = panelRef.current;
    if (!el) return;
    const swing = () => {
      later(() => setPhase(1), FRAME_MS);
      later(() => setPhase(2), FRAME_MS * 2);
      later(() => setPhase("open"), FRAME_MS * 3);
    };
    gsap.fromTo(`.${s.scrim}`, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none" });
    const from = fromOrigin();
    if (from) {
      gsap.fromTo(
        el,
        { ...from, transformOrigin: "0 0" },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: TRAVEL.duration, ease: TRAVEL.ease, onComplete: swing },
      );
    } else {
      gsap.fromTo(el, { y: 48, scale: 0.96 }, { y: 0, scale: 1, duration: TRAVEL.duration, ease: TRAVEL.ease });
      swing();
    }
    // once, on open
     
  }, []);

  // closing: the cover shuts in 3 frames, then the notebook springs back to its place
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const el = panelRef.current;
    if (quiet || !el || phase !== "open" || leaf) {
      onClose();
      return;
    }
    setPhase(2);
    later(() => setPhase(1), FRAME_MS);
    later(() => {
      setPhase("shut");
      requestAnimationFrame(() => {
        const to = fromOrigin();
        if (!to) {
          onClose();
          return;
        }
        gsap.to(`.${s.scrim}`, { opacity: 0, duration: 0.2, ease: "none" });
        gsap.to(el, { ...to, transformOrigin: "0 0", duration: TRAVEL.duration * 0.8, ease: TRAVEL.ease, onComplete: onClose });
      });
    }, FRAME_MS * 2);
     
  }, [quiet, phase, leaf, onClose]);

  const onKeyDown = useDialogKeys(panelRef, close);

  useEffect(() => {
    if (spread === 1 && !toldLast.current) {
      toldLast.current = true;
      emitStory({ type: "notebook-last-page" });
    }
  }, [spread]);

  const turn = useCallback(
    (to: number) => {
      if (to < 0 || to > 1 || to === spread || leaf || phase !== "open") return;
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
     
    [spread, leaf, quiet, phase],
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

  const coverFrame = phase === "open" ? null : phase === "shut" ? 0 : phase;

  return (
    <div className={s.root} ref={rootRef}>
      <div className={s.scrim} onClick={close} aria-hidden="true" />
      <div
        ref={panelRef}
        className={s.notebook}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={keys}
        data-shut={phase === "shut" ? "" : undefined}
      >
        <div className={s.board}>
          <header className={s.head}>
            <h1 id={titleId} ref={titleRef} tabIndex={-1} className={s.h1}>
              <span>About Omar</span>
              <span className={s.kana} lang="ja">
                プロフィール
              </span>
            </h1>
            <button type="button" className={s.close} onClick={close} aria-label="Close the notebook">
              <span aria-hidden="true">✕</span>
            </button>
          </header>

          <div className={s.spread} data-spread={spread}>
            {spread === 0 ? (
              <>
                <section className={`${s.page} ${s.pageLeft}`} aria-label="Portrait">
                  <div className={s.pageInner}>
                    <Portrait max={180} />
                    <p className={s.caption}>Self-portrait, 36 × 48.</p>
                  </div>
                </section>
                <section className={`${s.page} ${s.pageRight}`}>
                  <div className={s.pageInner}>
                    <h2 className={s.h2}>Omar Golinelli</h2>
                    <p className={s.p}>Game designer. Online I go by PrimordialRune.</p>
                    <p className={s.p}>
                      I love metaphor and storytelling, and I use them to explain my games. Everything on this desk arrives
                      in its own medium: a cassette you flip, a cartridge you slot in, a disc, a booster you tear open. The
                      medium is the metaphor.
                    </p>
                    <p className={s.p}>
                      A lot of my work starts by re-reading a game I love: Generation 1 again on a wider handheld screen,
                      the Pokémon TCG as a cube.
                    </p>
                  </div>
                </section>
              </>
            ) : (
              <>
                <section className={`${s.page} ${s.pageLeft}`} aria-labelledby={`${titleId}-fav`}>
                  <div className={s.pageInner}>
                    <Label en="Favourites" jp="おきにいり" />
                    <h2 id={`${titleId}-fav`} className={s.h2}>
                      Games I keep going back to
                    </h2>
                    <ul className={s.list}>
                      {FAVOURITES.map((g) => (
                        <li key={g}>{g}</li>
                      ))}
                    </ul>
                  </div>
                </section>
                <section className={`${s.page} ${s.pageRight}`} aria-labelledby={`${titleId}-insp`}>
                  <div className={s.pageInner}>
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
                      Write to me:{" "}
                      <a className={s.link} href={`mailto:${CONTACT_EMAIL}`}>
                        {CONTACT_EMAIL}
                      </a>
                    </p>
                    <MarginNote id="notebook" />
                  </div>
                </section>
              </>
            )}
            <span className={s.spine} aria-hidden="true" />
            <span className={s.ribbon} aria-hidden="true" />

            {leaf && (
              <span
                className={s.leaf}
                data-dir={leaf.dir}
                style={{ transform: leaf.dir === 1 ? LEAF_FRAMES[leaf.frame] : LEAF_FRAMES[leaf.frame].replace("-", "") }}
                aria-hidden="true"
              />
            )}
          </div>

          <nav className={s.pager} aria-label="Pages">
            <button type="button" className={s.pageBtn} onClick={() => turn(spread - 1)} disabled={spread === 0}>
              <span aria-hidden="true">←</span> <span className={s.pageBtnLong}>Previous page</span>
              <span className={s.pageBtnShort}>Back</span>
            </button>
            <span className={s.pageNum} aria-live="polite">
              <span className="nd-sr-only">Pages </span>
              {spread * 2 + 1}–{spread * 2 + 2} / 4
            </span>
            <button type="button" className={s.pageBtn} onClick={() => turn(spread + 1)} disabled={spread === 1}>
              <span className={s.pageBtnLong}>Next page</span>
              <span className={s.pageBtnShort}>Next</span> <span aria-hidden="true">→</span>
            </button>
          </nav>
          <span className={s.elastic} aria-hidden="true" />
        </div>

        {coverFrame !== null && (
          <span
            ref={coverRef}
            className={s.cover}
            data-frame={coverFrame}
            style={{ transform: COVER_FRAMES[coverFrame] }}
            aria-hidden="true"
          >
            {coverFrame === 0 && (
              <>
                <span className={s.coverStitch} />
                <span className={s.coverLabel}>
                  <span>NOTES</span>
                </span>
                <span className={s.coverElastic} />
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
