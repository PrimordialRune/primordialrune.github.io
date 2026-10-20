// The manuals' content. FACTS ONLY: everything here comes from lib/desk.ts, the team memory
// or what the real assets in public/resources/desk show. Anything we don't know is left out
// of the page and listed in `todo` (collected in CONTENT_TODO for the reviewer and Omar).
//
// Katakana subtitles are real words only (P5): Story ストーリー, How to Play あそびかた,
// Design Notes デザインノート, Credits クレジット, Making Of メイキング.

import type { ProjectId } from "../types";

export interface ManualSection {
  en: string;
  jp: string;
  body: string[];
}

export interface ManualImage {
  /** path under public/, always rendered through asset() */
  src: string;
  alt: string;
  /** pixel art: integer scale only, nearest-neighbour (P1) */
  pixel?: boolean;
  /** native size in image pixels */
  w?: number;
  h?: number;
  /**
   * Anti-aliased art with a pixel-styled part (the Crossfader logo): never a fractional
   * scale, so 1x when it fits, otherwise exactly 1/2 (then 1/3...).
   */
  fit?: "halves";
}

/** The cover's accents, in the game's own declared palette (cover only, P4) */
export interface CoverPalette {
  paper: string;
  ink: string;
  accent: string;
  accent2: string;
}

export interface NightProject {
  id: ProjectId;
  title: string;
  titleJp: string;
  medium: string;
  /** the object itself in plain words ("cartridge", "cassette"), for announcements */
  objectName: string;
  /** the device the object goes into, as the manual names it */
  deviceName: string;
  year?: number;
  pitch: string;
  credits?: string;
  tools?: string[];
  sections: ManualSection[];
  /** Crossfader only: side B, "Making Of" */
  sideB?: ManualSection[];
  images?: ManualImage[];
  /** the cover art; images[0] when absent */
  cover: ManualImage;
  coverPalette: CoverPalette;
  /** what Omar still has to give us; never shown on the page */
  todo: string[];
}

export const SECTION_LABELS = {
  story: { en: "Story", jp: "ストーリー" },
  play: { en: "How to Play", jp: "あそびかた" },
  notes: { en: "Design Notes", jp: "デザインノート" },
  credits: { en: "Credits", jp: "クレジット" },
  making: { en: "Making Of", jp: "メイキング" },
} as const;

const S = SECTION_LABELS;

