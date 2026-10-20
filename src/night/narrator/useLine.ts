"use client";
// Line playback shared by the CRT screen and the desk dialogue: 25ms per character in
// FULL (skippable), whole line in QUIET, and the machine's lines one sentence at a time.
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { isQuiet, subscribeMotion } from "@/lib/motion";
import { cleanLine, splitChunks } from "./lines";
import type { StoryState } from "../types";

const CHAR_MS = 25;
const CHUNK_HOLD_MS = 1700;

export function useQuiet(): boolean {
  return useSyncExternalStore(subscribeMotion, isQuiet, () => false);
}

export interface LinePlayback {
  /** The piece of the line on screen now (markup kept) */
  chunk: string;
  /** How many clean characters of it are visible */
  shown: number;
  /** Clean length of the chunk */
  length: number;
  typing: boolean;
  more: boolean;
  /** Click / Enter: finish the piece, or go to the next one */
  skip(): void;
}

export function useLine(story: Pick<StoryState, "line" | "lineId" | "voice">): LinePlayback {
  const { line, lineId, voice } = story;
  const quiet = useQuiet();
  const chunks = useMemo(() => (line ? (voice === "machine" ? splitChunks(line) : [line]) : []), [line, voice]);
  const [st, setSt] = useState({ id: lineId, chunk: 0, n: 0 });
  // A new line starts over (adjusting state during render, not in an effect)
  if (st.id !== lineId) setSt({ id: lineId, chunk: 0, n: 0 });

  const index = st.id === lineId ? Math.min(st.chunk, Math.max(0, chunks.length - 1)) : 0;
  const chunk = chunks[index] ?? "";
  const length = cleanLine(chunk).length;
  const shown = quiet ? length : st.id === lineId ? Math.min(st.n, length) : 0;
  const typing = shown < length;
  const more = index < chunks.length - 1;

  // Reveal
  useEffect(() => {
    if (!typing) return;
    const t = setInterval(() => setSt((s) => (s.id === lineId ? { ...s, n: s.n + 1 } : s)), CHAR_MS);
    return () => clearInterval(t);
  }, [typing, lineId, index]);

  // The machine's next sentence
  useEffect(() => {
    if (typing || !more) return;
    const t = setTimeout(() => setSt((s) => (s.id === lineId ? { ...s, chunk: s.chunk + 1, n: 0 } : s)), CHUNK_HOLD_MS);
    return () => clearTimeout(t);
  }, [typing, more, lineId, index]);

  // The phosphor glow may breathe while it speaks (shell reads html[data-night-speaking])
  useEffect(() => {
    const root = document.documentElement;
    if (typing) root.dataset.nightSpeaking = "1";
    else delete root.dataset.nightSpeaking;
  }, [typing]);

  const skip = useCallback(() => {
    setSt((s) => {
      if (s.id !== lineId) return s;
      if (!quiet && s.n < length) return { ...s, n: length };
      if (s.chunk < chunks.length - 1) return { ...s, chunk: s.chunk + 1, n: 0 };
      return s;
    });
  }, [lineId, length, chunks.length, quiet]);

  return { chunk, shown, length, typing, more, skip };
}
