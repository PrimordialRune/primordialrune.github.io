// Shared contracts for the Night Desk. Frozen: every package builds against these.
import type { Ref } from "react";

export type ProjectId =
  | "galactic-news"
  | "project-minamoto"
  | "crossfader"
  | "haunt-record"
  | "ptcg-cube";

export const PROJECT_IDS: ProjectId[] = [
  "galactic-news",
  "project-minamoto",
  "crossfader",
  "haunt-record",
  "ptcg-cube",
];

export type Side = "A" | "B";

export type View =
  | { kind: "desk" }
  | { kind: "ceremony"; id: ProjectId; reverse?: boolean }
  | { kind: "manual"; id: ProjectId; side: Side }
  | { kind: "notebook" }
  | { kind: "card" }
  | { kind: "void" };

export type CeremonyMode = "full" | "short" | "cut";

export interface DeviceProps {
  id: ProjectId;
  mode: CeremonyMode;
  /** Play the ceremony backwards (closing the manual) */
  reverse?: boolean;
  /** Increments when the user skips; the device must jump to its end state and call onReady */
  skipToken: number;
  /** Ceremony finished: the shell switches to the manual (or back to the desk when reverse) */
  onReady(): void;
}

export interface ManualProps {
  id: ProjectId;
  side: Side;
  onClose(): void;
  onSide(s: Side): void;
  titleRef: Ref<HTMLHeadingElement>;
}

export type StoryTarget = ProjectId | "card" | "notebook";

export type StoryEvent =
  | { type: "boot" | "continue" | "newgame" | "corrupt" | "void-exit" | "idle" | "power-off" | "power-on" | "motion-quiet-auto" }
  | { type: "hover" | "open" | "close" | "flip" | "tear"; id: StoryTarget }
  | { type: "notebook-last-page" };

export interface StoryState {
  stage: 0 | 1 | 2 | 3;
  nameTag: string;
  inner: "plate" | "red";
  voice: "omar" | "machine";
  /** false once the AI has left the CRT (stage 3) */
  inCrt: boolean;
  /** current line, already chosen from the trigger table; null = silent */
  line: string | null;
  /** increments on every new line so views can re-run reveal effects */
  lineId: number;
}

export type MotionLevel = "full" | "quiet";