export const PROJECTS: Record<ProjectId, NightProject> = {
  "galactic-news": {
    id: "galactic-news",
    title: "Galactic News",
    titleJp: "ギャラクティック・ニュース",
    medium: "Handheld cartridge (160 × 144)",
    objectName: "cartridge",
    deviceName: "handheld",
    year: 2023,
    pitch: "My GBJAM 11 entry, made in Godot: four colours, 160 × 144 pixels.",
    tools: ["Godot"],
    cover: {
      src: "resources/desk/galactic-news-cover.png",
      alt: "Title screen: THE GALACTIC NEWS above a small ship in a starfield, in four colours.",
      pixel: true,
      w: 160,
      h: 144,
    },
    coverPalette: { paper: "#f7ecb9", ink: "#291f23", accent: "#bd502f", accent2: "#34d1af" },
    sections: [
      {
        ...S.notes,
        body: [
          "I made Galactic News for GBJAM 11, in 2023. The jam asks for an old handheld's limits: a 160 × 144 screen and four colours, nothing more.",
          "My four are the PAL_SPACE palette: #291f23, #bd502f, #34d1af and #f7ecb9. Every pixel on the cover above is one of them. They sit very close to the colours of this desk, which is not a coincidence.",
        ],
      },
    ],
    todo: [
      "Galactic News: the premise in Omar's words (who flies the ship on the title screen, what the news is). There is no Story section until then.",
      "Galactic News: how to play (controls, goal, length).",
      "Galactic News: Omar's role and any teammates.",
      "Galactic News: a link to the jam page or a playable build.",
      "Galactic News: gameplay screenshots (only the title screen is in the repo).",
    ],
  },

  "project-minamoto": {
    id: "project-minamoto",
    title: "Project Minamoto",
    titleJp: "プロジェクト・ミナモト",
    medium: "Handheld cartridge, widescreen (240 × 160)",
    objectName: "cartridge",
    deviceName: "handheld",
    pitch: "A Pokémon fan game that re-reads Generation 1 on a 240 × 160 handheld screen.",
    cover: {
      src: "resources/desk/minamoto-logo.png",
      alt: "Project Minamoto logo: ポケットモンスター in purple lettering with the kanji 源, over POCKET MONSTERS.",
      w: 420,
      h: 185,
    },
    coverPalette: { paper: "#fbf8fb", ink: "#2a0a35", accent: "#7a0a96", accent2: "#e020c0" },
    sections: [
      {
        ...S.notes,
        body: [
          "I went back to the first generation and gave it a wider canvas: the 240 × 160 screen of a later handheld, instead of the 160 × 144 the original games shipped on.",
          "The logo keeps the original ポケットモンスター lettering and adds one kanji, 源 (minamoto), which means “source”.",
        ],
      },
      { ...S.credits, body: ["A fan project. Pokémon and its names belong to their owners."] },
    ],
    todo: [
      "Project Minamoto: what changes in the re-reading (story, regions, mechanics).",
      "Project Minamoto: how to play, status of the build (demo? in progress?).",
      "Project Minamoto: year(s) and tools.",
      "Project Minamoto: in-game screenshots at 240 × 160.",
      "Project Minamoto: confirm the kanji 源 is meant as “the source” (the manual only gives the dictionary meaning).",
    ],
  },

  crossfader: {
    id: "crossfader",
    title: "Crossfader",
    titleJp: "クロスフェーダー",
    medium: "Cassette tape",
    objectName: "cassette",
    deviceName: "walkman",
    pitch: "A game jam game about cassettes: a music puzzle in three views.",
    cover: {
      src: "resources/desk/crossfader-logo.png",
      alt: "Crossfader logo: CROSS in pixel letters with a cassette in the O, FADER on a lightning bolt.",
      w: 509,
      h: 149,
      fit: "halves",
    },
    coverPalette: { paper: "#f1ead6", ink: "#2e2828", accent: "#e0459b", accent2: "#53b3c9" },
    sections: [
      {
        ...S.play,
        body: [
          "Flip the side, remix the song. Turning the cassette over is the move: side A and side B are the mechanic, not decoration, and the puzzle plays out across three views.",
          "Try it here. The switch below turns the tape over in the walkman, and this manual turns with it.",
        ],
      },
    ],
    sideB: [
      {
        ...S.making,
        body: [
          "I made Crossfader for a game jam, and the cassette came before the puzzle. The first things I built were two 3D models, a cassette player and a cassette, each with an idle animation and a transition.",
          "The mood board set one rule early: a flip is never a plain fade. You are holding the tape when the side changes, so the change has to feel physical. This manual keeps the same rule.",
        ],
      },
    ],
    todo: [
      "Crossfader: which jam, which year, the theme, and the team (no Credits section until then).",
      "Crossfader: what the three views are.",
      "Crossfader: the story premise in Omar's words (side A has no Story section yet).",
      "Crossfader: tools/engine.",
      "Crossfader: screenshots or a capture of the cassette player models; link to a playable build.",
    ],
  },

  "haunt-record": {
    id: "haunt-record",
    title: "Haunt Record",
    titleJp: "ホーント・レコード",
    medium: "Compact disc",
    objectName: "CD",
    deviceName: "disc player",
    pitch: "A dungeon crawler where the player is complicit.",
    credits: "Graphics with Edoardo Zuliani",
    cover: {
      src: "resources/desk/haunt-record-logo.png",
      alt: "Haunt Record logo: HAUNT in coral and cream jagged letters over a teal RECORD banner.",
      w: 420,
      h: 288,
    },
    coverPalette: { paper: "#202c39", ink: "#fcde9c", accent: "#eb5e55", accent2: "#48a9a6" },
    images: [
      {
        src: "resources/desk/haunt-record-crown.png",
        alt: "The Haunt Record crown icon: a cream flame inside a coral crown on dark blue.",
        w: 160,
        h: 160,
      },
    ],
    sections: [
      {
        ...S.notes,
        body: [
          "The crown is the game's icon: a cream flame inside a coral crown. The logo on the cover uses the same coral, cream and teal, so the disc, the booklet and the icon read as one record.",
        ],
      },
    ],
    todo: [
      "Haunt Record: how the player is complicit (the core twist, in Omar's words). There is no Story section until then.",
      "Haunt Record: how to play, platform, engine, year.",
      "Haunt Record: Omar's role vs Edoardo Zuliani's; any other credits.",
      "Haunt Record: real design notes (the current section only describes the crown icon and logo colours).",
      "Haunt Record: gameplay screenshots.",
    ],
  },

  "ptcg-cube": {
    id: "ptcg-cube",
    title: "PTCG Cube",
    titleJp: "キューブ",
    medium: "Booster pack",
    objectName: "booster pack",
    deviceName: "playmat",
    pitch: "A cube format for the Pokémon TCG, with Roguelike and Co-op modes.",
    cover: {
      src: "resources/desk/ptcg-cube-playmat.jpg",
      alt: "The PTCG Cube playmat: Active, Bench (ベンチ), Side, Deck and Trash zones in white on black.",
      w: 640,
      h: 372,
    },
    coverPalette: { paper: "#1b1b1b", ink: "#fce8cd", accent: "#f2cf3f", accent2: "#2b62a6" },
    sections: [
      {
        ...S.play,
        body: [
          "A cube is a fixed, curated pool of cards that players draft from instead of bringing their own decks. PTCG Cube is that format for the Pokémon Trading Card Game.",
          "It comes with two modes, Roguelike and Co-op. The playmat on the cover lays out the table: Active, Bench (ベンチ), Side, Deck and Trash.",
        ],
      },
      {
        ...S.notes,
        body: [
          "Like Project Minamoto, it starts from a game I love and re-reads it: the Pokémon TCG, played through a format it never shipped with.",
        ],
      },
      { ...S.credits, body: ["A fan project. Pokémon and the Pokémon TCG belong to their owners."] },
    ],
    todo: [
      "PTCG Cube: the rules of the Roguelike and Co-op modes.",
      "PTCG Cube: card pool size and era, how the draft works.",
      "PTCG Cube: year; whether Omar designed the playmat (it carries the PRIMORDIALRUNE mark) and a story/premise section if any.",
      "PTCG Cube: photos of a real table session.",
    ],
  },
};

export const CONTACT_LINKS = [
  { id: "email", label: "Email", jp: "メール", value: "primordialrune@gmail.com", href: "mailto:primordialrune@gmail.com" },
  { id: "telegram", label: "Telegram", jp: "テレグラム", value: "@PrimordialRune", href: "https://t.me/PrimordialRune" },
  { id: "github", label: "GitHub", jp: "ギットハブ", value: "PrimordialRune", href: "https://github.com/PrimordialRune" },
] as const;

export const CONTACT_EMAIL = "primordialrune@gmail.com";

/** Everything still missing, for the reviewer and Omar. Never rendered on the page. */
export const CONTENT_TODO: string[] = [
  ...Object.values(PROJECTS).flatMap((p) => p.todo),
  "About: confirm the abstract portrait (omar-portrait-gb.png, 36 × 48, four tones) is fine to publish as the notebook's self-portrait.",
  "About: where Omar is based and Omar's current role or studio (not confirmed, so not stated).",
  "About: a short bio in Omar's own words to replace the drafted one (including the line about re-reading games Omar loves).",
  "Card: confirm the role line 'Game designer' and whether to add a portfolio/itch.io link.",
];
