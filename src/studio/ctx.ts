"use client";

import { createContext, useContext } from "react";
import type { EngineEvent, Slug, Story, View } from "./story";

export interface GameApi {
  story: Story;
  view: View;
  dispatch: (e: EngineEvent) => Story;
  /** Go to a view (pushes history for navigable views) */
  go: (v: View, opts?: { replace?: boolean }) => void;
  /** Esc / back: manual → record → hub */
  back: () => void;
  /** go to the hub; `line` replaces the usual hub.enter narration (boot lines) */
  enterHub: (line?: string) => void;
  openRecord: (focus?: Slug) => void;
  loadProject: (slug: Slug) => void;
  /** the view's heading, focused on view change */
  headingRef: (el: HTMLElement | null) => void;
}

export const GameCtx = createContext<GameApi | null>(null);
export function useGame() {
  const g = useContext(GameCtx);
  if (!g) throw new Error("useGame outside <Game>");
  return g;
}
