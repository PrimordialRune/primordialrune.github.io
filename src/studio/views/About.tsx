"use client";

// ABOUT (trainer card). Hero: the card, read like a handheld RPG's trainer card: a printed band,
// NAME / CLASS / TIME beside the portrait, a badge case where each badge is one of Omar's skills,
// and the records underneath. Facts are Omar's (clean Grotesk), field keys are the machine's
// (pixel). In act 2 a LAST SEEN field appears; activating it flips the card in 4 stepped frames
// to UTSUSHI's own card: same stock, its own portrait, and an empty badge case.

import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGame } from "../ctx";
import { TRAINER_CARD_LAST_SEEN, TRAINER_CARD_OMAR, TRAINER_CARD_UTSUSHI, type CardField } from "../script";
import { formatPlaytime } from "../story";
import AiLogo from "../Logo";
import { quiet, spring } from "../fx";
import { say } from "../narrator/narrator";

// ---------- portrait: a 48 × 56 placeholder in a 4-tone ordered dither (dither lives inside imagery, P4)

const TONES = ["#102f41", "#256069", "#339999", "#fce8cd"];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const PW = 48;
const PH = 56;
const LIGHT = (() => {
  const l = [-0.55, -0.6, 0.58];
  const n = Math.hypot(...l);
  return l.map((v) => v / n);
})();

function portraitPixels() {
  const out: number[] = [];
  const lit = (nx: number, ny: number) => {
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    return Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
  };
  for (let y = 0; y < PH; y++) {
    for (let x = 0; x < PW; x++) {
      const b = BAYER[(x % 4) + (y % 4) * 4];
      const px = x + 0.5;
      const py = y + 0.5;
      // background: plain card stock, a dithered shade gathering at the bottom
      let v = 3.6 - Math.max(0, (py - 34) / (PH - 34)) * 1.8;
      let lo = 2;
      let hi = 3;
      const hx = (px - 24) / 11;
      const hy = (py - 22) / 13;
      const head = hx * hx + hy * hy <= 1;
      const hair = head && (py < 17 + Math.abs(px - 24) * 0.25 || Math.abs(px - 24) > 9.2) && py < 27;
      const neck = Math.abs(px - 24) <= 4.5 && py >= 32 && py < 40;
      const half = 11 + (py - 40) * 1.5;
      const body = py >= 40 && Math.abs(px - 24) <= Math.min(half, 23);
      if (body) {
        // shirt: lit like a cylinder, with a darker collar notch
        const nx = (px - 24) / (Math.min(half, 23) + 1);
        const collar = Math.abs(px - 24) < 4 - (py - 40) * 0.5;
        v = collar ? 0.6 : 0.35 + 1.7 * lit(nx, -0.35);
        lo = 0;
        hi = 2;
      } else if (neck) {
        v = 0.6 + 0.9 * lit((px - 24) / 6, 0.2);
        lo = 0;
        hi = 2;
      }
      if (head) {
        if (hair) {
          v = 0.15 + 1.3 * lit(hx, hy);
          lo = 0;
          hi = 1;
        } else {
          v = 1.25 + 2.1 * lit(hx, hy);
          lo = 1;
          hi = 3;
        }
      }
      out.push(Math.max(lo, Math.min(hi, Math.floor(v + b - 0.5))));
    }
  }
  return out;
}

function Portrait() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(PW, PH);
    portraitPixels().forEach((t, i) => {
      const hex = TONES[t];
      img.data[i * 4] = parseInt(hex.slice(1, 3), 16);
      img.data[i * 4 + 1] = parseInt(hex.slice(3, 5), 16);
      img.data[i * 4 + 2] = parseInt(hex.slice(5, 7), 16);
      img.data[i * 4 + 3] = 255;
    });
    ctx.putImageData(img, 0, 0);
  }, []);
  return <canvas className="tc-portrait" ref={ref} width={PW} height={PH} aria-hidden="true" />;
}

// ---------- badges: one per skill, 12 × 12 pixel art drawn at an integer scale

