"use client";

// HUB (TALK). Hero: the logo, the AI's face. The command window (Earthbound-style) is the nav,
// and the AI rewrites it as the story moves on. With `ending`, it plays act 4: the objects are
// put away in their own media, the commands go out one by one, the logo comes apart on its grid.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGame } from "../ctx";
import AiLogo from "../Logo";
import { say, clearNarrator } from "../narrator/narrator";
import { commands, logoFill, type Command } from "../story";
import { glitch, quiet, spring, frames } from "../fx";
import { PROJECTS } from "../projects";
import ObjectArt from "../objects/art";

export default function Hub({ ending = false }: { ending?: boolean }) {
  const { story, dispatch, go, openRecord, headingRef } = useGame();
  const win = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const logo = useRef<SVGSVGElement>(null);
  const cmds = commands(story);

  // the command window arrives on a spring
  useEffect(() => {
    if (!win.current || ending) return;
    spring(win.current, { x: 0, autoAlpha: 1 }, undefined, { x: 40, autoAlpha: 0 });
  }, [ending]);

  const run = (c: Command) => {
    switch (c.id) {
      case "works":
        openRecord();
        return;
      case "about": {
        const side = story.act === 3 ? "utsushi" : "omar";
        go({ kind: "about", side });
        glitch("static");
        say(side === "utsushi" ? "about.utsushi" : "about.enter");
        return;
      }
      case "contact":
        go({ kind: "contact" });
        glitch("static");
        say("contact.enter");
        return;
      case "question":
        // the question is asked first; the truth follows once it is on screen
        say("question", { onRead: () => dispatch({ type: "QUESTION" }) });
        return;
      case "yes":
        dispatch({ type: "CHOICE", choice: "yes" });
        return;
      case "stay":
        say("choice.stay", { interrupt: true, replace: true });
        dispatch({ type: "CHOICE", choice: "stay" });
        return;
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const items = Array.from(win.current?.querySelectorAll<HTMLButtonElement>(".cmd") ?? []);
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const n = items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length];
    if (n) {
      e.preventDefault();
      n.focus();
    }
  };

  const poke = () => {
    dispatch({ type: "LOGO" });
    say("logo");
  };

  // ---------- the ending ----------
  useEffect(() => {
    if (!ending) return;
    const el = root.current;
    if (!el) return;
    let finished = false;
    const timers: number[] = [];
    let tl: gsap.core.Timeline | null = null;
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    const finish = () => {
      if (finished) return;
      finished = true;
      tl?.kill();
      clearNarrator();
      go({ kind: "void" }, { replace: true });
    };
    // the last line waits for both: the lines read out and the room emptied (about 6 s in all)
    let linesDone = false;
    let purgeDone = false;
    let lastSaid = false;
    const last = () => {
      if (finished || lastSaid || !linesDone || !purgeDone) return;
      lastSaid = true;
      say("end.last", { interrupt: true, replace: true, onShown: () => later(finish, 1000) });
    };
    const purge = () => {
      if (finished) return;
      const objs = Array.from(el.querySelectorAll<HTMLElement>(".end-obj"));
      const items = Array.from(el.querySelectorAll<HTMLElement>(".cmd-item"));
      const cellsI = logo.current?.querySelectorAll<SVGRectElement>(".cell-i");
      const cellsO = logo.current?.querySelectorAll<SVGRectElement>(".cell-o");
      tl = gsap.timeline({
        onComplete: () => {
          purgeDone = true;
          last();
        },
      });
      if (quiet()) {
        // first frame → last frame
        tl.set(objs, { autoAlpha: 0 }, 0.16).set(items, { autoAlpha: 0 }, 0.16);
        tl.set([cellsI, cellsO], { attr: { fill: "none" } }, 0.32);
        return;
      }
      // each object put away in its own medium, in stepped frames (≤ 300 ms each)
      objs.forEach((o) => {
        const kind = o.dataset.kind;
        const v =
          kind === "gb-cart"
            ? { y: 140, ...frames(2) }
            : kind === "cassette"
              ? { scaleX: 0, ...frames(2) }
              : kind === "cd"
                ? { scale: 0.2, rotate: 180, ...frames(2) }
                : kind === "booster"
                  ? { scaleY: 0, ...frames(2) }
                  : { x: 220, ...frames(2) };
        tl!.to(o, v).set(o, { autoAlpha: 0 });
      });
      // the commands, hard cuts 120 ms apart
      items.forEach((it) => tl!.set(it, { autoAlpha: 0 }, "+=0.12"));
      // the logo comes apart: the inner path in 4 stepped frames, then the outer
      for (const cells of [cellsI, cellsO]) {
        for (let g = 0; g < 4; g++) {
          const group = Array.from(cells ?? []).filter((c) => c.dataset.g === String(g));
          tl.set(group, { attr: { fill: "none" } }, `+=${1 / 12}`);
        }
      }
    };
    say("end", {
      onShown: () =>
        later(() => {
          linesDone = true;
          last();
        }, 500),
    });
    // the room empties while the AI is still talking
    later(purge, 600);
    const start = Date.now();
    const skip = (e: Event) => {
      if (Date.now() - start < 1000) return;
      if (e instanceof KeyboardEvent && (e.key === "Tab" || e.key === "Shift")) return;
      finish();
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      finished = true;
      tl?.kill();
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [ending, go]);

  return (
    <div className="view hub" ref={root} data-ending={ending || undefined}>
      <h1 className="sr-only" tabIndex={-1} ref={headingRef}>
        {ending ? "The end" : "Talk"}
      </h1>
      <div className="hub-face">
        <span className="hub-glow" aria-hidden="true" />
        <button type="button" className="logo-btn" onClick={poke} disabled={ending} aria-label="The logo. Poke it">
          <AiLogo ref={logo} fill={ending ? "red" : logoFill(story.act)} className="hub-logo" grid={ending} />
        </button>
      </div>
      <div className="cmdwin" ref={win} onKeyDown={onKey}>
        <ul className="cmd-list" aria-label="Commands">
          {cmds.map((c) => (
            <li key={c.id} className="cmd-item">
              <button type="button" className="cmd" onClick={() => run(c)} disabled={ending} data-id={c.id}>
                <span className="cmd-en v-machine">{c.en}</span>
                <span className="cmd-jp v-sub" lang="ja" aria-hidden="true">
                  {c.jp}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {ending && (
        <div className="end-row" aria-hidden="true">
          {PROJECTS.map((p) => (
            <span key={p.slug} className="end-obj" data-kind={p.kind}>
              <ObjectArt kind={p.kind} width={window.innerWidth < 720 ? 50 : 72} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
