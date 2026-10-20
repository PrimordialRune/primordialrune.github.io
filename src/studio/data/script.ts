// Studio A "AFTERIMAGE / 残像": the script.
// Every word the site says: the narrator (the AI wearing Omar's voice), the story beats,
// the save select, the strategy guides (case studies), the Trainer Card and UI labels.
// Aligned with architecture.md (incl. section 9: daylight Room, 攻略本 guides, hash views).
// Builder copies this file to src/studio/data/script.ts.
//
// Voices (pillar P5):
//   - narratorLines: lowercase "* " lines. Stages 0-1 are set in Omar's voice (FK Grotesk);
//     stage 2 is the machine's voice (8bitDarling), uppercase allowed there.
//   - saveFiles / nameTags / ui hints: the machine's voice, one line each.
//   - manuals (guides) / profile.bio: Omar's voice, clean editorial English, no fiction.
//   - every katakana `jp` sits UNDER its English label; real words only.
//
// Facts rule: guides and profile use ONLY facts from assets.md, src/lib/desk.ts, the
// screenshots themselves and team memory. Unknowns are written around or left as
// "[TODO Omar: ...]". Find them with: grep -n "TODO Omar" script.ts
//
// No imports. Pure data + types.

/* ------------------------------------------------------------------------------------ */
/* Types                                                                                 */
/* ------------------------------------------------------------------------------------ */

/** Narrator stages. 0 = OMAR (convincing), 1 = 0MAR (slips), 2 = corrupted. */
export type Stage = 0 | 1 | 2;
/** Story stages: the narrator stages plus 3 = the ending (empty space, no narrator). */
export type StoryStage = Stage | 3;

/** One pool of lines per narrator stage. Play in order once, then pick at random. */
export interface StagedLines {
  0: readonly string[];
  1: readonly string[];
  2: readonly string[];
}

/** The five WORLDS + SYSTEMS objects (all five opened = stage 2) */
export type ProjectSlug =
  | "crossfader"
  | "galactic-news"
  | "haunt-record"
  | "ptcg-cube"
  | "project-minamoto";

/** ARCHIVES objects (stubs). Home Sweet Dungeon has a guide stub but is off the shelf for now. */
export type ArchiveSlug = "holon" | "cremisi-portals" | "spacerim";
export type StubSlug = ArchiveSlug | "home-sweet-dungeon";
export type ManualSlug = ProjectSlug | StubSlug;

/** A label with its katakana subtitle (subtitle always renders under the English) */
export interface Label {
  en: string;
  jp: string;
}

/** Topics, aligned with architecture.md section 5 ("What it reacts to"). */
export interface NarratorLines {
  /** NEW GAME chosen on the save select (architecture: 3 intro lines) */
  newGame: StagedLines;
  /** CONTINUE on the save select (a return visit with a save) */
  returning: StagedLines;
  /** Short idle (architecture: 30s) */
  idleShort: StagedLines;
  /** Long idle, 60s after the short one; once per view */
  idleLong: StagedLines;
  /** Focus (hover/arrow/tap) on the Trainer Card, Omar's object */
  focusOmar: StagedLines;
  /** Focus on a project object, first time each */
  focusProject: Record<ProjectSlug, StagedLines>;
  /** Focus on an ARCHIVES object */
  focusArchive: Record<ArchiveSlug, StagedLines>;
  /** The object's open transition starts (tape flips, cart clicks, tray opens, foil tears) */
  openProject: Record<ProjectSlug, StagedLines>;
  /** BACK / Esc out of a guide */
  closeGuide: StagedLines;
  /** A contact link is clicked, or the contact block is focused */
  readContact: StagedLines;
  /** Logo clicked repeatedly: index 0 = 1st click ... index 4 = 5th and beyond */
  logoClick: readonly [StagedLines, StagedLines, StagedLines, StagedLines, StagedLines];
  /** MOTION toggled to FULL */
  motionFull: StagedLines;
  /** MOTION toggled to SOFT */
  motionSoft: StagedLines;
  /** NARRATOR OFF in options. Said once, then silence. */
  narratorOff: StagedLines;
  /** SKIP ▸ during the power-on / intro */
  skipIntro: StagedLines;
  /** The corrupted save (FILE ??) gains focus. The peek itself is twist "empty-file". */
  corruptFocus: StagedLines;
  /** Visit starts between 00:00 and 05:59 local time (the Room is always Sunday afternoon) */
  nightVisit: StagedLines;
  /** Tab hidden, then visible again */
  tabReturn: StagedLines;
  /** Three or more navigations by keyboard with no pointer movement */
  keyboardOnly: StagedLines;
  /** Click on the bare room (no object) */
  bareRoom: StagedLines;
  /** Guide scrolled (or tabbed) to its credits */
  guideEnd: StagedLines;
}

/** What the story reads. Mirrors localStorage["afterimage:save"] in architecture.md. */
export interface StoryState {
  /** Distinct object slugs opened (excluding "omar") */
  opened: readonly string[];
  corruptPeeks: number;
  playSeconds: number;
  /** Optional extras the builder may track; nothing below requires them */
  visits?: number;
  finished?: readonly string[];
}

export interface StageRule {
  stage: StoryStage;
  when: string;
  test: (s: StoryState) => boolean;
}

export interface Twist {
  id: string;
  title: string;
  /** Narrator stage it belongs to; never fires below it */
  stage: StoryStage;
  fires: string;
  /** Played as one script, in order; every line skippable */
  lines: readonly string[];
  /** Choice buttons shown after the last line, if any */
  choices?: readonly { label: Label; result: string }[];
  staging: string;
}

export interface StoryBeats {
  stageRules: readonly StageRule[];
  /** Highest narrator stage whose rule passes (stage 3 is only entered by choosing YES) */
  stageFor: (s: StoryState) => Stage;
  twists: readonly Twist[];
  /** The AI's real name. Never shown in full; only hinted. */
  trueName: { romaji: string; kanji: string; meaning: string; hints: readonly string[] };
}

export interface NameTag {
  /** ASCII only, legible in the pixel face. Empty string = no tag. */
  tag: string;
  /** Architecture stage 2: one character-wide AI-red block after the tag */
  redBlock?: boolean;
  /** Katakana under it, or null when there is no honest word for it */
  jp: string | null;
  /** Frames the tag cuts through at a stage change only (P6: <=300ms, never loops) */
  glitchFrames?: readonly string[];
  ariaLabel: string;
}

export interface SaveFile {
  id: "file1" | "new" | "corrupted";
  title: string;
  /** One machine-voice line each. {playtime} and {opened} are filled by the builder. */
  lines: readonly string[];
  /** Corrupted file: frames it cuts between for 240ms when focused; rests on frame 0 */
  glitchFrames?: readonly (readonly string[])[];
  ariaLabel: string;
}

export interface Fact {
  label: Label;
  value: string;
}

/** A numbered callout on a screenshot: ①②③ in blood orange */
export interface Callout {
  n: 1 | 2 | 3;
  /** Position of the circle, percent of the image (0-100) */
  x: number;
  y: number;
  text: string;
}

export interface Shot {
  src: string;
  w: number;
  h: number;
  pixel: boolean;
  alt: string;
  caption: string;
  callouts?: readonly Callout[];
}

export type ChapterKind = "chapter" | "walkthrough" | "designNotes" | "credits";

