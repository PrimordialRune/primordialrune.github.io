// The story store. Listens to the bus (onStory), keeps the visitor's progress, derives the
// stage (how far the mask has slipped) and picks what the narrator says next.
//
// Progress lives in localStorage ("night:opened": distinct projects opened, plus
// "night:notebook-last"). The stage is derived from it, but during a visit it only moves
// at a calm moment: when the visitor closes what they opened (or after a short fallback),
// so they come back to the desk and find the name tag changed.
import { useSyncExternalStore } from "react";
import { emitStory, onStory } from "../bus";
import { PROJECT_IDS, type ProjectId, type StoryEvent, type StoryState, type StoryTarget } from "../types";
import { isQuiet, readMotionSetting, systemReducesMotion } from "@/lib/motion";
import {
  BEATS, BOOT, CONTINUE, FLIP, HOVER, IDLE, NAME_TAGS, OPEN, OPEN_LATE, POWER_ON, STAGE_ENTER, TEAR,
  cleanLine, creep, type Stage,
} from "./lines";

const OPENED_KEY = "night:opened";
const NOTEBOOK_KEY = "night:notebook-last";
const FILE_KEY = "night:file";
const SESSION_KEY = "night:file-picked";

/** A line stays at least this long before a hover line may replace it */
const MIN_HOLD = 2200;
const REVEAL_MS_PER_CHAR = 25;
const IDLE_MS = 45000;
const STAGE_FALLBACK_MS = 9000;
const HOVER_REPEAT_MS = 15000;

// ---- guarded storage ---------------------------------------------------------------

function readOpened(): Set<ProjectId> {
  try {
    const raw = localStorage.getItem(OPENED_KEY);
    const arr: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is ProjectId => PROJECT_IDS.includes(x as ProjectId)));
  } catch {
    return new Set();
  }
}

function writeOpened(s: Set<ProjectId>) {
  try {
    localStorage.setItem(OPENED_KEY, JSON.stringify([...s]));
  } catch {}
}

