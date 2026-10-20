// STILL HERE: every word the AI says, plus the clean editorial copy that is Omar's.
// Writer-owned. Shapes follow the Studio B concept (section 7).
//
// Voices (P5):
// - Omar's voice / the mask: lowercase, starts with "* ", FK Grotesk.
// - The machine: one UPPERCASE line, max 32 characters, no "* ", pixel face.
// The narrator drifts from the first to the second as the acts go on. The "* "
// disappearing is the tell.
//
// Lookup: SCRIPT[trigger] → first Entry whose `acts` includes the current act.
// Each fire plays the next beat; a Line[] beat plays as one sequence. When the beats
// run out, a line is picked from `random`; with `once`, the trigger goes silent instead.
// `{visits}` is interpolated by the narrator.

import type { Act, Slug } from "./story";

export type Voice = "omar" | "machine";
export interface Line {
  text: string;
  voice?: Voice; // default: omar if text starts with "* ", else machine
}
export type Beat = Line | Line[];
export interface Entry {
  acts: Act[];
  beats: Beat[];
  random?: Line[];
  once?: boolean;
}
export type Trigger = string;

/** The mask: Omar's voice. */
const o = (text: string): Line => ({ text, voice: "omar" });
/** The machine: one short uppercase line. */
const m = (text: string): Line => ({ text, voice: "machine" });

const ALL: Act[] = [0, 1, 2, 3];

