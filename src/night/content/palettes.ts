// Declared palettes (P4: counted colour). Every game screen and object on the Night Desk
// stays inside the list declared here; the reviewer checks the art against it.
//
// - `screen`: the exact tones a boot screen may show. No antialiasing, no overlays:
//   pixel screens are drawn at integer scale with nearest-neighbour sampling (P1).
// - `object`: base tones of a shell, label or print. Plastic gets light on top of these
//   (a lit gradient and a specular edge are light, not new hues), labels get print grain
//   inside the imagery only.
import type { ProjectId } from "../types";

export interface DeclaredPalette {
  /** What this palette is for */
  name: string;
  tones: readonly string[];
  /** Where the tones were taken from */
  source: string;
}

export const SCREEN_PALETTES: Record<"galactic-news" | "project-minamoto", DeclaredPalette> = {
  "galactic-news": {
    name: "Galactic News boot screen, 160x144",
    // exactly the four tones of the game's cover (counted pixel by pixel)
    tones: ["#291f23", "#bd502f", "#34d1af", "#f7ecb9"],
    source: "public/resources/desk/galactic-news-cover.png",
  },
  "project-minamoto": {
    name: "Project Minamoto boot screen, 240x160",
    // six tones sampled from the logo: white, lilac highlight, magenta rim, the two
    // purples of the katakana fill, and the brown-black outline
    // The boot field powers on in the lilac (tones[1]), never a full frame of pure white.
    tones: ["#ffffff", "#e6cdec", "#f500b8", "#85079d", "#55008b", "#40110a"],
    source: "public/resources/desk/minamoto-logo.png (median of each colour cluster)",
  },
};

export const OBJECT_PALETTES: Record<ProjectId, Record<string, DeclaredPalette>> = {
  "galactic-news": {
    cart: {
      name: "Small handheld cartridge shell",
      tones: ["#d3cdc2", "#aba496", "#958e80", "#6f685a", "#fbf9f4"],
      source: "src/night/desk/DeskArt.tsx (the desk object itself travels into the handheld)",
    },
    handheld: {
      name: "Generic portrait handheld (no wordmarks; own layout, Omar's logo pressed in)",
      // warm grey shell, charcoal bezel, buttons in the game's own red, stripes in its teal
      tones: ["#d9d3c7", "#b7b0a2", "#7d766a", "#3b3540", "#2a2530", "#bd502f", "#34d1af", "#1d1a1f"],
      source: "Shell drawn for the Night Desk; accents from the Galactic News screen palette",
    },
  },
  "project-minamoto": {
    cart: {
      name: "Widescreen handheld cartridge, label in the logo's palette",
      tones: ["#62636e", "#3a3b43", "#28292e", "#1f2025", "#fbf8fb", "#7a0a96", "#e020c0"],
      source: "src/night/desk/DeskArt.tsx (the desk object itself travels into the handheld)",
    },
    handheld: {
      name: "Generic landscape handheld (no wordmarks)",
      // smoked indigo shell picked to sit under the logo's purples
      tones: ["#544c86", "#4a4378", "#3d3669", "#332d5a", "#221d3d", "#26232f", "#8f89b3", "#c9c4e6", "#f500b8"],
      source: "Shell drawn for the Night Desk; accents from the Minamoto screen palette",
    },
  },
  crossfader: {
    cassette: {
      name: "Cassette shell and J-label",
      tones: ["#f8df72", "#ebc84a", "#d2a92f", "#8a6c17", "#f1ead6", "#e0459b", "#53b3c9", "#8233c4", "#2e2828", "#4a3226"],
      source: "src/night/desk/DeskArt.tsx Cassette (copied line for line, plus side B); label stripes from crossfader-logo.png",
    },
    walkman: {
      name: "Walkman body, lid and keys",
      tones: ["#3a3942", "#2b2a31", "#1c1b21", "#121116", "#e1e4e8", "#c9ccd2", "#a3a7b0", "#8e929b", "#6b6f78", "#5d616a", "#53b3c9", "#e0459b"],
      source: "Body drawn for the Night Desk; PLAY pink and stripe cyan from crossfader-logo.png",
    },
  },
  "haunt-record": {
    print: {
      name: "Disc print (the desk disc)",
      // the exact four tones of the crown and logo art (counted pixel by pixel), and the
      // desk disc's DISC 1 print
      tones: ["#1f2c39", "#eb5e54", "#fbde9c", "#48a9a6", "#48a8a0"],
      source: "haunt-record-crown.png and haunt-record-logo.png; src/night/desk/DeskArt.tsx Cd",
    },
    disc: {
      name: "Disc data side (the desk disc's rainbow)",
      tones: ["#c3ccd1", "#eef2f4", "#b9c3c9", "#e7d3ef", "#c4e5f0", "#d6efcc", "#f3eac6"],
      source: "src/night/desk/DeskArt.module.css .cdDisc conic gradient",
    },
    deck: {
      name: "CD deck, jewel case and tray",
      tones: ["#2e2e38", "#24242c", "#17171d", "#14141c", "#101018", "#3a3a46", "#c3ccd1", "#eef2f4", "#48a9a6"],
      source: "Deck drawn for the Night Desk; display teal from haunt-record-logo.png",
    },
  },
  "ptcg-cube": {
    pack: {
      name: "The desk's blue holo booster pack",
      tones: ["#1e3f8f", "#2b62a6", "#4eb99f", "#24509a", "#1a3678", "#0b1a3a", "#102f41", "#f2cf3f", "#13234f", "#fce8cd", "#b9ab92", "#ded3bd", "#b2a48a", "#9a8d74"],
      source: "src/night/desk/DeskArt.tsx Booster (copied line for line); the playmat photo appears as its window art",
    },
    card: {
      name: "The pulled card (WotC era) and the four dealt with it",
      tones: ["#f2cf3f", "#b8932c", "#efe9d6", "#1b1b1b", "#c4392b", "#c9a640", "#d9bd5c", "#b9ab88", "#3a3a3a", "#fff6cf"],
      source: "src/night/desk/DeskArt.tsx Booster (pulled card)",
    },
    mat: {
      name: "Playmat edge",
      tones: ["#151515", "#2e2e2e"],
      source: "ptcg-cube-playmat.jpg (black field); the playmat photo itself appears as artwork",
    },
  },
};
