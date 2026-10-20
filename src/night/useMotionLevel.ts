"use client";

// The resolved motion level (AUTO follows the system, FULL/QUIET override), as a hook.
// Every GSAP call in the Night Desk branches on this; CSS follows html[data-motion].
import { useSyncExternalStore } from "react";
import { isQuiet, readMotionSetting, subscribeMotion, systemReducesMotion, type MotionSetting } from "@/lib/motion";
import type { MotionLevel } from "./types";

const readLevel = (): MotionLevel => (isQuiet() ? "quiet" : "full");

export function useMotionLevel(): MotionLevel {
  return useSyncExternalStore(subscribeMotion, readLevel, () => "full");
}

export function useMotionSetting(): MotionSetting {
  return useSyncExternalStore(subscribeMotion, readMotionSetting, () => "auto");
}

export function useSystemQuiet(): boolean {
  return useSyncExternalStore(subscribeMotion, systemReducesMotion, () => false);
}
