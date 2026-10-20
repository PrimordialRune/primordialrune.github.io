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

/**
 * The hardware each object loads into (LOAD view, objects/players.tsx). Like the objects, each
 * player is lit and keeps to its own declared palette (P4); no player colour is used elsewhere.
 */
export const PLAYER_PALETTES = {
  /** Game Boy (DMG): warm grey plastic, dark bezel, magenta A/B */
  dmg: {
    shellTop: "#d3cdc2",
    shellBottom: "#aba496",
    edge: "#6f685a",
    slot: "#3c3830",
    lip: "#f2eee6",
    specular: "#fbf9f4",
    screenOff: "#958e80",
    screenLine: "#5e584c",
    pad: "#3c3830",
    buttons: "#8b1d48",
    pill: "#958e80",
    led: "#bd502f",
  },
  /** Game Boy Advance: dark grey shell, the cart's own purple on the buttons */
  gba: {
    shellTop: "#62636e",
    shellBottom: "#3a3b43",
    edge: "#1f2025",
    shoulder: "#4b4c56",
    glass: "#28292e",
    slot: "#1f2025",
    lip: "#c9cad3",
    buttons: "#7a0a96",
  },
  /** Cassette deck: brown-black face, cream keys, the tape's purple on the window rim */
  deck: {
    faceTop: "#4a3f3f",
    faceBottom: "#2e2828",
    edge: "#1d1818",
    rim: "#8233c4",
    key: "#d9d2c4",
    specular: "#a89c9c",
  },
  /** CD player: brushed silver lid, the disc's navy and teal on tray and display */
  cd: {
    lidLight: "#eef2f4",
    lidMid: "#c3ccd1",
    lidDark: "#b9c3c9",
    edge: "#7d878d",
    tray: "#1f2c39",
    trayWell: "#18232e",
    trayEdge: "#0f1820",
    display: "#48a8a0",
  },
} as const;

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
