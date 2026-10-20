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
    tones: ["#ffffff", "#e6cdec", "#f500b8", "#85079d", "#55008b", "#40110a"],
    source: "public/resources/desk/minamoto-logo.png (median of each colour cluster)",
  },
};

export const OBJECT_PALETTES: Record<ProjectId, Record<string, DeclaredPalette>> = {
  "galactic-news": {
    cart: {
      name: "GB-style cartridge shell",
      tones: ["#d3cdc2", "#aba496", "#958e80", "#6f685a", "#fbf9f4"],
      source: "src/components/desk/DeskArt.tsx (desk object)",
    },
    handheld: {
      name: "Generic portrait handheld (no wordmarks)",
      // warm grey shell, charcoal bezel, buttons in the game's own red, stripes in its teal
      tones: ["#d9d3c7", "#b7b0a2", "#7d766a", "#3b3540", "#2a2530", "#bd502f", "#34d1af", "#1d1a1f"],
      source: "Shell drawn for the Night Desk; accents from the Galactic News screen palette",
    },
  },
  "project-minamoto": {
    cart: {
      name: "GBA-style cartridge, label in the logo's palette",
      tones: ["#62636e", "#3a3b43", "#28292e", "#ffffff", "#85079d", "#f500b8"],
      source: "src/components/desk/DeskArt.tsx; label tones from the Minamoto screen palette",
    },
    handheld: {
      name: "Generic landscape handheld (no wordmarks)",
      // smoked indigo shell picked to sit under the logo's purples
      tones: ["#4a4378", "#332d5a", "#221d3d", "#26232f", "#c9c4e6", "#e6cdec", "#f500b8"],
      source: "Shell drawn for the Night Desk; accents from the Minamoto screen palette",
    },
  },
  crossfader: {
    cassette: {
      name: "Cassette shell and J-label",
      tones: ["#ebc84a", "#d2a92f", "#8a6c17", "#f1ead6", "#e0459b", "#53b3c9", "#8233c4", "#2e2828", "#4a3226"],
      source: "src/components/desk/DeskArt.tsx; label stripes from crossfader-logo.png",
    },
    walkman: {
      name: "Walkman body, lid and keys",
      tones: ["#2b2a31", "#1c1b21", "#c9ccd2", "#8e929b", "#53b3c9", "#e0459b", "#f1ead6"],
      source: "Body drawn for the Night Desk; PLAY pink and stripe cyan from crossfader-logo.png",
    },
  },
  "haunt-record": {
    print: {
      name: "Disc print and booklet",
      tones: ["#181830", "#1f2c39", "#d84848", "#f06048", "#f0d890", "#48a890"],
      source: "haunt-record-crown.png and haunt-record-logo.png (colour clusters)",
    },
    deck: {
      name: "CD deck, jewel case and tray",
      tones: ["#24242c", "#17171d", "#3a3a46", "#14141c", "#c3ccd1", "#48a890"],
      source: "Deck drawn for the Night Desk; display teal from haunt-record-logo.png",
    },
  },
  "ptcg-cube": {
    pack: {
      name: "Booster pack, cards and foil (monochrome, like the playmat)",
      tones: ["#151515", "#1f1f1f", "#2e2e2e", "#8c8c8c", "#d8d8d8", "#ffffff", "#4eb99f"],
      source: "ptcg-cube-playmat.jpg (black field, white line art, grey motifs); teal foil glint",
    },
  },
};