const INK: Record<string, string> = {
  o: "#102f41",
  h: "#fce8cd",
  r: "#ec563b",
  g: "#fadb68",
  t: "#339999",
  q: "#4eb99f",
};
const BADGES: string[][] = [
  // Game Design: a die
  ["............", ".oooooooooo.", ".ohhhhhhhho.", ".ohoohhhhho.", ".ohoohhhhho.", ".ohhhoohhho.", ".ohhhoohhho.", ".ohhhhhooho.", ".ohhhhhooho.", ".ohhhhhhhho.", ".oooooooooo.", "............"],
  // Board Games: a meeple
  ["....oooo....", "...orrrro...", "...orrrro...", ".oooorrrooo.", "orrrrrrrrrro", "orrrrrrrrrro", ".oorrrrrroo.", "..orrrrrro..", ".orrroorrro.", ".orro..orro.", "orrro..orrro", "ooooo..ooooo"],
  // RPGs: a sword
  [".........ooo", "........ohqo", ".......ohqo.", "......ohqo..", ".....ohqo...", "..o.ohqo....", "..oogqo.....", "...ogo......", "..ogogo.....", ".ogo..oo....", "ogo.........", "oo.........."],
  // UI/UX: a pointer
  ["..o.........", "..oo........", "..oho.......", "..ohho......", "..ohhho.....", "..ohhhho....", "..ohhhhho...", "..ohhhhhho..", "..ohhhoooo..", "..ohoohho...", "..oo..oho...", "..o....oo..."],
  // Pixel Art: four big pixels
  ["............", ".oooooooooo.", ".orrrrggggo.", ".orrrrggggo.", ".orrrrggggo.", ".orrrrggggo.", ".ottttqqqqo.", ".ottttqqqqo.", ".ottttqqqqo.", ".ottttqqqqo.", ".oooooooooo.", "............"],
  // Strategy: a flag planted
  [".oo.........", ".ooooooooo..", ".oggggggggo.", ".oggggggggo.", ".oggggggggo.", ".oggggggggo.", ".ooooooooo..", ".oo.........", ".oo.........", ".oo.........", "oooo........", "oooo........"],
];

function Badge({ art }: { art: string[] }) {
  const rects: React.ReactNode[] = [];
  art.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c !== ".") rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={INK[c]} />);
    }),
  );
  return (
    <svg className="tc-badge-art" viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
      {rects}
    </svg>
  );
}

// ---------- the card

