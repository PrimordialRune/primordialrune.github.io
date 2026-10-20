// Studio A contracts. Frozen: builders read these, the lead changes them.

export type ObjectKind =
  | "trainer-card"
  | "booster"
  | "cassette"
  | "gb-cart"
  | "cd"
  | "gba-cart"
  | "deck-box"
  | "ds-card"
  | "floppy";

export type Shelf = "omar" | "systems" | "worlds" | "archives";

export interface Art {
  /** Relative to public/, no leading slash. Render through asset() */
  src: string;
  w: number;
  h: number;
  /** Pixel art: only ever shown at an integer scale, nearest neighbour */
  pixel: boolean;
  alt: string;
}

export interface Callout {
  /** Position on the shot in percent */
  x: number;
  y: number;
  text: string;
}

export interface Shot extends Art {
  caption?: string;
  callouts?: Callout[];
}

export interface GuideSection {
  heading: string;
  headingJp: string;
  body: string[];
}

export interface StudioProject {
  slug: string;
  title: string;
  titleJp: string;
  shelf: Shelf;
  kind: ObjectKind;
  medium: string;
  mediumJp: string;
  year?: number;
  role?: string;
  tools?: string[];
  team?: string;
  /** One line, Omar's voice */
  pitch: string;
  guide: GuideSection[];
  art: { title?: Art; label?: Art; shots: Shot[] };
  /** The object's own palette (P4), max 5 hex */
  palette: string[];
  links?: { label: string; url: string; note?: string }[];
  stub?: boolean;
}

/** Props every object drawing takes (ObjectArt.tsx) */
export interface ObjectArtProps {
  project: StudioProject;
  /** Width in CSS px; height follows the object's own aspect */
  size: number;
  /** For the cassette: which side faces out */
  side?: "A" | "B";
}

/**
 * transitions.ts exports:
 *   openTimeline(kind, objectEl, tvEl, soft): gsap.core.Timeline
 *     plays the medium's physical action (stepped frames at 12fps, half the frames in SOFT)
 *     and ends with the object "inside" the TV. Must be killable / progress(1)-able.
 *   liftFrame(el, lifted, soft): void   one stepped lift frame on shelf focus
 *   staticBurst(el, soft): void          <=300ms static overlay, no-op in SOFT
 */
