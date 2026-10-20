"use client";

// ABOUT (trainer card). Hero: the card. Facts are Omar's (clean Grotesk), field keys are the
// machine's (pixel). In act 2 a LAST SEEN field appears; activating it flips the card in 4
// stepped frames to UTSUSHI's own card.

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGame } from "../ctx";
import { TRAINER_CARD_LAST_SEEN, TRAINER_CARD_OMAR, TRAINER_CARD_UTSUSHI, type CardField } from "../script";
import AiLogo from "../Logo";
import { quiet } from "../fx";
import { say } from "../narrator/narrator";

/** A placeholder silhouette in a 4-tone dither (dither lives inside imagery only, P4) */
function Portrait() {
  // 32 × 32 px picture: head and shoulders, ordered dither between the tones
  const tones = ["#102f41", "#256069", "#339999", "#fce8cd"];
  const px: { x: number; y: number; c: string }[] = [];
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const head = (x - 16) ** 2 / 49 + (y - 12) ** 2 / 64 <= 1;
      const body = y >= 21 && Math.abs(x - 16) <= 6 + (y - 21) * 0.9;
      const light = (32 - x + (32 - y)) / 64; // light from the top left
      let t: number;
      if (head || body) {
        const v = 1 + light * 1.6;
        const bayer = [0, 2, 3, 1][(x % 2) + (y % 2) * 2] / 4;
        t = Math.min(2, Math.floor(v + bayer - 0.3));
      } else {
        t = (x + y) % 2 === 0 && y < 16 ? 3 : y > 26 ? 0 : 3;
        if (t === 3 && y >= 16) t = (x + y) % 4 === 0 ? 2 : 3;
      }
      px.push({ x, y, c: tones[t] });
    }
  }
  return (
    <svg className="card-portrait" viewBox="0 0 32 32" shapeRendering="crispEdges" aria-hidden="true">
      {px.map((p) => (
        <rect key={`${p.x}-${p.y}`} x={p.x} y={p.y} width="1" height="1" fill={p.c} />
      ))}
    </svg>
  );
}

function Field({ f }: { f: CardField }) {
  return (
    <div className="card-field">
      <dt className="v-machine">
        {f.key}
        {f.keyJp && (
          <span className="v-sub card-keyjp" lang="ja">
            {f.keyJp}
          </span>
        )}
      </dt>
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
      </dd>
    </div>
  );
}

/** Frames 1–2 of the flip turn the card edge-on, frames 3–4 turn the other side to face us */
const halfOut = (el: Element, done: () => void) =>
  gsap.timeline().set(el, { scaleX: 0.5 }, 1 / 12).set(el, { scaleX: 0.08 }, 2 / 12).call(done, [], 2 / 12);
const halfIn = (el: Element) => gsap.timeline().set(el, { scaleX: 0.08 }, 0).set(el, { scaleX: 0.5 }, 1 / 12).set(el, { scaleX: 1 }, 2 / 12);

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

  useLayoutEffect(() => {
    if (!flipping.current || !card.current) return;
    flipping.current = false;
    if (!quiet()) halfIn(card.current);
  }, [side]);

  const lastSeen = () => {
    say("about.lastseen", { interrupt: true });
    dispatch({ type: "LAST_SEEN" });
    flipTo("utsushi");
  };

  const utsushi = side === "utsushi";
  const fields = utsushi ? TRAINER_CARD_UTSUSHI : TRAINER_CARD_OMAR;

  return (
    <div className="view about">
      <h1 className="sr-only" tabIndex={-1} ref={headingRef}>
        {utsushi ? "Trainer card: Utsushi" : "Trainer card: Omar Golinelli"}
      </h1>
      <div className="card" ref={card} data-side={side}>
        <p className="card-title v-machine" aria-hidden="true">
          TRAINER CARD
        </p>
        <div className="card-grid">
          <div className="card-pic">{utsushi ? <AiLogo fill="red" className="card-logo" /> : <Portrait />}</div>
          <dl className="card-fields">
            {fields.map((f) => (
              <Field key={f.key} f={f} />
            ))}
            {!utsushi && story.act === 2 && story.mode === "story" && (
              <div className="card-field">
                <dt className="v-machine">{TRAINER_CARD_LAST_SEEN.key}</dt>
                <dd>
                  <button type="button" className="card-lastseen" onClick={lastSeen} aria-label="Last seen: unknown. Check it">
                    {TRAINER_CARD_LAST_SEEN.value as string}
                  </button>
                </dd>
              </div>
            )}
          </dl>
        </div>
        {story.act === 3 && (
          <button
            type="button"
            className="card-flip v-machine"
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