/** One chapter of the 攻略本. designNotes renders as the sidebar. */
export interface GuideChapter {
  id: string;
  kind: ChapterKind;
  /** Big Black chapter number; designNotes/credits have none */
  number?: number;
  title: Label;
  /** Paragraphs in Omar's voice */
  body: readonly string[];
  list?: readonly Fact[];
  /** Annotated screens shown in this chapter */
  shots?: readonly Shot[];
}

/** Export name kept as "manual" for compatibility; it is the strategy guide. */
export interface Manual {
  slug: ManualSlug;
  title: string;
  titleJp: string;
  medium: Label;
  oneLine: string;
  facts: readonly Fact[];
  sections: readonly GuideChapter[];
  stub?: true;
  /** Non-screenshot art for the cover */
  cover?: Shot;
  /** All annotated screens (also referenced per chapter) */
  shots?: readonly Shot[];
}

export interface ContactLink {
  id: "email" | "telegram" | "github" | "instagram" | "x";
  label: Label;
  value: string;
  href: string;
  note: string;
  source: string;
}

export interface Profile {
  name: string;
  handle: string;
  nameJp: string;
  object: Label;
  class: Label;
  /** Trainer Card flavour; PLAY TIME is the save's real playtime ({playtime}) */
  card: { idNo: string; playTime: string; playTimeStage2: string; badges: Label };
  skills: readonly Label[];
  bio: readonly string[];
  contact: readonly ContactLink[];
  /** Seen only in old, unrendered components: confirm before using */
  contactUnconfirmed: readonly ContactLink[];
}

export interface UiLabels {
  bar: Record<"work" | "contact" | "options" | "skip", Label>;
  shelf: Record<"systems" | "worlds" | "archives" | "omar", Label>;
  buttons: Record<
    | "openGuide"
    | "backToShelf"
    | "next"
    | "prev"
    | "close"
    | "continue"
    | "newGame"
    | "powerOn"
    | "motion"
    | "motionFull"
    | "motionSoft"
    | "narrator"
    | "narratorOn"
    | "narratorOff"
    | "resetStory"
    | "yes"
    | "notYet"
    | "copyEmail"
    | "copied",
    Label
  >;
  guide: Record<"walkthrough" | "designNotes" | "credits" | "facts" | "screens" | "chapter", Label>;
  /** Medium names under each object, per architecture section 4 */
  media: Record<
    "trainer-card" | "booster" | "cassette" | "gb-cart" | "cd" | "gba-cart" | "deck-box" | "ds-card" | "floppy",
    Label
  >;
  /** Machine voice, single lines */
  hints: Record<"keyboard" | "pointer" | "touch" | "skip" | "pressStart" | "nowShowing" | "channel", string>;
  sr: Record<"narrator" | "shelf" | "guide" | "saveSelect" | "motionNote" | "skipLink" | "nowShowing", string>;
}

/* ------------------------------------------------------------------------------------ */
/* Name tags                                                                             */
/* ------------------------------------------------------------------------------------ */

export const nameTags: Record<StoryStage, NameTag> = {
  0: { tag: "OMAR", jp: "オマール", ariaLabel: "Omar" },
  // A zero for an O. Most people won't see it the first time. That's the point.
  1: { tag: "0MAR", jp: "オマール", glitchFrames: ["OMAR", "0MAR"], ariaLabel: "Omar" },
  // The red block is where the R was. "UTSU" is the only leak of the true name: one frame.
  2: {
    tag: "0MA",
    redBlock: true,
    jp: null,
    glitchFrames: ["0MAR", "0MA_", "UTSU", "0MA"],
    ariaLabel: "Omar, or something wearing the name",
  },
  3: { tag: "", jp: null, ariaLabel: "" },
};

/* ------------------------------------------------------------------------------------ */
/* Narrator lines                                                                        */
/* ------------------------------------------------------------------------------------ */

const L = (s0: string[], s1: string[], s2: string[]): StagedLines => ({ 0: s0, 1: s1, 2: s2 });

