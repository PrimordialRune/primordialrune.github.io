// Story event bus: anything can tell the narrator what just happened
import type { StoryEvent } from "./types";

const EVENT = "night:story";

export function emitStory(ev: StoryEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<StoryEvent>(EVENT, { detail: ev }));
}

export function onStory(fn: (ev: StoryEvent) => void) {
  const h = (e: Event) => fn((e as CustomEvent<StoryEvent>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}
