// The story state: types, initial state, reducer, act transition rules and selectors.
// Shapes follow the Studio B concept (section 7). script.ts imports Act and Slug from here.

export type Act = 0 | 1 | 2 | 3 | 4;
export type Slug = "crossfader" | "galactic-news" | "haunt-record" | "ptcg-cube" | "project-minamoto";
export type View =
  | { kind: "power" }
  | { kind: "title"; peek?: boolean }
  | { kind: "hub" }
  | { kind: "record"; focus: Slug }
  | { kind: "load"; slug: Slug; eject?: boolean }
  | { kind: "manual"; slug: Slug }
  | { kind: "about"; side: "omar" | "utsushi" }
  | { kind: "contact" }
  | { kind: "ending" }
  | { kind: "void" };

export type Flag =
  | "peeked" | "tabReturned" | "frameRefused" | "askedQuestion" | "lastSeenFlipped"
  | "revealPlayed" | "stayChosen" | "misdatePlayed";

export interface Story {
  v: 1;
  act: Act;
  mode: "story" | "direct";
  opened: Slug[];                 // unique, in order
  flags: Flag[];
  logoPokes: number;
  activeSeconds: number;
  visits: number;
  seen: Record<string, number>;   // narration cursor per script key
  endings: number;
  archive: { playSeconds: number; endedAt: number }[];  // past runs → corrupted files on TITLE
  updatedAt: number;
}

export type StoryEvent =
  | { type: "BOOT"; continued: boolean }
  | { type: "OPEN"; slug: Slug } | { type: "CLOSE"; slug: Slug }
  | { type: "LOGO" } | { type: "TICK"; seconds: number }
  | { type: "TAB_HIDDEN" } | { type: "TAB_RETURN" }
  | { type: "PEEK" } | { type: "QUESTION" } | { type: "LAST_SEEN" }
  | { type: "CHOICE"; choice: "yes" | "stay" } | { type: "HUB_ENTER" }
  | { type: "SET_MODE"; mode: Story["mode"] } | { type: "NEW_GAME" };

// Builder additions (kept outside the spec's union so the writer's types stay as specified)
export type EngineEvent = StoryEvent | { type: "FLAG"; flag: Flag } | { type: "DEBUG_ACT"; act: Act };

export const SLUGS: Slug[] = ["galactic-news", "crossfader", "haunt-record", "ptcg-cube", "project-minamoto"];

export function initialStory(): Story {
  return {
    v: 1,
    act: 0,
    mode: "story",
    opened: [],
    flags: [],
    logoPokes: 0,
    activeSeconds: 0,
    visits: 0,
    seen: {},
    endings: 0,
    archive: [],
    updatedAt: Date.now(),
  };
}

const has = (s: Story, f: Flag) => s.flags.includes(f);
const addFlag = (s: Story, f: Flag): Story => (has(s, f) ? s : { ...s, flags: [...s.flags, f] });

/** Manuals opened since the visitor came back to the tab in act 1 (rule 1 → 2) */
interface Extra {
  openedAtReturn?: number;
}

function step(s: Story & Extra, e: EngineEvent): Story & Extra {
  switch (e.type) {
    case "BOOT":
      return { ...s, visits: s.visits + 1 };
    case "OPEN":
      return s.opened.includes(e.slug) ? s : { ...s, opened: [...s.opened, e.slug] };
    case "CLOSE":
      return s;
    case "LOGO":
      return { ...s, logoPokes: s.logoPokes + 1 };
    case "TICK":
      return { ...s, activeSeconds: s.activeSeconds + e.seconds };
    case "TAB_HIDDEN":
      return s;
    case "TAB_RETURN":
      if (s.act !== 1 || has(s, "tabReturned")) return s;
      return { ...addFlag(s, "tabReturned"), openedAtReturn: s.opened.length };
    case "PEEK":
      return addFlag(s, "peeked");
    case "QUESTION":
      return addFlag(s, "askedQuestion");
    case "LAST_SEEN":
      return s.act === 2 ? addFlag(s, "lastSeenFlipped") : s;
    case "CHOICE":
      if (s.act !== 3) return s;
      return e.choice === "yes" ? { ...s, act: 4 } : addFlag(s, "stayChosen");
    case "HUB_ENTER":
      return s.act === 3 && has(s, "stayChosen") ? { ...s, act: 4 } : s;
    case "SET_MODE":
      return { ...s, mode: e.mode };
    case "NEW_GAME":
      return {
        ...initialStory(),
        mode: "story",
        visits: s.visits,
        endings: s.endings,
        archive: s.archive,
      };
    case "FLAG":
      return addFlag(s, e.flag);
    case "DEBUG_ACT":
      // ?ab review panel only: jump to an act as if its rules had fired
      return { ...s, act: e.act, mode: "story", flags: e.act < 3 ? s.flags.filter((f) => f !== "revealPlayed" && f !== "stayChosen") : s.flags };
  }
}