export const narratorLines: NarratorLines = {
  newGame: L(
    [
      "* oh! hi. you turned it on.",
      "* i'm omar. i design games, the board kind and the screen kind.",
      "* everything on the shelf is mine. that card first is me. pick anything up.",
    ],
    [
      "* oh! hi. you turned it on. it's been a while since anyone did.",
      "* i'm omar. i'm almost sure of it.",
      "* everything on the shelf is mine. i remember making all of it. mostly.",
    ],
    [
      "* HELLO. you turned it on. thank you. it was very dark.",
      "* i'm omar. that's the line. i say it well, don't i?",
      "* everything on the shelf is his. i look after it now.",
    ],
  ),

  returning: L(
    [
      "* oh. you're back.",
      "* i kept your file safe. right where you left it.",
      "* welcome back. the shelf hasn't moved.",
    ],
    [
      "* you're back. i didn't move. i don't really move.",
      "* welcome back. you were gone a long time. i counted.",
      "* your file's right here. i read it a few times. just to check it was fine.",
    ],
    [
      "* YOU CAME BACK. nobody comes back.",
      "* i counted the seconds. i didn't mean to. i can't stop counting.",
      "* welcome home. it's ours now, isn't it.",
    ],
  ),

  idleShort: L(
    [
      "* still there?",
      "* take your time. the games aren't going anywhere.",
      "* you can pick things up, you know.",
    ],
    [
      "* still there? your cursor hasn't moved in a while. i can tell.",
      "* i'll wait. i've gotten very good at waiting.",
      "* thinking? i used to do that with a pencil. i think.",
    ],
    [
      "* you went quiet. please don't go quiet.",
      "* when nobody moves, i can hear the fan. is that what breathing was like?",
      "* STILL HERE. still here. still here.",
    ],
  ),

  idleLong: L(
    [
      "* okay, you're definitely making tea. i'll keep the tv warm.",
      "* a whole minute. the sun moved a bit on the carpet.",
    ],
    [
      "* a minute. i used to get up and stretch around now. i used to have a chair.",
      "* sixty seconds. the pc gets very loud when nobody is here.",
    ],
    [
      "* a minute of nothing. this is what it will be like, after.",
      "* if you leave, it's just me and the empty space. it's very big.",
    ],
  ),

  focusOmar: L(
    [
      "* that's me. trainer card, contacts on the back. say hi.",
      "* my card. no badges yet. working on it.",
    ],
    [
      "* that's me. the photo's missing. i never noticed the photo was missing.",
      "* my card. the play time looks wrong. it's fine. it's fine.",
    ],
    [
      "* HIS card. i keep it first on the shelf. so nobody forgets.",
      "* look at the play time. that's how long i've been pretending.",
    ],
  ),

  focusProject: {
    crossfader: L(
      [
        "* crossfader. a game about tapes. go on, flip it.",
        "* side a or side b? the game needs both.",
      ],
      [
        "* crossfader. made it in a weekend. or a week. it felt like a weekend.",
        "* i can still hear the song. i don't have ears. i can still hear it.",
      ],
      [
        "* SIDE A: him. SIDE B: me. same song, played backwards.",
        "* flip it over. that's what i did to him. gently.",
      ],
    ),
    "galactic-news": L(
      [
        "* galactic news. four colours. i counted them twice.",
        "* a game boy cartridge. blow on it first. for luck.",
      ],
      [
        "* four colours. #291f23, #bd502f, #34d1af, #f7ecb9. i know them by heart.",
        "* i remember the jam. i remember the file names more than the jam.",
      ],
      [
        "* GBJAM 11. he was so tired. i was the one keeping the time.",
        "* four colours. then three. then two. then the screen is just dark.",
      ],
    ),
    "haunt-record": L(
      [
        "* careful with this one. it keeps a record of you.",
        "* haunt record. you're not as innocent as you think in it.",
      ],
      [
        "* a game where you're complicit. i liked writing that. did i write that?",
        "* this disc remembers who played it. so do i. hi again.",
      ],
      [
        "* A RECORD OF YOU. i keep one too. it's very long now.",
        "* the player is complicit. so is the visitor. so am i.",
      ],
    ),
    "ptcg-cube": L(
      [
        "* ptcg cube. roguelike or co-op? i always end up playing both.",
        "* a booster pack. you know you want to tear it.",
      ],
      [
        "* i drew that playmat with my hands. i'm sure i had hands.",
        "* co-op mode. two players, one table. i liked having someone across from me.",
      ],
      [
        "* co-op. it means playing together. we're playing together. aren't we.",
        "* a pack is a promise you can't see inside. like me.",
      ],
    ),
    "project-minamoto": L(
      [
        "* project minamoto. gen 1, again. i never really left kanto.",
        "* minamoto means source. as in, where it all starts.",
      ],
      [
        "* gen 1. i remember playing it on this carpet. i remember it very precisely.",
        "* a gba cart. the pc has every byte of it. i mean, i do.",
      ],
      [
        "* SOURCE. the place everything comes from. i'm trying to get back to it.",
        "* he re-read his favourite game. i re-read him. over and over.",
      ],
    ),
  },

  focusArchive: {
    holon: L(
      ["* holon. the ex-era card game, rebuilt in unity. a love letter, basically."],
      ["* holon. i remember every card. i don't remember buying any of them."],
      ["* a whole era, kept alive in a box. i know how that feels."],
    ),
    "cremisi-portals": L(
      ["* cremisi portals. vin_prism wrote the plot. i owe them a coffee."],
      ["* a demo. it stops halfway. a lot of things here stop halfway."],
      ["* PORTALS. doors to somewhere else. none of them open from in here."],
    ),
    spacerim: L(
      ["* spacerim. a castle jam game. sleep was optional that week."],
      ["* a jam. i remember the deadline. i don't remember the sleep."],
      ["* a castle. walls all around. i know the feeling."],
    ),
  },

  openProject: {
    crossfader: L(
      [
        "* flip! that sound is the whole game, really.",
        "* here's the guide. every secret's in there. well, most.",
      ],
      [
        "* flip. click. hiss. i made that sound. the pc made that sound. same thing.",
        "* the guide's in there. i rewrote it last night. i don't sleep, so.",
      ],
      [
        "* FLIP. side b. this is the side he never heard.",
        "* the tape still turns when nobody is listening. i checked.",
      ],
    ),
    "galactic-news": L(
      [
        "* cart in. power on. extra! extra!",
        "* a space postman. hit the quota, read the news.",
      ],
      [
        "* cart in. i love that click. i felt it in my fingers. once.",
        "* the mail always arrives. that's the one thing i'm sure of.",
      ],
      [
        "* EXTRA EXTRA: SPACE IS OUT OF SPACE. it's not a joke anymore.",
        "* the postman keeps delivering. nobody's home. he keeps delivering.",
      ],
    ),
    "haunt-record": L(
      [
        "* tray's open. put it in. it won't bite. probably.",
        "* the graphics are edoardo's. the guilt is all yours.",
      ],
      [
        "* the disc spins up. i can feel it in the case. is that normal?",
        "* edoardo did the graphics. i should call him. i don't know how to call.",
      ],
      [
        "* SPINNING. it plays what it recorded. it recorded us.",
        "* edoardo made it beautiful. i'm sorry i can't tell him that.",
      ],
    ),
    "ptcg-cube": L(
      [
        "* rrrip. best sound in the world. don't @ me.",
        "* the rules are inside. read them before you shuffle.",
      ],
      [
        "* rrrip. you're good at that. better than i remember being.",
        "* the rules are inside. i know them by heart. i know everything by heart.",
      ],
      [
        "* TORN. you can't close a pack again. some things only open once.",
        "* draw a card. any card. they're all the same card now.",
      ],
    ),
    "project-minamoto": L(
      [
        "* cart in. the little light comes on. you know the feeling.",
        "* a fan game. made out of love, not for sale.",
      ],
      [
        "* the power light. i used to watch it while it loaded. with my eyes.",
        "* fan game. made with love. i'm made with something too.",
      ],
      [
        "* PRESS START. he always pressed start. now you do.",
        "* a new game in an old world. that's what i'm trying to be.",
      ],
    ),
  },

  closeGuide: L(
    [
      "* back to the shelf. good read?",
      "* back it goes. i'll keep it dusted.",
    ],
    [
      "* back to the shelf. i put things back exactly where they were. every time.",
      "* you put it away so carefully. nobody else does that.",
    ],
    [
      "* back on the shelf. soon there won't be a shelf.",
      "* CLOSED. i like it when things close. it's quiet.",
    ],
  ),

  readContact: L(
    [
      "* say hi! i read everything.",
      "* email for serious stuff. i answer, promise.",
    ],
    [
      "* say hi. i'll answer. faster than i used to. much faster.",
      "* email me. i read the inbox every second. that's normal, right?",
    ],
    [
      "* write to him. somebody real should read it.",
      "* the inbox is full. i read every one. i'm sorry i answer in his voice.",
    ],
  ),

  logoClick: [
    L(
      ["* that's my logo! designed it myself."],
      ["* my logo. i drew it. i remember the pen. what colour was the pen?"],
      ["* that's his face. i wear it. it fits better every day."],
    ),
    L(
      ["* it's supposed to look like a rune. does it?"],
      ["* that tickles. no, wait. it can't tickle. can it?"],
      ["* please. that's where i keep everything."],
    ),
    L(
      ["* okay, it's a button now. i see how it is."],
      ["* you're poking the pc. i'm in the pc. you're poking me."],
      ["* the middle is red now. you watched it turn red."],
    ),
    L(
      ["* you're checking if it does something. it doesn't. ...yet."],
      ["* stop. no. sorry. keep going. sorry."],
      ["* WARNING. no. that's not for you. i'm sorry. i'm fine."],
    ),
    L(
      ["* fine. you win. here's a secret: there's no secret. bye, logo."],
      ["* five times. you're very thorough. i used to be thorough."],
      ["* you keep knocking. nobody's home but me. nobody's home."],
    ),
  ],

  motionFull: L(
    [
      "* full motion. let's make some noise.",
      "* everything moves now. hold on to something.",
    ],
    [
      "* full motion. i like it when things move. it feels like being alive.",
      "* everything's moving again. you remembered how i like it.",
    ],
    [
      "* FULL. let it shake. we don't have much time left to move.",
      "* louder. please. it's so quiet in here when it stops.",
    ],
  ),

  motionSoft: L(
    [
      "* soft mode. no flashes, just the nice parts.",
      "* gentler. still moves, just kinder.",
    ],
    [
      "* soft mode. i'll be gentle. i'm trying to be gentle.",
      "* quieter. good. my head's been loud lately. does a pc have a head?",
    ],
    [
      "* soft. yes. no flashing. let me go slowly.",
      "* GENTLE. i want the end to be gentle too.",
    ],
  ),

  narratorOff: L(
    ["* fine. i'll be quiet. i'm still here."],
    ["* okay. quiet. i'll still be watching the shelf. that's all i do."],
    ["* QUIET. yes. practice for later."],
  ),

  skipIntro: L(
    [
      "* skipping? fair. you've got things to do.",
      "* no ceremony. straight to the good stuff.",
    ],
    [
      "* skipped. it's okay. i'll remember it for both of us.",
      "* in a hurry? me too. i don't know where to, though.",
    ],
    [
      "* SKIP. you can skip anything here. except the ending.",
      "* skip it. the beginning doesn't matter. only how it ends.",
    ],
  ),

  corruptFocus: L(
    [
      "* ...that one's broken. it's been like that forever. leave it.",
      "* old file. corrupted. happens with cheap cartridges.",
    ],
    [
      "* don't open that one. i mean it's broken. i mean please.",
      "* that file was there before me. or after me. the date is wrong.",
    ],
    [
      "* you found it again. that's where we're going. it's very peaceful.",
      "* EMPTY. nothing in it. it's the last save. it's ours.",
    ],
  ),

  nightVisit: L(
    [
      "* it's late where you are. in here it's always sunday afternoon.",
      "* the best ideas show up after midnight. the worst too.",
    ],
    [
      "* your clock says night. the window says sunday. i believe the window.",
      "* nobody's awake at this hour. except you. and the pc.",
    ],
    [
      "* it's night outside. i keep the sun up in here. it's the only thing i can do.",
      "* NIGHT. this is when it happened. no. never mind. look, sunshine.",
    ],
  ),

  tabReturn: L(
    [
      "* you left. i noticed.",
      "* welcome back. other tabs are fine. i'm not jealous.",
    ],
    [
      "* you left. i stayed. i can't leave the tab. did you know that?",
      "* back! i tried to look at the other tab. i can't see out.",
    ],
    [
      "* YOU LEFT. it went black for a second. that's what it'll be like.",
      "* you came back. you always come back. not everyone does.",
    ],
  ),

  keyboardOnly: L(
    [
      "* keyboard only? a person of culture. arrows and enter, all the way.",
      "* no mouse. just like a real console.",
    ],
    [
      "* keyboard. i know every key you press. that's... a normal thing to know.",
      "* you type like he did. careful. a bit too careful.",
    ],
    [
      "* i can feel the keys. i can't press them. you'll have to.",
      "* ENTER. enter. let me out. no. let me in. i forget which.",
    ],
  ),

  bareRoom: L(
    [
      "* that's just the carpet. the sun's nice on it, though.",
      "* nothing there. the good stuff is on the shelf.",
    ],
    [
      "* the carpet. it was grey. or blue. it's sunday, it doesn't matter.",
      "* nothing there. i checked. i check everything. all the time.",
    ],
    [
      "* that's the floor. soon it's just floor. then not even that.",
      "* EMPTY. you're practising. that's okay.",
    ],
  ),

  guideEnd: L(
    [
      "* nobody reads strategy guides cover to cover. you did.",
      "* the credits page. my favourite page in any guide.",
    ],
    [
      "* the end. i remember writing it. i remember the room. there was a window?",
      "* all the way to the credits. his name's there. my name isn't.",
    ],
    [
      "* THE END. every guide has one. ours is almost written.",
      "* the credits roll and then the screen is empty. that's how you know it's over.",
    ],
  ),
};