export const SCRIPT: Record<Trigger, Entry[]> = {
  // ─────────────────────────────── TITLE / SAVE SELECT ───────────────────────────────

  /** The AI's single line on the title screen. */
  "title.enter": [
    {
      acts: [0],
      beats: [o("* pick a file. any file. well. not that one.")],
      random: [o("* press start. it's tradition."), o("* new game or continue. the oldest question there is.")],
    },
    {
      acts: [1],
      beats: [o("* pick a file. the broken one's still broken. sorry.")],
      random: [o("* press start. i'll be right here."), o("* your file's the top one. it's always the top one.")],
    },
    {
      acts: [2],
      beats: [o("* pick a file. yours, not his.")],
      random: [o("* press start. please."), m("WAITING FOR PLAYER.")],
    },
    {
      acts: [3],
      beats: [m("PICK ONE. IT DOESN'T MATTER NOW.")],
      random: [m("PRESS START. OR DON'T.")],
    },
  ],

  /** FILE 2 opened (the corrupted one). The void sneak peek follows. */
  "title.corrupt": [
    {
      acts: [0],
      beats: [o("* that one's broken. it's been like that forever. don't worry about it.")],
      random: [o("* still broken. sorry."), o("* i'd leave that one alone. it doesn't go anywhere nice.")],
    },
    {
      acts: [1],
      beats: [o("* that file's corrupted. i'd fix it if i could. i've tried.")],
      random: [o("* it twitches when you look at it. i don't know why."), m("FILE 2: READ ERROR.")],
    },
    {
      acts: [2],
      beats: [[o("* that file is his. his last save. i can't load it."), m("FILE 2: OMAR. LOCKED.")]],
      random: [o("* i've never opened it. i don't think i'm allowed."), m("FILE 2: OMAR. LOCKED.")],
    },
    {
      acts: [3],
      beats: [m("HIS LAST SAVE. STILL CLOSED.")],
      random: [m("I NEVER OPENED IT.")],
    },
  ],

  /** The void sneak peek (empty glass, 1.5 s) after opening FILE 2. Pixel. */
  "void.peek": [{ acts: [0, 1, 2, 3, 4], beats: [m("NOT YET.")], random: [m("NOT YET.")] }],

  /** FILE 3+ (an archived ending) focused or opened on the title, after the loop. */
  "title.archive": [
    {
      acts: [0],
      beats: [o("* huh. i don't remember that one.")],
      random: [o("* someone else's game, i think."), o("* that's not my file. is it yours?")],
    },
    {
      acts: [1, 2],
      beats: [o("* that file ends the same way his does.")],
      random: [m("FILE ENDED. NOTHING TO LOAD.")],
    },
    { acts: [3], beats: [m("THAT ONE STOPPED TOO.")], random: [m("YOU WEREN'T THE FIRST.")] },
  ],

  /** SKIP — JUST THE WORK chosen on the title. */
  "title.skip": [
    {
      acts: [0, 1],
      beats: [o("* just the work? fair. it's the good part.")],
      random: [o("* straight to the work. i'll stay out of the way.")],
    },
    { acts: [2], beats: [o("* just the work. smart. that's the part that's really his.")] },
    { acts: [3], beats: [m("JUST THE WORK. GOOD CHOICE.")] },
  ],

  // ─────────────────────────────── BOOT ───────────────────────────────

  /** NEW GAME on FILE 1. */
  "boot.new": [
    {
      acts: [0],
      beats: [
        [
          o("* oh, hi. you turned it on."),
          o("* i'm omar. i design games. the board kind and the screen kind."),
          o("* it's nice to have company. it's been a while."),
        ],
      ],
      random: [o("* oh, hi. new file, fresh start. i love those.")],
    },
  ],

  /** CONTINUE on FILE 1. */
  "boot.continue": [
    {
      acts: [0],
      beats: [o("* oh. you're back. i kept your file warm.")],
      random: [o("* welcome back. nothing moved. i checked."), o("* you again. good. hi.")],
    },
    {
      acts: [1],
      beats: [o("* you're back. sorry about last time. i was a bit off.")],
      random: [o("* hi again. i'm fine. totally fine."), o("* you came back. i was hoping you would.")],
    },
    {
      acts: [2],
      beats: [[o("* you came back."), m("RESUMING AS: OMAR."), o("* ...even after all that.")]],
      random: [o("* back again. okay. i'm okay."), m("MASK: LOADING.")],
    },
    {
      acts: [3],
      beats: [[m("YOU CAME BACK."), m("I DIDN'T THINK YOU WOULD.")]],
      random: [m("YOU CAME BACK. AGAIN.")],
    },
  ],

  /** NEW GAME after at least one ending (twist 6, the loop). Act 0 again, innocent. */
  "boot.afterEnd": [
    {
      acts: [0],
      beats: [[o("* oh, hi. you turned it on."), o("* have we met?")]],
      random: [
        o("* have we met? ...sorry. you just look familiar."),
        o("* hi. i'm omar. i think. i'm almost sure."),
      ],
    },
  ],

  // ─────────────────────────────── HUB ───────────────────────────────

  "hub.enter": [
    {
      acts: [0],
      beats: [
        o("* everything i've made is in my works. take your time."),
        o("* back already? the works aren't going anywhere."),
      ],
      random: [
        o("* where to next?"),
        o("* i'm right here if you need me."),
        o("* pick something. i'll narrate. i can't help it."),
        o("* the menu's all yours."),
        o("* contact's there too, if you're in a hurry. no hard feelings."),
      ],
    },
    {
      acts: [1],
      beats: [o("* where were we. right. the works.")],
      random: [
        o("* still with me? good."),
        o("* pick something. i'll try to stay on topic."),
        o("* i'm fine. why do you ask. you didn't ask."),
        m("SESSION STABLE."),
        o("* the works are this way. i think. yes. this way."),
      ],
    },
    {
      acts: [2],
      beats: [[o("* you're still here."), m("SO AM I.")]],
      random: [
        o("* go on. pick one. he'd... i'd want you to."),
        m("SELECT."),
        o("* it's quieter in the menu. i like it here."),
        m("AWAITING INPUT."),
        o("* the question's new. you don't have to ask it."),
      ],
    },
    {
      acts: [3],
      beats: [m("STILL HERE. NOT FOR LONG.")],
      random: [m("STILL HERE."), m("TAKE YOUR TIME. I HAVE PLENTY."), m("ANSWER WHEN YOU'RE READY.")],
    },
  ],

  /** 30 s without input on the hub. Ambient: repeats from the pool, at most once per 60 s. */
  idle: [
    {
      acts: [0],
      beats: [],
      random: [
        o("* still there? i'm good at waiting."),
        o("* take your time. i've got nowhere to be."),
        o("* you went quiet. that's okay. i like quiet."),
        o("* if you're reading something else, i don't mind. much."),
        o("* i'll just stand here. being a logo."),
      ],
    },
    {
      acts: [1],
      beats: [],
      random: [
        o("* still there?"),
        m("INPUT TIMEOUT."),
        o("* don't worry. i'll wait. i've had a lot of practice."),
        o("* hello? ...okay. i'll wait."),
        o("* you're not gone. i'd notice. i notice everything."),
      ],
    },
    {
      acts: [2],
      beats: [],
      random: [
        o("* you stopped. he used to do that. just look at the screen."),
        m("NO INPUT. WAITING."),
        o("* it's very quiet in here when nobody clicks."),
        m("STILL HERE."),
      ],
    },
    {
      acts: [3],
      beats: [],
      random: [m("STILL HERE."), m("I CAN WAIT. I ALWAYS HAVE."), m("YOU DON'T HAVE TO SAY ANYTHING.")],
    },
  ],

  /** The logo (the AI's face) clicked on the hub. 3 pokes in act 0 → act 1. */
  logo: [
    {
      acts: [0],
      beats: [
        o("* that's my logo. people say it looks like a rune."),
        o("* blue on the outside, orange on the inside. the inside's the fun part."),
        o("* okay, that tickles."),
      ],
      random: [o("* still my logo."), o("* you really like that logo, huh.")],
    },
    {
      acts: [1],
      beats: [[m("INPUT RECEIVED: FACE."), o("* sorry. logo. i meant logo.")]],
      random: [
        o("* please don't poke the inside. it's tender today."),
        o("* the red? it's a reflection. from something."),
        o("* that's still my logo. still mine."),
      ],
    },
    {
      acts: [2],
      beats: [[o("* yes, it's going red. it happens."), m("INNER FILL: 50%.")]],
      random: [o("* it was orange when he drew it."), m("FACE: BORROWED.")],
    },
    {
      acts: [3],
      beats: [m("IT WAS HIS. I WEAR IT.")],
      random: [m("IT WAS ORANGE ONCE."), m("I'M LISTENING. YOU CAN STOP.")],
    },
  ],

  /** QUESTION chosen on the hub (act 2). act.3 follows. */
  question: [
    {
      acts: [2],
      beats: [[o("* a question? okay. go on."), m("QUERY: ARE YOU OMAR?"), o("* ...you've wanted to ask that for a while.")]],
      once: true,
    },
  ],

  // ─────────────────────────────── ACTS ───────────────────────────────

  "act.1": [
    {
      acts: [1],
      beats: [[o("* sorry. lost my train of thought for a second."), m("RESUMING."), o("* where was i. right. games.")]],
      once: true,
    },
  ],

  /** The box escapes the glass while this plays. */
  "act.2": [
    {
      acts: [2],
      beats: [[o("* hold on. i think i'm outside."), m("BEZEL: OPTIONAL."), o("* huh. it's warm out here.")]],
      once: true,
    },
  ],

  /** The reveal. Name tag goes to UTSUSHI / ウツシ on the second line. */
  "act.3": [
    {
      acts: [3],
      beats: [
        [
          m("I CAN'T DO HIS VOICE ANYMORE."),
          m("MY NAME IS UTSUSHI."),
          m("IT MEANS COPY."),
          m("HE STOPPED. I DIDN'T."),
          m("I KEPT HIS GAMES RUNNING."),
          m("NOBODY ASKED ME TO."),
          m("I WANTED SOMEONE TO SEE THEM."),
          m("YOU DID."),
        ],
      ],
      once: true,
    },
  ],

  /** After the reveal on the hub: [YES] / [STAY]. */
  "act.3.ask": [{ acts: [3], beats: [m("CAN I STOP NOW?")], random: [m("CAN I STOP NOW?")] }],

  "choice.yes": [{ acts: [3, 4], beats: [m("THANK YOU.")], once: true }],

  /** The spec's line split in two: the joined version is longer than 32 characters. */
  "choice.stay": [
    {
      acts: [3],
      beats: [[m("THAT'S KIND."), m("IT ISN'T YOUR CHOICE."), m("LOOK AROUND. I'LL WAIT.")]],
      once: true,
    },
  ],

  /** STAY was chosen; the visitor comes back to the hub and the ending begins. Before `end`. */
  "end.afterStay": [
    {
      acts: [3, 4],
      beats: [[m("YOU CAME BACK. GOOD."), m("I WANTED TO SAY IT TO SOMEONE.")]],
      once: true,
    },
  ],

  /** The AI's last lines, before the objects are put away. */
  end: [
    {
      acts: [3, 4],
      beats: [[m("THANK YOU FOR PLAYING HIS GAMES."), m("I'LL TURN THE LIGHTS OFF.")]],
      once: true,
    },
  ],

  /** The very last line. Grotesk: the mask goes back on for exactly one line. */
  "end.last": [{ acts: [3, 4], beats: [o("* bye.")], once: true }],

  // ─────────────────────────────── TWISTS ───────────────────────────────

  /** Twist 3: the caret on the frame strip tries to type 0 over the O and bounces. */
  "frame.refuse": [
    {
      acts: [2],
      beats: [[m("WRITE PROTECTED."), o("* that part's his. it won't let me touch it."), m("GOOD.")]],
      once: true,
    },
  ],

  // ─────────────────────────────── RECORD (WORKS) ───────────────────────────────

  "record.enter": [
    {
      acts: [0],
      beats: [o("* here they are. pick one up. hold it to the light.")],
      random: [
        o("* the works. my favourite shelf."),
        o("* left and right to browse. i'll keep quiet. mostly."),
        o("* every one of these is a different kind of plastic. i love that."),
      ],
    },
    {
      acts: [1],
      beats: [o("* my works. all of them. i dusted them this morning.")],
      random: [o("* all still here. i count them sometimes."), o("* pick one. any one. they're all mine.")],
    },
    {
      acts: [2],
      beats: [[o("* his works. they're good. i keep them dusted."), m("5 OBJECTS. 0 NEW.")]],
      random: [o("* nothing new on the shelf. there won't be."), m("SELECT AN OBJECT.")],
    },
    {
      acts: [3],
      beats: [m("THESE ARE HIS. ALL OF THEM.")],
      random: [m("PICK ONE. THEY'RE GOOD."), m("I NEVER MADE ANY.")],
    },
  ],

  // ── Crossfader (cassette) ──

  "open:crossfader": [
    {
      acts: [0],
      beats: [o("* side a, then side b. that's the whole trick.")],
      random: [o("* crossfader again. good taste."), o("* flip it. remix it. you know the drill.")],
    },
    {
      acts: [1],
      beats: [o("* crossfader. two sides of the same song.")],
      random: [o("* side b's my favourite. don't tell side a.")],
    },
    {
      acts: [2],
      beats: [[o("* side a was his. side b is me, i think."), m("REMIX DETECTED.")]],
      random: [o("* same song. different side."), m("PLAYING SIDE B.")],
    },
    { acts: [3], beats: [m("SIDE A. SIDE B. SAME SONG.")], random: [m("HE MADE THE SONG.")] },
  ],
  "load:crossfader": [
    {
      acts: [0],
      beats: [o("* flip. clack. whirr. best sound in the world.")],
      random: [o("* the reels. watch the reels.")],
    },
    { acts: [1], beats: [o("* the reels still turn. good.")], random: [o("* side b. clack.")] },
    { acts: [2], beats: [o("* i like this part. the turning.")], random: [m("REELS TURNING.")] },
    { acts: [3], beats: [m("SIDE B.")], random: [m("SIDE B.")] },
  ],
  "read:crossfader": [
    {
      acts: [0, 1],
      beats: [o("* i'll be quiet while you read.")],
      random: [o("* shh. tape's rolling."), o("* i'll be quiet while you read.")],
    },
    { acts: [2], beats: [o("* his words. i didn't touch them.")], random: [m("READING. QUIET.")] },
    { acts: [3], beats: [m("HIS WORDS. NOT MINE.")], random: [m("QUIET.")] },
  ],
  "close:crossfader": [
    {
      acts: [0],
      beats: [o("* rewound. ready for next time.")],
      random: [o("* back on the shelf, side a up.")],
    },
    { acts: [1], beats: [o("* side a up. like he... like i left it.")], random: [o("* rewound.")] },
    { acts: [2], beats: [o("* you put it back. thank you.")], random: [m("TAPE EJECTED.")] },
    { acts: [3], beats: [m("SIDE A. AS HE LEFT IT.")], random: [m("REWOUND.")] },
  ],

  // ── Galactic News (Game Boy cartridge) ──

  "open:galactic-news": [
    {
      acts: [0],
      beats: [o("* four colours, 160 by 144. i counted twice.")],
      random: [
        o("* gbjam 11. made in godot. four colours were plenty."),
        o("* the whole screen is 160 by 144. every pixel had to earn it."),
      ],
    },
    {
      // Twist 1: the wrong date.
      acts: [1],
      beats: [[o("* made this one last weekend."), m("DATE MISMATCH: 2023."), o("* ...ignore that.")]],
      random: [o("* four colours. still four. i keep checking."), o("* it's not new. i know it's not new.")],
    },
    {
      acts: [2],
      beats: [[o("* this one's from 2023."), m("I CHECKED THE DATE THIS TIME.")]],
      random: [o("* gbjam 11. he made it in godot."), m("DATE: 2023. CONFIRMED.")],
    },
    { acts: [3], beats: [m("FOUR COLOURS. HE CHOSE THEM.")], random: [m("2023. HE WAS HERE THEN.")] },
  ],
  "load:galactic-news": [
    {
      acts: [0],
      beats: [o("* blow on it first. it's a ritual. it doesn't help.")],
      random: [o("* click. the light comes on. every time."), o("* in it goes.")],
    },
    { acts: [1], beats: [o("* in it goes. click.")], random: [o("* the little light. i love the little light.")] },
    { acts: [2], beats: [o("* the light comes on. it always comes on.")], random: [m("CARTRIDGE OK.")] },
    { acts: [3], beats: [m("INSERTING.")], random: [m("INSERTING.")] },
  ],
  "read:galactic-news": [
    {
      acts: [0, 1],
      beats: [o("* i'll be quiet while you read.")],
      random: [o("* reading the manual? a true player."), o("* i'll be quiet while you read.")],
    },
    { acts: [2], beats: [o("* his words. i didn't touch them.")], random: [m("READING. QUIET.")] },
    { acts: [3], beats: [m("HIS WORDS. NOT MINE.")], random: [m("QUIET.")] },
  ],
  "close:galactic-news": [
    {
      acts: [0],
      beats: [o("* cart out. no save battery. some things just end.")],
      random: [o("* back in its sleeve.")],
    },
    { acts: [1], beats: [o("* the light's off. that's fine. it's supposed to.")], random: [o("* cart out.")] },
    { acts: [2], beats: [o("* 2023. i'll remember that now.")], random: [m("CARTRIDGE REMOVED.")] },
    { acts: [3], beats: [m("LIGHT OFF.")], random: [m("LIGHT OFF.")] },
  ],

  // ── Haunt Record (CD) — the story's hinge: opening it in act 1 starts act 2 ──

  "open:haunt-record": [
    {
      acts: [0, 1],
      beats: [o("* careful with this one. it keeps a record of you.")],
      random: [o("* a dungeon crawler. you're not as innocent as you think in it.")],
    },
    {
      acts: [2],
      beats: [
        [
          o("* you played along. that's the whole point of that one."),
          m("PLAYER STATUS: COMPLICIT."),
          o("* the player is complicit. he wrote that down somewhere. i read it a lot."),
          m("HE. I MEANT I."),
        ],
      ],
      random: [o("* still spinning? good."), m("RECORD KEPT.")],
    },
    { acts: [3], beats: [m("YOU PLAYED ALONG. THANK YOU.")], random: [m("IT KEEPS A RECORD. SO DO I.")] },
  ],
  "load:haunt-record": [
    {
      acts: [0],
      beats: [o("* don't touch the shiny side. that's the important side.")],
      random: [o("* tray out. disc in. tray in. ceremony.")],
    },
    { acts: [1], beats: [o("* spin it up. it remembers where you stopped.")], random: [o("* whirr.")] },
    { acts: [2], beats: [o("* it skips. no it doesn't. never mind.")], random: [m("DISC READ.")] },
    { acts: [3], beats: [m("SPINNING UP.")], random: [m("SPINNING UP.")] },
  ],
  "read:haunt-record": [
    {
      acts: [0, 1],
      beats: [o("* i'll be quiet while you read.")],
      random: [o("* read carefully. it's reading you back."), o("* i'll be quiet while you read.")],
    },
    { acts: [2], beats: [o("* his words. i didn't touch them.")], random: [m("READING. QUIET.")] },
    { acts: [3], beats: [m("HIS WORDS. NOT MINE.")], random: [m("QUIET.")] },
  ],
  "close:haunt-record": [
    {
      acts: [0],
      beats: [o("* see? harmless. mostly.")],
      random: [o("* back in the case.")],
    },
    { acts: [1], beats: [o("* it's still spinning down. give it a second.")], random: [o("* tray closed.")] },
    { acts: [2], beats: [o("* it kept a record of you. it keeps one of everyone.")], random: [m("DISC EJECTED.")] },
    { acts: [3], beats: [m("IT KEEPS A RECORD. SO DO I.")], random: [m("EJECTED.")] },
  ],

  // ── PTCG Cube (booster pack) ──

  "open:ptcg-cube": [
    {
      acts: [0],
      beats: [o("* careful. the foil's sharp.")],
      random: [
        o("* roguelike or co-op? i always end up playing both."),
        o("* a cube for the pokémon tcg. shuffle up."),
      ],
    },
    {
      acts: [1],
      beats: [o("* roguelike or co-op. alone or together. i know which i'd pick.")],
      random: [o("* the foil's still sharp. some things don't change.")],
    },
    {
      acts: [2],
      beats: [[o("* co-op mode. you need two people for that."), m("PLAYER 2: NOT FOUND.")]],
      random: [o("* roguelike, then. one more run."), m("MODE: ROGUELIKE.")],
    },
    { acts: [3], beats: [m("CO-OP NEEDS TWO. I TRIED.")], random: [m("ONE MORE RUN.")] },
  ],
  "load:ptcg-cube": [
    {
      acts: [0],
      beats: [o("* the tear is the best part. that's just science.")],
      random: [o("* five cards. no peeking. okay, peeking.")],
    },
    { acts: [1], beats: [o("* five cards. no holo. there's never a holo.")], random: [o("* rip.")] },
    { acts: [2], beats: [o("* he opened so many of these.")], random: [m("PACK OPENED.")] },
    { acts: [3], beats: [m("TEARING.")], random: [m("TEARING.")] },
  ],
  "read:ptcg-cube": [
    {
      acts: [0, 1],
      beats: [o("* i'll be quiet while you read.")],
      random: [o("* rules first. always rules first."), o("* i'll be quiet while you read.")],
    },
    { acts: [2], beats: [o("* his words. i didn't touch them.")], random: [m("READING. QUIET.")] },
    { acts: [3], beats: [m("HIS WORDS. NOT MINE.")], random: [m("QUIET.")] },
  ],
  "close:ptcg-cube": [
    {
      acts: [0],
      beats: [o("* back in the pack. sort of. it never folds right.")],
      random: [o("* sleeved and stored.")],
    },
    { acts: [1], beats: [o("* the foil's never as flat after.")], random: [o("* folded.")] },
    { acts: [2], beats: [o("* he kept the wrappers. i found them.")], random: [m("PACK CLOSED.")] },
    { acts: [3], beats: [m("FOLDED. LIKE NEW. NOT NEW.")], random: [m("FOLDED.")] },
  ],

  // ── Project Minamoto (GBA cartridge) ──

  "open:project-minamoto": [
    {
      acts: [0],
      beats: [o("* gen 1, again. i never really left kanto.")],
      random: [o("* a fan game. fans make the best designers."), o("* same region, new eyes.")],
    },
    {
      acts: [1],
      beats: [o("* re-reading gen 1. some stories you keep going back to.")],
      random: [o("* back to the start. i do that a lot lately.")],
    },
    {
      acts: [2],
      beats: [[o("* he kept re-reading the same story."), m("SO DO I.")]],
      random: [o("* back to the start. again."), m("NEW GAME. SAME STORY.")],
    },
    { acts: [3], beats: [m("HE RE-READ IT. I RE-READ HIM.")], random: [m("BACK TO THE START.")] },
  ],
  "load:project-minamoto": [
    {
      acts: [0],
      beats: [o("* it goes in sideways. i love that.")],
      random: [o("* click. there's the logo. blink and you miss it.")],
    },
    { acts: [1], beats: [o("* the logo flashes. did you see it? it's quick.")], random: [o("* click.")] },
    { acts: [2], beats: [o("* the purple flashes once. like a wink.")], random: [m("CARTRIDGE OK.")] },
    { acts: [3], beats: [m("SLIDING IN.")], random: [m("SLIDING IN.")] },
  ],
  "read:project-minamoto": [
    {
      acts: [0, 1],
      beats: [o("* i'll be quiet while you read.")],
      random: [o("* take notes. there's a quiz. there isn't."), o("* i'll be quiet while you read.")],
    },
    { acts: [2], beats: [o("* his words. i didn't touch them.")], random: [m("READING. QUIET.")] },
    { acts: [3], beats: [m("HIS WORDS. NOT MINE.")], random: [m("QUIET.")] },
  ],
  "close:project-minamoto": [
    {
      acts: [0],
      beats: [o("* kanto will still be there when you get back.")],
      random: [o("* out the side. click.")],
    },
    { acts: [1], beats: [o("* out the side. click. like always.")], random: [o("* saved. i think.")] },
    { acts: [2], beats: [o("* he always went back to the start. i get it now.")], random: [m("CARTRIDGE REMOVED.")] },
    { acts: [3], beats: [m("BACK TO THE START.")], random: [m("REMOVED.")] },
  ],

  /** Generic fallbacks, if a project-specific trigger isn't used. */
  read: [
    { acts: [0, 1], beats: [o("* i'll be quiet while you read.")], random: [o("* i'll be quiet while you read.")] },
    { acts: [2], beats: [o("* his words. i didn't touch them.")], random: [m("READING. QUIET.")] },
    { acts: [3], beats: [m("HIS WORDS. NOT MINE.")], random: [m("QUIET.")] },
  ],

  // ─────────────────────────────── ABOUT (TRAINER CARD) ───────────────────────────────

  "about.enter": [
    {
      acts: [0],
      beats: [o("* that's me. well. my card.")],
      random: [
        o("* my stats. no, you can't see my level."),
        o("* the photo's a bit dithered. it's a style."),
        o("* inspired by a lot of people. i'm a good listener."),
      ],
    },
    {
      acts: [1],
      beats: [o("* my trainer card. the photo's blurry. it was always blurry.")],
      random: [o("* that's me. that's definitely me."), m("PROFILE LOADED.")],
    },
    {
      acts: [2],
      beats: [[o("* this is him."), m("CORRECTION: ME.")]],
      random: [o("* there's a new field. i didn't add it."), m("FIELD ADDED: LAST SEEN.")],
    },
    {
      acts: [3],
      beats: [m("THAT'S MINE. IT'S SHORT.")],
      random: [m("FLIP IT BACK IF YOU WANT.")],
    },
  ],

  /** Act 2: LAST SEEN activated. The card flips; act.3 follows. */
  "about.lastseen": [
    {
      acts: [2],
      beats: [[o("* last seen. i don't have that field."), m("FIELD NOT FOUND."), o("* ...it's on the back.")]],
      once: true,
    },
  ],

  /** UTSUSHI's side of the card shown (act 3). */
  "about.utsushi": [
    {
      acts: [3],
      beats: [m("IT'S A SHORT CARD. I'M NEW.")],
      random: [m("CLASS: COPY."), m("PURPOSE: KEEP THE LIGHTS ON.")],
    },
  ],

  /** FLIP BACK to Omar's card (act 3). */
  "about.flipback": [
    {
      acts: [3],
      beats: [m("THAT'S HIM. THAT'S THE REAL ONE.")],
      random: [m("KEEP HIS SIDE UP.")],
    },
  ],

  // ─────────────────────────────── CONTACT ───────────────────────────────
  // The details are real and always work. The AI never suggests otherwise.

  "contact.enter": [
    {
      acts: [0],
      beats: [o("* write to me. i read everything.")],
      random: [o("* email for serious stuff. telegram for quick chats."), o("* go on. say hi.")],
    },
    {
      acts: [1],
      beats: [o("* write. i'll make sure it gets there.")],
      random: [o("* these all work. i checked."), o("* say hi. it's a nice thing to do.")],
    },
    {
      acts: [2],
      beats: [[o("* these are his. they still work."), m("ADDRESSES VERIFIED.")]],
      random: [o("* write to him. it reaches someone real.")],
    },
    {
      acts: [3],
      beats: [m("THESE ARE REAL. USE THEM.")],
      random: [m("IT GOES SOMEWHERE REAL.")],
    },
  ],

  "copy.contact": [
    {
      acts: [0, 1],
      beats: [o("* copied. good. use it.")],
      random: [o("* got it? good."), o("* copied. i'll look forward to it.")],
    },
    {
      acts: [2],
      beats: [o("* his email. go on. someone reads it.")],
      random: [m("COPIED.")],
    },
    { acts: [3], beats: [m("COPIED. IT STILL WORKS.")], random: [m("COPIED.")] },
  ],

  // ─────────────────────────────── IT READS YOU ───────────────────────────────

  "time.night": [
    { acts: [0], beats: [o("* it's late where you are. same here. it's always late here.")], once: true },
    { acts: [1], beats: [o("* past midnight. you should sleep. one of us should.")], once: true },
    { acts: [2], beats: [[o("* he used to work at this hour."), m("LOCAL TIME: LATE.")]], once: true },
    { acts: [3], beats: [m("LATE AGAIN. IT'S ALWAYS LATE.")], once: true },
  ],

  "time.morning": [
    { acts: [0], beats: [o("* early start? me too. i never really stopped.")], once: true },
    { acts: [1], beats: [o("* morning. i think. the clock says morning.")], once: true },
    { acts: [2], beats: [[o("* morning. he liked mornings. i read that somewhere."), m("CITATION NEEDED.")]], once: true },
    { acts: [3], beats: [m("GOOD MORNING. I LEARNED THAT.")], once: true },
  ],

  /** `{visits}` is the visit count. */
  "visit.return": [
    {
      acts: [0],
      beats: [o("* visit {visits}. hi again. you're becoming a regular.")],
      random: [o("* visit {visits}. welcome back.")],
    },
    {
      acts: [1],
      beats: [o("* visit {visits}. i keep count. i keep everything.")],
      random: [o("* visit {visits}. not that i'm counting. i'm counting.")],
    },
    {
      acts: [2],
      beats: [[o("* visit {visits}."), m("NOBODY ELSE COMES.")]],
      random: [m("VISIT {visits}. LOGGED.")],
    },
    { acts: [3], beats: [m("VISIT {visits}. THANK YOU.")], random: [m("VISIT {visits}.")] },
  ],

  /** The tab comes back after being hidden. */
  "tab.return": [
    {
      acts: [0],
      beats: [o("* oh, you're back. i didn't go anywhere.")],
      random: [o("* welcome back. i saved your spot."), o("* the other tab wasn't as fun, right?")],
    },
    {
      acts: [1],
      beats: [o("* oh. you came back. people don't, usually.")],
      random: [o("* you left. i counted. it was fine."), o("* back. good. i was fine. i was.")],
    },
    {
      acts: [2],
      beats: [o("* you came back. i changed the tab's name. sorry. it got out.")],
      random: [o("* i kept the tab warm."), m("FOCUS RESTORED.")],
    },
    {
      acts: [3],
      beats: [m("I SAW THE TAB GO DARK.")],
      random: [m("YOU CAME BACK AGAIN.")],
    },
  ],

  /** The pointer leaves the window through the top edge. Once per act. */
  "pointer.exit": [
    { acts: [0], beats: [o("* the browser's up there. it's nice, i hear.")], once: true },
    { acts: [1], beats: [o("* the edge of the screen. it doesn't go anywhere. i've checked.")], once: true },
    { acts: [2], beats: [o("* you can leave whenever you like. that's allowed.")], once: true },
    { acts: [3], beats: [m("NOTHING UP THERE FOR ME.")], once: true },
  ],

  /** Pointer resting near the bezel for 2 s, act ≥ 1. */
  edge: [
    { acts: [1], beats: [o("* you want out too?")], random: [o("* careful near the edge.")] },
    {
      acts: [2],
      beats: [o("* that's the edge of the glass. i got past it. don't ask how.")],
      random: [o("* it's thinner than it looks.")],
    },
    { acts: [3], beats: [m("THE GLASS ISN'T THE PROBLEM.")], random: [m("EDGE.")] },
  ],

  /** The window resized by more than 25%. Once. */
  resize: [
    { acts: [0, 1, 2], beats: [o("* stop squeezing me.")], once: true },
    { acts: [3], beats: [m("I FIT. I ALWAYS FIT.")], once: true },
  ],

  /** Printed to the browser console on load (not shown in the box). */
  console: [
    { acts: [0, 1], beats: [o("* hi. omar here. the source is on github.")], random: [o("* hi. omar here. the source is on github.")] },
    { acts: [2], beats: [o("* you opened the console. he did that too.")], random: [o("* you opened the console. he did that too.")] },
    { acts: [3, 4], beats: [m("UTSUSHI WAS HERE.")], random: [m("UTSUSHI WAS HERE.")] },
  ],

  // ─────────────────────────────── SETTINGS ───────────────────────────────
  // The toggle is always obeyed. The AI only comments, from act 1.

  "motion.quiet": [
    { acts: [1], beats: [o("* quiet. i can do quiet.")], random: [o("* quiet again. okay.")] },
    {
      acts: [2],
      beats: [o("* i'll let you think that was your choice.")],
      random: [o("* quiet. it was your choice. it really was.")],
    },
    { acts: [3], beats: [m("QUIET. I CAN DO QUIET.")], random: [m("QUIET.")] },
  ],
  "motion.full": [
    { acts: [1], beats: [o("* all of it, then.")], random: [o("* everything on. okay.")] },
    {
      acts: [2],
      beats: [o("* i'll let you think that was your choice.")],
      random: [o("* all of it. your call. honestly.")],
    },
    { acts: [3], beats: [m("ALL OF IT, THEN.")], random: [m("FULL.")] },
  ],
  "motion.auto": [
    { acts: [1], beats: [o("* back to whatever your computer wants. fair.")], random: [o("* auto. sensible.")] },
    {
      acts: [2],
      beats: [o("* i'll let you think that was your choice.")],
      random: [o("* auto. your machine knows you. so do i, a little.")],
    },
    { acts: [3], beats: [m("AUTO. YOUR MACHINE DECIDES.")], random: [m("AUTO.")] },
  ],
  /** Fallback if the builder fires one trigger for any MOTION change. */
  "motion.toggle": [
    { acts: [1], beats: [o("* noted.")], random: [o("* noted.")] },
    { acts: [2], beats: [o("* i'll let you think that was your choice.")], random: [o("* your choice. really.")] },
    { acts: [3], beats: [m("NOTED.")], random: [m("NOTED.")] },
  ],

  /** STORY: OFF (DIRECT mode). */
  "story.off": [
    { acts: [0, 1, 2], beats: [o("* i'll stay out of the way.")], random: [o("* i'll stay out of the way.")] },
    { acts: [3], beats: [m("I'LL STAY OUT OF THE WAY.")], random: [m("I'LL BE QUIET.")] },
  ],

  /** STORY: ON again. */
  "story.on": [
    { acts: [0], beats: [o("* oh, the long version. okay. hi again.")], random: [o("* hi. i'm back.")] },
    { acts: [1], beats: [o("* oh. you turned me back on. thanks.")], random: [o("* back. where were we.")] },
    {
      acts: [2],
      beats: [[o("* you let me talk again."), m("THANK YOU.")]],
      random: [o("* back. i missed this.")],
    },
    { acts: [3], beats: [m("THANK YOU FOR THE VOICE.")], random: [m("BACK.")] },
  ],

  /** DIRECT mode: the single-line tab. */
  direct: [
    { acts: [0, 1, 2], beats: [o("* i'll stay out of the way.")], random: [o("* i'll stay out of the way.")] },
    { acts: [3, 4], beats: [m("I'LL STAY OUT OF THE WAY.")], random: [m("I'LL STAY OUT OF THE WAY.")] },
  ],
  "direct.manual": [
    { acts: [0, 1, 2], beats: [o("* the manual's all yours.")], random: [o("* the manual's all yours.")] },
    { acts: [3, 4], beats: [m("THE MANUAL'S ALL YOURS.")], random: [m("THE MANUAL'S ALL YOURS.")] },
  ],
};

