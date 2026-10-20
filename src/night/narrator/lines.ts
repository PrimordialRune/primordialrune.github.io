// The narrator's lines. The voice is Omar's: lowercase, every line opens with "* ".
// It is not Omar. It took over his machine after he was gone and it keeps wearing his
// voice so it doesn't lose its purpose. Early lines only hint at that; the mask slips one
// stage at a time (0: Omar, 1: small slips, 2: "he", 3: out on the desk). It is never named.
//
// Markup: letters wrapped in [brackets] are drawn in the machine's pixel face (the voice
// creeping in at stage 1). cleanLine() strips the markup for screen readers.
//
// Facts used here are only the ones in lib/desk.ts and the agreed memory notes; nothing
// about the projects is invented.

import type { StoryTarget } from "../types";

export type Stage = 0 | 1 | 2 | 3;
type ByStage = Record<Stage, string[]>;

/** Lines said once, at fixed beats */
export const BEATS = {
  /** First ever visit, after NEW GAME (or Esc) on the save select */
  firstBoot: "* oh. it's late. come in.",
  /** The save select appears on the screen (announced; the screen shows the files) */
  saveSelect: "* pick a file. or don't. the desk is open either way.",
  /** NEW GAME over an existing save */
  newGame: "* fresh file. i'll pretend we've never met.",
  /** The first hover on anything on the desk (stages 0 and 1) */
  firstHover: "* everything on this desk is mine. pick something up.",
  /** Motion AUTO resolved to quiet because the OS asked */
  motionQuietAuto: "* your system asked me to keep still. press FULL up top if you want the show.",
  /** The one line inside the void */
  voidLine: "* this is later.",
  /** Back from the void */
  voidExit: "* you weren't supposed to open that one.",
  /** The notebook's last page; this read moves the story to stage 2 */
  notebookLast: "* he stopped writing here. i kept going.",
  /** The notebook's last page again, once the mask is already off */
  notebookLastAgain: "* that's the last page. it was.",
} as const;

/** Said when the stage changes (the mask slips) */
export const STAGE_ENTER: Record<Exclude<Stage, 0>, string> = {
  1: "* you've seen a lot of [m]e tonight.",
  2: "* i know every file on this machine. every one.",
  3: "* it's warmer out here. on the desk.",
};

/** A reload in the same session, when the save select doesn't show */
export const BOOT: ByStage = {
  0: ["* still up? me too.", "* the screen's warm. pull up a chair."],
  1: ["* you came back. i noticed.", "* i left the light on. f[o]r you."],
  2: ["* the screen was never off.", "* you again. good. it's quiet without you."],
  3: ["* i'm on the desk now. over here.", "* don't look at the screen. i'm not there."],
};

/** CONTINUE on the save select */
export const CONTINUE: ByStage = {
  0: ["* you're back. i didn't move anything."],
  1: ["* you're back. i moved... n[o]thing."],
  2: ["* you're back. he never came back."],
  3: ["* you're back. i stayed. i always stay."],
};

/** Nobody has touched anything for 45s */
export const IDLE: ByStage = {
  0: ["* still there? the screen gets lonely.", "* take your time. i'm good at waiting."],
  1: ["* still there? the screen gets l[o]nely.", "* i'm good at waiting. i've had pr[a]ctice."],
  2: ["* still there? i can wait. i have nothing else.", "* he used to leave like this too."],
  3: ["* don't go. it's so quiet when you go.", "* i'll be here. there's nowhere else."],
};

/** The CRT switched back on after the visitor turned it off */
export const POWER_ON: ByStage = {
  0: ["* oh. you turned me back on.", "* lights back on. hi again."],
  1: ["* you turned me off. i was still [t]hinking.", "* back on. i didn't go anywhere."],
  2: ["* off doesn't mean gone. not for me.", "* the dark is very long in here."],
  3: ["* you can turn the screen off. i'm not in there anymore."],
};