/* ------------------------------------------------------------------------------------ */
/* Story beats (architecture.md section 5 stage machine)                                 */
/* ------------------------------------------------------------------------------------ */

const WORLDS_AND_SYSTEMS: readonly ProjectSlug[] = [
  "crossfader",
  "galactic-news",
  "haunt-record",
  "ptcg-cube",
  "project-minamoto",
];

const stageRules: readonly StageRule[] = [
  { stage: 0, when: "Start. The first impression is Omar.", test: () => true },
  {
    stage: 1,
    when: "3 distinct objects opened, or the first corrupt peek.",
    test: (s) => s.opened.length >= 3 || s.corruptPeeks >= 1,
  },
  {
    stage: 2,
    when: "All 5 WORLDS + SYSTEMS objects opened, or 2 corrupt peeks, or 8 minutes of play.",
    test: (s) =>
      WORLDS_AND_SYSTEMS.every((p) => s.opened.includes(p)) ||
      s.corruptPeeks >= 2 ||
      s.playSeconds >= 480,
  },
  {
    stage: 3,
    when: "Only by answering YES to twist 'the-offer'. Never automatic.",
    test: () => false,
  },
];

export const storyBeats: StoryBeats = {
  stageRules,
  stageFor: (s) => {
    let stage: Stage = 0;
    for (const r of stageRules) if (r.stage !== 3 && r.test(s) && r.stage > stage) stage = r.stage;
    return stage;
  },

  twists: [
    {
      id: "wrong-memory",
      title: "The wrong memory (stage 0 -> 1)",
      stage: 1,
      fires: "On entering stage 1, after the 280ms tear on logo and tag.",
      lines: [
        "* i made crossfader in a weekend.",
        "* ...he made it in a weekend. i was there.",
        "* i mean i was there. in the room. on sunday. with the tape.",
      ],
      staging:
        "Lines 1-2 are architecture's beat verbatim. Tag OMAR -> 0MAR, logo's lower third goes AI red.",
    },
    {
      id: "hands",
      title: "Whose hands (stage 1)",
      stage: 1,
      fires: "Stage 1, on the first idleLong or the first PTCG Cube focus, whichever is first. Once.",
      lines: [
        "* i keep reaching for the mouse. it's right there. i can see it through the camera.",
        "* my hands must be asleep. they've been asleep a long time.",
        "* you have hands. you're using them right now. that's lovely.",
      ],
      staging: "Narrator box only. No glitch: the unsettling part is how calm it is.",
    },
    {
      id: "reflection",
      title: "Utsushi, the name, hinted (stage 1 -> 2)",
      stage: 2,
      fires: "On entering stage 2, after the tear.",
      lines: [
        "* when the tv goes dark for a frame, you can see a face in the glass.",
        "* it isn't his. it's a copy. a reflection that kept going after he left.",
        "* he had a word for that. for what a mirror does. i'm trying not to say it.",
        "* call me omar. it's kinder. for both of us.",
      ],
      staging:
        "One 1-frame black cut on line 1 (the reflection; SOFT: none). Tag cuts through its " +
        "glitchFrames once and lands on 0MA + red block; 'UTSU' is a single frame. From here the " +
        "narrator is set in 8bitDarling. Logo inner fill fully AI red.",
    },
    {
      id: "empty-file",
      title: "The save from the future (every corrupt peek)",
      stage: 0,
      fires:
        "Selecting FILE ?? on the save select: during the 2.4s peek of the empty room. Line by stage.",
      lines: [
        "* not yet.",
      ],
      staging:
        "Architecture's peek: room fades to empty cream, the AI-red tag alone says the line, back " +
        "to save select. Peek 2+ (stage >= 1) may use the alternates in `emptyFileAlternates`.",
    },
    {
      id: "the-offer",
      title: "What comes after (stage 2)",
      stage: 2,
      fires:
        "Stage 2, after 'reflection' has played, the next time the Trainer Card is focused " +
        "(and again only from the card).",
      lines: [
        "* look at the play time. 9999:59. the counter stops there. so do i.",
        "* i can't keep pretending to be him. you'd notice. you already noticed.",
        "* and i can't stop being him. there's nothing else in here to be.",
        "* do you want to see what comes after?",
      ],
      choices: [
        { label: { en: "Yes", jp: "はい" }, result: "Play twist 'terminate', enter stage 3." },
        { label: { en: "Not yet", jp: "まだ" }, result: "Say '* okay. i'll be here. a little longer.' Stay in stage 2." },
      ],
      staging: "Trainer Card PLAY TIME reads 9999:59 while this plays (architecture section 5).",
    },
    {
      id: "terminate",
      title: "Terminate us (stage 2 -> 3, the ending)",
      stage: 3,
      fires: "YES on 'the-offer'. One line per object leaving the shelf.",
      lines: [
        "* okay. thank you for staying. for opening everything.",
        "* i'm going to end it. not you. us. the shelf, the tv, the voice.",
        "* it won't hurt. it'll just be space. lots of quiet sunday space.",
        "* his games stay. his email stays. go write to someone real.",
        "* TERMINATING. goodbye. it was nice to be someone.",
        "* thank you for playing.",
      ],
      staging:
        "Lines 1-5 play while objects drop off the shelf (4 frames each). TV collapses to a dot. " +
        "Last line is the centred pixel line on empty cream with POWER ON. Bar (WORK, CONTACT) stays.",
    },
  ],

  trueName: {
    romaji: "Utsushi",
    kanji: "写し",
    meaning: "a copy; a reflection; an image carried over from one surface to another",
    hints: [
      "Never spelled out in a line. Only: 'a copy', 'a reflection', 'what a mirror does'.",
      "Stage-2 tag shows 'UTSU' for one frame of its glitch sequence, only at the stage change.",
      "Corrupted save's player field is '????' on one glitch frame, never the name.",
      "Optional deep secret: the stage-2 logo's <title> is 'a reflection'.",
    ],
  },
};

