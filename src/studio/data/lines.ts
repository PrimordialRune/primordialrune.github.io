// The narrator's topics, keyed for say(). Every line comes from the writer's script.ts.

import { emptyFileAlternates, nameTags, narratorLines as N, storyBeats, type StagedLines } from "./script";

export const TOPICS: Record<string, StagedLines> = {
  newGame: N.newGame,
  returning: N.returning,
  idleShort: N.idleShort,
  idleLong: N.idleLong,
  closeGuide: N.closeGuide,
  readContact: N.readContact,
  motionFull: N.motionFull,
  motionSoft: N.motionSoft,
  narratorOff: N.narratorOff,
  skipIntro: N.skipIntro,
  corruptFocus: N.corruptFocus,
  nightVisit: N.nightVisit,
  tabReturn: N.tabReturn,
  keyboardOnly: N.keyboardOnly,
  bareRoom: N.bareRoom,
  guideEnd: N.guideEnd,
  emptyFile: emptyFileAlternates,
  "focus.omar": N.focusOmar,
  "open.omar": N.readContact,
};

N.logoClick.forEach((l, i) => (TOPICS[`logo${i}`] = l));
for (const [slug, l] of Object.entries(N.focusProject)) TOPICS[`focus.${slug}`] = l;
for (const [slug, l] of Object.entries(N.focusArchive)) TOPICS[`focus.${slug}`] = l;
for (const [slug, l] of Object.entries(N.openProject)) TOPICS[`open.${slug}`] = l;

export const TWISTS = Object.fromEntries(storyBeats.twists.map((t) => [t.id, t]));
export const NOT_YET_REPLY = "* okay. i'll be here. a little longer.";
export { nameTags };