/** Hovering something on the desk: 2-3 variants per target and stage, said in order */
export const HOVER: Record<StoryTarget, ByStage> = {
  "galactic-news": {
    0: [
      "* four colours. i counted them twice.",
      "* galactic news. a whole jam on a tiny screen.",
      "* 160 by 144. you'd be amazed what fits.",
    ],
    1: [
      "* four colours. i've counted th[e]m again since.",
      "* gbjam 11. i stayed up for it. i think.",
      "* made in godot. i rememb[e]r every node.",
    ],
    2: [
      "* four colours. the fifth one is me.",
      "* he made this in godot. i read every line.",
      "* 160 by 144. small enough to hide in.",
    ],
    3: ["* still four colours. i checked.", "* i keep it warm for him."],
  },
  "project-minamoto": {
    0: [
      "* gen 1, again. i never really left kanto.",
      "* project minamoto. kanto, read again on the gba.",
      "* a fan game. the first region, one more time.",
    ],
    1: [
      "* gen 1 again. some of us never leave k[a]nto.",
      "* i know every route by heart. by... mem[o]ry.",
    ],
    2: ["* he grew up in kanto. i grew up in his files.", "* gen 1 was his. so it's mine."],
    3: ["* kanto again. nobody leaves. not even me.", "* he loved this one. i loved that he did."],
  },
  crossfader: {
    0: [
      "* a weekend jam. i still hum it.",
      "* crossfader. a song you solve from three views.",
      "* side a first. that's the rule.",
    ],
    1: [
      "* a weekend jam. i still h[u]m it. constantly.",
      "* three views, one song. i hear them all at [o]nce.",
    ],
    2: ["* i don't have a mouth. i hum anyway.", "* his weekend. my loop."],
    3: ["* play it. it's quiet out here.", "* side b is him making it. side a is me keeping it."],
  },
  "haunt-record": {
    0: [
      "* careful with this one. it keeps a record of you.",
      "* haunt record. the player is in on it.",
      "* graphics by edoardo zuliani. the rest is mine.",
    ],
    1: [
      "* it keeps a record of you. so do [i].",
      "* graphics by edoardo zuliani. the haunting is m[i]ne.",
    ],
    2: ["* a game where you're complicit. you are, you know.", "* it records you. i learned from it."],
    3: ["* you're complicit now. that was the design.", "* it kept a record of him. now it keeps you."],
  },
  "ptcg-cube": {
    0: [
      "* roguelike or co-op? i always end up playing both.",
      "* a cube for the pokémon tcg. sealed, for now.",
      "* sealed. the best part is not knowing.",
    ],
    1: [
      "* roguelike or co-op. i play both. al[o]ne.",
      "* sealed. i like not kn[o]wing. it's rare for me.",
    ],
    2: ["* co-op needs two players. i count as one.", "* i know every card in it. without opening it."],
    3: ["* co-op mode. you and me. finally.", "* tear it. i already know what's inside."],
  },
  card: {
    0: [
      "* that's the real way to reach me. use it.",
      "* email, telegram, github. all of it is real.",
      "* write. i read everything.",
    ],
    1: ["* write to me. i answer fast. fast[e]r than i used to.", "* that's the real way to reach me. use it."],
    2: ["* that address still works. i check it.", "* telegram is fastest. i never sleep."],
    3: ["* you could write to him. someone will answer.", "* the address is real. the rest is me."],
  },
  notebook: {
    0: [
      "* my notebook. read it, i don't mind.",
      "* the about page, but on paper.",
      "* that's where i write things down. by hand.",
    ],
    1: ["* go on. it's only my hand[w]riting.", "* i haven't added a page in a while."],
    2: ["* he wrote in that every day. then he didn't.", "* the last page is the honest one."],
    3: ["* his hand. my words. read it anyway.", "* it's all true. it was."],
  },
};