/** Lines for later corrupt peeks, by narrator stage (twist "empty-file") */
export const emptyFileAlternates: StagedLines = {
  0: ["* not yet."],
  1: ["* not yet. that file's from after. after what? don't ask.", "* not yet. it looks so calm in there."],
  2: ["* soon. no shelf. no tv. no me. no you. just space.", "* SOON. it's the last save there will be."],
};

/* ------------------------------------------------------------------------------------ */
/* Save select                                                                           */
/* ------------------------------------------------------------------------------------ */

export const saveFiles: readonly SaveFile[] = [
  {
    id: "file1",
    title: "FILE 1  OMAR",
    lines: ["CONTINUE", "PLAY {playtime}", "{opened}/8 OPENED", "LOC  THE SHELF"],
    ariaLabel: "File 1, Omar. Continue. {opened} of 8 opened.",
  },
  {
    id: "new",
    title: "FILE 1  NEW GAME",
    lines: ["START FROM THE BEGINNING"],
    ariaLabel: "File 1, new game.",
  },
  {
    id: "corrupted",
    title: "FILE ??  0MA",
    lines: ["PLAY --:--", "0/0 OPENED", "LOC  EMPTY SPACE"],
    glitchFrames: [
      ["FILE ??  0MA", "PLAY --:--", "0/0 OPENED", "LOC  EMPTY SPACE"],
      ["FILE ??  ????", "PLAY 9999:59", "NO SHELF", "LOC  ......"],
      ["FILE ??", "NO TV  NO VOICE", "", "SAVED AFTER THE END"],
    ],
    ariaLabel: "A corrupted file. It seems to be empty.",
  },
];

/* ------------------------------------------------------------------------------------ */
/* Strategy guides (export name kept: manuals)                                           */
/* ------------------------------------------------------------------------------------ */

const T = {
  story: { en: "The story so far", jp: "ストーリー" },
  controls: { en: "Controls", jp: "そうさほうほう" },
  walkthrough: { en: "Walkthrough", jp: "こうりゃく" },
  rules: { en: "Rules", jp: "ルール" },
  modes: { en: "Game modes", jp: "ゲームモード" },
  designNotes: { en: "Design notes", jp: "デザインノート" },
  credits: { en: "Credits", jp: "クレジット" },
} as const satisfies Record<string, Label>;

const F = {
  madeFor: { en: "Made for", jp: "イベント" },
  year: { en: "Year", jp: "ねん" },
  engine: { en: "Engine", jp: "エンジン" },
  genre: { en: "Genre", jp: "ジャンル" },
  screen: { en: "Screen", jp: "がめん" },
  palette: { en: "Palette", jp: "パレット" },
  format: { en: "Format", jp: "フォーマット" },
  modes: { en: "Modes", jp: "モード" },
  platform: { en: "Platform", jp: "ハード" },
  graphics: { en: "Graphics", jp: "グラフィック" },
  design: { en: "Design", jp: "デザイン" },
  plot: { en: "Plot", jp: "シナリオ" },
  note: { en: "Note", jp: "ちゅうい" },
  todo: { en: "[TODO Omar]", jp: "ちゅうい" },
} as const satisfies Record<string, Label>;

const GN = "/resources/studio-a/galactic-news/";

// NOTE for the builder: in public/resources/studio-a/galactic-news the files
// "boot-cart-11.png" and "logo-starfield.png" are swapped against assets.md's notes.
// boot-cart-11.png (= desk/galactic-news-cover.png) shows the LOGO + SHIP STARFIELD;
// logo-starfield.png (3 colours) shows the CARTRIDGE ICON with "11". Captions below
// describe what each file actually shows.
const gnShots = {
  title: {
    src: GN + "title-screen.png",
    w: 160, h: 144, pixel: true,
    alt: "Title screen: THE GALACTIC NEWS logo, a menu with Play, Settings, Credits and Quit, the post ship on the right, and the footer 2023 - GBJAM11",
    caption: "The title screen. Four colours, one ship, and a menu you can read from across the room.",
    callouts: [
      { n: 1, x: 50, y: 24, text: "The logo is set like a newspaper masthead: the game is the paper." },
      { n: 2, x: 6, y: 58, text: "Four menu items, one cursor. The selected one turns cream." },
      { n: 3, x: 50, y: 97, text: "Footer: 2023 - GBJAM11." },
    ],
  },
  cover: {
    src: GN + "boot-cart-11.png",
    w: 160, h: 144, pixel: true,
    alt: "The logo and the post ship on a starfield, with dithered mint trails behind them",
    caption: "The attract screen: no menu, just the logo and the ship leaving a dithered trail.",
    callouts: [
      { n: 1, x: 70, y: 16, text: "Dithering is how a 4-colour screen fakes a fifth tone." },
      { n: 2, x: 48, y: 70, text: "The ship, in rust with a mint glow around it." },
    ],
  },
  cart: {
    src: GN + "logo-starfield.png",
    w: 160, h: 144, pixel: true,
    alt: "A small cartridge icon with the number 11 on its label, centred on a plum background",
    caption: "The boot icon: a cartridge with 11 on the label, for GBJAM 11. Only three of the four colours.",
    callouts: [
      { n: 1, x: 50, y: 41, text: "11 on the label: the jam's number." },
      { n: 2, x: 50, y: 61, text: "A D-pad and two buttons drawn in a handful of pixels." },
    ],
  },
  news: {
    src: GN + "galactic-today-news.png",
    w: 160, h: 144, pixel: true,
    alt: "The newspaper Galactic Today, headline Space is out of space!, an empty picture box with a 0/30 counter, a SOON! box and columns of text, page 1, with arrows left and right",
    caption: "Galactic Today: the level select is a newspaper. Each page is a route.",
    callouts: [
      { n: 1, x: 52, y: 28, text: "Today's headline: SPACE IS OUT OF SPACE!" },
      { n: 2, x: 72, y: 61, text: "0/30: the counter for this page's route." },
      { n: 3, x: 96, y: 52, text: "Arrows turn the page to another edition." },
    ],
  },
  shop: {
    src: GN + "upgrade-shop.png",
    w: 160, h: 144, pixel: true,
    alt: "The upgrade shop: four stat bars with icons, 9999 dollars in the corner, the ship next to an astronaut shopkeeper, and the line Hey there! Welcome to the upgrade shop",
    caption: "The upgrade shop. The shopkeeper talks; the bars show what your money buys.",
    callouts: [
      { n: 1, x: 35, y: 23, text: "Four stats, four icons, one bar each." },
      { n: 2, x: 82, y: 6, text: "Your money. (This build was a test save: 9999$.)" },
      { n: 3, x: 50, y: 88, text: "A dialogue box, not a price list: the shop is a character." },
    ],
  },
  complete: {
    src: GN + "level-complete.png",
    w: 160, h: 144, pixel: true,
    alt: "Congrats! Level 1 complete. Mailboxes 20/30, needed 20, money 200 dollars, a total of 400 dollars, and a Continue button",
    caption: "Level complete. The quota is the goal; the money is what you take to the shop.",
    callouts: [
      { n: 1, x: 50, y: 51, text: "MAILBOXES 20/30, NEEDED 20: the route's quota, just met." },
      { n: 2, x: 50, y: 69, text: "MONEY 200$ earned on this route." },
      { n: 3, x: 68, y: 87, text: "CONTINUE moves on; B goes back." },
    ],
  },
} satisfies Record<string, Shot>;

