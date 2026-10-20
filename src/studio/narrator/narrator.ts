// The narrator's queue. Any component can make the AI talk with say(trigger) or sayLines(lines).
// Lines are looked up in the script by (trigger, act); each Entry's beats play in order, one per
// trigger fire, then fall back to its random pool (or stop when `once`).
//
// Three kinds of lines, so the story always lands and the box never lags behind the views:
// - story: act changes, twists, choices, the ending. Never dropped; a beat's Line[] is never split.
// - context: lines about the current view (hub.enter, record.enter, load/read/close, about...).
//   A newer context line replaces an older one, and changing view flushes them (flushContext).
// - ambient: idle, clock, edge... Only said when the box has nothing else to do.

import { SCRIPT_SOURCE } from "./source";
import type { Act } from "../story";

export type Voice = "omar" | "machine";
export type Kind = "story" | "context" | "ambient";
export interface Page {
  text: string;
  voice: Voice;
  kind: Kind;
  /** set by the box once the page has been fully typed out */
  shown?: boolean;
  onDone?: () => void;
  /** called once when the page has been fully typed out */
  onShown?: () => void;
}

interface Config {
  getAct: () => Act;
  isDirect: () => boolean;
  getSeen: (key: string) => number;
  bumpSeen: (key: string) => void;
  vars: () => Record<string, string | number>;
}

const AMBIENT = new Set(["idle", "edge", "pointer.exit", "resize", "time.night", "time.morning", "visit.return"]);
const STORY_PREFIX = ["act.", "choice.", "end", "question", "frame.refuse", "about.lastseen", "title.corrupt", "void.peek", "tab.return", "open:"];

export function kindOf(trigger: string): Kind {
  if (AMBIENT.has(trigger)) return "ambient";
  if (STORY_PREFIX.some((p) => trigger.startsWith(p))) return "story";
  return "context";
}

let config: Config | null = null;
let current: Page | null = null;
let queue: Page[] = [];
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version++;
  listeners.forEach((l) => l());
}

export function configureNarrator(c: Config) {
  config = c;
}

