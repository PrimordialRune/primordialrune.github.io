// The five projects on the Record (objects and palettes; the copy lives in script.ts MANUALS). Only facts we have; unknown fields are left out, never guessed.

import type { Slug } from "./story";

export type ObjectKind = "gb-cart" | "cassette" | "cd" | "booster" | "gba-cart";

export interface Project {
  slug: Slug;
  title: string;
  /** katakana subtitle, always under its English (P5) */
  jp: string;
  kind: ObjectKind;
  /** what the object is, for screen readers */
  medium: string;
  /** the object's own declared palette (P4) */
  palette: string[];
}

export const OMAR_TODO = "[OMAR TO WRITE]";

export const PROJECTS: Project[] = [
  {
    slug: "galactic-news",
    title: "Galactic News",
    jp: "ギャラクティック・ニュース",
    kind: "gb-cart",
    medium: "Game Boy cartridge",
    palette: ["#291f23", "#bd502f", "#34d1af", "#f7ecb9"],

  },
  {
    slug: "crossfader",
    title: "Crossfader",
    jp: "クロスフェーダー",
    kind: "cassette",
    medium: "Cassette tape",
    palette: ["#ebc84a", "#f1ead6", "#e0459b", "#53b3c9", "#8233c4", "#2e2828"],

  },
  {
    slug: "haunt-record",
    title: "Haunt Record",
    jp: "ホーント・レコード",
    kind: "cd",
    medium: "CD",
    palette: ["#1f2c39", "#48a8a0", "#c3ccd1", "#eef2f4"],

  },
  {
    slug: "ptcg-cube",
    title: "PTCG Cube",
    jp: "キューブ",
    kind: "booster",
    medium: "Booster pack",
    palette: ["#1e3f8f", "#2b62a6", "#f2cf3f", "#efe9d6", "#c4392b"],

  },
  {
    slug: "project-minamoto",
    title: "Project Minamoto",
    jp: "プロジェクト・ミナモト",
    kind: "gba-cart",
    medium: "Game Boy Advance cartridge",
    palette: ["#7a0a96", "#e020c0", "#fbf8fb", "#4b4c56"],

  },
];

export const getProject = (slug: Slug) => PROJECTS.find((p) => p.slug === slug)!;
export const projectIndex = (slug: Slug) => PROJECTS.findIndex((p) => p.slug === slug);
export const neighbour = (slug: Slug, d: number) =>
  PROJECTS[(projectIndex(slug) + d + PROJECTS.length) % PROJECTS.length].slug;

export const CONTACTS = [
  { label: "Email", jp: "メール", value: "primordialrune@gmail.com", url: "mailto:primordialrune@gmail.com", copy: true },
  { label: "Telegram", jp: "テレグラム", value: "t.me/PrimordialRune", url: "https://t.me/PrimordialRune" },
  { label: "GitHub", jp: "ギットハブ", value: "github.com/PrimordialRune", url: "https://github.com/PrimordialRune" },
  { label: "Instagram", jp: "インスタグラム", value: "instagram.com/primordialrune", url: "https://instagram.com/primordialrune" },
];

export const SKILLS = ["Game Design", "Board Games", "RPGs", "UI/UX", "Pixel Art", "Strategy"];
export const INSPIRED_BY = ["Vital Lacerda", "Cole Wehrle", "Toby Fox", "Daniel Mullins", "Carl Chudyk", "Jesper Juul"];
export const FAVOURITES = [
  "Persona / SMT",
  "Pokémon (up to DS)",
  "Gris",
  "Undertale / Deltarune",
  "Ace Attorney",
  "Danganronpa",
  "Earthbound",
  "Hollow Knight",
];