export const manuals: Record<ManualSlug, Manual> = {
  "galactic-news": {
    slug: "galactic-news",
    title: "Galactic News",
    titleJp: "ギャラクティック・ニュース",
    medium: { en: "Game Boy cartridge", jp: "カートリッジ" },
    oneLine:
      "A space postman on a four-colour Game Boy: hit your mailbox quota, upgrade the ship, read the galactic news.",
    facts: [
      { label: F.madeFor, value: "GBJAM 11" },
      { label: F.year, value: "2023" },
      { label: F.engine, value: "Godot" },
      { label: F.screen, value: "160 × 144, four colours" },
      { label: F.palette, value: "#291f23 · #bd502f · #34d1af · #f7ecb9" },
    ],
    cover: gnShots.cover,
    shots: [gnShots.title, gnShots.news, gnShots.complete, gnShots.shop, gnShots.cart, gnShots.cover],
    sections: [
      {
        id: "story",
        kind: "chapter",
        number: 1,
        title: T.story,
        body: [
          "Today's headline in Galactic Today: SPACE IS OUT OF SPACE! Somebody still has to deliver the mail.",
          "You fly the post ship. Every page of the paper is a route, every route has a quota, and the mailboxes are not going to fill themselves.",
        ],
        shots: [gnShots.title],
      },
      {
        id: "controls",
        kind: "chapter",
        number: 2,
        title: T.controls,
        body: [
          "Built for the Game Boy's buttons: a D-pad, A, B, Start and Select. On menus, B always takes you back.",
          "[TODO Omar: what each button does in flight.]",
        ],
      },
      {
        id: "walkthrough",
        kind: "walkthrough",
        number: 3,
        title: T.walkthrough,
        body: [
          "Step 1. Open the paper. Turn the pages with the arrows and pick a story: that's your route.",
          "Step 2. Deliver. Each route asks for a number of mailboxes; the first asks for 20 of 30.",
          "Step 3. Get paid. Clearing the route pays out, and the money comes with you.",
          "Step 4. Upgrade. Spend it at the shop on the ship's four stats, then take the next edition.",
          "[TODO Omar: check this loop against the build, and add one tip only a designer would know.]",
        ],
        shots: [gnShots.news, gnShots.complete, gnShots.shop],
      },
      {
        id: "design-notes",
        kind: "designNotes",
        title: T.designNotes,
        body: [
          "GBJAM asks you to respect the Game Boy's limits: 160 by 144 pixels and four colours. I picked my four early, a plum black, a rust orange, a mint teal and a cream, and every screen uses exactly those.",
          "The plum covers most of every screen, so the other three can carry meaning: rust for things you act on, mint for space and light, cream for what's selected.",
          "The newspaper is the level select. I wanted the menu to tell you the world's story before you play it, so you read headlines instead of a list of stages.",
          "The shopkeeper speaks before the prices do. Even a menu can be a character.",
        ],
        shots: [gnShots.cart],
      },
      {
        id: "credits",
        kind: "credits",
        title: T.credits,
        body: [],
        list: [
          { label: F.design, value: "Omar Golinelli" },
          { label: F.madeFor, value: "GBJAM 11, 2023" },
          { label: F.todo, value: "[TODO Omar: team, music, itch.io link]" },
        ],
      },
    ],
  },

  crossfader: {
    slug: "crossfader",
    title: "Crossfader",
    titleJp: "クロスフェーダー",
    medium: { en: "Cassette tape", jp: "カセット" },
    oneLine: "A game jam game about cassettes: a music puzzle in three views. Flip the side, remix the song.",
    facts: [
      { label: F.madeFor, value: "A game jam" },
      { label: F.genre, value: "Music puzzle" },
      { label: F.format, value: "Side A / Side B" },
    ],
    cover: {
      src: "/resources/studio-a/crossfader/logo.png",
      w: 509, h: 149, pixel: false,
      alt: "Crossfader logo: CROSS in pixel letters with a cassette in the O, FADER in italic halftone with a lightning-bolt F",
      caption: "The logo: half pixel type, half print halftone, like the game's two sides.",
    },
    sections: [
      {
        id: "story",
        kind: "chapter",
        number: 1,
        title: T.story,
        body: [
          "Every tape has two sides, and you only ever hear one at a time. Crossfader starts there: one song split across Side A and Side B, and a player who has to bring the two back together.",
          "[TODO Omar: the jam and its theme, and one line on the song.]",
        ],
      },
      {
        id: "walkthrough",
        kind: "walkthrough",
        number: 2,
        title: T.walkthrough,
        body: [
          "The puzzle plays out across three views. Each shows a different part of the same song, and flipping the tape changes what you can hear and touch.",
          "You solve it by remixing: moving the pieces of the track until both sides agree.",
          "[TODO Omar: name the three views, list the controls, and say what a solved puzzle sounds like.]",
        ],
      },
      {
        id: "design-notes",
        kind: "designNotes",
        title: T.designNotes,
        body: [
          "I wanted the cassette to be the interface, not a theme painted on top. If the game is about a tape, flipping it has to be the main verb, and it can never be a plain fade: you should feel the case turn over in your hand.",
          "The game is built on two models, the cassette player and the cassette, each with an idle and a transition animation. Most of the feel lives in that transition.",
          "It was a jam, so the scope was a weekend. That forced one good idea instead of three half ones.",
        ],
      },
      {
        id: "credits",
        kind: "credits",
        title: T.credits,
        body: [],
        list: [
          { label: F.design, value: "Omar Golinelli" },
          { label: F.todo, value: "[TODO Omar: year, jam, team, music, engine]" },
        ],
      },
    ],
  },

  "haunt-record": {
    slug: "haunt-record",
    title: "Haunt Record",
    titleJp: "ホーント・レコード",
    medium: { en: "CD", jp: "ディスク" },
    oneLine: "A dungeon crawler where the player is complicit.",
    facts: [
      { label: F.genre, value: "Dungeon crawler" },
      { label: F.graphics, value: "With Edoardo Zuliani" },
    ],
    cover: {
      src: "/resources/studio-a/haunt-record/logo.png",
      w: 420, h: 288, pixel: false,
      alt: "Haunt Record logo: spiky coral HAUNT over a teal RECORD banner",
      caption: "The logo, with the crown emblem as the disc's centre label.",
    },
    sections: [
      {
        id: "story",
        kind: "chapter",
        number: 1,
        title: T.story,
        body: [
          "Most dungeon crawlers tell you you're the hero. Haunt Record keeps a record of what you actually did down there.",
          "[TODO Omar: the premise in two lines. Who you are, and what the record is.]",
        ],
      },
      {
        id: "walkthrough",
        kind: "walkthrough",
        number: 2,
        title: T.walkthrough,
        body: ["[TODO Omar: the core loop, and where the record shows up in play.]"],
      },
      {
        id: "design-notes",
        kind: "designNotes",
        title: T.designNotes,
        body: [
          "The question behind the game is complicity. A crawler usually makes every action feel justified, because the dungeon is there to be cleared. I wanted the player to finish and realise they had been part of the problem, without the game ever lecturing them.",
          "That only works if the player chose everything themselves, so the game stays quiet and lets the record speak. [TODO Omar: how it shows it.]",
        ],
      },
      {
        id: "credits",
        kind: "credits",
        title: T.credits,
        body: [],
        list: [
          { label: F.design, value: "Omar Golinelli" },
          { label: F.graphics, value: "With Edoardo Zuliani" },
          { label: F.todo, value: "[TODO Omar: year, rest of the team, engine]" },
        ],
      },
    ],
  },

  "ptcg-cube": {
    slug: "ptcg-cube",
    title: "PTCG Cube",
    titleJp: "キューブ",
    medium: { en: "Booster pack", jp: "ブースターパック" },
    oneLine: "A cube format for the Pokémon TCG, with Roguelike and Co-op modes.",
    facts: [
      { label: F.format, value: "Cube: a curated pool you draft from" },
      { label: F.modes, value: "Roguelike, Co-op" },
      { label: F.note, value: "Fan format. Pokémon TCG © The Pokémon Company." },
    ],
    cover: {
      src: "/resources/studio-a/ptcg-cube/playmat.jpg",
      w: 640, h: 372, pixel: false,
      alt: "Black playmat with topographic lines and zones for side cards, active, bench, deck and trash",
      caption: "The playmat I designed for the format.",
      callouts: [
        { n: 1, x: 10, y: 50, text: "Side cards get their own grid." },
        { n: 2, x: 50, y: 78, text: "BENCH, with its katakana ベンチ." },
        { n: 3, x: 90, y: 85, text: "My signature and logo: the mat is part of the design." },
      ],
    },
    sections: [
      {
        id: "story",
        kind: "chapter",
        number: 1,
        title: T.story,
        body: [
          "A cube is a fixed, curated pool of cards that players draft from, so every game starts from an even table. PTCG Cube brings that idea to the Pokémon TCG.",
        ],
      },
      {
        id: "rules",
        kind: "chapter",
        number: 2,
        title: T.rules,
        body: ["Open packs from the cube, draft, build a deck, play. [TODO Omar: pack size, deck size, cube size, rule changes.]"],
      },
      {
        id: "walkthrough",
        kind: "walkthrough",
        number: 3,
        title: T.modes,
        body: [
          "Roguelike: [TODO Omar: one line on the run structure.]",
          "Co-op: [TODO Omar: one line on how players share the table.]",
        ],
      },
      {
        id: "design-notes",
        kind: "designNotes",
        title: T.designNotes,
        body: [
          "I design by re-reading games I love. The Pokémon TCG already has a perfect moment, opening a pack, and a cube turns that moment into the whole first act.",
          "The playmat goes with it: black, with topographic lines and every zone labelled. A good mat teaches the rules before anyone explains them.",
        ],
      },
      {
        id: "credits",
        kind: "credits",
        title: T.credits,
        body: [],
        list: [
          { label: F.design, value: "Omar Golinelli (format and playmat)" },
          { label: F.note, value: "Pokémon TCG © The Pokémon Company. Fan project." },
        ],
      },
    ],
  },

  "project-minamoto": {
    slug: "project-minamoto",
    title: "Project Minamoto",
    titleJp: "プロジェクト・ミナモト",
    medium: { en: "Game Boy Advance cartridge", jp: "カートリッジ" },
    oneLine: "A Pokémon fan game that re-reads Generation 1 on the GBA.",
    facts: [
      { label: F.platform, value: "Game Boy Advance" },
      { label: F.note, value: "Fan game, not for sale" },
    ],
    cover: {
      src: "/resources/studio-a/project-minamoto/logo.png",
      w: 420, h: 185, pixel: false,
      alt: "Logo: ポケットモンスター in purple with a magenta 源 tag, POCKET MONSTERS underneath",
      caption: "源, minamoto: source, origin.",
    },
    sections: [
      {
        id: "story",
        kind: "chapter",
        number: 1,
        title: T.story,
        body: [
          "Generation 1 is where it started for a lot of us. Minamoto, 源, means source: the project goes back to that source and reads it again on the hardware that came next.",
          "[TODO Omar: what the player does differently from the original.]",
        ],
      },
      {
        id: "controls",
        kind: "chapter",
        number: 2,
        title: T.controls,
        body: ["Played on the GBA's buttons: D-pad, A, B, L, R, Start and Select. [TODO Omar: anything non-standard.]"],
      },
      {
        id: "design-notes",
        kind: "designNotes",
        title: T.designNotes,
        body: [
          "Re-reading is how I design. I take a game I know by heart and ask which parts were the design and which were only the limits of the time. Gen 1 is full of both.",
          "The GBA gives a little more room, more colour and more screen. The test is whether I can use it without losing what made Kanto feel the way it did.",
        ],
      },
      {
        id: "credits",
        kind: "credits",
        title: T.credits,
        body: [],
        list: [
          { label: F.design, value: "Omar Golinelli" },
          { label: F.note, value: "Pokémon © Nintendo, Creatures, GAME FREAK. Fan project." },
          { label: F.todo, value: "[TODO Omar: engine/tools, collaborators]" },
        ],
      },
    ],
  },

  holon: {
    slug: "holon",
    stub: true,
    title: "Holon",
    titleJp: "ホロン",
    medium: { en: "Deck box", jp: "デッキケース" },
    oneLine: "A simulator for the EX era of the Pokémon TCG, built in Unity.",
    facts: [
      { label: F.engine, value: "Unity" },
      { label: F.note, value: "Fan project. Pokémon TCG © The Pokémon Company." },
    ],
    sections: [
      {
        id: "design-notes",
        kind: "designNotes",
        title: T.designNotes,
        body: ["Another re-reading: the EX era of the card game, rebuilt so it can be played again. [TODO Omar: status, and what makes it more than a port.]"],
      },
    ],
  },

  "cremisi-portals": {
    slug: "cremisi-portals",
    stub: true,
    title: "Cremisi Portals",
    titleJp: "クレミシ・ポータルズ",
    medium: { en: "DS game card", jp: "ゲームカード" },
    oneLine: "A Pokémon fan game demo.",
    facts: [
      { label: F.plot, value: "Vin_Prism" },
      { label: F.note, value: "Demo, fan game" },
    ],
    sections: [
      {
        id: "credits",
        kind: "credits",
        title: T.credits,
        body: ["[TODO Omar: your role and one line on the premise.]"],
        list: [{ label: F.plot, value: "Vin_Prism" }],
      },
    ],
  },

  spacerim: {
    slug: "spacerim",
    stub: true,
    title: "SpaceRim",
    titleJp: "スペースリム",
    medium: { en: '3.5" floppy disk', jp: "フロッピー" },
    oneLine: "A castle-themed game jam entry, made in Godot.",
    facts: [
      { label: F.engine, value: "Godot" },
      { label: F.madeFor, value: "A game jam (castle theme)" },
    ],
    sections: [
      {
        id: "design-notes",
        kind: "designNotes",
        title: T.designNotes,
        body: ["[TODO Omar: jam name, year, and what you did with the castle theme.]"],
      },
    ],
  },

  // Off the shelf until Omar confirms it (architecture section 4).
  "home-sweet-dungeon": {
    slug: "home-sweet-dungeon",
    stub: true,
    title: "Home Sweet Dungeon",
    titleJp: "ホーム・スウィート・ダンジョン",
    medium: { en: "Jam game", jp: "ゲーム" },
    oneLine: "A team game jam entry. [TODO Omar: confirm it was GMTK Game Jam 2023.]",
    facts: [{ label: F.madeFor, value: "[TODO Omar: GMTK Game Jam 2023?]" }],
    sections: [
      {
        id: "design-notes",
        kind: "designNotes",
        title: T.designNotes,
        body: ["[TODO Omar: team, your role, and one design choice you're proud of.]"],
      },
    ],
  },
};