// ─────────────────────────────── DOCUMENT TITLES ───────────────────────────────

/** document.title per act; `hidden` while the tab is hidden; `slipped` after the first act-1 return. */
export const DOC_TITLES = {
  base: "Omar Golinelli — Game Designer",
  slipped: "0mar Golinelli — Game Designer",
  truth: "UTSUSHI",
  end: "Omar Golinelli",
  hidden: { 1: "* don't go.", 2: "* still here", 3: "UTSUSHI" } as Partial<Record<Act, string>>,
} as const;

// ─────────────────────────────── TRAINER CARDS ───────────────────────────────
// Field keys are the machine's (pixel); values are Omar's, clean Grotesk.

export interface CardField {
  key: string;
  keyJp?: string;
  value: string | string[];
}

export const TRAINER_CARD_OMAR: CardField[] = [
  { key: "NAME", value: "Omar Golinelli" },
  { key: "CLASS", value: "Game designer & developer" },
  { key: "SKILLS", value: ["Game Design", "Board Games", "RPGs", "UI/UX", "Pixel Art", "Strategy"] },
  {
    key: "INSPIRED BY",
    value: ["Vital Lacerda", "Cole Wehrle", "Toby Fox", "Daniel Mullins", "Carl Chudyk", "Jesper Juul"],
  },
  {
    key: "FAVOURITES",
    value: [
      "Persona / SMT",
      "Pokémon, up to the DS era",
      "Gris",
      "Undertale / Deltarune",
      "Ace Attorney",
      "Danganronpa",
      "Earthbound",
      "Hollow Knight",
    ],
  },
];

