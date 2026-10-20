"use client";

// The Night Desk: composition, the view reducer and its hash, ceremonies, Esc / back.
// One route; the desk is usable at first paint, and every view sits over it.
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import gsap from "gsap";
import Desk from "./desk/Desk";
import TopBar from "./chrome/TopBar";
import MotionToast from "./chrome/MotionToast";
import { captureOrigin } from "./desk/originRect";
import ProjectIndex from "./chrome/ProjectIndex";
import { INITIAL_VIEW, isOverlay, parseHash, viewHash, viewReducer } from "./state/view";
import { markSeen, readProgress, resetProgress } from "./state/progress";
import { emitStory, onStory } from "./bus";
import { useMotionLevel } from "./useMotionLevel";
import { isQuiet } from "@/lib/motion";
import { SPRING_UI } from "./motion/spring";
import { DEVICES } from "./devices";
import Manual from "./manual/Manual";
import Notebook from "./paper/Notebook";
import Card from "./paper/Card";
import DeskDialogue from "./narrator/DeskDialogue";
import Void from "./narrator/Void";
import { useStory } from "./narrator/story";
import type { CeremonyMode, ProjectId, Side, View } from "./types";
import s from "./NightDesk.module.css";

/** if a device never reports back, the shell moves on anyway */
const SAFETY_MS: Record<CeremonyMode, number> = { full: 6000, short: 2500, cut: 600 };
const NON_SKIP_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "Tab", "CapsLock"]);

type NavState = { night?: 1 } | null;