function Field({ f }: { f: CardField }) {
  return (
    <div className="tc-field">
      <dt className="v-machine">{f.key}</dt>
      <dd>
        {Array.isArray(f.value) ? (
          <ul>
            {f.value.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        ) : (
          f.value
        )}
        {f.keyJp && (
          <span className="v-sub tc-jp" lang="ja" aria-hidden="true">
            {f.keyJp}
          </span>
        )}
      </dd>
    </div>
  );
}

/** Frames 1–2 of the flip turn the card edge-on, frames 3–4 turn the other side to face us */
const halfOut = (el: Element, done: () => void) =>
  gsap.timeline().set(el, { scaleX: 0.5 }, 1 / 12).set(el, { scaleX: 0.08 }, 2 / 12).call(done, [], 2 / 12);
const halfIn = (el: Element) => gsap.timeline().set(el, { scaleX: 0.08 }, 0).set(el, { scaleX: 0.5 }, 1 / 12).set(el, { scaleX: 1 }, 2 / 12);

const byKey = (fields: CardField[], key: string) => fields.find((f) => f.key === key);

export default function About({ side }: { side: "omar" | "utsushi" }) {
  const { story, go, dispatch, headingRef } = useGame();
  const card = useRef<HTMLDivElement>(null);
  const flipping = useRef(false);

  const flipTo = (next: "omar" | "utsushi") => {
    const el = card.current;
    if (!el) return go({ kind: "about", side: next }, { replace: true });
    flipping.current = true;
    if (quiet()) {
      gsap.set(el, { scaleX: 1 });
      return go({ kind: "about", side: next }, { replace: true });
    }
    halfOut(el, () => go({ kind: "about", side: next }, { replace: true }));
  };

  // the card is an interface panel: it springs up into the glass on arrival
  useLayoutEffect(() => {
    if (card.current) spring(card.current, { y: 0, autoAlpha: 1 }, undefined, { y: 48, autoAlpha: 0 });
  }, []);

  useLayoutEffect(() => {
    if (!flipping.current || !card.current) return;
    flipping.current = false;
    if (!quiet()) halfIn(card.current);
  }, [side]);

  const lastSeen = () => {
    // the card turns now; the act changes once its last act 2 line has been read
    say("about.lastseen", { onRead: () => dispatch({ type: "LAST_SEEN" }) });
    flipTo("utsushi");
  };

  const utsushi = side === "utsushi";
  const fields = utsushi ? TRAINER_CARD_UTSUSHI : TRAINER_CARD_OMAR;
  const top = fields.filter((f) => f.key === "NAME" || f.key === "CLASS");
  const skills = byKey(fields, "SKILLS");
  const records = fields.filter((f) => !top.includes(f) && f !== skills);
  const skillList = Array.isArray(skills?.value) ? skills.value : [];

  return (
    <div className="view about">
      <h1 className="sr-only" tabIndex={-1} ref={headingRef}>
        {utsushi ? "Trainer card: Utsushi" : "Trainer card: Omar Golinelli"}
      </h1>
      <div className="tc" ref={card} data-side={side}>
        <p className="tc-band" aria-hidden="true">
          <span className="v-machine">TRAINER CARD</span>
          <span className="v-sub tc-band-jp" lang="ja">
            トレーナーカード
          </span>
        </p>
        <div className="tc-main">
          <dl className="tc-fields">
            {top.map((f) => (
              <Field key={f.key} f={f} />
            ))}
            <div className="tc-field">
              <dt className="v-machine">TIME</dt>
              <dd className="tc-time">{formatPlaytime(story.activeSeconds)}</dd>
            </div>
            {!utsushi && story.act === 2 && story.mode === "story" && (
              <div className="tc-field">
                <dt className="v-machine">{TRAINER_CARD_LAST_SEEN.key}</dt>
                <dd>
                  <button type="button" className="tc-lastseen" onClick={lastSeen} aria-label="Last seen: unknown. Check it">
                    {TRAINER_CARD_LAST_SEEN.value as string}
                  </button>
                </dd>
              </div>
            )}
          </dl>
          <div className="tc-pic">{utsushi ? <AiLogo fill="red" className="tc-logo" /> : <Portrait />}</div>
        </div>

        <section className="tc-case" aria-label={utsushi ? "Badges: none" : "Badges: skills"}>
          <h2 className="tc-case-title v-machine" aria-hidden="true">
            BADGES
          </h2>
          <ul className="tc-badges">
            {BADGES.map((art, i) =>
              utsushi || !skillList[i] ? (
                <li key={i} className="tc-badge tc-badge-empty" aria-hidden="true">
                  <span className="tc-slot" />
                </li>
              ) : (
                <li key={i} className="tc-badge">
                  <span className="tc-slot">
                    <Badge art={art} />
                  </span>
                  <span className="tc-badge-name">{skillList[i]}</span>
                </li>
              ),
            )}
          </ul>
        </section>

        {records.length > 0 && (
          <dl className="tc-records">
            {records.map((f) => (
              <Field key={f.key} f={f} />
            ))}
          </dl>
        )}

        {story.act === 3 && (
          <button
            type="button"
            className="tc-flip v-machine"
            onClick={() => {
              say(utsushi ? "about.flipback" : "about.utsushi", { interrupt: true });
              flipTo(utsushi ? "omar" : "utsushi");
            }}
          >
            {utsushi ? "FLIP BACK" : "FLIP"}
          </button>
        )}
      </div>
    </div>
  );
}
