"use client";

// The fourth wall, browser-real and never hostile: tab title, favicon, tab visibility, the clock,
// visit count, idle, pointer leaving through the top, copy, resize, a console line, active time.
// Silent in DIRECT mode apart from title and favicon resets.

import { useEffect, useRef } from "react";
import { LOGO_INNER, LOGO_OUTER } from "@/lib/logo";
import { say, hasLines } from "./narrator/narrator";
import { DOC_TITLES, SCRIPT } from "./script";
import type { Act, EngineEvent, Story, View } from "./story";

const INNER: Record<Act, string> = { 0: "#ec563b", 1: "#ec563b", 2: "#ec563b", 3: "#d7263d", 4: "#ec563b" };

function favicon(act: Act) {
  const half =
    act === 2
      ? `<clipPath id="h"><rect x="0" y="300" width="555" height="255"/></clipPath><path d="${LOGO_INNER}" fill="#d7263d" clip-path="url(#h)"/>`
      : "";
  const rim = act === 1 ? `<path d="${LOGO_INNER}" fill="none" stroke="#d7263d" stroke-width="28"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 554.72 555"><path d="${LOGO_OUTER}" fill="#102f41"/><path d="${LOGO_INNER}" fill="${INNER[act]}"/>${half}${rim}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function setFavicon(act: Act) {
  try {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-studio]');
    if (!link) {
      document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach((l) => l.remove());
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/svg+xml";
      link.dataset.studio = "";
      document.head.appendChild(link);
    }
    link.href = favicon(act);
  } catch {}
}

function baseTitle(s: Story) {
  if (s.mode === "direct") return DOC_TITLES.base;
  if (s.act === 4) return DOC_TITLES.end;
  if (s.act === 3) return DOC_TITLES.truth;
  if (s.act >= 1 && s.flags.includes("tabReturned")) return DOC_TITLES.slipped;
  return DOC_TITLES.base;
}

interface Args {
  story: Story;
  view: View;
  dispatch: (e: EngineEvent) => Story;
  storyRef: React.RefObject<Story>;
}

export function useFourthWall({ story, view, dispatch, storyRef }: Args) {
  const viewRef = useRef(view);
  const lastInput = useRef(0);
  const lastIdle = useRef(0);
  const firedPerAct = useRef(new Set<string>());

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // title + favicon follow the act
  useEffect(() => {
    const apply = () => {
      if (document.visibilityState !== "hidden") document.title = baseTitle(story);
    };
    apply();
    setFavicon(story.mode === "direct" ? 0 : story.act);
    // Next's metadata can land after the first effect; set it again once things settle
    const t = window.setTimeout(apply, 400);
    return () => window.clearTimeout(t);
  }, [story]);

  // tab hidden / returned
  useEffect(() => {
    const onVis = () => {
      const s = storyRef.current;
      if (document.visibilityState === "hidden") {
        dispatch({ type: "TAB_HIDDEN" });
        const t = s.mode === "story" ? DOC_TITLES.hidden[s.act] : undefined;
        if (t) document.title = t;
      } else {
        const next = dispatch({ type: "TAB_RETURN" });
        document.title = baseTitle(next);
        const v = viewRef.current.kind;
        if (next.mode === "story" && next.act < 4 && v !== "power" && v !== "ending" && v !== "void") say("tab.return");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [dispatch, storyRef]);

  // input tracking, active time, idle
  useEffect(() => {
    lastInput.current = Date.now();
    const mark = () => {
      lastInput.current = Date.now();
    };
    const evs = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"] as const;
    evs.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    let acc = 0;
    const id = window.setInterval(() => {
      const s = storyRef.current;
      const now = Date.now();
      const active = document.visibilityState === "visible" && now - lastInput.current < 30000;
      if (s.mode === "story" && s.act < 4 && active) {
        acc++;
        if (acc >= 5) {
          dispatch({ type: "TICK", seconds: acc });
          acc = 0;
        }
      }
      if (
        s.mode === "story" &&
        viewRef.current.kind === "hub" &&
        now - lastInput.current > 30000 &&
        now - lastIdle.current > 60000 &&
        s.act < 4
      ) {
        lastIdle.current = now;
        say("idle");
      }
    }, 1000);
    return () => {
      evs.forEach((e) => window.removeEventListener(e, mark));
      window.clearInterval(id);
    };
  }, [dispatch, storyRef]);

  // the clock and the visit count, once per act, when the AI is first on screen in that act
  useEffect(() => {
    const k = view.kind;
    if (story.mode !== "story" || story.act >= 4 || (k !== "hub" && k !== "record")) return;
    const key = `clock-${story.act}`;
    if (firedPerAct.current.has(key)) return;
    firedPerAct.current.add(key);
    const h = new Date().getHours();
    if (h < 5) say("time.night");
    else if (h < 9) say("time.morning");
    // the visit count: once per page load, not once per act
    if (story.visits > 1 && !firedPerAct.current.has("visit")) {
      firedPerAct.current.add("visit");
      say("visit.return");
    }
  }, [view.kind, story.act, story.mode, story.visits]);

  // pointer leaving through the top edge, once per act; resize > 25%, once; copy from contact
  useEffect(() => {
    const onOut = (e: MouseEvent) => {
      const s = storyRef.current;
      if (s.mode !== "story" || e.relatedTarget !== null || e.clientY > 0) return;
      const key = `exit-${s.act}`;
      if (firedPerAct.current.has(key)) return;
      firedPerAct.current.add(key);
      say("pointer.exit");
    };
    let w = window.innerWidth;
    let h = window.innerHeight;
    let t = 0;
    const onResize = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        const dw = Math.abs(window.innerWidth - w) / w;
        const dh = Math.abs(window.innerHeight - h) / h;
        w = window.innerWidth;
        h = window.innerHeight;
        if ((dw > 0.25 || dh > 0.25) && storyRef.current.mode === "story" && !firedPerAct.current.has("resize")) {
          firedPerAct.current.add("resize");
          say("resize");
        }
      }, 400);
    };
    const onCopy = () => {
      if (viewRef.current.kind === "contact") say("copy.contact", { interrupt: true });
    };
    document.addEventListener("mouseout", onOut);
    window.addEventListener("resize", onResize);
    document.addEventListener("copy", onCopy);
    return () => {
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("copy", onCopy);
    };
  }, [storyRef]);

  // one console line on load, in the act's voice (not shown in the box)
  useEffect(() => {
    const act = storyRef.current.act;
    if (!hasLines("console", act)) return;
    const entry = SCRIPT.console.find((e) => e.acts.includes(act));
    const beat = entry?.beats[0];
    const line = Array.isArray(beat) ? beat[0] : beat;
    if (line) console.log(`%c${line.text}`, "font: 14px monospace; color: #339999");
  }, [storyRef]);
}