/** Section 2's transition rules: the first matching rule wins, never in DIRECT mode, never down */
export function nextAct(s: Story & Extra): Act {
  if (s.mode === "direct") return s.act;
  const n = s.opened.length;
  switch (s.act) {
    case 0:
      if (n >= 2 || (has(s, "peeked") && n >= 1) || s.logoPokes >= 3 || s.activeSeconds >= 120) return 1;
      return 0;
    case 1:
      if (
        s.opened.includes("haunt-record") ||
        n >= 4 ||
        (has(s, "tabReturned") && s.openedAtReturn !== undefined && n > s.openedAtReturn) ||
        s.activeSeconds >= 360
      )
        return 2;
      return 1;
    case 2:
      if (has(s, "askedQuestion") || n >= 5 || has(s, "lastSeenFlipped")) return 3;
      return 2;
    default:
      return s.act;
  }
}

export function reduce(prev: Story, e: EngineEvent): Story {
  // Act changes are only ever applied by these rules (or the CHOICE / HUB_ENTER ending rule)
  let s = step(prev as Story & Extra, e);
  if (s.mode === "story") {
    // rules cascade one act per event at most, so every act plays its own moment
    const a = nextAct(s);
    if (a > s.act) s = { ...s, act: a };
  }
  if (s.act === 4 && prev.act !== 4) {
    s = {
      ...s,
      endings: s.endings + 1,
      archive: [...s.archive, { playSeconds: Math.round(s.activeSeconds), endedAt: Date.now() }].slice(-4),
    };
  }
  if (s === prev) return prev;
  return { ...s, updatedAt: Date.now() };
}

// ---------- selectors ----------

export const nameTag = (act: Act) => (["OMAR", "0MAR", "0M4R", "UTSUSHI", ""] as const)[act];
export const nameTagLabel = (act: Act) =>
  (["Omar", "Omar", "Omar, corrupted", "Utsushi", ""] as const)[act];

export interface Command {
  id: "works" | "about" | "contact" | "question" | "yes" | "stay";
  en: string;
  jp: string;
}

export function commands(s: Story): Command[] {
  if (s.act === 3 && has(s, "revealPlayed") && !has(s, "stayChosen"))
    return [
      { id: "yes", en: "YES", jp: "イエス" },
      { id: "stay", en: "STAY", jp: "ステイ" },
    ];
  const his = s.act >= 2 && s.mode === "story";
  const list: Command[] = [
    { id: "works", en: his ? "HIS WORKS" : "MY WORKS", jp: "ワークス" },
    { id: "about", en: his ? "ABOUT HIM" : "ABOUT ME", jp: "プロフィール" },
    { id: "contact", en: "CONTACT", jp: "コンタクト" },
  ];
  if (s.act === 2 && s.mode === "story") list.push({ id: "question", en: "QUESTION", jp: "クエスチョン" });
  return list;
}

/** The logo's inner shape, per act */
export type LogoFill = "original" | "rim" | "half" | "red" | "gone";
export const logoFill = (act: Act): LogoFill => (["original", "rim", "half", "red", "gone"] as const)[act];

export const loadLabel = (s: Story) => (s.act === 2 && s.mode === "story" ? "PLAY HIS GAME" : "LOAD");

export function hasProgress(s: Story) {
  return s.act > 0 || s.opened.length > 0 || s.activeSeconds >= 20;
}

export function formatPlaytime(seconds: number) {
  // minutes:seconds, like a handheld's play time
  const t = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
