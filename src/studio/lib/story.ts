// The story: a persisted save plus the stage machine (script.ts storyBeats.stageFor).
// Stage 3 is the ending, entered only by answering YES.

import { useSyncExternalStore } from "react";
import { storyBeats } from "@/studio/data/script";
import { EMPTY_SAVE, readSave, writeSave, type SaveData } from "./save";

export type StageN = 0 | 1 | 2 | 3;

let state: SaveData = EMPTY_SAVE;
let hydrated = false;
const listeners = new Set<() => void>();
const stageListeners = new Set<(from: StageN, to: StageN) => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = readSave();
}

function computeStage(s: SaveData): StageN {
  if (s.stage === 3) return 3;
  const st = storyBeats.stageFor({ opened: s.opened, corruptPeeks: s.corruptPeeks, playSeconds: s.playSeconds, visits: s.visits, finished: s.finished });
  return Math.max(st, s.stage) as StageN;
}

function commit(next: SaveData, opts: { silentStage?: boolean } = {}) {
  const from = state.stage;
  const stage = next.stage === 3 ? 3 : computeStage(next);
  state = { ...next, stage };
  writeSave(state);
  listeners.forEach((l) => l());
  if (stage !== from && !opts.silentStage) stageListeners.forEach((l) => l(from, stage));
}

export function getStory(): SaveData {
  hydrate();
  return state;
}

function subscribe(fn: () => void) {
  hydrate();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useStory(): SaveData {
  return useSyncExternalStore(subscribe, getStory, () => EMPTY_SAVE);
}

export function onStageChange(fn: (from: StageN, to: StageN) => void) {
  stageListeners.add(fn);
  return () => {
    stageListeners.delete(fn);
  };
}

const update = (patch: Partial<SaveData>, opts?: { silentStage?: boolean }) => commit({ ...getStory(), ...patch }, opts);
const add = (list: string[], v: string) => (list.includes(v) ? list : [...list, v]);

export const story = {
  /** NEW GAME: a fresh file (the narrator setting is kept) */
  newGame() {
    const narrator = getStory().narrator;
    commit({ ...EMPTY_SAVE, narrator, started: true, visits: 1 }, { silentStage: true });
  },
  continueGame() {
    const s = getStory();
    update({ started: true, visits: s.visits + 1 });
  },
  /** Deep links and skips: make sure a file exists without a ceremony */
  ensureStarted() {
    const s = getStory();
    if (!s.started) update({ started: true, visits: Math.max(1, s.visits) }, { silentStage: true });
  },
  opened(slug: string) {
    if (slug === "omar") return;
    update({ opened: add(getStory().opened, slug) });
  },
  finished(slug: string) {
    update({ finished: add(getStory().finished, slug) });
  },
  focus(slug: string) {
    if (getStory().focus !== slug) update({ focus: slug }, { silentStage: true });
  },
  corruptPeek() {
    update({ corruptPeeks: getStory().corruptPeeks + 1 });
  },
  tick(seconds: number) {
    const s = getStory();
    if (s.stage === 3 || !s.started) return;
    update({ playSeconds: s.playSeconds + seconds });
  },
  twist(id: string) {
    update({ twistsPlayed: add(getStory().twistsPlayed, id) }, { silentStage: true });
  },
  setNarrator(on: boolean) {
    update({ narrator: on }, { silentStage: true });
  },
  ending() {
    update({ stage: 3 });
  },
  reset() {
    const narrator = getStory().narrator;
    commit({ ...EMPTY_SAVE, narrator }, { silentStage: true });
    listeners.forEach((l) => l());
  },
};

export function formatPlayTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
