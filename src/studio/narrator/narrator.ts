// The narrator's queue. Any component can make the AI talk with say(trigger) or sayLines(lines).
// Lines are looked up in the script by (trigger, act); each Entry's beats play in order, one per
// trigger fire, then fall back to its random pool (or stop when `once`).

import { SCRIPT_SOURCE } from "./source";
import type { Act } from "../story";

export type Voice = "omar" | "machine";
export interface Page {
  text: string;
  voice: Voice;
  /** ambient lines (idle, edge...) are the first to drop when the queue is full */
  ambient?: boolean;
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

const MAX_QUEUE = 4;
const AMBIENT = new Set(["idle", "edge", "pointer.exit", "resize", "time.night", "time.morning"]);

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

function push(pages: Page[]) {
  if (!pages.length) return;
  for (const p of pages) {
    if (!current) {
      current = p;
      continue;
    }
    queue.push(p);
    while (queue.length > MAX_QUEUE) {
      const i = queue.findIndex((q) => q.ambient);
      const [dropped] = queue.splice(i >= 0 ? i : 0, 1);
      dropped.onDone?.();
    }
  }
  emit();
}

export interface SayOptions {
  vars?: Record<string, string | number>;
  /** called once the trigger's last line has been read (or right away when there is none) */
  onDone?: () => void;
  /** called once the trigger's last line is fully on screen */
  onShown?: () => void;
  /** replace whatever is showing instead of queueing after it */
  interrupt?: boolean;
  /** speak even in DIRECT mode */
  force?: boolean;
}

/** Make the AI talk about `trigger`. Returns whether anything was said. */
export function say(trigger: string, opts: SayOptions = {}): boolean {
  if (!config) return false;
  if (config.isDirect() && !opts.force) {
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
  const ambient = AMBIENT.has(trigger);
  const pages: Page[] = lines.map((l) => {
    const text = interpolate(l.text, vars);
    return { text, voice: voiceOf(text, l.voice), ambient };
  });
  if (opts.onDone) pages[pages.length - 1].onDone = opts.onDone;
  if (opts.onShown) pages[pages.length - 1].onShown = opts.onShown;
  if (opts.interrupt) clearNarrator();
  push(pages);
  return true;
}

export function sayLines(lines: RawLine[], opts: { onDone?: () => void; onShown?: () => void; interrupt?: boolean } = {}) {
  const pages: Page[] = lines.map((l) => ({ text: l.text, voice: voiceOf(l.text, l.voice) }));
  if (!pages.length) return;
  if (opts.onDone) pages[pages.length - 1].onDone = opts.onDone;
  if (opts.onShown) pages[pages.length - 1].onShown = opts.onShown;
  if (opts.interrupt) clearNarrator();
  push(pages);
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
  const f = p.onShown;
  p.onShown = undefined;
  f?.();
}

export function clearNarrator() {
  current = null;
  queue = [];
  emit();
}
