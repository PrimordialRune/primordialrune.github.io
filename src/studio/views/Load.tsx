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
import ObjectArt, { RES } from "../objects/art";
import { quiet } from "../fx";
import type { ObjectKind } from "../projects";

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
      tl.set(q(".ld-slot"), { y: S * 0.12, autoAlpha: 0 }).set(cart, { y: -S * 0.75 }).set(q(".ld-screen"), { autoAlpha: 0 });
      // the DMG slot rises (2 frames)
      seq(tl, q(".ld-slot"), [{ y: S * 0.06, autoAlpha: 1 }, { y: 0 }]);
      // the cart drops in (6 frames), then a 2px overshoot "click"
      seq(tl, cart, [-0.62, -0.48, -0.34, -0.2, -0.08, 0].map((k) => ({ y: S * k })));
      seq(tl, cart, [{ y: 2 }, { y: 0 }]);
      // the cart's own LED (GB palette, not the AI red), then the screen at integer scale
      seq(tl, q(".ld-led"), [{ backgroundColor: "#bd502f" }]);
      seq(tl, q(".ld-screen"), [{ autoAlpha: 1, clipPath: "inset(0 0 50% 0)" }, { clipPath: "inset(0 0 0% 0)" }]);
      break;
    }
    case "gba-cart": {
      const cart = q(".ld-obj");
      tl.set(cart, { x: S * 0.9 }).set(q(".ld-slot"), { autoAlpha: 1 });
      seq(tl, cart, [{ x: S * 0.9, filter: "brightness(1.9)" }, { filter: "none" }]);
      seq(tl, cart, [0.66, 0.48, 0.32, 0.2, 0.1, 0].map((k) => ({ x: S * k })));
      seq(tl, cart, [{ x: -4 }, { x: 0 }]);
      break;
    }
    case "cassette": {
      const tape = q(".ld-obj");
      const a = q(".ld-side-a");
      const b = q(".ld-side-b");
      tl.set(b, { autoAlpha: 0 }).set(a, { autoAlpha: 1 }).set(tape, { y: -S * 0.28, scaleX: 1 }).set(q(".ld-deck"), { autoAlpha: 1 });
      // A label → thinning edge → spine → edge → B label (5 frames, 15 fps)
      seq(
        tl,
        tape,
        [{ scaleX: 0.5 }, { scaleX: 0.12 }, { scaleX: 0.04 }, { scaleX: 0.12 }, { scaleX: 0.5 }, { scaleX: 1 }],
        15,
      );
      tl.set(a, { autoAlpha: 0 }, `-=${3 / 15}`).set(b, { autoAlpha: 1 }, "<");
      // drops into the deck window (3 frames)
      seq(tl, tape, [{ y: -S * 0.17 }, { y: -S * 0.07 }, { y: 0 }]);
      // reels turn: 4-frame stepped rotation, twice
      const reels = root.querySelectorAll(".ld-side-b .obj-reel");
      for (let i = 1; i <= 8; i++) tl.set(reels, { rotation: i * 90, transformOrigin: "50% 50%" }, `+=${1 / 15}`);
      break;
    }
    case "cd": {
      const tray = q(".ld-tray");
      const disc = q(".ld-obj");
      const spin = root.querySelectorAll(".obj-cd-spin");
      tl.set(tray, { x: 0 }).set(disc, { x: S * 0.42, y: -S * 0.7, autoAlpha: 1 }).set(spin, { rotation: 0 });
      // the tray ejects to the right (4 frames)
      seq(tl, tray, [0.1, 0.2, 0.32, 0.42].map((k) => ({ x: S * k })));
      // the disc drops onto it (2 frames)
      seq(tl, disc, [{ y: -S * 0.3 }, { y: 0 }]);
      // the tray closes with the disc (3 frames)
      seq(tl, [...Array.from(tray), ...Array.from(disc)], [0.28, 0.12, 0].map((k) => ({ x: S * k })));
      // 8-frame stepped spin, two revolutions, stopping on the crown upright (15 fps)
      for (let i = 1; i <= 8; i++) tl.set(spin, { rotation: i * 90 }, `+=${1 / 15}`);
      break;
    }
    case "booster": {
      const tear = q(".ld-tear");
      const flap = q(".ld-flap");
      const base = q(".ld-obj");
      const cards = Array.from(q(".ld-card"));
      const mat = q(".ld-mat");
      tl.set(tear, { clipPath: "inset(0 100% 0 0)", autoAlpha: 1 })
        .set(flap, { autoAlpha: 0, x: 0, y: 0, rotation: 0 })
        .set(base, { clipPath: "inset(0% 0 0 0)" })
        .set(cards, { autoAlpha: 0 })
        .set(mat, { clipPath: "inset(0 0 100% 0)", autoAlpha: 1 });
      // the tear runs along the top crimp, left to right (4 frames)
      seq(tl, tear, [75, 50, 25, 0].map((r) => ({ clipPath: `inset(0 ${r}% 0 0)` })));
      // the flap flies off (3 frames)
      tl.set(base, { clipPath: "inset(7.5% 0 0 0)" }, `+=${1 / 12}`).set(flap, { autoAlpha: 1 }, "<").set(tear, { autoAlpha: 0 }, "<");
      seq(tl, flap, [
        { x: S * 0.08, y: -S * 0.1, rotation: 12 },
        { x: S * 0.2, y: -S * 0.22, rotation: 28 },
        { x: S * 0.34, y: -S * 0.3, rotation: 48, autoAlpha: 0 },
      ]);
      // five card backs fan out (5 frames), the playmat unrolls behind them in 3 bands
      const fan = gsap.timeline();
      cards.forEach((c, i) => fan.set(c, { autoAlpha: 1 }, i / 12));
      tl.add(fan, `+=${1 / 12}`);
      seq(tl, mat, [{ clipPath: "inset(0 0 66% 0)" }, { clipPath: "inset(0 0 33% 0)" }, { clipPath: "inset(0 0 0% 0)" }], 12);
      tl.set({}, {}, `+=${1 / 12}`);
      break;
    }
  }
  return tl;
}

function Scene({ kind, S }: { kind: ObjectKind; S: number }) {
  switch (kind) {
    case "gb-cart": {
      const k = Math.max(1, Math.floor((S * 0.56) / 160));
      return (
        <>
          <span className="ld-obj ld-gb-cart">
            <ObjectArt kind="gb-cart" width={Math.round(S * 0.34)} />
          </span>
          <span className="ld-slot ld-dmg">
            <span className="ld-led" />
          </span>
          <span className="ld-screen">
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
            <ObjectArt kind="gba-cart" width={Math.round(S * 0.5)} />
          </span>
          <span className="ld-slot ld-gba" />
        </>
      );
    case "cassette":
      return (
        <>
          <span className="ld-deck" />
          <span className="ld-obj ld-tape">
            <span className="ld-side-a">
              <ObjectArt kind="cassette" width={Math.round(S * 0.56)} side="A" />
            </span>
            <span className="ld-side-b">
              <ObjectArt kind="cassette" width={Math.round(S * 0.56)} side="B" />
            </span>
          </span>
        </>
      );
    case "cd":
      return (
        <>
          <span className="ld-player" />
          <span className="ld-tray" />
          <span className="ld-obj ld-disc">
            <ObjectArt kind="cd" width={Math.round(S * 0.42)} />
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
    setS(Math.round(Math.min(r.width * 0.86, r.height * 0.9, 560)));
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
