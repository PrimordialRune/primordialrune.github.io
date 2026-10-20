// The Desk: Omar's real projects as physical objects sitting on the CRT glass (P3: each
// project arrives in its own medium, built from its own assets). Only facts we have are
// written here; anything unknown (most years) is left out rather than guessed.

import type { Project } from "@/types/project";

export type DeskObjectKind = "cassette" | "gb-cart" | "cd" | "booster" | "gba-cart";

export interface DeskProject {
  slug: string;
  title: string;
  /** Katakana subtitle (P5: always under its English, never alone) */
  titleJp: string;
  sectionId: string;
  kind: DeskObjectKind;
  /** What the object is, for screen readers and captions */
  medium: string;
  year?: number;
  pitch: string;
  credits?: string;
  /** The narrator's comment in the right-click menu: lowercase, starts with "* " */
  narrator: string;
}

export const deskProjects: DeskProject[] = [
  {
    slug: "ptcg-cube",
    title: "PTCG Cube",
    titleJp: "キューブ",
    sectionId: "systems",
    kind: "booster",
    medium: "Booster pack",
    pitch: "A cube format for the Pokémon TCG, with Roguelike and Co-op modes.",
    narrator: "* roguelike or co-op? i always end up playing both.",
  },
  {
    slug: "crossfader",
    title: "Crossfader",
    titleJp: "クロスフェーダー",
    sectionId: "worlds",
    kind: "cassette",
    medium: "Cassette tape",
    pitch: "A game jam game about cassettes: a music puzzle in three views. Flip the side, remix the song.",
    narrator: "* open it. i made this one in a weekend.",
  },
  {
    slug: "galactic-news",
    title: "Galactic News",
    titleJp: "ギャラクティック・ニュース",
    sectionId: "worlds",
    kind: "gb-cart",
    medium: "Game Boy cartridge",
    year: 2023,
    pitch: "A GBJAM 11 entry for the Game Boy, made in Godot: four colours, 160 × 144 pixels.",
    narrator: "* four colours. i counted them twice.",
  },
  {
    slug: "haunt-record",
    title: "Haunt Record",
    titleJp: "ホーント・レコード",
    sectionId: "worlds",
    kind: "cd",
    medium: "CD",
    pitch: "A dungeon crawler where the player is complicit.",
    credits: "Graphics with Edoardo Zuliani",
    narrator: "* careful with this one. it keeps a record of you.",
  },
  {
    slug: "project-minamoto",
    title: "Project Minamoto",
    titleJp: "プロジェクト・ミナモト",
    sectionId: "worlds",
    kind: "gba-cart",
    medium: "Game Boy Advance cartridge",
    pitch: "A Pokémon fan game that re-reads Generation 1 on the GBA.",
    narrator: "* gen 1, again. i never really left kanto.",
  },
];

export function getDeskProjects(sectionId: string): DeskProject[] {
  return deskProjects.filter((p) => p.sectionId === sectionId);
}

/** The narrator's line under the desk, per section, before anything is touched */
export const deskIntro: Record<string, { pointer: string; touch: string }> = {
  systems: {
    pointer: "* rules first. drag it, right-click it, i won't mind.",
    touch: "* rules first. tap it, hold it, i won't mind.",
  },
  worlds: {
    pointer: "* everything here is mine. drag, select, right-click. you know how this works.",
    touch: "* everything here is mine. tap, drag, hold. you know how this works.",
  },
};

export const deskEmptyLine = "* nothing here yet. i'm still making it.";

/** Right-click on bare glass */
export const deskGlassLine = "* that's just the glass. nothing under it. i checked.";

/** The narrator's comment on a multiple selection */
export function deskMultiLine(count: number): string {
  if (count === 2) return "* you picked two. bold.";
  if (count === 3) return "* three at once? greedy. i like that.";
  if (count === 4) return "* all four. you really want to get to know me.";
  return "* everything. okay. take your time.";
}

// The modal's view of a desk object until each project gets its own case study page
const DESK_IMAGES: Record<string, string> = {
  crossfader: "/resources/desk/crossfader-logo.png",
  "galactic-news": "/resources/desk/galactic-news-cover.png",
  "haunt-record": "/resources/desk/haunt-record-logo.png",
  "project-minamoto": "/resources/desk/minamoto-logo.png",
  "ptcg-cube": "/resources/desk/ptcg-cube-playmat.jpg",
};

export function deskProjectAsProject(p: DeskProject): Project {
  return {
    slug: p.slug,
    title: p.title,
    titleJp: p.titleJp,
    shortDescription: p.pitch,
    year: p.year ? String(p.year) : "",
    role: "",
    tools: [],
    category: p.sectionId as Project["category"],
    images: DESK_IMAGES[p.slug] ? [DESK_IMAGES[p.slug]] : [],
    abstract: [p.medium, p.credits].filter(Boolean).join(". ") + ".",
  };
}
