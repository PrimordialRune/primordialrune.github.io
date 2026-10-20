// What this visitor has opened and which ceremonies they've already seen in full.
// localStorage, every access guarded (private windows, blocked storage).
import type { ProjectId } from "../types";
import { PROJECT_IDS } from "../types";

export const PROGRESS_KEY = "night:progress";
export const PROGRESS_EVENT = "night:progress-change";

export interface Progress {
  /** distinct objects opened, ever */
  opened: ProjectId[];
  /** ceremonies already played in full */
  seen: ProjectId[];
}

const EMPTY: Progress = { opened: [], seen: [] };
let cache: Progress | null = null;

const clean = (a: unknown): ProjectId[] =>
  Array.isArray(a) ? PROJECT_IDS.filter((id) => a.includes(id)) : [];

export function readProgress(): Progress {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const p = raw ? JSON.parse(raw) : null;
    cache = p ? { opened: clean(p.opened), seen: clean(p.seen) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(p: Progress) {
  cache = p;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {}
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

export function markOpened(id: ProjectId) {
  const p = readProgress();
  if (!p.opened.includes(id)) write({ ...p, opened: [...p.opened, id] });
}

export function markSeen(id: ProjectId) {
  const p = readProgress();
  if (!p.seen.includes(id)) write({ ...p, seen: [...p.seen, id] });
}

/** NEW GAME: forget everything */
export function resetProgress() {
  write({ opened: [], seen: [] });
}

export function subscribeProgress(fn: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === PROGRESS_KEY) {
      cache = null;
      fn();
    }
  };
  window.addEventListener(PROGRESS_EVENT, fn);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(PROGRESS_EVENT, fn);
    window.removeEventListener("storage", onStorage);
  };
}