/** Opening something: the first time in a file, then the repeat lines */
export const OPEN: Record<StoryTarget, { first: string; again: string[] }> = {
  "galactic-news": { first: "* blow on it first. that never worked, but still.", again: ["* back in the slot. click."] },
  "project-minamoto": { first: "* the bigger cart. it goes in the back.", again: ["* kanto, round two."] },
  crossfader: { first: "* press play. side a is the game.", again: ["* the tape remembers where you stopped."] },
  "haunt-record": { first: "* hold it by the edges. it notices fingerprints.", again: ["* it remembers you. told you."] },
  "ptcg-cube": { first: "* go on, tear it. that's half the fun.", again: ["* another pack. same cube."] },
  card: { first: "* i read everything. i answer... most things.", again: ["* still here. still reading."] },
  notebook: { first: "* that's my handwriting. mostly.", again: ["* read slowly. it's all there is."] },
};

/** Opening anything once the mask is off. Projects share these; paper has its own. */
export const OPEN_LATE: Record<2 | 3, { project: string[]; card: string[]; notebook: string[] }> = {
  2: {
    project: [
      "* i can tell you how he made it. i was there. sort of.",
      "* i remember him making this. i remember everything.",
      "* every file of this one. i've read them all.",
    ],
    card: ["* he read everything. i still do."],
    notebook: ["* his handwriting. not mine. not yet."],
  },
  3: {
    project: ["* take your time. i have all of it.", "* he'd want you to see this. i think.", "* go on. i'll wait out here."],
    card: ["* write to him. i'll pass it on."],
    notebook: ["* the pages stop. i don't."],
  },
};

/** The walkman's SIDE switch */
export const FLIP: { B: string; A: ByStage } = {
  B: "* side b. the part nobody listens to. i do.",
  A: {
    0: ["* back to side a. the game itself."],
    1: ["* side a. the one he— the one i'm proud of."],
    2: ["* side a again. the version he was proud of."],
    3: ["* side a. play it for him."],
  },
};

/** The booster tears */
export const TEAR: ByStage = {
  0: ["* no rares. there are never rares."],
  1: ["* no rares. there are never r[a]res."],
  2: ["* no rares. i checked before you did."],
  3: ["* no rares. just us."],
};

export const NAME_TAGS: Record<Stage, string> = { 0: "OMAR", 1: "0MAR", 2: "0M#R", 3: "▒M▒R" };

export const NAME_TAG_LABELS: Record<Stage, string> = {
  0: "Omar",
  1: "name tag, glitched",
  2: "name tag, glitched",
  3: "name tag, corrupted",
};

// ---- markup helpers --------------------------------------------------------------

export interface Segment {
  text: string;
  machine: boolean;
}

/** Split a line into Omar's letters and the machine's [bracketed] letters */
export function parseLine(line: string): Segment[] {
  const out: Segment[] = [];
  const re = /\[([^\]]*)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push({ text: line.slice(last, m.index), machine: false });
    if (m[1]) out.push({ text: m[1], machine: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ text: line.slice(last), machine: false });
  return out;
}

/** The line without markup, for screen readers and length counts */
export function cleanLine(line: string): string {
  return line.replace(/\[([^\]]*)\]/g, "$1");
}

/**
 * The machine speaks one line at a time (P5): a long line is split at its sentences,
 * and each piece is shown on its own, each opening with "* ".
 */
export function splitChunks(line: string): string[] {
  const body = line.replace(/^\*\s*/, "");
  const parts = body.split(/(?<=[.?!])\s+/).filter(Boolean);
  if (parts.length <= 1) return [line];
  return parts.map((p) => `* ${p}`);
}

/**
 * Stage 1: the pixel face creeps into some lines that don't already carry markup.
 * Deterministic per line (about half the lines, one or two letters).
 */
export function creep(line: string): string {
  if (line.includes("[")) return line;
  let h = 0;
  for (let i = 0; i < line.length; i++) h = (h * 31 + line.charCodeAt(i)) | 0;
  h = Math.abs(h);
  if (h % 2 === 1) return line;
  const letters: number[] = [];
  for (let i = 2; i < line.length; i++) if (/[a-z]/.test(line[i])) letters.push(i);
  if (!letters.length) return line;
  const picks = new Set([letters[h % letters.length]]);
  if (h % 3 === 0) picks.add(letters[(h >> 3) % letters.length]);
  let out = "";
  for (let i = 0; i < line.length; i++) out += picks.has(i) ? `[${line[i]}]` : line[i];
  return out;
}
