// The shelf: Omar first (the Trainer Card), then every project in its own medium.
// Copy comes from the writer's script.ts (manuals, profile). Facts only: anything the
// script marks "[TODO Omar: ...]" is left out of the rendered site until Omar fills it.

import type { Art, GuideSection, ObjectKind, Shelf, Shot, StudioProject } from "@/studio/types";
import {
  manuals as SCRIPT_MANUALS,
  profile,
  ui,
  type Fact as ScriptFact,
  type GuideChapter,
  type Manual,
  type ManualSlug,
  type Shot as ScriptShot,
} from "./script";

const TODO = /\[TODO Omar[^\]]*\]/g;
const hasTodo = (s: string) => /\[TODO Omar|^\[.*\]$/.test(s);
const clean = (s: string) => s.replace(TODO, "").replace(/\s{2,}/g, " ").trim();
const rel = (src: string) => src.replace(/^\/+/, "");

/* Lead's facts from Omar's device (assets.md addendum, crossfader-itch-page.md). They
   replace the matching [TODO Omar] items; nothing here goes beyond those sources. */
const CF = "/resources/studio-a/crossfader/";
const cfShot = (file: string, alt: string, caption: string): ScriptShot => ({ src: CF + file, w: 1280, h: 720, pixel: false, alt, caption });
const cfShots = {
  title: cfShot("title-screen.png", "Crossfader title screen: a turntable with a record, a cassette, the Crossfader logo and a SIDE A! badge, with QUIT and PLAY", "The title screen. Left and right pick the tape, F flips the record."),
  a: cfShot("side-a.png", "Side A: the room seen from above, a grid of teal and magenta tiles, the player and a note", "Side A shows the room from above: walk, find the way, spot what's hidden."),
  b: cfShot("side-b.png", "Side B: the same room from the side, the player standing on a platform under a gold cassette", "Side B shows it from the side: run, jump and dash."),
  hyper: cfShot("hyper-mode.png", "Hyper-mode: the room in 3D on a cyan grid under a purple sky", "Hyper-mode: the room turns 3D for one short hyper track."),
  sub: cfShot("hyper-subwoofer.png", "Hyper-mode with a subwoofer block next to the player", "Walk into a subwoofer to push it one block."),
};
const HR = "/resources/studio-a/haunt-record/";
const hrShots = {
  ui: { src: HR + "ui-test.jpg", w: 1280, h: 720, pixel: false, alt: "In-game UI test: a dark streaked corridor, a portrait and the line Oh? You need some help? Don't look at me, I'm here just to see slaughtering", caption: "A UI test: a voice that comments while you hunt." },
  textbox: { src: HR + "textbox.jpg", w: 1280, h: 720, pixel: false, alt: "Textbox system test: Hello hunter, I'm COR, the funny voice that loves to talk to your mind!", caption: "The textbox system test. COR introduces itself." },
  timeline: { src: HR + "timeline.png", w: 806, h: 376, pixel: false, alt: "Timeline: Summer 2021, first prototype: 3+ enemies, 1 main area, random map generation, dice roll attack", caption: "Summer 2021: the first prototype." },
} satisfies Record<string, ScriptShot>;
const CP = "/resources/studio-a/cremisi-portals/";
const cpShots = {
  title: { src: CP + "title-screen.png", w: 480, h: 270, pixel: false, alt: "Cremisi Portals title screen: the logo over a purple starfield, with START and OPTIONS", caption: "The title screen." },
  save: { src: CP + "save-menu.jpg", w: 720, h: 405, pixel: false, alt: "The save menu: player Omar, location Cava Eureka, PokéDex 100, and the team", caption: "The save menu." },
} satisfies Record<string, ScriptShot>;

const lbl = (en: string, jp: string) => ({ en, jp });
const fact = (en: string, jp: string, value: string): ScriptFact => ({ label: lbl(en, jp), value });

const OVERRIDES: Partial<Record<ManualSlug, Partial<Manual>>> = {
  crossfader: {
    oneLine: "One room, two sides, one half-remembered song. A puzzle platformer made for Castle Game Jam.",
    facts: [
      fact("Made for", "イベント", "Castle Game Jam (theme: cross-over)"),
      fact("Engine", "エンジン", "Godot 4.7"),
      fact("Genre", "ジャンル", "Puzzle platformer"),
      fact("Levels", "ステージ", "CMY, Bass Drop"),
    ],
    shots: [cfShots.title, cfShots.a, cfShots.b, cfShots.hyper, cfShots.sub],
    sections: [
      {
        id: "story",
        kind: "chapter",
        number: 1,
        title: lbl("The story so far", "ストーリー"),
        body: [
          "Crossfader is a puzzle platformer about a girl searching for a song she half-remembers.",
          "Every tape has two sides, and you only ever hear one at a time. Every level is one room you can read in two ways, and the song comes back one layer at a time.",
        ],
        shots: [cfShots.title],
      },
      {
        id: "controls",
        kind: "chapter",
        number: 2,
        title: lbl("Controls", "そうさほうほう"),
        body: ["Keyboard or gamepad. On the title screen, Left and Right pick the tape, Enter or Space plays, F flips the record."],
        list: [
          fact("Move", "いどう", "WASD / arrow keys (left stick or D-pad). AZERTY: ZQSD"),
          fact("Jump", "ジャンプ", "Space (A), in Side B and Hyper-mode. In Side B, W / Up also jumps"),
          fact("Dash", "ダッシュ", "Shift (RB), in Side B and Hyper-mode"),
          fact("Flip", "うらがえす", "F (Y): Side A / Side B"),
          fact("Hyper-mode", "ハイパー", "X (X) with a full gauge; press again to stop early and keep the rest"),
          fact("Pause", "ポーズ", "P / Esc (Start)"),
        ],
      },
      {
        id: "walkthrough",
        kind: "walkthrough",
        number: 3,
        title: lbl("Walkthrough", "こうりゃく"),
        body: [
          "Step 1. Read the room on Side A, from above: walk around, find the way, spot what's hidden. No jumping here.",
          "Step 2. Flip to Side B, from the side: run, jump and dash. What blocks you on one side might be a step on the other.",
          "Step 3. Watch for the rings. Things you collect exist on one side only; where something waits on the other side, a small ring pulses on the beat in that side's colour, cyan for Side A, magenta for Side B. The gold cassette that ends the level shows through as a faint ghost.",
          "Step 4. Pick up five Inspirations, the notes, to fill the Walkman gauge, then press X for Hyper-mode: the room turns 3D for one short hyper track. It sets up the solution and never solves it for you: nothing can be collected in 3D.",
          "Step 5. Walk into a subwoofer to push it one block. Find the three cassettes: the first two bring back layers of the song, the third ends the track.",
          "Tip: in Bass Drop, Inspirations come back 15 seconds after you take them. Falling off the room restarts it.",
        ],
        shots: [cfShots.a, cfShots.b, cfShots.hyper, cfShots.sub],
      },
      {
        id: "design-notes",
        kind: "designNotes",
        title: lbl("Design notes", "デザインノート"),
        body: [
          "The jam's theme was cross-over, so the room crosses over between two readings: a top-down puzzle and a side-on platformer. Flipping the tape is the main verb, and it can never be a plain fade.",
          "Hyper-mode is the reward for paying attention, not a shortcut: it shows you the room in 3D so you can reach new spots, but nothing can be collected there.",
          "It's a jam build made for playtesting, with two levels for now: CMY and Bass Drop.",
        ],
      },
      {
        id: "credits",
        kind: "credits",
        title: lbl("Credits", "クレジット"),
        body: [],
        list: [fact("Design", "デザイン", "Omar Golinelli"), fact("Made for", "イベント", "Castle Game Jam"), fact("Engine", "エンジン", "Godot 4.7")],
      },
    ],
  },
  "haunt-record": {
    facts: [
      fact("Genre", "ジャンル", "Dungeon crawler"),
      fact("First prototype", "プロトタイプ", "Summer 2021"),
      fact("Graphics", "グラフィック", "With Edoardo Zuliani"),
    ],
    shots: [hrShots.textbox, hrShots.ui, hrShots.timeline],
    sections: [
      {
        id: "story",
        kind: "chapter",
        number: 1,
        title: lbl("The story so far", "ストーリー"),
        body: [
          "Most dungeon crawlers tell you you're the hero. Haunt Record keeps a record of what you actually did down there.",
          "You are a hunter. A voice called COR talks to your mind, and it is not on your side.",
        ],
        shots: [hrShots.textbox],
      },
      {
        id: "walkthrough",
        kind: "walkthrough",
        number: 2,
        title: lbl("Walkthrough", "こうりゃく"),
        body: [
          "The first prototype, in summer 2021, set the core: three or more enemies, one main area, a randomly generated map and a dice-roll attack.",
        ],
        shots: [hrShots.ui, hrShots.timeline],
      },
      {
        id: "design-notes",
        kind: "designNotes",
        title: lbl("Design notes", "デザインノート"),
        body: [
          "The question behind the game is complicity. A crawler usually makes every action feel justified, because the dungeon is there to be cleared. I wanted the player to finish and realise they had been part of the problem, without the game ever lecturing them.",
          "That only works if the player chose everything themselves, so the game stays quiet and lets the record speak.",
        ],
      },
      {
        id: "credits",
        kind: "credits",
        title: lbl("Credits", "クレジット"),
        body: [],
        list: [fact("Design", "デザイン", "Omar Golinelli"), fact("Graphics", "グラフィック", "With Edoardo Zuliani"), fact("First prototype", "プロトタイプ", "Summer 2021")],
      },
    ],
  },
  "cremisi-portals": {
    facts: [fact("Plot", "シナリオ", "Vin_Prism"), fact("Build", "バージョン", "Demo v1.1.3"), fact("Note", "ちゅうい", "Fan game")],
    cover: cpShots.title,
    shots: [cpShots.title, cpShots.save],
    sections: [
      {
        id: "story",
        kind: "chapter",
        number: 1,
        title: lbl("The story so far", "ストーリー"),
        body: ["A Pokémon fan game, released as a demo (v1.1.3), with its plot written by Vin_Prism."],
        shots: [cpShots.title, cpShots.save],
      },
      {
        id: "credits",
        kind: "credits",
        title: lbl("Credits", "クレジット"),
        body: [],
        list: [fact("Plot", "シナリオ", "Vin_Prism")],
      },
    ],
  },
};

const manuals = Object.fromEntries(
  Object.entries(SCRIPT_MANUALS).map(([slug, m]) => [slug, { ...m, ...(OVERRIDES[slug as ManualSlug] ?? {}) }]),
) as Record<ManualSlug, Manual>;

const cleanFacts = (list: readonly ScriptFact[] = []) => list.filter((f) => !hasTodo(f.value) && !hasTodo(f.label.en));
const cleanShot = (s: ScriptShot): Shot => ({
  src: rel(s.src),
  w: s.w,
  h: s.h,
  pixel: s.pixel,
  alt: s.alt,
  caption: s.caption,
  callouts: s.callouts?.map((c) => ({ x: c.x, y: c.y, text: c.text })),
});

export interface CleanChapter extends Omit<GuideChapter, "shots" | "list"> {
  list: readonly ScriptFact[];
  shots: Shot[];
}

/** The strategy guide for a slug, [TODO Omar] items removed. Guide.tsx can read chapters
 *  (kind: chapter | walkthrough | designNotes | credits, number, shots) from here. */
export function guideFor(slug: string) {
  const m = manuals[slug as ManualSlug];
  if (!m) return null;
  const chapters: CleanChapter[] = m.sections
    .map((c) => ({
      ...c,
      body: c.body.map(clean).filter((p) => p && !/^\[.*\]$/.test(p) && !/:\s*$/.test(p)),
      list: cleanFacts(c.list),
      shots: (c.shots ?? []).map(cleanShot),
    }))
    .filter((c) => c.body.length || c.list.length || c.shots.length);
  return {
    title: m.title,
    titleJp: m.titleJp,
    medium: m.medium,
    oneLine: clean(m.oneLine),
    facts: cleanFacts(m.facts),
    cover: m.cover ? cleanShot(m.cover) : undefined,
    shots: (m.shots ?? []).map(cleanShot),
    chapters,
  };
}

function guideFrom(slug: string): GuideSection[] {
  return (guideFor(slug)?.chapters ?? []).map((c) => ({
    heading: c.title.en,
    headingJp: c.title.jp,
    body: [...c.body, ...c.list.map((f) => `${f.label.en}: ${f.value}`)],
  }));
}

/** The guide's facts with TODO values removed, for the info card */
export function factsFor(slug: string): { label: string; labelJp: string; value: string }[] {
  return (guideFor(slug)?.facts ?? []).map((f) => ({ label: f.label.en, labelJp: f.label.jp, value: f.value }));
}

const art = (src: string, w: number, h: number, pixel: boolean, alt: string): Art => ({ src, w, h, pixel, alt });
const S = "resources/studio-a/";

interface Extra {
  shelf: Shelf;
  kind: ObjectKind;
  year?: number;
  role?: string;
  tools?: string[];
  team?: string;
  /** title: the TV title screen; label: the art printed on the object */
  title?: Art;
  label?: Art;
  palette: string[];
}

const EXTRA: Record<string, Extra> = {
  "ptcg-cube": {
    shelf: "systems",
    kind: "booster",
    palette: ["#1a1819", "#545252", "#ffffff"],
    title: art(S + "ptcg-cube/playmat.jpg", 640, 372, false, "The PTCG Cube playmat: black, with topographic lines and labelled zones"),
    label: art(S + "ptcg-cube/playmat.jpg", 640, 372, false, "Playmat art on the booster foil"),
  },
  crossfader: {
    shelf: "worlds",
    kind: "cassette",
    tools: ["Godot 4.7"],
    palette: ["#f4de32", "#7934c3", "#30cbd0", "#110c1d", "#d2508f"],
    title: art(S + "crossfader/title-screen.png", 1280, 720, false, "Crossfader title screen: a turntable, a cassette and the Crossfader logo"),
    label: art(S + "crossfader/logo.png", 509, 149, false, "Crossfader logo on the J-card"),
  },
  "galactic-news": {
    shelf: "worlds",
    kind: "gb-cart",
    year: 2023,
    tools: ["Godot"],
    palette: ["#291f23", "#bd502f", "#34d1af", "#f7ecb9"],
    title: art(S + "galactic-news/title-screen.png", 160, 144, true, "Title screen: THE GALACTIC NEWS, a menu with Play, Settings, Credits and Quit, and the post ship"),
    // boot-cart-11.png actually shows the logo + ship starfield (file names are swapped)
    label: art(S + "galactic-news/boot-cart-11.png", 160, 144, true, "The Galactic News logo and ship on a starfield, on the cartridge label"),
  },
  "haunt-record": {
    shelf: "worlds",
    kind: "cd",
    year: 2021,
    team: "Graphics with Edoardo Zuliani",
    palette: ["#202c39", "#eb5e55", "#fcde9c", "#48a9a6"],
    title: art(S + "haunt-record/logo.png", 420, 288, false, "Haunt Record logo: spiky coral HAUNT over a teal RECORD banner"),
    label: art(S + "haunt-record/crown-icon.png", 160, 160, false, "A coral and cream flame crown on navy, printed on the disc"),
  },
  "project-minamoto": {
    shelf: "worlds",
    kind: "gba-cart",
    palette: ["#65028b", "#8b05a0", "#ffffff", "#b560c2", "#40100a"],
    title: art(S + "project-minamoto/logo.png", 420, 185, false, "Logo: ポケットモンスター in purple with a magenta 源 tag, POCKET MONSTERS underneath"),
    label: art(S + "project-minamoto/logo.png", 420, 185, false, "The Minamoto logo on the cartridge label"),
  },
  holon: {
    shelf: "archives",
    kind: "deck-box",
    tools: ["Unity"],
    palette: ["#1d1a2f", "#e8e4d8", "#c8a24a", "#6b5ca5"],
  },
  "cremisi-portals": {
    shelf: "archives",
    kind: "ds-card",
    palette: ["#241e41", "#3c2e76", "#d10053", "#91007b", "#ffffff"],
    title: art(S + "cremisi-portals/title-screen.png", 480, 270, false, "Cremisi Portals title screen: the logo over a purple starfield, with START and OPTIONS"),
    label: art(S + "cremisi-portals/title-screen.png", 480, 270, false, "Cremisi Portals logo on the game card label"),
  },
  spacerim: {
    shelf: "archives",
    kind: "floppy",
    tools: ["Godot"],
    palette: ["#14182b", "#8fa3c7", "#e9e4d4", "#c9a66b"],
  },
};

/** Real object media, in shelf order (Home Sweet Dungeon stays off until confirmed) */
const ORDER = ["ptcg-cube", "crossfader", "galactic-news", "haunt-record", "project-minamoto", "holon", "cremisi-portals", "spacerim"];

const omar: StudioProject = {
  slug: "omar",
  title: profile.name,
  titleJp: profile.nameJp,
  shelf: "omar",
  kind: "trainer-card",
  medium: profile.object.en,
  mediumJp: profile.object.jp,
  role: profile.class.en,
  pitch: profile.bio[0],
  guide: [{ heading: "About", headingJp: "プロフィール", body: [...profile.bio] }],
  art: { shots: [] },
  palette: ["#fce8cd", "#102f41", "#ec563b", "#fadb68", "#339999"],
  links: profile.contact.map((c) => ({ label: c.label.en, url: c.href, note: c.note })),
};

export const projects: StudioProject[] = [
  omar,
  ...ORDER.map((slug): StudioProject => {
    const m = manuals[slug as ManualSlug];
    const x = EXTRA[slug];
    const g = guideFor(slug)!;
    return {
      slug,
      title: m.title,
      titleJp: m.titleJp,
      shelf: x.shelf,
      kind: x.kind,
      medium: m.medium.en,
      mediumJp: m.medium.jp,
      year: x.year,
      role: x.role,
      tools: x.tools,
      team: x.team,
      pitch: g.oneLine,
      guide: guideFrom(slug),
      art: { title: x.title, label: x.label, shots: g.shots.length ? g.shots : g.cover ? [g.cover] : [] },
      palette: x.palette,
      stub: m.stub ? true : undefined,
    };
  }),
];

/** Projects that count toward "n/8 OPENED" */
export const works = projects.filter((p) => p.slug !== "omar");

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);

export function nextWork(slug: string): StudioProject {
  const i = works.findIndex((p) => p.slug === slug);
  return works[(i + 1) % works.length];
}

export const SHELF_GROUPS: { id: Shelf; label: string; jp: string }[] = (["omar", "systems", "worlds", "archives"] as const).map((id) => ({
  id,
  label: ui.shelf[id].en.toUpperCase(),
  jp: ui.shelf[id].jp,
}));

export { profile };