function readFlag(store: "local" | "session", key: string): boolean {
  try {
    return (store === "local" ? localStorage : sessionStorage).getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(store: "local" | "session", key: string, on: boolean) {
  try {
    const s = store === "local" ? localStorage : sessionStorage;
    if (on) s.setItem(key, "1");
    else s.removeItem(key);
  } catch {}
}

// ---- the store -----------------------------------------------------------------------

const isProject = (id: StoryTarget): id is ProjectId => PROJECT_IDS.includes(id as ProjectId);

function deriveStage(opened: number, notebookLast: boolean): Stage {
  if (opened >= 5) return 3;
  if (opened >= 4 || notebookLast) return 2;
  if (opened >= 3) return 1;
  return 0;
}

function buildState(stage: Stage, line: string | null, lineId: number): StoryState {
  return {
    stage,
    nameTag: NAME_TAGS[stage],
    inner: stage >= 2 ? "red" : "plate",
    voice: stage >= 2 ? "machine" : "omar",
    inCrt: stage < 3,
    line,
    lineId,
  };
}

const SERVER_STATE: StoryState = buildState(0, null, 0);

export interface SaveSelectState {
  open: boolean;
  /** A file exists (the visitor has been here before): CONTINUE is offered */
  hasSave: boolean;
  /** Distinct projects opened in this file, 0-5 */
  openedCount: number;
}
/** A stage change that happened during this visit (id 0 = none yet) */
export interface StageShift {
  id: number;
  from: Stage;
  to: Stage;
}
const NO_SHIFT: StageShift = { id: 0, from: 0, to: 0 };

const SERVER_SAVE: SaveSelectState = { open: false, hasSave: false, openedCount: 0 };

const m = {
  ready: false,
  opened: new Set<ProjectId>(),
  notebookLast: false,
  stage: 0 as Stage,
  powered: true,
  saveOpen: false,
  hasSave: false,
  line: null as string | null,
  lineId: 0,
  lineAt: 0,
  bootDone: false,
  firstHoverDone: false,
  motionSaid: false,
  lastIdleAt: 0,
  flips: 0,
  cardFirst: true,
  openedThisFile: new Set<StoryTarget>(),
  hoverIdx: {} as Record<string, number>,
  hoverAt: {} as Partial<Record<StoryTarget, number>>,
  pendingStage: null as Stage | null,
  stageTimer: 0 as number | ReturnType<typeof setTimeout>,
  queued: 0 as number | ReturnType<typeof setTimeout>,
};

let state: StoryState = SERVER_STATE;
let saveState: SaveSelectState = SERVER_SAVE;
let powerOff = false;
let shift: StageShift = { id: 0, from: 0, to: 0 };
const listeners = new Set<() => void>();

function publish() {
  state = buildState(m.stage, m.line, m.lineId);
  saveState = { open: m.saveOpen, hasSave: m.hasSave, openedCount: m.opened.size };
  powerOff = !m.powered;
  listeners.forEach((fn) => fn());
}

function holdFor(line: string | null) {
  if (!line || isQuiet()) return MIN_HOLD;
  return Math.max(MIN_HOLD, cleanLine(line).length * REVEAL_MS_PER_CHAR + 1200);
}

type Priority = "hover" | "event";

/** Say a line. Hover lines wait their turn; event lines (open, flip, stage) take over. */
function say(raw: string | null, pri: Priority = "event") {
  if (!m.powered) return;
  const now = Date.now();
  if (pri === "hover" && m.line && now - m.lineAt < holdFor(m.line)) return;
  m.line = raw && m.stage === 1 ? creep(raw) : raw;
  m.lineId += 1;
  m.lineAt = now;
  publish();
}

/** Say a line once the current one has had its time on screen */
function sayAfter(raw: string) {
  clearTimeout(m.queued);
  const wait = Math.max(0, holdFor(m.line) - (Date.now() - m.lineAt));
  m.queued = setTimeout(() => say(raw), wait);
}

function pick(list: string[], key: string): string {
  const i = m.hoverIdx[key] ?? 0;
  m.hoverIdx[key] = i + 1;
  return list[i % list.length];
}

function applyStage(stage: Stage) {
  clearTimeout(m.stageTimer);
  m.pendingStage = null;
  if (stage === m.stage) return;
  const rising = stage > m.stage;
  shift = { id: shift.id + 1, from: m.stage, to: stage };
  m.stage = stage;
  if (rising && stage > 0) say(STAGE_ENTER[stage as 1 | 2 | 3]);
  else publish();
}

/** Progress moved: the stage catches up at the next close, or after a fallback */
function progressChanged() {
  const derived = deriveStage(m.opened.size, m.notebookLast);
  if (derived <= m.stage) return;
  m.pendingStage = derived;
  clearTimeout(m.stageTimer);
  m.stageTimer = setTimeout(() => m.pendingStage !== null && applyStage(m.pendingStage), STAGE_FALLBACK_MS);
}

function openLine(id: StoryTarget, firstInFile: boolean): string {
  if (m.stage >= 2) {
    const late = OPEN_LATE[m.stage as 2 | 3];
    const list = isProject(id) ? late.project : id === "card" ? late.card : late.notebook;
    return pick(list, `open:${m.stage}:${isProject(id) ? "project" : id}`);
  }
  const o = OPEN[id];
  return firstInFile ? o.first : pick(o.again, `again:${id}`);
}

function startFile(fresh: boolean) {
  m.saveOpen = false;
  writeFlag("session", SESSION_KEY, true);
  writeFlag("local", FILE_KEY, true);
  if (fresh) {
    m.opened = new Set();
    writeOpened(m.opened);
    m.notebookLast = false;
    writeFlag("local", NOTEBOOK_KEY, false);
    m.openedThisFile = new Set();
    m.flips = 0;
    m.cardFirst = true;
    m.firstHoverDone = false;
    clearTimeout(m.stageTimer);
    m.pendingStage = null;
    m.stage = 0;
  }
}

function handle(ev: StoryEvent) {
  // Power first: while the screen is off the narrator is silent, but progress still counts
  if (ev.type === "power-off") {
    clearTimeout(m.queued);
    m.line = null;
    m.lineId += 1;
    m.powered = false;
    publish();
    return;
  }
  if (ev.type === "power-on") {
    if (m.powered) return;
    m.powered = true;
    say(pick(POWER_ON[m.stage], `power:${m.stage}`));
    return;
  }

  switch (ev.type) {
    case "boot": {
      if (m.bootDone) return;
      m.bootDone = true;
      // First power-on this session: the save select speaks for itself
      if (!m.saveOpen) say(pick(BOOT[m.stage], `boot:${m.stage}`));
      if (!m.motionSaid && readMotionSetting() === "auto" && systemReducesMotion()) {
        m.motionSaid = true;
        sayAfter(BEATS.motionQuietAuto);
      }
      return;
    }
    case "motion-quiet-auto": {
      if (m.motionSaid) return;
      m.motionSaid = true;
      sayAfter(BEATS.motionQuietAuto);
      return;
    }
    case "continue": {
      startFile(false);
      say(pick(CONTINUE[m.stage], `continue:${m.stage}`));
      return;
    }
    case "newgame": {
      const hadSave = m.hasSave;
      startFile(true);
      m.hasSave = true;
      say(hadSave ? BEATS.newGame : BEATS.firstBoot);
      return;
    }
    case "corrupt": {
      startFile(false);
      clearTimeout(m.queued);
      m.line = null; // the void has its own single line
      m.lineId += 1;
      publish();
      return;
    }
    case "void-exit": {
      say(BEATS.voidExit);
      return;
    }
    case "idle": {
      const now = Date.now();
      if (m.saveOpen || now - m.lastIdleAt < IDLE_MS - 5000) return;
      m.lastIdleAt = now;
      say(pick(IDLE[m.stage], `idle:${m.stage}`), "hover");
      return;
    }
    case "hover": {
      const id = ev.id;
      if (!m.firstHoverDone && m.stage < 2) {
        if (m.line && Date.now() - m.lineAt < holdFor(m.line)) return;
        m.firstHoverDone = true;
        say(BEATS.firstHover, "hover");
        return;
      }
      const key = `hover:${m.stage}:${id}`;
      const list = HOVER[id][m.stage];
      const used = m.hoverIdx[key] ?? 0;
      // Every variant said once; after that a target only speaks again after a while
      if (used >= list.length && Date.now() - (m.hoverAt[id] ?? 0) < HOVER_REPEAT_MS) return;
      if (m.line && Date.now() - m.lineAt < holdFor(m.line)) return;
      m.hoverAt[id] = Date.now();
      say(pick(list, key), "hover");
      return;
    }
    case "open": {
      const id = ev.id;
      const firstInFile = !m.openedThisFile.has(id) && !(isProject(id) && m.opened.has(id));
      m.openedThisFile.add(id);
      // The card speaks when it lands face up (its flip), not when it's picked up
      if (id !== "card") say(openLine(id, firstInFile));
      else m.cardFirst = firstInFile;
      if (isProject(id) && !m.opened.has(id)) {
        m.opened.add(id);
        writeOpened(m.opened);
        writeFlag("local", FILE_KEY, true);
        m.hasSave = true;
        progressChanged();
        publish();
      }
      return;
    }
    case "close": {
      if (m.pendingStage !== null) {
        const s = m.pendingStage;
        clearTimeout(m.stageTimer);
        // Let the close ceremony land before the mask slips
        m.stageTimer = setTimeout(() => applyStage(s), 450);
      }
      return;
    }
    case "flip": {
      if (ev.id === "card") {
        say(openLine("card", m.cardFirst));
        m.cardFirst = false;
        return;
      }
      m.flips += 1;
      say(m.flips % 2 === 1 ? FLIP.B : pick(FLIP.A[m.stage], `flipA:${m.stage}`));
      return;
    }
    case "tear": {
      say(pick(TEAR[m.stage], `tear:${m.stage}`));
      return;
    }
    case "notebook-last-page": {
      const was = m.notebookLast;
      m.notebookLast = true;
      writeFlag("local", NOTEBOOK_KEY, true);
      say(was || m.stage >= 2 ? BEATS.notebookLastAgain : BEATS.notebookLast);
      progressChanged();
      return;
    }
  }
}

function startIdleWatch() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(() => emitStory({ type: "idle" }), IDLE_MS);
  };
  for (const ev of ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"]) {
    window.addEventListener(ev, arm, { passive: true });
  }
  arm();
}