export function subscribeNarrator(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export const narratorVersion = () => version;
export const currentPage = () => current;
export const pendingCount = () => queue.length;

const voiceOf = (text: string, voice?: Voice): Voice => voice ?? (text.startsWith("* ") ? "omar" : "machine");

function interpolate(text: string, vars: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

type RawLine = { text: string; voice?: Voice };
type RawBeat = RawLine | RawLine[];
type RawEntry = { acts: Act[]; beats: RawBeat[]; random?: RawLine[]; once?: boolean };

/** Whether the script has anything to say for this trigger in this act */
export function hasLines(trigger: string, act?: Act) {
  const a = act ?? config?.getAct() ?? 0;
  const entries = (SCRIPT_SOURCE as Record<string, RawEntry[] | undefined>)[trigger];
  return !!entries?.some((e) => e.acts.includes(a));
}

function resolve(trigger: string, act: Act): RawLine[] {
  if (!config) return [];
  const entries = (SCRIPT_SOURCE as Record<string, RawEntry[] | undefined>)[trigger];
  if (!entries) return [];
  const idx = entries.findIndex((e) => e.acts.includes(act));
  if (idx < 0) return [];
  const entry = entries[idx];
  const key = `${trigger}#${idx}`;
  const cursor = config.getSeen(key);
  let beat: RawBeat | undefined;
  if (cursor < entry.beats.length) {
    beat = entry.beats[cursor];
    config.bumpSeen(key);
  } else if (entry.random && entry.random.length) {
    beat = entry.random[Math.floor(Math.random() * entry.random.length)];
  } else if (!entry.once && entry.beats.length) {
    beat = entry.beats[entry.beats.length - 1];
  }
  if (!beat) return [];
  return Array.isArray(beat) ? beat : [beat];
}

function drop(pages: Page[]) {
  if (process.env.NODE_ENV !== "production" && pages.some((p) => p.kind === "story"))
    console.warn("narrator: dropped a story line", pages);
  pages.forEach((p) => p.onDone?.());
}

/** Remove queued (not yet shown) pages of the given kinds */
function prune(kinds: Kind[]) {
  const keep: Page[] = [];
  const gone: Page[] = [];
  for (const p of queue) (kinds.includes(p.kind) ? gone : keep).push(p);
  queue = keep;
  drop(gone);
}

function push(pages: Page[], interrupt = false) {
  if (!pages.length) return;
  const kind = pages[0].kind;
  if (interrupt) {
    // clears what belongs to the moment, never story that is already waiting
    prune(["context", "ambient"]);
    if (current && current.kind !== "story") {
      drop([current]);
      current = null;
    }
  }
  if (kind === "ambient") {
    // only when the box is idle
    if (queue.length || (current && !current.shown)) {
      drop(pages);
      return;
    }
    if (current) drop([current]);
    current = pages[0];
    queue.push(...pages.slice(1));
    emit();
    return;
  }
  // a newer line replaces older context and any ambient line
  prune(["context", "ambient"]);
  if (!current || current.kind !== "story") {
    if (current) drop([current]);
    current = pages[0];
    queue.push(...pages.slice(1));
  } else {
    queue.push(...pages);
  }
  emit();
}

export interface SayOptions {
  vars?: Record<string, string | number>;
  /** called once the trigger's last line has been read (or right away when there is none) */
  onDone?: () => void;
  /** called once the trigger's last line is fully on screen */
  onShown?: () => void;
  /** clear context and ambient lines (current included) before this one */
  interrupt?: boolean;
  /** speak even in DIRECT mode */
  force?: boolean;
  /** override the trigger's kind */
  kind?: Kind;
}

/** Make the AI talk about `trigger`. Returns whether anything was said. */
export function say(trigger: string, opts: SayOptions = {}): boolean {
  if (!config) return false;
  if (config.isDirect() && !opts.force) {
    opts.onShown?.();
    opts.onDone?.();
    return false;
  }
  const lines = resolve(trigger, config.getAct());
  if (!lines.length) {
    opts.onShown?.();
    opts.onDone?.();
    return false;
  }
  const vars = { ...config.vars(), ...(opts.vars || {}) };
  const kind = opts.kind ?? kindOf(trigger);
  const pages: Page[] = lines.map((l) => {
    const text = interpolate(l.text, vars);
    return { text, voice: voiceOf(text, l.voice), kind };
  });
  if (opts.onDone) pages[pages.length - 1].onDone = opts.onDone;
  if (opts.onShown) pages[pages.length - 1].onShown = opts.onShown;
  push(pages, opts.interrupt);
  return true;
}

export function sayLines(
  lines: RawLine[],
  opts: { onDone?: () => void; onShown?: () => void; interrupt?: boolean; kind?: Kind } = {},
) {
  const kind = opts.kind ?? "story";
  const pages: Page[] = lines.map((l) => ({ text: l.text, voice: voiceOf(l.text, l.voice), kind }));
  if (!pages.length) return;
  if (opts.onDone) pages[pages.length - 1].onDone = opts.onDone;
  if (opts.onShown) pages[pages.length - 1].onShown = opts.onShown;
  push(pages, opts.interrupt);
}

/** A view change: context and ambient lines that haven't been shown yet are for the old view */
export function flushContext() {
  const before = queue.length;
  prune(["context", "ambient"]);
  if (queue.length !== before) emit();
}

/** Move to the next page; fires the finished page's onDone */
export function advance() {
  const done = current;
  current = queue.shift() ?? null;
  emit();
  done?.onDone?.();
}

/** The box reports a page fully typed */
export function pageShown(p: Page) {
  p.shown = true;
  const f = p.onShown;
  p.onShown = undefined;
  f?.();
}

export function clearNarrator() {
  current = null;
  queue = [];
  emit();
}
