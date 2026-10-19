// Save data for the title screen. Storage can be unavailable (private mode,
// blocked cookies), so every access is guarded and the site works without it.

export interface SaveData {
  lastSection: string;
  playSeconds: number;
  updatedAt: number;
}

const SAVE_KEY = "primordialrune:save";
const POWER_KEY = "primordialrune:powered";

export function readSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data?.lastSection !== "string") return null;
    return {
      lastSection: data.lastSection,
      playSeconds: Number(data.playSeconds) || 0,
      updatedAt: Number(data.updatedAt) || 0,
    };
  } catch {
    return null;
  }
}

export function writeSave(patch: Partial<SaveData>) {
  try {
    const current = readSave() ?? { lastSection: "systems", playSeconds: 0, updatedAt: 0 };
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...current, ...patch, updatedAt: Date.now() }));
  } catch {
    // Storage unavailable: the save simply doesn't persist
  }
}

export function addPlayTime(seconds: number) {
  const current = readSave();
  if (current) writeSave({ playSeconds: current.playSeconds + seconds });
}

// Power state lasts for the browser session, so the boot plays once per visit
export function readPowered(): boolean {
  try {
    return sessionStorage.getItem(POWER_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePowered() {
  try {
    sessionStorage.setItem(POWER_KEY, "1");
  } catch {
    // Storage unavailable: the boot plays again next load
  }
}

export function formatPlayTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds / 60) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
