// The narrator: an AI wearing Omar's voice. It comments on what the visitor does.
// Each topic has numbered lines (said in order, once each) and random lines
// (said after the numbered ones run out). Lines keep Omar's lowercase "* " style.

export const NARRATE_EVENT = "primordialrune:narrate";

export interface Topic {
  numbered: string[];
  random: string[];
}

export const TOPICS: Record<string, Topic> = {
  newGame: {
    numbered: [
      "* welcome to my corner of the internet.",
      "* i'm omar. i design games, the board kind and the screen kind.",
      "* poke around. i'll comment on things. i can't help it.",
    ],
    random: [],
  },
  returning: {
    numbered: ["* oh. you're back.", "* i kept your file safe. right where you left it."],
    random: [],
  },
  logo: {
    numbered: [
      "* that's my logo! designed it myself.",
      "* it's supposed to look like a rune. does it?",
      "* took me like 50 iterations to get it right.",
    ],
    random: ["* if logos had IV stats, this one would be perfect."],
  },
  nickname: {
    numbered: [
      "* yep, that's my nickname.",
      "* primordial = ancient. rune = symbol. deep stuff, huh?",
      "* i came up with it when i was 14. still like it.",
    ],
    random: ["* you can call me omar though. or just... hey you.", "* it's super effective! ...wait, wrong game."],
  },
  name: {
    numbered: ["* that's me. hi.", "* the full name. very official."],
    random: ["* still me."],
  },
  title: {
    numbered: [
      "* that's what i do. design games.",
      "* sometimes they're even good. sometimes.",
      "* it's like architecture but more fun and less money.",
    ],
    random: ["* game designer used 'creative block'. it's not very effective..."],
  },
  japaneseText: {
    numbered: [
      "* ゲームデザイナー means 'game designer'. fancy, right?",
      "* i don't actually speak japanese fluently.",
      "* but the aesthetic is *chef's kiss*",
    ],
    random: ["* blame jrpgs for my obsession with kanji.", "* this reminds me of the elite four subtitle style."],
  },
  skills: {
    numbered: ["* my stats. no, you can't see my level.", "* strategy is maxed. pixel art is... trained."],
    random: ["* i'd trade a skill point for more sleep."],
  },
  contact: {
    numbered: ["* say hi! i read everything.", "* email for serious stuff. telegram for quick chats."],
    random: ["* go on. i don't bite."],
  },
  discover: {
    numbered: ["* ooh, feeling adventurous?", "* that button shows random projects. try it!"],
    random: ["* it's like a loot box but free and ethical.", "* it's like a mystery gift! but for projects."],
  },
  pause: {
    numbered: ["* paused. take your time.", "* the menu's all yours."],
    random: ["* back so soon?", "* menus are my favourite part of any game, honestly."],
  },
  background: {
    numbered: ["* you're exploring the void.", "* nothing here but vibes and pixels."],
    random: ["* i like that you're curious though.", "* maybe try the glowing things instead?"],
  },
  idle: {
    numbered: ["* still there?", "* you can click things, you know."],
    random: ["* i'll wait. i'm good at waiting."],
  },
  systems: {
    numbered: ["* board games. cardboard was my first language."],
    random: ["* systems again. good taste."],
  },
  worlds: {
    numbered: ["* videogames. each one comes in its own box."],
    random: ["* pick one up. they don't break."],
  },
  interfaces: {
    numbered: ["* menus and screens. the stuff nobody notices when it's done right."],
    random: ["* yes, i made this menu too."],
  },
  archives: {
    numbered: ["* the drawer of half-finished things. don't judge."],
    random: ["* game jams, mostly. sleep was optional."],
  },
};

const said: Record<string, number> = {};

export function nextLine(topic: string): string | null {
  const t = TOPICS[topic];
  if (!t) return null;
  const n = said[topic] ?? 0;
  said[topic] = n + 1;
  if (n < t.numbered.length) return t.numbered[n];
  if (!t.random.length) return null;
  return t.random[Math.floor(Math.random() * t.random.length)];
}

// Ask the narrator to react. `script` plays several lines in a row (the intros).
export function narrate(topic: string, opts: { script?: boolean } = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NARRATE_EVENT, { detail: { topic, script: Boolean(opts.script) } }));
}
