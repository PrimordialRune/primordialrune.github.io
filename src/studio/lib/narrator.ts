// The narrator bus. say(topic) picks the next line for the current story stage
// (numbered lines once each in order, then random); sayLine() says a given line;
// script() plays several in a row; ask() puts choices under a line.
// Reactions are limited to one per 1.2s and dropped (not queued); scripts always play.

import { TOPICS } from "@/studio/data/lines";
import { getStory } from "./story";

export interface Choice {
  label: string;
  value: string;
}

export interface Utterance {
  lines: string[];
  /** Scripts advance on their own; single reactions fade after a while */
  script: boolean;
  choices?: Choice[];
  onChoice?: (value: string) => void;
  onDone?: () => void;
}

const listeners = new Set<(u: Utterance) => void>();
const cursor: Record<string, number> = {};
let lastReaction = 0;
let scriptUntil = 0;

export function onUtterance(fn: (u: Utterance) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function emit(u: Utterance) {
  listeners.forEach((l) => l(u));
}

function silent() {
  const s = getStory();
  return !s.narrator || s.stage === 3;
}

export function lineFor(topic: string): string | null {
  const t = TOPICS[topic];
  const stage = getStory().stage;
  if (!t || stage === 3) return null;
  const pool = t[stage as 0 | 1 | 2];
  if (!pool?.length) return null;
  const key = `${topic}@${stage}`;
  const n = cursor[key] ?? 0;
  cursor[key] = n + 1;
  return n < pool.length ? pool[n] : pool[Math.floor(Math.random() * pool.length)];
}

function reactionAllowed() {
  const now = Date.now();
  if (now < scriptUntil || now - lastReaction < 1200) return false;
  lastReaction = now;
  return true;
}

export function say(topic: string) {
  if (silent() || !reactionAllowed()) return;
  const line = lineFor(topic);
  if (line) emit({ lines: [line], script: false });
}

export function sayLine(line: string, opts: { force?: boolean } = {}) {
  if (!opts.force && (silent() || !reactionAllowed())) return;
  if (opts.force && !getStory().narrator) return;
  emit({ lines: [line], script: false });
}

/** All lines of a topic's current-stage pool, or a list of lines, as one skippable script */
export function script(lines: readonly string[], onDone?: () => void) {
  if (silent() || !lines.length) {
    onDone?.();
    return;
  }
  scriptUntil = Date.now() + lines.length * 2500;
  emit({ lines: [...lines], script: true, onDone });
}

export function scriptTopic(topic: string, onDone?: () => void) {
  const t = TOPICS[topic];
  const stage = getStory().stage;
  if (!t || stage === 3) return onDone?.();
  script(t[stage as 0 | 1 | 2], onDone);
}

/** A question with choices. With the narrator off nothing is asked (the card asks instead). */
export function ask(line: string, choices: Choice[], onChoice: (v: string) => void, lead: readonly string[] = []) {
  if (!getStory().narrator) return false;
  scriptUntil = Date.now() + 60000;
  emit({ lines: [...lead, line], script: true, choices, onChoice: (v) => ((scriptUntil = 0), onChoice(v)) });
  return true;
}

export function endScript() {
  scriptUntil = 0;
}
