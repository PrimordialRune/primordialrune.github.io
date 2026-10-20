"use client";

// The narrator's box. It belongs to the glass in act 0, leans out over the bezel in act 1,
// escapes onto the cream page in act 2 and floats over the top bezel in act 3. Moves between
// positions are springs (it's an interface panel). The typewriter is visual only: screen
// readers get each full line once through the live region.

import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import {
  advance,
  currentPage,
  narratorVersion,
  pageRead,
  pageShown,
  pendingCount,
  subscribeNarrator,
} from "./narrator";
import { BOX, quiet, spring } from "../fx";
import { useGame } from "../ctx";
import { nameTag, nameTagLabel } from "../story";

export type BoxPos = "hidden" | "docked" | "leaning" | "escaped" | "floating" | "tab";

const CPS = 40;
const SCRAMBLE = "#%&@$0123456789ABCDEFGHJKMNPQRSTUVWXYZ";

function NameTag() {
  const { story } = useGame();
  const tag = nameTag(story.act);
  const el = useRef<HTMLSpanElement>(null);
  const prev = useRef(tag);
  useEffect(() => {
    const node = el.current;
    if (!node || prev.current === tag) return;
    prev.current = tag;
    if (quiet()) {
      node.textContent = tag;
      return;
    }
    // 3-frame pixel scramble, 60 ms a frame
    let f = 0;
    const len = Math.max(tag.length, 4);
    const id = window.setInterval(() => {
      f++;
      if (f > 3) {
        node.textContent = tag;
        window.clearInterval(id);
        return;
      }
      node.textContent = Array.from({ length: len }, () => SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0]).join("");
    }, 60);
    return () => window.clearInterval(id);
  }, [tag]);
  if (!tag) return null;
  return (
    <span className="tag" role="img" aria-label={nameTagLabel(story.act)}>
      <span className="tag-en" ref={el} aria-hidden="true">
        {tag}
      </span>
      {story.act === 3 && (
        <span className="tag-jp" lang="ja" aria-hidden="true">
          ウツシ
        </span>
      )}
    </span>
  );
}

export default function DialogueBox({ pos }: { pos: BoxPos }) {
  const version = useSyncExternalStore(subscribeNarrator, narratorVersion, narratorVersion);
  const shown = useRef(false);
  const page = currentPage();
  const box = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const typing = useRef<gsap.core.Tween | null>(null);
  const hold = useRef<number>(0);
  const lastRect = useRef<DOMRect | null>(null);
  const hidden = pos === "hidden";

  // typewriter: 40 chars/s, any input completes the line, a second input advances
  useEffect(() => {
    const node = text.current;
    window.clearTimeout(hold.current);
    typing.current?.kill();
    typing.current = null;
    if (!node) return;
    if (!page) {
      node.textContent = "";
      return;
    }
    shown.current = false;
    const done = () => {
      shown.current = true;
      typing.current = null;
      node.textContent = page.text;
      pageShown(page);
      const ms = 900 + page.text.length * 22;
      if (pendingCount() > 0) hold.current = window.setTimeout(advance, ms);
      // the last line of a sequence: its onRead (an act change, say) waits until it has been read
      else if (page.onRead) hold.current = window.setTimeout(() => pageRead(page), ms);
    };
    if (quiet()) {
      done();
      return;
    }
    const c = { n: 0 };
    node.textContent = "";
    typing.current = gsap.to(c, {
      n: page.text.length,
      duration: page.text.length / CPS,
      ease: "none",
      onUpdate: () => {
        node.textContent = page.text.slice(0, Math.round(c.n));
      },
      onComplete: done,
    });
    return () => {
      typing.current?.kill();
      window.clearTimeout(hold.current);
    };
  }, [page, hidden]);

  // lines queued after the current one finished typing: hold it, then move on
  useEffect(() => {
    if (!shown.current || typing.current || pendingCount() === 0) return;
    const p = currentPage();
    window.clearTimeout(hold.current);
    hold.current = window.setTimeout(advance, 900 + (p?.text.length ?? 0) * 22);
  }, [version]);

  // any input completes the line being typed (the box itself also advances)
  useEffect(() => {
    const complete = (e: Event) => {
      if (e instanceof KeyboardEvent && (e.key === "Tab" || e.key === "Shift" || e.metaKey || e.ctrlKey || e.altKey)) return;
      if (box.current && e.target instanceof Node && box.current.contains(e.target)) return;
      typing.current?.progress(1);
    };
    window.addEventListener("keydown", complete);
    window.addEventListener("pointerdown", complete);
    return () => {
      window.removeEventListener("keydown", complete);
      window.removeEventListener("pointerdown", complete);
    };
  }, []);

  const onPress = () => {
    if (typing.current) {
      typing.current.progress(1);
      return;
    }
    if (pendingCount() > 0) {
      window.clearTimeout(hold.current);
      advance();
    }
  };

  // springs between positions (FLIP), so the escape reads as being tugged out of the glass
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) {
      lastRect.current = null;
      return;
    }
    const r = el.getBoundingClientRect();
    const prev = lastRect.current;
    lastRect.current = r;
    if (!prev || pos === "tab" || pos === "hidden") return;
    const dx = prev.left - r.left;
    const dy = prev.top - r.top;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
    spring(el, { x: 0, y: 0 }, BOX, { x: dx, y: dy });
  }, [pos]);

  useEffect(() => {
    const onResize = () => {
      if (box.current) lastRect.current = box.current.getBoundingClientRect();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (hidden) return <p className="sr-only" role="status" aria-live="polite" />;

  const voice = page?.voice ?? "omar";
  return (
    <div className="box" ref={box} data-pos={pos} data-voice={voice}>
      {pos !== "tab" && <NameTag />}
      <button
        type="button"
        className="box-body"
        onClick={onPress}
        aria-label={pendingCount() > 0 ? `Next line (${pendingCount()} more)` : "Show the whole line"}
        aria-describedby="box-live"
      >
        {/* the whole line, invisible, reserves the box's size so words never jump lines while typing */}
        <span className="box-lines" aria-hidden="true">
          <span className="box-text box-ghost">{page?.text ?? ""}</span>
          <span className="box-text" ref={text} />
        </span>
        {pendingCount() > 0 && (
          <span className="box-more" aria-hidden="true">
            ▼
          </span>
        )}
      </button>
      <p id="box-live" className="sr-only" role="status" aria-live="polite">
        {page?.text ?? ""}
      </p>
    </div>
  );
}