export default function NightDesk() {
  const story = useStory();
  const level = useMotionLevel();
  const [state, dispatch] = useReducer(viewReducer, INITIAL_VIEW);
  const { view, mode, skipToken } = state;
  const [powered, setPowered] = useState(true);
  const [indexOpen, setIndexOpen] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);

  const objectRefs = useRef<Record<string, HTMLElement | null>>({});
  const titleRef = useRef<HTMLHeadingElement>(null);
  const workRef = useRef<HTMLButtonElement>(null);
  const deviceBoxRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<View>(view);
  const modeRef = useRef(mode);
  const indexRef = useRef(indexOpen);
  const closing = useRef(false);
  const continued = useRef(false);
  const lastSpot = useRef<string | null>(null);

  useLayoutEffect(() => {
    viewRef.current = view;
    modeRef.current = mode;
    indexRef.current = indexOpen;
  });
  useLayoutEffect(() => {
    closing.current = false;
  }, [view]);

  // ---- how a ceremony plays ----------------------------------------------------------
  const modeFor = useCallback((id: ProjectId, deep: boolean): CeremonyMode => {
    if (isQuiet()) return "cut";
    if (deep || continued.current || readProgress().seen.includes(id)) return "short";
    return "full";
  }, []);
  const closeMode = (): CeremonyMode => (isQuiet() ? "cut" : "short");

  // ---- opening ---------------------------------------------------------------------
  const openProject = useCallback(
    (id: ProjectId, opts: { deep?: boolean; side?: Side } = {}) => {
      setIndexOpen(false);
      lastSpot.current = id;
      captureOrigin(id);
      emitStory({ type: "open", id });
      dispatch({ type: "open", id, mode: modeFor(id, !!opts.deep), side: opts.side });
    },
    [modeFor],
  );
  const openNotebook = useCallback(() => {
    setIndexOpen(false);
    lastSpot.current = "notebook";
    captureOrigin("notebook");
    emitStory({ type: "open", id: "notebook" });
    dispatch({ type: "show", view: { kind: "notebook" } });
  }, []);
  const openCard = useCallback(() => {
    setIndexOpen(false);
    lastSpot.current = "card";
    captureOrigin("card");
    emitStory({ type: "open", id: "card" });
    dispatch({ type: "show", view: { kind: "card" } });
  }, []);

  // ---- closing (Esc, ✕, back) ---------------------------------------------------------
  const requestClose = useCallback(() => {
    const v = viewRef.current;
    if (closing.current) return;
    if (!isOverlay(v) && !(v.kind === "ceremony" && !v.reverse)) return;
    closing.current = true;
    const target = v.kind === "manual" || v.kind === "ceremony" ? v.id : v.kind === "notebook" ? "notebook" : "card";
    emitStory({ type: "close", id: target });
    if ((history.state as NavState)?.night) history.back(); // popstate does the rest
    else dispatch({ type: "close", mode: closeMode() });
  }, []);

  const onReady = useCallback(() => {
    const v = viewRef.current;
    if (v.kind !== "ceremony") return;
    if (!v.reverse && modeRef.current === "full") markSeen(v.id);
    dispatch({ type: "ready" });
  }, []);

  // ---- deep links and the back button ------------------------------------------------
  useEffect(() => {
    const apply = (deep: boolean) => {
      const target = parseHash(location.hash);
      const v = viewRef.current;
      if (target.kind === "desk") {
        if (isOverlay(v) || (v.kind === "ceremony" && !v.reverse)) dispatch({ type: "close", mode: closeMode() });
        return;
      }
      if (target.kind === "manual") {
        if (v.kind === "manual" && v.id === target.id) dispatch({ type: "side", side: target.side });
        else if (v.kind === "ceremony" && v.id === target.id && !v.reverse) return;
        else if (v.kind === "desk" || isOverlay(v) || v.kind === "ceremony") {
          // desk, another manual, the notebook or the card: this hash wins (manual -> manual too)
          lastSpot.current = target.id;
          captureOrigin(target.id);
          emitStory({ type: "open", id: target.id });
          dispatch({ type: "open", id: target.id, mode: modeFor(target.id, deep), side: target.side });
        }
        return;
      }
      const spot = target.kind === "notebook" ? "notebook" : "card";
      if (v.kind === target.kind) return;
      if (v.kind === "desk" || isOverlay(v) || v.kind === "ceremony") {
        lastSpot.current = spot;
        captureOrigin(spot);
        emitStory({ type: "open", id: spot });
        dispatch({ type: "show", view: target });
      }
    };
    apply(true);
    const onPop = () => apply(true);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [modeFor]);

  // mirror the view into the hash: opening pushes (so Back closes), the rest replaces
  const mirrored = useRef(false);
  useEffect(() => {
    // the first pass belongs to the deep link above
    if (!mirrored.current) {
      mirrored.current = true;
      return;
    }
    const want = viewHash(view);
    const have = location.hash === "#" ? "" : location.hash;
    if (want === have || view.kind === "void") return;
    if (!have && want) history.pushState({ night: 1 }, "", want);
    else if (!want) history.replaceState(null, "", location.pathname + location.search);
    else history.replaceState(history.state, "", want);
  }, [view]);

  // ---- focus: into the view's title, and back to the object afterwards ----------------
  const prevKind = useRef(view.kind);
  useEffect(() => {
    const was = prevKind.current;
    prevKind.current = view.kind;
    if (view.kind === "desk" && was !== "desk" && lastSpot.current) {
      const el = objectRefs.current[lastSpot.current];
      if (!el) return;
      if (el.matches("button")) el.focus({ preventScroll: true });
      else el.querySelector<HTMLElement>("button, a[href]")?.focus({ preventScroll: true });
    }
  }, [view.kind]);

  // ---- input modality: a programmatic focus (deep link, view title) only draws its ring when
  // the visitor is on the keyboard; html[data-input] drives that in night.css
  useEffect(() => {
    const root = document.documentElement;
    const kbd = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey && !e.altKey) root.dataset.input = "keyboard";
    };
    const ptr = () => {
      root.dataset.input = "pointer";
    };
    window.addEventListener("keydown", kbd, true);
    window.addEventListener("pointerdown", ptr, true);
    return () => {
      window.removeEventListener("keydown", kbd, true);
      window.removeEventListener("pointerdown", ptr, true);
    };
  }, []);

  // ---- skip: any key or click during a ceremony jumps to its end; Esc closes ---------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = viewRef.current;
      if (e.key === "Escape") {
        if (indexRef.current) {
          setIndexOpen(false);
          workRef.current?.focus();
          return;
        }
        if (v.kind === "ceremony") dispatch({ type: "skip" });
        else if (isOverlay(v)) requestClose();
        return;
      }
      if (v.kind === "ceremony" && !NON_SKIP_KEYS.has(e.key)) {
        e.preventDefault();
        dispatch({ type: "skip" });
      }
    };
    const onDown = () => {
      if (viewRef.current.kind === "ceremony") dispatch({ type: "skip" });
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [requestClose]);

  // a device that never reports back must not strand the visitor
  useEffect(() => {
    if (view.kind !== "ceremony") return;
    const t = window.setTimeout(() => dispatch({ type: "ready" }), skipToken > 0 ? 400 : SAFETY_MS[mode]);
    return () => window.clearTimeout(t);
  }, [view, mode, skipToken]);

  // ---- story hooks: the save file and the corrupted one -----------------------------
  useEffect(
    () =>
      onStory((ev) => {
        if (ev.type === "continue") continued.current = true;
        else if (ev.type === "newgame") {
          continued.current = false;
          resetProgress();
        } else if (ev.type === "corrupt") {
          setIndexOpen(false);
          dispatch({ type: "show", view: { kind: "void" } });
        }
      }),
    [],
  );

  const exitVoid = useCallback(() => {
    if (viewRef.current.kind !== "void") return;
    dispatch({ type: "show", view: { kind: "desk" } });
  }, []);

  const register = useCallback((id: string, el: HTMLElement | null) => {
    objectRefs.current[id] = el;
  }, []);

  const togglePower = () => {
    const next = !powered;
    setPowered(next);
    emitStory({ type: next ? "power-on" : "power-off" });
  };

  // ---- the device moves aside (spring) when its manual comes out -----------------------
  const reading = view.kind === "manual";
  const lastBox = useRef<DOMRect | null>(null);
  useLayoutEffect(() => {
    const el = deviceBoxRef.current;
    if (!el) {
      lastBox.current = null;
      return;
    }
    const now = el.getBoundingClientRect();
    const was = lastBox.current;
    lastBox.current = now;
    if (!was || level === "quiet" || (was.left === now.left && was.width === now.width)) return;
    const tween = gsap.fromTo(
      el,
      { x: was.left - now.left, y: was.top - now.top, scale: was.width / now.width },
      { x: 0, y: 0, scale: 1, duration: SPRING_UI.duration, ease: SPRING_UI.ease, transformOrigin: "0 0" },
    );
    return () => {
      tween.kill();
      gsap.set(el, { clearProps: "transform" });
    };
  }, [reading, level]);

  // ---- render --------------------------------------------------------------------------
  const ceremonyId = view.kind === "ceremony" || view.kind === "manual" ? view.id : null;
  const Device = ceremonyId ? DEVICES[ceremonyId] : null;
  const covered = view.kind !== "desk";
  // the clicked object is the one in the device: its original leaves the mat meanwhile
  const away =
    view.kind === "ceremony" || view.kind === "manual"
      ? view.id
      : view.kind === "notebook" || view.kind === "card"
        ? view.kind
        : null;

  return (
    <div className={s.root} data-view={view.kind}>
      <a className="nd-skip" href="#nd-index" onClick={(e) => { e.preventDefault(); setIndexOpen(true); }}>
        Skip to project index
      </a>
      <div inert={covered || undefined}>
        <TopBar
          indexOpen={indexOpen}
          workRef={workRef}
          powered={powered}
          onWork={() => setIndexOpen((o) => !o)}
          onAbout={openNotebook}
          onContact={openCard}
          onPower={togglePower}
          onHome={() => setIndexOpen(false)}
        />
        <MotionToast />
        {indexOpen && (
          <ProjectIndex
            onClose={() => {
              setIndexOpen(false);
              workRef.current?.focus();
            }}
            onProject={(id) => openProject(id)}
            onAbout={openNotebook}
            onContact={openCard}
          />
        )}
      </div>

      <main className={s.main} inert={covered || indexOpen || undefined} aria-label="Omar's desk">
        <h1 className="nd-sr-only">Omar Golinelli, game designer: projects on the desk</h1>
        <Desk
          story={story}
          powered={powered}
          empty={view.kind === "void"}
          away={away}
          register={register}
          onOpen={(id) => openProject(id)}
          onNotebook={openNotebook}
          onCard={openCard}
          onAnchor={(el) => setAnchor(el.getBoundingClientRect())}
        />
        {!story.inCrt && view.kind === "desk" && <DeskDialogue anchor={anchor} />}
      </main>

      {ceremonyId && (
        <div className={s.stage} data-reading={reading ? "" : undefined}>
          <div className={s.dim} aria-hidden="true" />
          <div className={s.deviceBox} ref={deviceBoxRef}>
            {Device && (
              <Device
                key={ceremonyId}
                id={ceremonyId}
                mode={mode}
                reverse={view.kind === "ceremony" && !!view.reverse}
                skipToken={skipToken}
                onReady={onReady}
              />
            )}
          </div>
        </div>
      )}
      {view.kind === "manual" && (
        <Manual
          id={view.id}
          side={view.side}
          onClose={requestClose}
          onSide={(side) => dispatch({ type: "side", side })}
          titleRef={titleRef}
        />
      )}
      {view.kind === "notebook" && <Notebook onClose={requestClose} titleRef={titleRef} />}
      {view.kind === "card" && <Card variant="open" onClose={requestClose} titleRef={titleRef} />}
      {view.kind === "void" && <Void onExit={exitVoid} />}
      {/* ceremonies are announced by their device (one announcer) */}
    </div>
  );
}
