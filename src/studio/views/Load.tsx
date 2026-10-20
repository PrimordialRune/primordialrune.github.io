"use client";

// LOAD / EJECT. Hero: the object entering its player. The object decides its transition (P3):
// carts insert, the tape flips sides, the CD tray closes and spins, the booster tears. Every
// object moves on stepped frames (P6) and every load ends on the manual's spring.
// Full (≤ 1.2 s) the first time per project, 400 ms short on repeats and in DIRECT mode, first
// frame → last frame in QUIET. Any input skips to the last frame. EJECT plays it backwards.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGame } from "../ctx";
import { getProject } from "../projects";
import { MANUALS } from "../script";
import type { Slug } from "../story";
import ObjectArt, { RES, gbMinWidth } from "../objects/art";
import { CdPlayer, CdTray, Deck, DeckGlass, Dmg, Gba } from "../objects/players";
import { quiet } from "../fx";
import { PLAYER_PALETTES, type ObjectKind } from "../projects";

const played = new Set<Slug>();

type Frame = gsap.TweenVars;
/** Stepped frames: each entry is set on its own frame, nothing in between is tweened */
function seq(tl: gsap.core.Timeline, el: gsap.TweenTarget, list: Frame[], fps = 12) {
  list.forEach((f) => tl.set(el, f, `+=${1 / fps}`));
  return tl;
}