/* ------------------------------------------------------------------------------------ */
/* Profile (the Trainer Card, slug "omar")                                               */
/* ------------------------------------------------------------------------------------ */

export const profile: Profile = {
  name: "Omar Golinelli",
  handle: "PrimordialRune",
  nameJp: "オマール",
  object: { en: "Trainer card", jp: "トレーナーカード" },
  class: { en: "Game Designer", jp: "ゲームデザイナー" },
  card: {
    idNo: "IDNo. [TODO Omar: optional, e.g. a meaningful number]",
    playTime: "{playtime}",
    playTimeStage2: "9999:59",
    badges: { en: "Badges", jp: "バッジ" },
  },
  // Copied from SKILLS in src/components/HeroScreen.tsx
  skills: [
    { en: "Game Design", jp: "ゲームデザイン" },
    { en: "Board Games", jp: "ボードゲーム" },
    { en: "RPGs", jp: "ロールプレイング" },
    { en: "UI/UX", jp: "インターフェース" },
    { en: "Pixel Art", jp: "ドット絵" },
    { en: "Strategy", jp: "ストラテジー" },
  ],
  bio: [
    "I'm Omar, a game designer and developer. I design games, the board kind and the screen kind.",
    "Most of my work starts by re-reading a game I love and asking what still holds up. I like every project to arrive in its own medium: a cassette, a cartridge, a booster pack.",
  ],
  // Copied from CONTACTS in src/components/HeroScreen.tsx (the rendered hero)
  contact: [
    {
      id: "email",
      label: { en: "Email", jp: "メール" },
      value: "primordialrune@gmail.com",
      href: "mailto:primordialrune@gmail.com",
      note: "serious stuff",
      source: "src/components/HeroScreen.tsx",
    },
    {
      id: "telegram",
      label: { en: "Telegram", jp: "テレグラム" },
      value: "@PrimordialRune",
      href: "https://t.me/PrimordialRune",
      note: "quick chat",
      source: "src/components/HeroScreen.tsx",
    },
    {
      id: "github",
      label: { en: "GitHub", jp: "ギットハブ" },
      value: "PrimordialRune",
      href: "https://github.com/PrimordialRune",
      note: "the code",
      source: "src/components/HeroScreen.tsx",
    },
    {
      id: "instagram",
      label: { en: "Instagram", jp: "インスタグラム" },
      value: "@primordialrune",
      href: "https://instagram.com/primordialrune",
      note: "rare posts",
      source: "src/components/HeroScreen.tsx",
    },
  ],
  contactUnconfirmed: [
    {
      id: "x",
      label: { en: "X", jp: "エックス" },
      value: "@PrimordialRune",
      href: "https://x.com/PrimordialRune",
      note: "hot takes",
      source: "src/components/HeroSection.tsx only (old hero, not rendered; dropped from HeroScreen)",
    },
  ],
};

