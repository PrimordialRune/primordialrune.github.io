"use client";

// MANUAL (case study). Hero: the object on the cover. Everything else is editorial: a clean
// cream booklet with no scanlines, glow or fringing (P1, P2). It slides up on a spring.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGame } from "../ctx";
import { getProject, neighbour, OMAR_TODO } from "../projects";
import { MANUALS } from "../script";
import type { Slug } from "../story";
import ObjectArt, { gbMinWidth } from "../objects/art";
import { spring } from "../fx";
import { say } from "../narrator/narrator";

function Section({ title, body }: { title: string; body?: string[] }) {
  const paras = body && body.length ? body : null;
  return (
    <section className="mn-sec">
      <h2>{title}</h2>
      {paras ? paras.map((t, i) => <p key={i}>{t}</p>) : <p className="mn-todo">{OMAR_TODO}</p>}
    </section>
  );
}

export default function Manual({ slug }: { slug: Slug }) {
  const { story, go, loadProject, headingRef } = useGame();
  const p = getProject(slug);
  const m = MANUALS[slug];
  const panel = useRef<HTMLElement>(null);
  const closing = useRef(false);

  useEffect(() => {
    if (panel.current) spring(panel.current, { yPercent: 0 }, undefined, { yPercent: 100 });
    if (story.mode === "direct") say("direct.manual", { force: true, interrupt: true });
    else say(`read:${slug}`);
    // once per manual mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const eject = () => {
      if (closing.current) return;
      closing.current = true;
      const done = () => {
        go({ kind: "load", slug, eject: true });
        say(`close:${slug}`);
      };
      if (!panel.current) return done();
      gsap.killTweensOf(panel.current);
      spring(panel.current, { yPercent: 100, onComplete: done });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") loadProject(neighbour(slug, 1));
      else if (e.key === "ArrowLeft") loadProject(neighbour(slug, -1));
      else return;
      e.preventDefault();
    };
    window.addEventListener("studio:eject", eject);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("studio:eject", eject);
      window.removeEventListener("keydown", onKey);
    };
  }, [slug, go, loadProject]);

  const eject = () => window.dispatchEvent(new Event("studio:eject"));

  return (
    <div className="view manual">
      <article className="booklet" ref={panel} aria-labelledby="mn-title">
        <header className="mn-cover">
          <div className="mn-obj">
            <ObjectArt kind={p.kind} width={p.kind === "gb-cart" ? Math.max(160, gbMinWidth()) : p.kind === "gba-cart" ? 216 : 200} />
          </div>
          <div className="mn-head">
            <p className="mn-kicker">Instruction manual</p>
            <h1 id="mn-title" tabIndex={-1} ref={headingRef}>
              {m.title}
              <span className="mn-jp v-sub" lang="ja" aria-hidden="true">
                {m.titleJp}
              </span>
            </h1>
            <p className="mn-pitch">{m.pitch}</p>
            <dl className="mn-facts">
              {m.facts.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </header>
        <div className="mn-body">
          <Section title="What it is" body={m.whatItIs} />
          <Section title="What I did" body={m.whatIDid} />
          <Section title="How it plays" body={m.howItPlays} />
          {m.credits && m.credits.length > 0 && <Section title="Credits" body={m.credits} />}
          {m.links && m.links.length > 0 && (
            <section className="mn-sec">
              <h2>Links</h2>
              <ul>
                {m.links.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noreferrer">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <footer className="mn-foot">
          <button type="button" onClick={() => loadProject(neighbour(slug, -1))}>
            ← Prev manual
          </button>
          <button type="button" className="mn-eject" onClick={eject}>
            Eject <span className="mn-key">(Esc)</span>
          </button>
          <button type="button" onClick={() => loadProject(neighbour(slug, 1))}>
            Next manual →
          </button>
        </footer>
      </article>
    </div>
  );
}