function buildTimeline(kind: ObjectKind, root: HTMLElement, S: number) {
  const q = (sel: string) => root.querySelectorAll<HTMLElement>(sel);
  const tl = gsap.timeline({ paused: true });
  switch (kind) {
    case "gb-cart": {
      const cart = q(".ld-obj");
      const body = q(".ld-console");
      tl.set(body, { y: S * 0.14, autoAlpha: 0 }).set(cart, { y: -S * 0.62 }).set(q(".ld-screen"), { autoAlpha: 0 }).set(q(".ld-led"), { backgroundColor: PLAYER_PALETTES.dmg.slot, autoAlpha: 0 });
      // the Game Boy rises into the lower glass (2 frames)
      seq(tl, body, [{ y: S * 0.07, autoAlpha: 1 }, { y: 0 }]);
      tl.set(q(".ld-led"), { autoAlpha: 1 }, "<");
      // the cart drops into the slot behind its top edge (6 frames), then a 2px overshoot "click"
      seq(tl, cart, [-0.5, -0.38, -0.27, -0.17, -0.08, 0].map((k) => ({ y: S * k })));
      seq(tl, cart, [{ y: 2 }, { y: 0 }]);
      // the power LED (the cart's own GB red, not the AI's) and the screen at integer scale
      seq(tl, q(".ld-led"), [{ backgroundColor: PLAYER_PALETTES.dmg.led }]);
      seq(tl, q(".ld-screen"), [{ autoAlpha: 1, clipPath: "inset(0 0 50% 0)" }, { clipPath: "inset(0 0 0% 0)" }]);
      break;
    }
    case "gba-cart": {
      const cart = q(".ld-obj");
      tl.set(cart, { x: S * 0.62, y: -S * 0.05 }).set(q(".ld-screen"), { autoAlpha: 0 });
      // the label's logo flashes as it comes in, then it slides along the slot (6 frames)...
      seq(tl, cart, [{ filter: "brightness(1.9)" }, { filter: "none" }]);
      seq(tl, cart, [0.48, 0.34, 0.22, 0.12, 0.05, 0].map((k) => ({ x: S * k })));
      // ...and settles down into it (2 frames)
      seq(tl, cart, [{ y: -S * 0.02 }, { y: 0 }]);
      seq(tl, q(".ld-screen"), [{ autoAlpha: 1, clipPath: "inset(0 0 50% 0)" }, { clipPath: "inset(0 0 0% 0)" }]);
      break;
    }
    case "cassette": {
      const tape = q(".ld-obj");
      const a = q(".ld-side-a");
      const b = q(".ld-side-b");
      tl.set(b, { autoAlpha: 0 }).set(a, { autoAlpha: 1 }).set(tape, { y: -S * 0.31, scaleX: 1 });
      // A label → thinning edge → spine → edge → B label (15 fps)
      seq(
        tl,
        tape,
        [{ scaleX: 0.5 }, { scaleX: 0.12 }, { scaleX: 0.04 }, { scaleX: 0.12 }, { scaleX: 0.5 }, { scaleX: 1 }],
        15,
      );
      tl.set(a, { autoAlpha: 0 }, `-=${3 / 15}`).set(b, { autoAlpha: 1 }, "<");
      // drops into the deck behind its window (3 frames)
      seq(tl, tape, [{ y: -S * 0.19 }, { y: -S * 0.08 }, { y: 0 }]);
      // the reels turn: 4-frame stepped rotation, twice
      const reels = root.querySelectorAll(".ld-side-b .obj-reel");
      for (let i = 1; i <= 8; i++) tl.set(reels, { rotation: i * 90, transformOrigin: "50% 50%" }, `+=${1 / 15}`);
      break;
    }
    case "cd": {
      const tray = q(".ld-tray");
      const disc = q(".ld-obj");
      const spin = root.querySelectorAll(".obj-cd-spin");
      tl.set(tray, { x: 0 }).set(disc, { x: S * 0.5, y: -S * 0.7, autoAlpha: 1 }).set(spin, { rotation: 0 });
      // the tray ejects to the right (4 frames)
      seq(tl, tray, [0.13, 0.26, 0.38, 0.5].map((k) => ({ x: S * k })));
      // the disc drops onto it (2 frames)
      seq(tl, disc, [{ y: -S * 0.3 }, { y: 0 }]);
      // the tray closes with the disc (3 frames)
      seq(tl, [...Array.from(tray), ...Array.from(disc)], [0.33, 0.15, 0].map((k) => ({ x: S * k })));
      // 8-frame stepped spin under the lid window, two revolutions, stopping on the crown upright
      for (let i = 1; i <= 8; i++) tl.set(spin, { rotation: i * 90 }, `+=${1 / 15}`);
      break;
    }
    case "booster": {
      const tear = q(".ld-tear");
      const flap = q(".ld-flap");
      const base = q(".ld-obj");
      const cards = Array.from(q(".ld-card"));
      tl.set(tear, { clipPath: "inset(0 100% 0 0)", autoAlpha: 1 })
        .set(flap, { autoAlpha: 0, x: 0, y: 0, rotation: 0 })
        .set(base, { clipPath: "inset(0% 0 0 0)" })
        .set(cards, { autoAlpha: 0 });
      // the tear runs along the top crimp, left to right (4 frames)
      seq(tl, tear, [75, 50, 25, 0].map((r) => ({ clipPath: `inset(0 ${r}% 0 0)` })));
      // the flap flies off (3 frames)
      tl.set(base, { clipPath: "inset(7.5% 0 0 0)" }, `+=${1 / 12}`).set(flap, { autoAlpha: 1 }, "<").set(tear, { autoAlpha: 0 }, "<");
      seq(tl, flap, [
        { x: S * 0.08, y: -S * 0.1, rotation: 12 },
        { x: S * 0.2, y: -S * 0.22, rotation: 28 },
        { x: S * 0.34, y: -S * 0.3, rotation: 48, autoAlpha: 0 },
      ]);
      // five card backs fan out onto the playmat (5 frames)
      cards.forEach((c) => tl.set(c, { autoAlpha: 1 }, `+=${1 / 12}`));
      tl.set({}, {}, `+=${2 / 12}`);
      break;
    }
  }
  return tl;
}

