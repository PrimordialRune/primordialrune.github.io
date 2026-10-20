// Package B: one device per project, each rendering its ceremony into the shell's overlay.
import type { ComponentType } from "react";
import type { DeviceProps, ProjectId } from "../types";
import { PtcgCubeDevice } from "./BoosterMat";
import { HauntRecordDevice } from "./DiscPlayer";
import { GalacticNewsDevice, MinamotoDevice } from "./Handheld";
import { CrossfaderDevice } from "./Walkman";

export const DEVICES: Record<ProjectId, ComponentType<DeviceProps>> = {
  "galactic-news": GalacticNewsDevice,
  "project-minamoto": MinamotoDevice,
  crossfader: CrossfaderDevice,
  "haunt-record": HauntRecordDevice,
  "ptcg-cube": PtcgCubeDevice,
};

export { DEVICE_DESCRIPTIONS, DEVICE_CLOSING_DESCRIPTIONS } from "./descriptions";
export { TapeFlip, type TapeFlipProps } from "./Walkman";
