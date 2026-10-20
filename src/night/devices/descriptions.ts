// What each ceremony is doing, for the aria-live region the device renders (P2: screen
// readers get the same story, and are told how to skip it).
import type { ProjectId } from "../types";

export const DEVICE_DESCRIPTIONS: Record<ProjectId, string> = {
  "galactic-news": "Inserting the Galactic News cartridge into the handheld. Press Escape to skip.",
  "project-minamoto": "Inserting the Project Minamoto cartridge into the handheld. Press Escape to skip.",
  crossfader: "Loading the Crossfader tape into the cassette player and pressing play. Press Escape to skip.",
  "haunt-record": "Loading the Haunt Record disc into the disc player. Press Escape to skip.",
  "ptcg-cube": "Opening the PTCG Cube booster pack over the playmat and dealing the cards onto it. Press Escape to skip.",
};

export const DEVICE_CLOSING_DESCRIPTIONS: Record<ProjectId, string> = {
  "galactic-news": "Ejecting the Galactic News cartridge from the handheld.",
  "project-minamoto": "Ejecting the Project Minamoto cartridge from the handheld.",
  crossfader: "Taking the Crossfader tape out of the cassette player.",
  "haunt-record": "Taking the Haunt Record disc out of the disc player.",
  "ptcg-cube": "Gathering the PTCG Cube cards back into the booster pack.",
};
