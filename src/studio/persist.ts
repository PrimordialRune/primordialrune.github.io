// Guarded storage: every read and write survives private windows and blocked storage.
// Without storage the story simply runs per page load.

import { initialStory, type Story } from "./story";

const STORY_KEY = "studio-b:story:v1";
const POWER_KEY = "studio-b:powered";

export function readStory(): Story {
  try {
    const raw = localStorage.getItem(STORY_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Story;
      if (s && s.v === 1 && typeof s.act === "number") return { ...initialStory(), ...s };
    }
  } catch {}
  return initialStory();
}

export function writeStory(s: Story) {
  try {
    localStorage.setItem(STORY_KEY, JSON.stringify(s));
  } catch {}
}

export function readPowered(): boolean {
  try {
    return sessionStorage.getItem(POWER_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePowered(on: boolean) {
  try {
    if (on) sessionStorage.setItem(POWER_KEY, "1");
    else sessionStorage.removeItem(POWER_KEY);
  } catch {}
}

/** Clears every studio-b:* key (local and session) */
export function eraseAll() {
  for (const store of [() => localStorage, () => sessionStorage]) {
    try {
      const s = store();
      const keys: string[] = [];
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i);
        if (k && k.startsWith("studio-b:")) keys.push(k);
      }
      keys.forEach((k) => s.removeItem(k));
    } catch {}
  }
}

/** ?reset in the URL: clear progress, then drop the parameter so a reload doesn't repeat it */
export function consumeResetParam(): boolean {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("reset")) return false;
    eraseAll();
    url.searchParams.delete("reset");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    return true;
  } catch {
    return false;
  }
}