function Scene({ kind, S }: { kind: ObjectKind; S: number }) {
  switch (kind) {
    case "gb-cart": {
      // the DMG screen window at integer scale (P1)
      const k = Math.max(1, Math.floor(Math.min((S * 0.47) / 160, (S * 0.4) / 144)));
      // never below the width where the label shows whole (the mini label is for thumbnails)
      const cartW = Math.max(Math.round(S * 0.34), Math.min(gbMinWidth(), Math.round(S * 0.42)));
      return (
        <>
          <span className="ld-obj ld-gb-cart" style={{ left: Math.round((S - cartW) / 2) }}>
            <ObjectArt kind="gb-cart" width={cartW} />
          </span>
          <span className="ld-console ld-dmg">
            <Dmg />
          </span>
          <span className="ld-led" />
          <span className="ld-screen ld-gb-screen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${RES}/galactic-news-cover.png`} alt="" width={160 * k} height={144 * k} />
          </span>
        </>
      );
    }
    case "gba-cart":
      return (
        <>
          <span className="ld-obj ld-gba-cart">
            <ObjectArt kind="gba-cart" width={Math.round(S * 0.46)} />
          </span>
          <span className="ld-console ld-gba">
            <Gba />
          </span>
          <span className="ld-screen ld-gba-screen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${RES}/minamoto-logo.png`} alt="" />
          </span>
        </>
      );
    case "cassette":
      return (
        <>
          <span className="ld-obj ld-tape">
            <span className="ld-side-a">
              <ObjectArt kind="cassette" width={Math.round(S * 0.54)} side="A" />
            </span>
            <span className="ld-side-b">
              <ObjectArt kind="cassette" width={Math.round(S * 0.54)} side="B" />
            </span>
          </span>
          <span className="ld-console ld-deck">
            <Deck />
          </span>
          <span className="ld-console ld-deck ld-deck-glass">
            <DeckGlass />
          </span>
        </>
      );
    case "cd":
      return (
        <>
          <span className="ld-tray">
            <CdTray />
          </span>
          <span className="ld-obj ld-disc">
            <ObjectArt kind="cd" width={Math.round(S * 0.4)} />
          </span>
          <span className="ld-console ld-player">
            <CdPlayer />
          </span>
        </>
      );
    case "booster":
      return (
        <>
          <span className="ld-mat">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${RES}/ptcg-cube-playmat.jpg`} alt="" />
          </span>
          {[-30, -15, 0, 15, 30].map((r, i) => (
            <span key={r} className="ld-card" style={{ ["--r" as string]: `${r}deg`, ["--i" as string]: i }} />
          ))}
          <span className="ld-obj ld-pack">
            <ObjectArt kind="booster" width={Math.round(S * 0.5)} />
          </span>
          <span className="ld-flap" aria-hidden="true">
            <ObjectArt kind="booster" width={Math.round(S * 0.5)} />
          </span>
          <svg className="ld-tear" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true">
            <polyline points="0,2 5,0 10,3 15,1 20,3.5 25,0.5 30,3 35,1 40,3.5 45,0 50,2.5 55,1 60,3.5 65,0.5 70,3 75,1 80,3.5 85,0 90,3 95,1 100,2" />
          </svg>
        </>
      );
  }
}

export default function Load({ slug, eject = false }: { slug: Slug; eject?: boolean }) {
  const { story, go, headingRef } = useGame();
  const p = getProject(slug);
  const root = useRef<HTMLDivElement>(null);
  const [S, setS] = useState(0);

  useLayoutEffect(() => {
    const el = root.current?.parentElement;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setS(Math.round(Math.min(r.width * 0.9, r.height * 0.92, 620)));
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || !S) return;
    const tl = buildTimeline(p.kind, el, S);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (eject) go({ kind: "record", focus: slug }, { replace: true });
      else {
        played.add(slug);
        go({ kind: "manual", slug });
      }
    };
    const total = tl.duration();
    const short = played.has(slug) || story.mode === "direct";
    let timer = 0;
    if (quiet()) {
      // first frame → last frame, 160 ms apart
      tl.progress(eject ? 1 : 0);
      timer = window.setTimeout(() => {
        tl.progress(eject ? 0 : 1);
        timer = window.setTimeout(finish, 160);
      }, 160);
    } else if (eject) {
      tl.progress(1);
      tl.timeScale(total / Math.min(total, 0.6));
      tl.eventCallback("onReverseComplete", finish);
      tl.reverse();
    } else {
      tl.timeScale(short ? total / 0.4 : 1);
      tl.eventCallback("onComplete", () => {
        timer = window.setTimeout(finish, short ? 60 : 220);
      });
      tl.play(0);
    }
    const skip = (e: Event) => {
      if (e instanceof KeyboardEvent && (e.key === "Tab" || e.key === "Shift")) return;
      tl.kill();
      tl.progress(eject ? 0 : 1);
      window.clearTimeout(timer);
      finish();
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      tl.kill();
      window.clearTimeout(timer);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
    // the transition runs once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S]);

  return (
    <div className="view load">
      <h1 className="sr-only" tabIndex={-1} ref={headingRef}>
        {eject ? `Ejecting ${MANUALS[slug].title}` : `Loading ${MANUALS[slug].title}. Press any key to skip.`}
      </h1>
      <div className="ld" ref={root} data-kind={p.kind} style={{ ["--S" as string]: `${S}px` }}>
        {S > 0 && <Scene kind={p.kind} S={S} />}
      </div>
    </div>
  );
}