function init() {
  if (m.ready || typeof window === "undefined") return;
  m.ready = true;
  m.opened = readOpened();
  m.notebookLast = readFlag("local", NOTEBOOK_KEY);
  m.hasSave = readFlag("local", FILE_KEY) || m.opened.size > 0;
  m.stage = deriveStage(m.opened.size, m.notebookLast);
  m.saveOpen = !readFlag("session", SESSION_KEY);
  onStory(handle);
  startIdleWatch();
  publish();
}

// The bus listener goes up as soon as this module loads on the client, so no event
// emitted by the shell before React subscribes is lost
if (typeof window !== "undefined") init();

function subscribe(fn: () => void) {
  init();
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// ---- public API ----------------------------------------------------------------------

/** The narrator's state: stage, name tag, logo inner, voice, whether it is still in the CRT, current line */
export function useStory(): StoryState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}

/** Whether the save select is showing on the CRT (first power-on per browser session) */
export function useSaveSelect(): SaveSelectState {
  return useSyncExternalStore(subscribe, () => saveState, () => SERVER_SAVE);
}

/** True while the visitor has the CRT switched off (the narrator is muted) */
export function isPoweredOff(): boolean {
  return powerOff;
}

export function usePoweredOff(): boolean {
  return useSyncExternalStore(subscribe, () => powerOff, () => false);
}

/** Stage changes during this visit, so views can mark them (flicker, glitch, static) */
export function useStageShift(): StageShift {
  return useSyncExternalStore(subscribe, () => shift, () => NO_SHIFT);
}

export function getSaveSelect(): SaveSelectState {
  return saveState;
}

/** Snapshot outside React */
export function getStory(): StoryState {
  return state;
}

/** SaveSelect calls this when it appears, so the line is announced */
export function noteSaveSelectShown() {
  if (m.line !== BEATS.saveSelect) say(BEATS.saveSelect);
}
