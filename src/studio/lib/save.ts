// The save file and the power state. Storage can be missing (private mode, blocked
// site data), so every access is guarded and the site works without it.

export interface SaveData {
  started: boolean;
  visits: number;
  /** Distinct project slugs whose guide was opened (omar excluded) */
  opened: string[];
  /** Distinct guides read to the end */
  finished: string[];
  focus: string;
  /** 0-2 from the script's rules; 3 = the ending was chosen */
  stage: 0 | 1 | 2 | 3;
  corruptPeeks: number;
  twistsPlayed: string[];
  playSeconds: number;
  narrator: boolean;
}

const SAVE_KEY = "afterimage:save";
const POWER_KEY = "afterimage:powered";

export const EMPTY_SAVE: SaveData = {
  started: false,
  visits: 0,
  opened: [],
  finished: [],
  focus: "omar",
  stage: 0,
  corruptPeeks: 0,
  twistsPlayed: [],
  playSeconds: 0,
  narrator: true,
};

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);

export function readSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...EMPTY_SAVE };
    const d = JSON.parse(raw) ?? {};
    const stage = [0, 1, 2, 3].includes(d.stage) ? d.stage : 0;
    return {
      started: Boolean(d.started),
      visits: Number(d.visits) || 0,
      opened: strings(d.opened),
      finished: strings(d.finished),
      focus: typeof d.focus === "string" ? d.focus : "omar",
      stage,
      corruptPeeks: Number(d.corruptPeeks) || 0,
      twistsPlayed: strings(d.twistsPlayed),
      playSeconds: Number(d.playSeconds) || 0,
      narrator: d.narrator !== false,
    };
  } catch {
    return { ...EMPTY_SAVE };
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable: the save lives only in memory for this page
  }
}

export function isPowered(): boolean {
  try {
    return sessionStorage.getItem(POWER_KEY) === "1";
  } catch {
    return false;
  }
}

export function setPowered(on: boolean) {
  try {
    if (on) sessionStorage.setItem(POWER_KEY, "1");
    else sessionStorage.removeItem(POWER_KEY);
  } catch {}
}
