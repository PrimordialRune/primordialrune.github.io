// What each ceremony is doing, for the aria-live region the device renders (P2: screen
// readers get the same story, and are told how to skip it).
import type { ProjectId } from "../types";

export const DEVICE_DESCRIPTIONS: Record<ProjectId, string> = {
  "galactic-news": "Inserting the Galactic News cartridge into the handheld. Press Escape to skip.",
  "project-minamoto": "Inserting the Project Minamoto cartridge into the handheld. Press Escape to skip.",
  crossfader: "Loading the Crossfader tape into the walkman and pressing play. Press Escape to skip.",
  "haunt-record": "Opening the Haunt Record jewel case and loading the disc. Press Escape to skip.",
  "ptcg-cube": "Tearing open the PTCG Cube booster pack and dealing the cards onto the playmat. Press Escape to skip.",
};

export const DEVICE_CLOSING_DESCRIPTIONS: Record<ProjectId, string> = {
  "galactic-news": "Ejecting the Galactic News cartridge.",
  "project-minamoto": "Ejecting the Project Minamoto cartridge.",
  crossfader: "Taking the Crossfader tape out of the walkman.",
  "haunt-record": "Putting the Haunt Record disc back in its case.",
  "ptcg-cube": "Gathering the PTCG Cube cards back into the pack.",
};