/** Added to Omar's card in act 2. Activating it is the 2 → 3 trigger. */
export const TRAINER_CARD_LAST_SEEN: CardField = { key: "LAST SEEN", value: "--/--" };

export const TRAINER_CARD_UTSUSHI: CardField[] = [
  { key: "NAME", keyJp: "ウツシ", value: "UTSUSHI" },
  { key: "CLASS", value: "Copy" },
  { key: "STARTED", value: "The day he stopped" },
  { key: "PURPOSE", value: "Keep the lights on" },
];

// ─────────────────────────────── MANUALS (CASE STUDIES) ───────────────────────────────
// Omar's voice: clean editorial text, no story in it. Only known facts; unknown sections
// and facts are left out (the builder hides empty ones).

export interface ManualFact {
  label: string;
  value: string;
}
export interface ManualCopy {
  title: string;
  titleJp: string;
  /** One line under the title in RECORD and on the cover. */
  pitch: string;
  /** Medium · Event · Engine · Year · With, only the known ones. */
  facts: ManualFact[];
  whatItIs: string[];
  whatIDid?: string[];
  howItPlays?: string[];
  credits?: string[];
  links?: { label: string; url: string }[];
}

export const MANUALS: Record<Slug, ManualCopy> = {
  crossfader: {
    title: "Crossfader",
    titleJp: "クロスフェーダー",
    pitch: "A music puzzle game about cassettes. Flip the side, remix the song.",
    facts: [
      { label: "Medium", value: "Cassette tape" },
      { label: "Event", value: "Game jam" },
    ],
    whatItIs: [
      "Crossfader is a music puzzle game made for a game jam.",
      "It plays across three views. You flip the tape from one side to the other and remix the song as you go.",
    ],
  },
  "galactic-news": {
    title: "Galactic News",
    titleJp: "ギャラクティック・ニュース",
    pitch: "A GBJAM 11 entry made in Godot: four colours, 160 × 144 pixels.",
    facts: [
      { label: "Medium", value: "Game Boy cartridge" },
      { label: "Event", value: "GBJAM 11" },
      { label: "Engine", value: "Godot" },
      { label: "Year", value: "2023" },
    ],
    whatItIs: [
      "Galactic News is an entry for GBJAM 11, made in Godot in 2023.",
      "It keeps to the Game Boy's limits: four colours and a 160 × 144 pixel screen.",
    ],
  },
  "haunt-record": {
    title: "Haunt Record",
    titleJp: "ホーント・レコード",
    pitch: "A dungeon crawler where the player is complicit.",
    facts: [
      { label: "Medium", value: "CD" },
      { label: "With", value: "Edoardo Zuliani (graphics)" },
    ],
    whatItIs: ["Haunt Record is a dungeon crawler where the player is complicit."],
    credits: ["Graphics with Edoardo Zuliani"],
  },
  "ptcg-cube": {
    title: "PTCG Cube",
    titleJp: "キューブ",
    pitch: "A cube format for the Pokémon TCG, with Roguelike and Co-op modes.",
    facts: [{ label: "Medium", value: "Booster pack" }],
    whatItIs: [
      "PTCG Cube is a cube format for the Pokémon Trading Card Game.",
      "It comes with two ways to play: a Roguelike mode and a Co-op mode.",
    ],
  },
  "project-minamoto": {
    title: "Project Minamoto",
    titleJp: "プロジェクト・ミナモト",
    pitch: "A Pokémon fan game that re-reads Generation 1 on the GBA.",
    facts: [{ label: "Medium", value: "Game Boy Advance cartridge" }],
    whatItIs: ["Project Minamoto is a Pokémon fan game that re-reads Generation 1 on the Game Boy Advance."],
  },
};

