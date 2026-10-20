"use client";

// CONTACT. Hero: the back page of a game manual, the one with the address on it. It's paper (an
// object, lit and shadowed), but everything printed on it is Omar's: clean Grotesk, no CRT
// treatment, plain selectable text. The details are real and always work.

import { useLayoutEffect, useRef, useState } from "react";
import { useGame } from "../ctx";
import { CONTACTS } from "../projects";
import { say } from "../narrator/narrator";
import { FrameLogo } from "../Logo";
import { spring } from "../fx";

/** A decorative product barcode for the page's foot (the bars mean nothing) */
const BARS = [
  3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 1, 2, 1, 1, 2, 3,
  1, 1, 2, 1, 1, 3,
];

/** Each bar's x offset, worked out once */
const BAR_X = BARS.map((_, i) => BARS.slice(0, i).reduce((a, w) => a + w, 0));
const BARS_W = BARS.reduce((a, w) => a + w, 0);

function Barcode() {
  return (
    <svg
      className="ct-barcode"
      viewBox={`0 0 ${BARS_W} 22`}
      width={BARS_W * 2}
      height="44"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {BARS.map((w, i) =>
        i % 2 === 0 ? <rect key={i} x={BAR_X[i]} y="0" width={w} height="22" /> : null,
      )}
    </svg>
  );
}

export default function Contact() {
  const { headingRef } = useGame();
  const page = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // the page is an interface panel: it springs up into the glass
  useLayoutEffect(() => {
    if (page.current)
      spring(page.current, { y: 0, autoAlpha: 1 }, undefined, {
        y: 48,
        autoAlpha: 0,
      });
  }, []);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
    say("copy.contact", { interrupt: true });
  };

  return (
    <div className="view contact">
      <div className="ct-sheet" ref={page}>
        <div className="ct-panel">
          <div className="ct-head">
            <h1 className="ct-title" tabIndex={-1} ref={headingRef}>
              Contact
              <span className="v-sub ct-jp" lang="ja" aria-hidden="true">
                コンタクト
              </span>
            </h1>
            <p className="ct-who">
              Omar Golinelli
              <span>Game designer &amp; developer</span>
            </p>
          </div>
          <ul className="ct-list">
            {CONTACTS.map((c) => (
              <li key={c.label} className="ct-row">
                <span className="ct-label">
                  {c.label}
                  <span className="v-sub" lang="ja" aria-hidden="true">
                    {c.jp}
                  </span>
                </span>
                <a
                  className="ct-value"
                  href={c.url}
                  target={c.url.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                >
                  {c.value}
                </a>
                {c.copy && (
                  <button
                    type="button"
                    className="ct-copy"
                    onClick={() => copy(c.value)}
                    aria-label={`Copy ${c.label.toLowerCase()} address`}
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="ct-foot" aria-hidden="true">
            <span className="ct-stamp">
              <FrameLogo size={28} />
              <span>PrimordialRune</span>
            </span>
            <Barcode />
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {copied ? "Email address copied" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
