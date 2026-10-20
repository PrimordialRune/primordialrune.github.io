"use client";

// The root of STILL HERE: story state, the view switch, hash history, global keys and the
// act machinery (glitch + narration on every act change).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameCtx, type GameApi } from "./ctx";
import {
  reduce,
  SLUGS,
  type Act,
  type EngineEvent,
  type Slug,
  type Story,
  type View,
} from "./story";
import { consumeResetParam, readPowered, readStory, writePowered, writeStory } from "./persist";
import { configureNarrator, say, clearNarrator } from "./narrator/narrator";
import { glitch } from "./fx";
import Frame from "./Frame";
import Tube from "./Tube";
import DialogueBox, { type BoxPos } from "./narrator/DialogueBox";
import { useFourthWall } from "./fourthwall";
import PowerOn from "./views/PowerOn";
import Title from "./views/Title";
import Hub from "./views/Hub";
import Record from "./views/Record";
import Load from "./views/Load";
import Manual from "./views/Manual";
import About from "./views/About";
import Contact from "./views/Contact";
import Void from "./views/Void";
import AbPanel from "./AbPanel";

// ---------- hash <-> view ----------

const isSlug = (s: string): s is Slug => (SLUGS as string[]).includes(s);

export function parseHash(hash: string): View | null {
  const h = hash.replace(/^#\/?/, "");
  if (!h) return null;
  const [a, b] = h.split("/");
  if (a === "talk") return { kind: "hub" };
  if (a === "works") return { kind: "record", focus: b && isSlug(b) ? b : SLUGS[0] };
  if (a === "manual" && b && isSlug(b)) return { kind: "manual", slug: b };
  if (a === "about") return { kind: "about", side: "omar" };
  if (a === "contact") return { kind: "contact" };
  return null;
}

function hashOf(v: View): string | null {
  switch (v.kind) {
    case "hub":
      return "#talk";
    case "record":
      return `#works/${v.focus}`;
    case "manual":
      return `#manual/${v.slug}`;
    case "about":
      return "#about";
    case "contact":
      return "#contact";
    default:
      return null;
  }
}

// ---------- boot ----------

interface Boot {
  story: Story;
  view: View;
  line: string | null;
}

function boot(): Boot {
  consumeResetParam();
  const story = reduce(readStory(), { type: "BOOT", continued: false });
  writeStory(story);
  const fromHash = parseHash(window.location.hash);
  const powered = readPowered();
  if (fromHash) {
    // deep link: skip power-on and the title, land on the view in the current act
    writePowered(true);
    if (story.act === 4 && fromHash.kind === "hub") return { story, view: { kind: "void" }, line: null };
    const view = fromHash.kind === "about" && story.act === 3 ? { kind: "about" as const, side: "utsushi" as const } : fromHash;
    return { story, view, line: null };
  }
  if (story.act === 4) return { story, view: powered ? { kind: "void" } : { kind: "power" }, line: null };
  if (story.mode === "direct") {
    writePowered(true);
    return { story, view: { kind: "record", focus: SLUGS[0] }, line: null };
  }
  if (powered) return { story, view: { kind: "hub" }, line: "boot.continue" };
  return { story, view: { kind: "power" }, line: null };
}

export function boxPosFor(view: View, story: Story): BoxPos {
  switch (view.kind) {
    case "power":
    case "void":
      return "hidden";
    case "title":
    case "ending":
      return "docked";
    case "manual":
    case "load":
      return "tab";
  }
  if (story.mode === "direct") return "tab";
  return (["docked", "leaning", "escaped", "floating", "hidden"] as const)[story.act];
}

export default function Game() {
  const [initial] = useState<Boot>(boot);
  const [story, setStory] = useState<Story>(initial.story);
  const [view, setView] = useState<View>(initial.view);
  const storyRef = useRef(story);
  const viewRef = useRef(view);
  const headingEl = useRef<HTMLElement | null>(null);
  const focusOnView = useRef(false);
  const lastActChange = useRef(0);

  // ---------- story ----------

  const handlers = useRef<{ onAct: (prev: Act, next: Act) => void }>({ onAct: () => {} });

  const dispatch = useCallback((e: EngineEvent) => {
    const prev = storyRef.current;
    const next = reduce(prev, e);
    if (next !== prev) {
      storyRef.current = next;
      setStory(next);
      writeStory(next);
      if (next.act !== prev.act) handlers.current.onAct(prev.act, next.act);
    }
    return next;
  }, []);

  // ---------- views ----------

  const go = useCallback((v: View, opts: { replace?: boolean } = {}) => {
    viewRef.current = v;
    focusOnView.current = true;
    setView(v);
    const h = hashOf(v);
    try {
      if (h) {
        if (window.location.hash !== h) {
          if (opts.replace) window.history.replaceState(null, "", h);
          else window.history.pushState(null, "", h);
        }
      } else if (v.kind !== "load" && v.kind !== "ending" && window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    } catch {}
  }, []);

  const reveal = useCallback(() => {
    say("act.3");
    say("act.3.ask", { onShown: () => dispatch({ type: "FLAG", flag: "revealPlayed" }) });
  }, [dispatch]);

  const startEnding = useCallback(() => {
    go({ kind: "ending" });
  }, [go]);

  const enterHub = useCallback((line?: string) => {
    const before = storyRef.current;
    go({ kind: "hub" });
    const s = dispatch({ type: "HUB_ENTER" });
    if (s.act === 4 && before.act === 3) {
      // STAY was chosen earlier: the ending starts now that we're back on the hub
      say("end.afterStay", { interrupt: true, onShown: () => setTimeout(startEnding, 1600) });
      return;
    }
    if (s.act === 4) return void go({ kind: "void" }, { replace: true });
    if (line) say(line);
    if (s.act === 3 && !s.flags.includes("revealPlayed")) return reveal();
    if (!line && s.mode === "story") say("hub.enter");
  }, [dispatch, go, reveal, startEnding]);

  const openRecord = useCallback(
    (focus?: Slug) => {
      const v = viewRef.current;
      const from = v.kind === "hub" || v.kind === "about" || v.kind === "contact";
      go({ kind: "record", focus: focus ?? SLUGS[0] });
      if (from) glitch("static");
      say("record.enter");
    },
    [go],
  );

  const loadProject = useCallback(
    (slug: Slug) => {
      const before = storyRef.current;
      dispatch({ type: "OPEN", slug });
      // act.N (queued by the act change) plays before the object's own line
      const s = storyRef.current;
      if (s.mode === "story") {
        if (!(before.act < 2 && s.act === 2 && slug === "haunt-record")) say(`open:${slug}`);
        say(`load:${slug}`);
      }
      go({ kind: "load", slug });
    },
    [dispatch, go],
  );

  const back = useCallback(() => {
    const v = viewRef.current;
    switch (v.kind) {
      case "manual":
        window.dispatchEvent(new Event("studio:eject"));
        return;
      case "record":
      case "about":
      case "contact":
        enterHub();
        return;
    }
  }, [enterHub]);

  // the act machinery: glitch and narration on every change
  useEffect(() => {
    handlers.current.onAct = (prev, next) => {
      lastActChange.current = Date.now();
      const v = viewRef.current;
      if (next === 4) {
        if (v.kind === "hub" && prev === 3) {
          // YES on the hub
          say("choice.yes", { interrupt: true, onShown: () => setTimeout(startEnding, 1200) });
        }
        return;
      }
      if (next > prev) {
        void glitch("act").then(() => (next === 2 ? glitch("bezel") : undefined));
        if (next === 3) {
          if (v.kind === "hub") reveal();
        } else {
          say(`act.${next}`);
        }
      }
    };
  }, [reveal, startEnding]);

  // narrator plumbing
  useEffect(() => {
    configureNarrator({
      getAct: () => storyRef.current.act,
      isDirect: () => storyRef.current.mode === "direct",
      getSeen: (k) => storyRef.current.seen[k] ?? 0,
      bumpSeen: (k) => {
        const s = storyRef.current;
        const next = { ...s, seen: { ...s.seen, [k]: (s.seen[k] ?? 0) + 1 } };
        storyRef.current = next;
        setStory(next);
        writeStory(next);
      },
      vars: () => ({ visits: storyRef.current.visits }),
    });
    if (initial.line) {
      say(initial.line);
      if (storyRef.current.act === 3 && !storyRef.current.flags.includes("revealPlayed")) {
        say("act.3");
        say("act.3.ask", { onShown: () => dispatch({ type: "FLAG", flag: "revealPlayed" }) });
      }
    }
    return () => clearNarrator();
  }, [initial.line, dispatch]);

  // browser Back steps back through views
  useEffect(() => {
    const onPop = () => {
      const v = parseHash(window.location.hash);
      const s = storyRef.current;
      if (!v || v.kind === "hub") {
        if (viewRef.current.kind === "hub" || viewRef.current.kind === "void") return;
        if (s.act === 4) go({ kind: "void" }, { replace: true });
        else enterHub();
        return;
      }
      viewRef.current = v;
      focusOnView.current = true;
      setView(v.kind === "about" && s.act === 3 ? { kind: "about", side: "utsushi" } : v);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [enterHub, go]);

  // global keys: Esc / X / Backspace go back; Z confirms
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (t?.closest("[data-popover]")) return;
      const k = e.key.toLowerCase();
      if (k === "escape" || k === "x" || k === "backspace") {
        const kind = viewRef.current.kind;
        if (kind === "manual" || kind === "record" || kind === "about" || kind === "contact") {
          e.preventDefault();
          back();
        }
      } else if (k === "z" && t instanceof HTMLButtonElement) {
        e.preventDefault();
        t.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [back]);

  // focus the view's heading after a view change the visitor asked for
  useEffect(() => {
    if (!focusOnView.current) return;
    focusOnView.current = false;
    const id = requestAnimationFrame(() => headingEl.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, [view]);

  useFourthWall({ story, view, dispatch, storyRef });

  const api: GameApi = useMemo(
    () => ({
      story,
      view,
      dispatch,
      go,
      back,
      enterHub,
      openRecord,
      loadProject,
      headingRef: (el) => {
        headingEl.current = el;
      },
    }),
    [story, view, dispatch, go, back, enterHub, openRecord, loadProject],
  );

  const pos = boxPosFor(view, story);

  return (
    <GameCtx.Provider value={api}>
      <div className="studio" data-act={story.act} data-boxpos={pos} data-view={view.kind} data-mode={story.mode}>
        <Frame />
        <main className="stage" id="main">
          <Tube>
            {view.kind === "power" && <PowerOn />}
            {view.kind === "title" && <Title peek={!!view.peek} />}
            {view.kind === "hub" && (story.act === 4 ? <Void /> : <Hub />)}
            {view.kind === "ending" && <Hub ending />}
            {view.kind === "record" && <Record focus={view.focus} />}
            {view.kind === "load" && <Load key={`${view.slug}-${!!view.eject}`} slug={view.slug} eject={view.eject} />}
            {view.kind === "manual" && <Manual slug={view.slug} />}
            {view.kind === "about" && <About side={view.side} />}
            {view.kind === "contact" && <Contact />}
            {view.kind === "void" && <Void />}
          </Tube>
          <DialogueBox pos={pos} />
        </main>
        <div className="stripe stripe-bottom" aria-hidden="true" />
        <AbPanel />
      </div>
    </GameCtx.Provider>
  );
}