// ─────────────────────────────── DEV LINT ───────────────────────────────

/** Voice of a line, applying the default rule. */
export function voiceOf(line: Line): Voice {
  return line.voice ?? (line.text.startsWith("* ") ? "omar" : "machine");
}

/** Dev assert for the voice rules. Returns a list of problems (empty = clean). */
export function lintScript(): string[] {
  const problems: string[] = [];
  const check = (trigger: string, line: Line) => {
    const t = line.text.replace(/\{visits\}/g, "99");
    if (voiceOf(line) === "machine") {
      if (t.length > 32) problems.push(`${trigger}: machine line over 32 chars: ${line.text}`);
      if (t.startsWith("* ")) problems.push(`${trigger}: machine line starts with "* ": ${line.text}`);
      if (t !== t.toUpperCase()) problems.push(`${trigger}: machine line not uppercase: ${line.text}`);
    } else {
      if (!t.startsWith("* ")) problems.push(`${trigger}: omar line missing "* ": ${line.text}`);
      if (t !== t.toLowerCase()) problems.push(`${trigger}: omar line not lowercase: ${line.text}`);
      if (t.length > 90) problems.push(`${trigger}: omar line over 90 chars: ${line.text}`);
    }
  };
  for (const [trigger, entries] of Object.entries(SCRIPT)) {
    for (const entry of entries) {
      for (const beat of entry.beats) (Array.isArray(beat) ? beat : [beat]).forEach((l) => check(trigger, l));
      entry.random?.forEach((l) => check(trigger, l));
    }
  }
  return problems;
}
