"use client";

// CONTACT. Hero: the contact list. Big, clean Grotesk; the CRT treatment is off on this panel.
// The details are real and always work.

import { useState } from "react";
import { useGame } from "../ctx";
import { CONTACTS } from "../projects";
import { say } from "../narrator/narrator";

export default function Contact() {
  const { headingRef } = useGame();
  const [copied, setCopied] = useState(false);
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
      <div className="ct-panel">
        <h1 className="ct-title" tabIndex={-1} ref={headingRef}>
          Contact
          <span className="v-sub ct-jp" lang="ja">
            コンタクト
          </span>
        </h1>
        <ul className="ct-list">
          {CONTACTS.map((c) => (
            <li key={c.label} className="ct-row">
              <span className="ct-label">
                {c.label}
                <span className="v-sub" lang="ja">
                  {c.jp}
                </span>
              </span>
              <a className="ct-value" href={c.url} target={c.url.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                {c.value}
              </a>
              {c.copy && (
                <button type="button" className="ct-copy" onClick={() => copy(c.value)} aria-label={`Copy ${c.label.toLowerCase()} address`}>
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </li>
          ))}
        </ul>
        <p className="sr-only" role="status" aria-live="polite">
          {copied ? "Email address copied" : ""}
        </p>
      </div>
    </div>
  );
}