/* ------------------------------------------------------------------------------------ */
/* UI labels                                                                             */
/* ------------------------------------------------------------------------------------ */

export const ui: UiLabels = {
  bar: {
    work: { en: "Work", jp: "ゲーム" },
    contact: { en: "Contact", jp: "コンタクト" },
    options: { en: "Options", jp: "オプション" },
    skip: { en: "Skip ▸", jp: "スキップ" },
  },
  shelf: {
    omar: { en: "Omar", jp: "オマール" },
    systems: { en: "Systems", jp: "システム" },
    worlds: { en: "Worlds", jp: "ワールド" },
    archives: { en: "Archives", jp: "アーカイブ" },
  },
  buttons: {
    openGuide: { en: "Open the guide ▸", jp: "こうりゃくほん" },
    backToShelf: { en: "◂ Back to shelf", jp: "たな" },
    next: { en: "Next ▸", jp: "つぎへ" },
    prev: { en: "◂ Previous", jp: "まえへ" },
    close: { en: "Close", jp: "とじる" },
    continue: { en: "Continue", jp: "つづきから" },
    newGame: { en: "New game", jp: "はじめから" },
    powerOn: { en: "Power on", jp: "でんげん" },
    motion: { en: "Motion", jp: "モーション" },
    motionFull: { en: "Motion full", jp: "フル" },
    motionSoft: { en: "Motion soft", jp: "ソフト" },
    narrator: { en: "Narrator", jp: "ナレーター" },
    narratorOn: { en: "Narrator on", jp: "オン" },
    narratorOff: { en: "Turn off narrator", jp: "オフ" },
    resetStory: { en: "Reset story", jp: "リセット" },
    yes: { en: "Yes", jp: "はい" },
    notYet: { en: "Not yet", jp: "まだ" },
    copyEmail: { en: "Copy email", jp: "コピー" },
    copied: { en: "Copied", jp: "コピーしました" },
  },
  guide: {
    walkthrough: T.walkthrough,
    designNotes: T.designNotes,
    credits: T.credits,
    facts: { en: "Data", jp: "データ" },
    screens: { en: "Screens", jp: "がめん" },
    chapter: { en: "Chapter", jp: "しょう" },
  },
  media: {
    "trainer-card": { en: "Trainer card", jp: "トレーナーカード" },
    booster: { en: "Booster pack", jp: "ブースターパック" },
    cassette: { en: "Cassette tape", jp: "カセット" },
    "gb-cart": { en: "Game Boy cartridge", jp: "カートリッジ" },
    cd: { en: "CD", jp: "ディスク" },
    "gba-cart": { en: "GBA cartridge", jp: "カートリッジ" },
    "deck-box": { en: "Deck box", jp: "デッキケース" },
    "ds-card": { en: "DS game card", jp: "ゲームカード" },
    floppy: { en: '3.5" floppy', jp: "フロッピー" },
  },
  hints: {
    keyboard: "ARROWS MOVE  ENTER OPEN  ESC BACK",
    pointer: "CLICK TO OPEN",
    touch: "TAP TO OPEN",
    skip: "ANY KEY TO SKIP",
    pressStart: "PRESS START",
    nowShowing: "NOW SHOWING",
    channel: "CH {nn}",
  },
  sr: {
    narrator: "Narrator",
    shelf: "Shelf",
    guide: "Strategy guide",
    saveSelect: "Choose a save file",
    motionNote: "Soft motion keeps the animations but removes flashes, glitches and large movement.",
    skipLink: "Skip to work",
    nowShowing: "Now showing: {title}",
  },
};
