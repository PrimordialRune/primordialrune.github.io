// Omar's room: a small early-2000s 3D scene rendered at 640x480 and shown through a Trinitron shader.
// Systems lie around the desk with the old PC in the middle, games wait on the table, the archive is
// in the desk drawer. Everything the visitor reads (narrator, project menu, the letter) is drawn
// inside the tube.
import * as THREE from 'three';
import { loadItem, loadTexture } from './stage.js';

// The picture is always 480 lines; its width follows the window, so the tube can fill it edge to edge.
let H = 480, W = 640;
// Quiet CRT: no noise, no fringe, no bobbing, short moves. It follows the system's reduced motion until the
// visitor picks one with CRT: FULL / QUIET; that pick is kept apart from the story save.
const CRT_KEY = 'omars-room-crt', motionQ = matchMedia('(prefers-reduced-motion: reduce)');
const crtPick = (() => { try { return localStorage.getItem(CRT_KEY); } catch { return null; } })();
let quiet = crtPick ? crtPick === 'quiet' : motionQ.matches;
// The room plays as an adventure: things are hidden until found, and each game unlocks the next.
// Story mode is the default; ?free opens every object at once (no memories, no locks)
const STORY = !new URLSearchParams(location.search).has('free');
let DUR = quiet ? 0.35 : 1.1;
// Keep tweens on wall-clock time even when a slow GPU drops frames.
gsap.ticker.lagSmoothing(0);

// ---------- data ----------
const manifest = (await fetch('manifest.json').then((r) => r.json())).items;
const byId = Object.fromEntries(manifest.map((i) => [i.id, i]));

// Real sizes (longest side, metres) and where each object lives. `pose` turns the model before it is
// placed (consoles lie on their backs), `rotY` scatters it on the surface.
const DESK_Y = 0.75, TABLE_Y = 0.46;
const PLACES = [
  // desk: the PC in the middle, the handhelds left where they were last played
  { id: 'pc', spot: 'desk', size: 0.62, pos: [0, DESK_Y, -0.66], rotY: 0.04 },
  { id: 'crossfader-player', spot: 'desk', size: 0.16, pos: [-0.56, DESK_Y, -0.66], pose: [['x', -90]], rotY: 0.55 },
  { id: 'gb-console', spot: 'desk', size: 0.148, pos: [-0.42, DESK_Y, -0.36], pose: [['z', 90]], rotY: -Math.PI / 2 + 0.4 },
  { id: 'gba-console', spot: 'desk', size: 0.145, pos: [0.4, DESK_Y, -0.36], pose: [['x', -90]], rotY: -0.3 },
  { id: 'ds-console', spot: 'desk', size: 0.15, pos: [0.56, DESK_Y, -0.66], rotY: -0.65 },
  // the letter lies on the keyboard, left for you, and above where the dialogue box sits
  { id: 'envelope', spot: 'desk', envelope: true, pos: [-0.02, DESK_Y + 0.02, -0.42], rotY: 0.08 },
  // table: the games, lying flat
  { id: 'gb-cart', spot: 'table', size: 0.065, fix: [-12.75, 12, -11], pos: [-1.62, TABLE_Y, -0.2], flat: true, rotY: 0.3 },
  { id: 'gba-cart', spot: 'table', size: 0.057, pos: [-1.5, TABLE_Y, -0.08], flat: true, rotY: -0.2 },
  { id: 'ds-cart', spot: 'table', size: 0.035, pos: [-1.4, TABLE_Y, -0.2], flat: true, rotY: 0.5 },
  { id: 'crossfader-cassette', spot: 'table', size: 0.1, pos: [-1.33, TABLE_Y, -0.02], flat: true, rotY: 0.15 },
  { id: 'holon-disc', spot: 'table', jewel: 'holon', pos: [-1.72, TABLE_Y, 0.02], rotY: -0.35 },
  { id: 'spacerim-disc', spot: 'table', jewel: 'spacerim', pos: [-1.56, TABLE_Y, 0.18], rotY: 0.2 },
  { id: 'ptcg-cube-rulebook', spot: 'table', size: 0.28, pos: [-1.2, TABLE_Y, 0.16], rotY: -0.3 },
  // drawer: the archive
  { id: 'cd-jewel', spot: 'drawer', jewel: 'haunt-record', pos: [0, -0.06, 0.04], rotY: 0.1 },
];
// In the story, Galactic News waits on the desk beside the Game Boy, and its postcard arrives later.
if (STORY) {
  Object.assign(PLACES.find((p) => p.id === 'gb-cart'), { spot: 'desk', pos: [-0.62, DESK_Y, -0.46], rotY: -0.5 });
  PLACES.push({ id: 'postcard', spot: 'desk', postcard: true, pos: [0.33, DESK_Y, -0.54], rotY: -0.3 });
}

// What plays what. The GBA reads Game Boy cartridges too; the PC reads every disc.
const PLAYS = {
  'pc': ['holon-disc', 'spacerim-disc', 'cd-jewel'],
  'gb-console': ['gb-cart'],
  'gba-console': ['gba-cart', 'gb-cart'],
  'ds-console': ['ds-cart'],
  'crossfader-player': ['crossfader-cassette'],
};
const SYSTEM_OF = {};
for (const [sys, games] of Object.entries(PLAYS)) for (const g of games) SYSTEM_OF[g] ??= sys;

// Where a game goes into each system, in the system's own normalised frame (longest side = 1).
// slot: the opening; dir: the way the game slides in; euler: how the game turns to fit;
// extent: the game's length along dir; stick: how much of it stays outside.
const SLOTS = {
  'gb-console': { slot: [-0.035, 0.5, 0], dir: [0, -1, 0], euler: [0, 0, 0], extent: 1, stick: 0.38 },
  'gba-console': { slot: [0, 0.331, -0.02], dir: [0, -1, 0], euler: [0, Math.PI / 2, 0], extent: 0.585, stick: 0.33 },
  'ds-console': { slot: [0, -0.26, -0.15], dir: [0, 0, 1], euler: [0, 0, 0], extent: 1, stick: 0.1, lift: 0.012, back: 0.3 },
};

// Project facts: only what the site already states.
const PROJECTS = {
  'gb-cart': { title: 'Galactic News', kana: 'ギャラクティック・ニュース', medium: 'GAME BOY CARTRIDGE', pitch: 'A GBJAM 11 entry for the Game Boy, made in Godot: four colours, 160 × 144 pixels.', part: 'Game design, pixel art and UI art' },
  'gba-cart': { title: 'Project Minamoto', kana: 'プロジェクト・ミナモト', medium: 'GAME BOY ADVANCE CARTRIDGE', pitch: 'A Pokémon fan game that re-reads Generation 1 on the GBA.' },
  'ds-cart': { title: 'Legends Arise', kana: 'レジェンズ・アライズ', medium: 'NINTENDO DS GAME CARD', pitch: 'A Pokémon Platinum fan game, built on the original DS hardware and set around Veilstone City.' },
  'crossfader-cassette': { title: 'Crossfader', kana: 'クロスフェーダー', medium: 'CASSETTE', pitch: 'A game jam game about cassettes: a music puzzle in three views. Flip the side, remix the song.', part: 'Project coordinator, game designer and UI/UX designer: all the UI, the level design, and an art direction that stays cohesive' },
  'holon-disc': { title: 'Holon', kana: 'ホロン', medium: 'PC DISC', pitch: 'A simulator for the RS-PK retro format of the Pokémon TCG (the EX era), designed for digital. Closed alpha, version 0.1.2.', part: 'Game design, visual design, art direction and development, building the code with AI help' },
  'spacerim-disc': { title: 'SpaceRim', kana: 'スペースリム', medium: 'PC DISC', pitch: 'A rhythm game with RPG boss battles, played by typing spells. Made in 48 hours for Castle Game Jam, October 2023.', part: 'Game designer, pixel artist and UI artist: I drew the bosses and wrote their spells' },
  'ptcg-cube-rulebook': { title: 'PTCG Cube', kana: 'キューブ', medium: 'RULEBOOK', pitch: 'A cube format for the Pokémon TCG, with Roguelike and Co-op modes. This is its rulebook.' },
  'cd-jewel': { title: 'Haunt Record', kana: 'ホーント・レコード', medium: 'ARCHIVED DISC', pitch: 'A dungeon crawler where the player is complicit. Graphics with Edoardo Zuliani.', part: 'Game design, programming, UI design and game graphics' },
};

// The letter in the envelope: Omar's own voice (normal case), facts from the site's status window.
// DRAFT copy for Omar to rewrite.
const LETTER = {
  name: 'OMAR GOLINELLI',
  role: 'Game designer & developer',
  kana: 'ゲームデザイナー',
  body: [
    'Hi, I’m Omar.',
    'I design board games and video games, and I care most about the metaphor a game is built on: the object you hold, the medium it arrives in, the story it tells by how it plays.',
    'I grew up on the Game Boy and the GBA, and Japanese games still shape most of what I make. Everything in this room is something I made. Pick it up.',
  ],
  skills: 'Game Design · Board Games · RPGs · UI/UX · Pixel Art · Strategy',
  contacts: [
    { label: 'EMAIL', note: 'primordialrune@gmail.com', url: 'mailto:primordialrune@gmail.com' },
    { label: 'TELEGRAM', note: '@PrimordialRune', url: 'https://t.me/PrimordialRune' },
    { label: 'GITHUB', note: 'github.com/PrimordialRune', url: 'https://github.com/PrimordialRune' },
    { label: 'INSTAGRAM', note: '@primordialrune', url: 'https://instagram.com/primordialrune' },
  ],
};

// The narrator, in Omar's lowercase "* " voice. Act 1 only: a guide who is a little too attentive.
const LINES = {
  boot: ['* oh. you’re here. sit, sit.', '* this is my room. well. where i keep my games.', '* the things on the desk play the things on the table. try one.'],
  hover: {
    'pc': '* my old pc. it still has a cd drive.',
    'gb-console': '* my first one was grey too. everyone’s was.',
    'gba-console': '* it still plays the grey ones. it remembers.',
    'ds-console': '* two screens. i only ever looked at one.',
    'crossfader-player': '* a tape deck. crossfader only makes sense on one.',
    'envelope': '* that’s for you. it’s about me.',
    'gb-cart': '* galactic news. four colours.',
    'gba-cart': '* minamoto. gen 1, again.',
    'ds-cart': '* legends arise. sinnoh, near veilstone.',
    'crossfader-cassette': '* side a. always side a first.',
    'holon-disc': '* holon. the logo took longer than some games.',
    'spacerim-disc': '* spacerim. i drew the bosses, and wrote what they cast.',
    'ptcg-cube-rulebook': '* the rulebook. i wrote every page. in italian.',
    'cd-jewel': '* that one’s old.',
  },
  choose: {
    'pc': '* a disc. any of the cases.',
    'gb-console': '* the grey cartridge. it goes in the top.',
    'gba-console': '* anything that fits. grey ones too.',
    'ds-console': '* the little card. careful, it’s small.',
    'crossfader-player': '* the cassette. it only takes the one.',
  },
  wrong: '* that doesn’t go in there.',
  nothingYet: '* nothing for that one yet. keep looking.',
  chooseHelp: () => touchUI ? '* one of the lit ones. or b, if you changed your mind.' : '* one of the lit ones. or esc, if you changed your mind.',
  rulebook: '* you don’t put this one in anything. you read it.',
  letter: '* go on. it’s short. i wrote it myself.',
  idle: ['* ...you can look around, you know.', '* the drawer’s just old stuff.', '* take your time. i have plenty.'],
  drawer: '* that one’s archived. it doesn’t— it’s fine.',
  takeOut: '* take it out first.',
};

// ---------- the story (?story) ----------
// Chapter 1: only the PC, the Game Boy, its cartridge and the letter are out. Galactic News is a
// game about delivering mail, so playing it delivers a postcard, and the postcard opens the table.
// Minamoto re-reads Gen 1 on newer hardware, so the GBA wakes for an old Game Boy cartridge first.
// Chapter 2: the Cube rulebook is a draft. Reading it offers three face-down picks (a cassette, a disc,
// a card); each pick turns up on the table, and once it's played the rulebook offers the next one.
// Holon leaves SpaceRim behind; Crossfader's side B is the drawer's tune, and the drawer holds Haunt Record.
// Every game played gives back one memory; the logo in the corner fills one step per memory.
const STORY_LINES = {
  boot: ['* oh. you’re here. sit, sit.', '* this is my room. where i keep the games i made.', '* the envelope’s for you. it’s about me, and how to reach me.', '* everything else is asleep. start with the grey one.'],
  back: ['* you’re back. i kept everything where you left it.'],
  // a finished run, back again: it has nothing left to show
  backDone: ['* you’re back. nothing else turned up.', '* i looked everywhere.'],
  postcard: '* mail. for you. galactic news still delivers.',
  postcardHover: '* that wasn’t there before.',
  table: '* the table. go on, it’s set for you.',
  findGba: ['* that one needs the advance.', '* it was under some papers. here.'],
  gbaAsleep: '* it’s asleep. give it something old. it remembers old things.',
  gbaRefuses: '* not that one yet. something older first.',
  gbaWakes: '* old game, new hardware. that’s minamoto.',
  minamoto: '* rereading it with my hands.',
  rulebook: '* a rulebook, on the table. i wrote it. it deals what comes next.',
  draft: ['* a cube is drafted. open the pack, keep one, pass the rest.', '* you pick first.'],
  draftNext: '* your turn again. the rulebook has another pick.',
  draftAgain: '* another pack. keep one, pass the rest.',
  draftLast: '* last pack. one card in it. it’s yours.',
  draftWait: '* play your pick first. then we draft again.',
  picked: {
    'crossfader-cassette': '* the cassette. two sides, and both of them matter.',
    'holon-disc': '* heavy case. it’s mostly numbers.',
    'ds-cart': '* the little card. the smallest thing in the room.',
  },
  find: {
    'crossfader-player': ['* that needs its tape deck.', '* it was behind the monitor. here.'],
    'ds-console': ['* that needs the ds.', '* it was still charging. here.'],
  },
  spacerim: ['* the drive had another disc in it.', '* oh. i’d forgotten that one.', '* spacerim. a jam, forty-eight hours. it’s on the table.'],
  drawerOpens: ['* side b. that’s the drawer’s tune.', '* it’s open now. the old stuff is in there.'],
  complete: ['* that’s all eight.', '* the envelope’s still on the desk. if you want to write back.', '* ...you can stay, you know. i’ll keep the room as it is.'],
  torch: ['* hm. the lamp’s going.', '* here. a flashlight. point it at things.'],
  // the draft's last pick is played: the pack is empty, and the drawer may still be waiting
  lastPick: '* that was the last pick. the pack’s empty.',
  drawerStill: '* the drawer’s still open.',
  // after 8/8, with nothing left to point at: each once, a long way apart
  after: ['* take your time. i have plenty.', '* it’s quieter with everything out.', '* i’ll be here.'],
  // each game's own line when it starts, in ?free too
  played: {
    'gb-cart': '* nobody trusts the web out there. you deliver the paper.',
    'gba-cart': '* rereading it with my hands.',
    'crossfader-cassette': '* flip the side, and the song changes under you.',
    'holon-disc': '* a card game rebuilt for a screen, not copied from a table.',
    'spacerim-disc': '* the keyboard’s your only weapon. type the spell, or it hits you.',
    'ds-cart': '* two screens, and this time i looked at both.',
    'cd-jewel': '* you’re not the hero in this one.',
  },
  ejectTip: '* when you’re done, take it out. things turn up.',
  ejectNudge: '* eject it when you’re done. see what turns up.',
  drawerLocked: '* that’s just old stuff. it’s stuck anyway.',
  skip: '* everything’s out. no story, just the games.',
  hints: [
    // [condition, gentle nudge, plain instruction]
    [() => !story.played.has('gb-cart'), '* the grey one. the cartridge is right next to it.', '* use the game boy, then the cartridge beside it.'],
    [() => !story.flags.has('postcard-read'), '* something came in the mail.', '* the postcard on the desk. read it.'],
    [() => !story.found.has('gba-console'), '* there’s something new on the table.', '* the table, top right. play the cartridge waiting there.'],
    [() => !story.flags.has('gba-awake'), '* the advance is asleep. it remembers old things.', '* use the advance, then the grey cartridge.'],
    [() => !story.played.has('gba-cart'), '* it’s awake now. minamoto fits.', '* use the advance, then the minamoto cartridge on the table.'],
    [() => !DRAFT.some((g) => story.found.has(g)), '* the rulebook on the table. it’s your pick.', '* go to the table and use the rulebook, then pick a game.'],
    [() => DRAFT.some((g) => story.found.has(g) && !story.played.has(g)), '* you picked one. go on, play it.', '* the game you picked is on the table. open it and choose play it.'],
    [() => story.found.has('spacerim-disc') && !story.played.has('spacerim-disc'), '* there’s a second disc on the table now.', '* play spacerim: the second disc on the table.'],
    [() => story.found.has('cd-jewel') && !story.played.has('cd-jewel'), '* the old disc. it’s been in there a while.', '* go to the drawer and play the disc inside.'],
    [() => DRAFT.some((g) => !story.found.has(g)), '* the rulebook has another pick.', '* use the rulebook on the table and pick the next game.'],
  ],
};
LINES.hover.postcard = STORY_LINES.postcardHover;
const GAMES = ['gb-cart', 'gba-cart', 'ptcg-cube-rulebook', 'crossfader-cassette', 'holon-disc', 'ds-cart', 'spacerim-disc', 'cd-jewel'];
const DRAFT = ['crossfader-cassette', 'holon-disc', 'ds-cart'];
const DRAFT_FACE = { 'crossfader-cassette': ['A CASSETTE', 'two sides'], 'holon-disc': ['A DISC', 'heavy case'], 'ds-cart': ['A CARD', 'very small'] };
const SAVE_KEY = 'omars-room';
const story = (() => {
  const s = { found: ['pc', 'gb-console', 'gb-cart', 'envelope'], played: [], spots: ['desk'], flags: [] };
  if (STORY) {
    try {
      if (new URLSearchParams(location.search).has('reset')) {
        localStorage.removeItem(SAVE_KEY);
        // drop ?reset from the address, so coming back from a case study (history.back) doesn't reset the run again
        history.replaceState(null, '', location.pathname + location.search.replace(/([?&])reset\b&?/, '$1').replace(/[?&]$/, '') + location.hash);
      }
      Object.assign(s, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'));
    } catch { /* no storage: the run just isn't kept */ }
  }
  return { found: new Set(s.found), played: new Set(s.played), spots: new Set(s.spots), flags: new Set(s.flags) };
})();
// A beat can be cut off: a reload mid-play, or a case study opened while a game was still in.
// Apply whatever the saved state already owes, silently, before anything is placed (place() reads isFound).
// No openSpot or reveal here: there are no objects yet. storyEjected keeps the animated version for the live case.
// The lamp goes after the first draft game: if that was cut off, the lamp is simply dim at load.
function catchUp() {
  const { found, played, spots, flags } = story;
  if (played.has('gb-cart') && !found.has('postcard')) found.add('postcard');
  if (played.has('gba-cart') && !found.has('ptcg-cube-rulebook')) found.add('ptcg-cube-rulebook');
  if (DRAFT.some((g) => played.has(g)) && !flags.has('torch')) flags.add('torch');
  if (played.has('holon-disc') && !found.has('spacerim-disc')) found.add('spacerim-disc');
  if (played.has('crossfader-cassette') && !spots.has('drawer')) { spots.add('drawer'); found.add('cd-jewel'); }
  if (played.size === GAMES.length) flags.add('complete');
  if (spots.has('drawer') && !flags.has('saw-drawer')) flags.add('saw-drawer'); // a save from before the slip was kept: it isn't replayed
  persist();
}
if (STORY) catchUp();
const returning = STORY && (story.played.size > 0 || story.flags.has('skipped')); // a skipped run has been here: everything is out, so no first-visit boot
function persist() {
  if (!STORY) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(Object.fromEntries(Object.entries(story).map(([k, v]) => [k, [...v]])))); } catch { /* ignore */ }
}
const isFound = (id) => !STORY || story.found.has(id);
const spotOpen = (s) => !STORY || story.spots.has(s);
const gbaAwake = () => !STORY || story.flags.has('gba-awake');

// Every CC BY model in the room is credited under the TV, as the licence asks.
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const seen = new Set();
const CREDIT_ITEMS = PLACES.filter((p) => !p.jewel && !p.envelope).map((p) => byId[p.id]).filter((i, k, a) => i && !i.real && i.credit?.url && a.findIndex((j) => j?.credit?.url === i.credit.url) === k);
const CREDIT_TEXT = CREDIT_ITEMS.map((i) => `“${i.credit.title}” by ${i.credit.author}`).join(' · ') + '. All CC BY 4.0, via Sketchfab. Jewel cases, CD tray and envelope are drawn in code; label and screen art, the Crossfader models and the Cube rulebook are Omar’s own work.';
document.getElementById('credits').innerHTML = PLACES.filter((p) => !p.jewel && !p.envelope).map((p) => byId[p.id]).filter((i) => i && !i.real && i.credit?.url && !seen.has(i.credit.url) && seen.add(i.credit.url))
  .map((i) => `“<a href="${esc(i.credit.url)}" target="_blank" rel="noopener">${esc(i.credit.title)}</a>” by ${esc(i.credit.author)}, ${esc(i.credit.license)}`).join(' · ') +
  '. Jewel cases, CD tray and envelope are drawn here; all label and screen art, the Crossfader models and the Cube rulebook are Omar’s own work.';

// ---------- renderer + CRT ----------
const canvas = document.getElementById('crt');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
// Lite mode on phones and small machines: no shadows, 1x output. ?lite and ?full force either.
const qs = new URLSearchParams(location.search);
const lite = qs.has('lite') || (!qs.has('full') && (matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4));
renderer.setPixelRatio(lite ? 1 : Math.min(devicePixelRatio, 1.5)); // the picture is 480 lines anyway: past 1.5x only the glass's edge gets sharper
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = !lite;
renderer.shadowMap.type = THREE.PCFShadowMap;
// Shadows only change when something moves: the loop redraws them while a tween runs, and for a couple
// of frames after anything turns up or the window changes (reshadow). At rest they are reused.
renderer.shadowMap.autoUpdate = false;
let shadowFrames = 2;
const reshadow = () => { shadowFrames = 2; };
canvas.addEventListener('webglcontextrestored', () => reshadow()); // a restored context starts with empty shadow maps
let powered = false; // true from the first frame the room draws (see powerOn)
const rt = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, samples: 0 });
rt.texture.colorSpace = THREE.SRGBColorSpace;

const ui = document.createElement('canvas'); ui.width = W; ui.height = H;
const g2 = ui.getContext('2d');
// the CRT pass writes what it samples straight to the screen (no re-encode), so the windows' canvas bytes go in as they are:
// decoded as sRGB they came out linear, blood orange as the AI's red and peacock blue as black (P4)
const uiTex = new THREE.CanvasTexture(ui); uiTex.minFilter = uiTex.magFilter = THREE.NearestFilter; uiTex.colorSpace = THREE.NoColorSpace;

// Trinitron glass is curved left-to-right only, so the bend is mostly horizontal.
const CURVE = 'vec2 curve(vec2 uv){ uv = uv * 2.0 - 1.0; uv.x *= 1.0 + 0.045 * uv.y * uv.y; uv.y *= 1.0 + 0.012 * uv.x * uv.x; return uv * 0.5 + 0.5; }';
function curve(u, v) { let x = u * 2 - 1, y = v * 2 - 1; x *= 1 + 0.045 * y * y; y *= 1 + 0.012 * x * x; return [x * 0.5 + 0.5, y * 0.5 + 0.5]; }

const crtMat = new THREE.ShaderMaterial({
  uniforms: { tScene: { value: rt.texture }, tUI: { value: uiTex }, uTime: { value: 0 }, uBurst: { value: 0 }, uPower: { value: 0 }, uOut: { value: new THREE.Vector2(1, 1) }, uQuiet: { value: quiet ? 1 : 0 }, uClean: { value: 0 }, uRect: { value: new THREE.Vector4(0, 0, 0, 0) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D tScene, tUI; uniform float uTime, uBurst, uPower, uQuiet, uClean; uniform vec2 uOut; uniform vec4 uRect;
    ${CURVE}
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    vec3 tap(vec2 uv){
      vec4 s = texture2D(tScene, uv);
      vec4 u = texture2D(tUI, uv);
      return mix(s.rgb, u.rgb, u.a);
    }
    void main(){
      vec2 uv = curve(vUv);
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
      // power-on: the picture opens from a bright line
      float open = smoothstep(0.0, 1.0, uPower);
      float band = abs(uv.y - 0.5) * 2.0;
      if (band > open * 1.02) { gl_FragColor = vec4(vec3(0.0), 1.0); return; }
      // VHS burst: torn lines, only on events
      float line = floor(uv.y * 240.0);
      float tear = uBurst * (hash(vec2(line, floor(uTime * 30.0))) - 0.5) * 0.06 * step(0.7, hash(vec2(line * 0.37, floor(uTime * 12.0))));
      uv.x += tear;
      // convergence: a hair of red/blue misregistration
      float c = (0.0009 + uBurst * 0.004) * (1.0 - uQuiet);
      vec3 col;
      col.r = tap(uv + vec2(c, 0.0)).r;
      col.g = tap(uv).g;
      col.b = tap(uv - vec2(c, 0.0)).b;
      // phosphor glow: cheap 4-tap bloom
      vec3 glow = (tap(uv + vec2(0.003, 0.0)) + tap(uv - vec2(0.003, 0.0)) + tap(uv + vec2(0.0, 0.004)) + tap(uv - vec2(0.0, 0.004))) * 0.25;
      col += max(glow - 0.45, 0.0) * 0.6;
      // scanlines locked to the 480-line picture
      float sl = 0.78 + 0.22 * pow(sin(uv.y * 480.0 * 3.14159), 2.0);
      col *= sl;
      // aperture grille: vertical RGB stripes (Trinitron, not a shadow mask)
      float px = mod(gl_FragCoord.x, 3.0);
      vec3 mask = px < 1.0 ? vec3(1.0, 0.82, 0.82) : px < 2.0 ? vec3(0.82, 1.0, 0.82) : vec3(0.82, 0.82, 1.0);
      col *= mix(vec3(1.0), mask, 0.55);
      // two damper wires, faint, at 1/3 and 2/3 height: every Trinitron has them
      col *= 1.0 - 0.18 * (1.0 - smoothstep(0.0, 0.0012, abs(uv.y - 0.333))) - 0.18 * (1.0 - smoothstep(0.0, 0.0012, abs(uv.y - 0.667)));
      // vignette + noise
      vec2 d = uv - 0.5; col *= 1.0 - dot(d, d) * 0.9;
      col += (hash(uv * uOut + uTime * (1.0 - uQuiet)) - 0.5) * (0.035 + uBurst * 0.25) * (1.0 - uQuiet);
      col *= 1.0 + 0.6 * (1.0 - smoothstep(0.0, 0.08, abs(band - open))) * (1.0 - open);
      col *= 1.12;
      // an information window (project facts, memories, credits) is read, not looked at: it sits on the glass clean (P1)
      vec4 ui = texture2D(tUI, uv);
      float inRect = step(uRect.x, uv.x) * step(uv.x, uRect.z) * step(uRect.y, uv.y) * step(uv.y, uRect.w);
      // (the window's fill is 96% opaque: inside the rect it counts as solid, so no fringed room bleeds through its text)
      col = mix(col, ui.rgb, min(1.0, ui.a * 1.05) * uClean * inRect);
      gl_FragColor = vec4(col, 1.0);
    }`,
  depthTest: false, depthWrite: false,
});
const quadScene = new THREE.Scene();
quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), crtMat));
const quadCam = new THREE.Camera();

let cam = null; // the room camera, once it exists
// Phones sideways become a handheld: a 4:3 tube in the middle, the pad and the nav on the left bezel, A and B on the right.
const navEl = document.getElementById('nav'), bezelL = document.querySelector('.bezel.left'), bezelR = document.querySelector('.bezel.right'), fineEl = document.querySelector('.fine');
let coarse = matchMedia('(pointer: coarse)').matches, handheld = null; // null until the first layout, so a desktop is laid out too
function layout() {
  const hh = coarse && innerWidth / innerHeight > 1.75;
  if (hh === handheld) return;
  handheld = hh;
  document.body.classList.toggle('handheld', hh);
  // the handheld's letter is short on height: the contacts come straight after the name, before the paragraphs (in the DOM too, so reading order matches)
  const ct = document.querySelector('#letter .contacts');
  if (ct) { if (hh) document.querySelector('#letter .body').before(ct); else document.querySelector('#letter .skills').after(ct); }
  // on a desktop the small print leaves the bezel and follows the nav, so Tab reaches it (pills on focus, bottom right)
  if (hh) { bezelL.prepend(navEl); bezelR.append(fineEl); } else { document.querySelector('body > footer').before(navEl); navEl.after(fineEl); }
  // the sticker on the chin is the desktop's quick view: no second one in the row
  const q = fineEl.querySelector('a[href^="quick/"]'); if (q) q.hidden = !hh && !!document.querySelector('.sticker');
}
function resize() {
  layout(); reshadow();
  const r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return;
  renderer.setSize(r.width, r.height, false);
  crtMat.uniforms.uOut.value.set(r.width, r.height);
  H = r.height < 520 ? 400 : 480; // short screens (phones sideways) get fewer lines, so the text inside reads bigger
  // The picture keeps the glass's own shape, so nothing is ever stretched. A phone sideways with the
  // browser bar showing is wider than 2.4:1 (a Pixel 10 is about 2.7:1), so the cap is generous.
  W = Math.round(H * Math.min(3.4, Math.max(1, r.width / r.height)));
  rt.setSize(W, H);
  // a canvas texture keeps the size it was first uploaded at: a new size needs a new texture,
  // or the tube shows the old picture smeared (turning a phone sideways did exactly that)
  if (ui.width !== W || ui.height !== H) { ui.width = W; ui.height = H; uiTex.dispose(); }
  // past 16:9 the lens stops widening (a wide window gets more room, not a fisheye): hold the horizontal angle
  // narrower than 4:3 (a half-screen window, a tablet upright): open the lens upward so the desk's ends stay in the picture
  if (cam) {
    cam.aspect = W / H; const k = cam.aspect < 4 / 3 ? (4 / 3) / cam.aspect : Math.min(1, 1.78 / cam.aspect);
    cam.fov = Math.min(80, 2 * Math.atan(Math.tan(25 * Math.PI / 180) * k) * 180 / Math.PI); cam.updateProjectionMatrix();
  }
}
addEventListener('resize', resize);
// rotating a phone or going fullscreen can resize the glass after the window event, so watch the canvas itself
new ResizeObserver(() => resize()).observe(canvas);
resize();

// ---------- the room ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06090b);
scene.fog = new THREE.Fog(0x06090b, 2.6, 5.5);
const camera = new THREE.PerspectiveCamera(50, W / H, 0.02, 20);
cam = camera; resize();

const sky = new THREE.HemisphereLight(0x7f9fae, 0x1a120c, 0.9); scene.add(sky);
const lamp = new THREE.SpotLight(0xffd6a0, 9, 4, 0.75, 0.6, 1.4);
lamp.position.set(-0.35, 1.6, 0.1); lamp.target.position.set(0, 0.75, -0.55);
lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0005;
scene.add(lamp, lamp.target);
const fill = new THREE.PointLight(0x4eb99f, 1.2, 3, 2); fill.position.set(-1.5, 1.2, 0.6); scene.add(fill);

function woodTexture(base, dark) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) { x.strokeStyle = dark; x.globalAlpha = 0.08 + Math.random() * 0.14; x.lineWidth = 1 + Math.random() * 3; x.beginPath(); const y = Math.random() * 256; x.moveTo(0, y); for (let k = 0; k <= 256; k += 32) x.lineTo(k, y + Math.sin(k * 0.03 + i) * 4); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; return t;
}
const wood = new THREE.MeshStandardMaterial({ map: woodTexture('#4a3426', '#22140a'), roughness: 0.8 });
const woodDark = new THREE.MeshStandardMaterial({ map: woodTexture('#3b2617', '#140a04'), roughness: 0.85 });
const wallMat = new THREE.MeshStandardMaterial({ color: 0x173a44, roughness: 1 });
const floorMat = new THREE.MeshStandardMaterial({ map: woodTexture('#2a1d14', '#0f0905'), roughness: 0.95 });
floorMat.map.repeat.set(6, 6);

function box(w, h, d, mat, x, y, z, shadow = true, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}
// walls and floor
const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), floorMat); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
box(8, 3, 0.05, wallMat, 0, 1.5, -1.0, false);
box(0.05, 3, 8, wallMat, -2.4, 1.5, 0, false);
// desk: wide enough for the PC and the handhelds around it
box(1.7, 0.04, 0.8, wood, 0, DESK_Y - 0.02, -0.58);
for (const [x, z] of [[-0.8, -0.95], [-0.8, -0.22], [0.8, -0.95]]) box(0.05, DESK_Y - 0.04, 0.05, woodDark, x, (DESK_Y - 0.04) / 2, z);
// drawer cabinet (right side) and the drawer that slides out
box(0.46, DESK_Y - 0.06, 0.7, woodDark, 0.55, (DESK_Y - 0.06) / 2, -0.58);
const drawer = new THREE.Group(); drawer.position.set(0.55, DESK_Y - 0.17, -0.58); scene.add(drawer);
const dFront = box(0.44, 0.15, 0.02, wood, 0, 0, 0.355, true, drawer);
const knob = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), new THREE.MeshStandardMaterial({ color: 0xb08850, metalness: 0.7, roughness: 0.3 })); knob.position.set(0, 0, 0.37); drawer.add(knob);
box(0.42, 0.01, 0.66, woodDark, 0, -0.065, 0.02, false, drawer);
for (const sx of [-0.205, 0.205]) box(0.01, 0.12, 0.66, woodDark, sx, -0.005, 0.02, false, drawer);
box(0.42, 0.12, 0.01, woodDark, 0, -0.005, -0.31, false, drawer);
dFront.userData.hit = 'drawer'; knob.userData.hit = 'drawer';
const DRAWER_SHUT = -0.58, DRAWER_OPEN = -0.26;
// lamp
const lampMat = new THREE.MeshStandardMaterial({ color: 0x1c3b36, metalness: 0.4, roughness: 0.5 });
box(0.14, 0.02, 0.14, lampMat, -0.66, DESK_Y + 0.01, -0.86);
const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.62), lampMat); arm.position.set(-0.63, DESK_Y + 0.31, -0.79); arm.rotation.x = 0.35; scene.add(arm);
const shade = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.12, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x1c3b36, side: THREE.DoubleSide, metalness: 0.3, roughness: 0.6 }));
shade.position.set(-0.57, 1.47, -0.59); shade.rotation.x = -0.5; scene.add(shade);
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe2b0 })); bulb.position.set(-0.565, 1.43, -0.575); scene.add(bulb);
// side table for the games
box(0.8, 0.035, 0.7, wood, -1.48, TABLE_Y - 0.0175, -0.02);
for (const [x, z] of [[-1.84, -0.33], [-1.84, 0.29], [-1.12, -0.33], [-1.12, 0.29]]) box(0.04, TABLE_Y - 0.035, 0.04, woodDark, x, (TABLE_Y - 0.035) / 2, z);
const drawerLight = new THREE.PointLight(0x9fd8d0, 1.6, 1.2, 1.5); drawerLight.position.set(0.55, 0.95, 0.1); scene.add(drawerLight);
const tableLamp = new THREE.PointLight(0xffb070, 4.5, 2.2, 1.6); tableLamp.position.set(-1.3, 1.05, 0.25); tableLamp.castShadow = true; scene.add(tableLamp); // its shadows stay: without them the table's games read washed out
// Lighting: 2 is the room's light (Omar's pick); ?light=1 is the darker first version, 3 a little brighter.
// Lamps grow less than the ambient so the pools of light still read as lamps.
const LIGHT = { 1: [1, 1, 5.5], 2: [1.45, 1.2, 6.5], 3: [1.9, 1.4, 7.5] }[new URLSearchParams(location.search).get('light') || '2'] || [1.45, 1.2, 6.5];
sky.intensity *= LIGHT[0];
for (const l of [lamp, fill, drawerLight, tableLamp]) l.intensity *= LIGHT[1];
scene.fog.far = LIGHT[2];
// The flashlight: held at the camera, it points wherever the cursor (or, on a phone, the aim) is.
// The story hands it over when the desk lamp starts to go; ?torch switches it on outside the story.
const torch = new THREE.SpotLight(0xfff1d6, 0, 3.2, 0.2, 0.55, 1.2);
scene.add(torch, torch.target);
const TORCH = 6;
if (new URLSearchParams(location.search).has('torch')) torch.intensity = TORCH;
// a poster on the wall, so the room is somebody's: the NES stripes
const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshStandardMaterial({ color: 0xfce8cd, roughness: 1 }));
poster.position.set(0.6, 1.5, -0.97); scene.add(poster);
for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.018), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(0xec / 255, 0x56 / 255, 0x3b / 255, THREE.LinearSRGBColorSpace) })); s.position.set(0.6, 1.3 + i * 0.03, -0.968); scene.add(s); }

// ---------- Omar's logo, drawn once for the monitor and the wax seal ----------
const LOGO_OUTER = 'M260.32,454.02l-159.33-159.33c-8.33-8.33-8.33-21.82,0-30.15l168.17-168.17c4-4,9.42-6.24,15.08-6.24h159.92c5.17,0,6.81-6.96,2.19-9.27L289.14,2.25c-8.21-4.1-18.12-2.5-24.61,3.99L6.24,264.53c-8.33,8.33-8.33,21.82,0,30.15l254.08,254.08c8.33,8.33,21.82,8.33,30.15,0l260.8-260.79c3.08-3.08.9-8.36-3.46-8.36h-72.56c-6.63,0-13,2.64-17.69,7.33l-167.08,167.08c-8.33,8.33-21.82,8.33-30.15,0Z';
const LOGO_INNER = 'M551.25,137.49h-263.74c-7.75,0-15.19,3.08-20.67,8.56l-125.39,125.39c-3.01,3.01-.88,8.16,3.38,8.16h101.34c16.14,0,29.23,13.09,29.23,29.23v101.34c0,4.26,5.15,6.39,8.16,3.38l270.14-270.14c2.19-2.19.64-5.92-2.45-5.92Z';
function drawLogo(ctx, x, y, size, outer = '#102f41', inner = '#ec563b') {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 555, size / 555);
  ctx.fillStyle = outer; ctx.fill(new Path2D(LOGO_OUTER));
  ctx.fillStyle = inner; ctx.fill(new Path2D(LOGO_INNER));
  ctx.restore();
}
function canvasTex(w, h, draw, space = THREE.SRGBColorSpace) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = space; return t;
}
// The PC's screen: one square canvas the size of the whole glass, corners rounded to the tube.
// It shows the desktop (Omar's logo on peacock blue), a running disc's cover, or nothing.
const desktopTex = { desktop: true };
const screenTex = canvasTex(512, 512, () => {}, THREE.NoColorSpace); // unlit, like the windows: its bytes reach the glass as drawn, so the logo stays blood orange
function paintScreen(src) {
  const x = screenTex.image.getContext('2d'), w = 512, h = 512;
  x.clearRect(0, 0, w, h);
  x.save(); x.beginPath(); x.roundRect(0, 0, w, h, 46); x.clip();
  x.fillStyle = src === null ? '#050708' : '#102f41'; x.fillRect(0, 0, w, h);
  if (src !== null) {
    x.fillStyle = 'rgba(51,153,153,0.18)'; for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 2);
    if (src === desktopTex) {
      drawLogo(x, w / 2 - 110, 92, 220, '#fce8cd', '#ec563b');
      x.fillStyle = '#fce8cd'; x.font = '900 34px "FK Grotesk", sans-serif'; x.textAlign = 'center'; x.fillText('PRIMORDIALRUNE', w / 2, 384); x.textAlign = 'left';
    } else if (src?.image) {
      x.drawImage(src.image, 36, 36, w - 72, h - 72);
    }
    x.fillStyle = '#ec563b'; x.fillRect(0, h - 22, w, 8);
  }
  x.restore();
  screenTex.needsUpdate = true;
}
paintScreen(desktopTex);

// ---------- objects ----------
const objects = {}; // id -> { root, pose, obj, place, item, mats, glow }
// A CD in its jewel case, lying flat: black tray, printed insert on a lid that opens, disc inside.
async function makeJewel(name) {
  const [ins, disc] = await Promise.all([loadTexture(`labels/${name}-insert.jpg`), loadTexture(`labels/${name}-disc.png`)]);
  const g = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.4 });
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.142, 0.006, 0.125), black); tray.position.y = 0.003;
  const cd = new THREE.Mesh(new THREE.CircleGeometry(0.06, 48), new THREE.MeshStandardMaterial({ map: disc, transparent: true, alphaTest: 0.05, roughness: 0.25, metalness: 0.4, side: THREE.DoubleSide }));
  cd.rotation.x = -Math.PI / 2; cd.position.set(0.006, 0.0065, 0); cd.name = 'Disc';
  // the lid hinges on the left edge, carrying the printed insert under clear plastic
  const lid = new THREE.Group(); lid.position.set(-0.071, 0.008, 0); lid.name = 'Lid';
  const print = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), new THREE.MeshStandardMaterial({ map: ins, roughness: 0.7, side: THREE.DoubleSide }));
  print.rotation.x = -Math.PI / 2; print.position.set(0.077, -0.0005, 0);
  const clear = new THREE.Mesh(new THREE.BoxGeometry(0.142, 0.003, 0.125), new THREE.MeshStandardMaterial({ color: 0xdfefff, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.1 }));
  clear.position.set(0.071, 0.001, 0);
  print.material.side = THREE.FrontSide;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), new THREE.MeshStandardMaterial({ color: 0xe9e2d4, roughness: 0.8 }));
  back.rotation.x = Math.PI / 2; back.position.set(0.077, -0.0008, 0);
  lid.add(print, back, clear);
  const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.011, 0.125), black); hinge.position.set(-0.068, 0.0055, 0);
  for (const m of [tray, print, hinge]) { m.castShadow = true; m.receiveShadow = true; }
  g.add(tray, cd, lid, hinge);
  return g;
}
// The envelope: cream paper, a flap hinged at the back, Omar's logo on a wax seal, the letter inside.
let letterMesh, flap, foldMid, foldTop;
const FOLD = Math.PI - 0.03; // a folded third, lying a hair off the one below
const FLAP_SHUT = Math.PI - 0.02, FLAP_OPEN = 1.05;
function makeEnvelope() {
  const g = new THREE.Group();
  const paper = new THREE.MeshStandardMaterial({ color: 0xefe2c8, roughness: 0.9, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.004, 0.12), paper); body.position.y = 0.002; body.castShadow = body.receiveShadow = true;
  const tri = new THREE.Shape(); tri.moveTo(-0.115, 0); tri.lineTo(0.115, 0); tri.lineTo(0, 0.075); tri.closePath();
  flap = new THREE.Group(); flap.position.set(0, 0.0045, -0.06); flap.name = 'Flap';
  const flapMesh = new THREE.Mesh(new THREE.ShapeGeometry(tri), paper); flapMesh.rotation.x = -Math.PI / 2; flapMesh.castShadow = true;
  const sealTex = canvasTex(128, 128, (x) => { x.fillStyle = '#b8321f'; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI * 2); x.fill(); drawLogo(x, 26, 26, 76, '#7e1d10', '#fce8cd'); });
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.017, 0.004, 24), [new THREE.MeshStandardMaterial({ color: 0x9c2817, roughness: 0.5 }), new THREE.MeshStandardMaterial({ map: sealTex, roughness: 0.45 }), new THREE.MeshStandardMaterial({ color: 0x9c2817 })]);
  seal.position.set(0, -0.0025, -0.058); seal.rotation.x = Math.PI; // on the flap's outside, near its tip
  flap.add(flapMesh, seal);
  flap.rotation.x = FLAP_SHUT;
  const letterTex = canvasTex(512, 680, (x, w, h) => {
    x.fillStyle = '#fbf3e3'; x.fillRect(0, 0, w, h);
    drawLogo(x, 36, 36, 64);
    x.fillStyle = '#102f41'; x.font = '900 34px "FK Grotesk", sans-serif'; x.fillText(LETTER.name, 116, 72);
    x.fillStyle = '#ec563b'; x.font = '900 18px "FK Grotesk", sans-serif'; x.fillText(LETTER.role.toUpperCase(), 116, 96);
    x.fillStyle = '#34505e'; for (let y = 150; y < 600; y += 26) x.fillRect(36, y, 380 + Math.sin(y) * 60, 3);
  });
  // A real letter, folded in three: the bottom third lies still, the middle folds up over it and
  // the top folds over both. Each third is its own panel with paper on the back.
  const third = 0.265 / 3, back = new THREE.MeshStandardMaterial({ color: 0xf3ead8, roughness: 0.95 });
  const panelOf = (k) => {
    const map = letterTex.clone(); map.repeat.set(1, 1 / 3); map.offset.set(0, k / 3); map.needsUpdate = true;
    const p = new THREE.Group();
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.2, third), new THREE.MeshStandardMaterial({ map, roughness: 0.9 }));
    const rear = new THREE.Mesh(new THREE.PlaneGeometry(0.2, third), back); rear.rotation.y = Math.PI;
    front.castShadow = rear.castShadow = true;
    p.add(front, rear); return p;
  };
  letterMesh = new THREE.Group();
  const bottom = panelOf(0);
  foldMid = new THREE.Group(); foldMid.position.set(0, third / 2, 0.0006);
  const mid = panelOf(1); mid.position.y = third / 2;
  foldTop = new THREE.Group(); foldTop.position.set(0, third, -0.0006);
  const top = panelOf(2); top.position.y = third / 2;
  foldTop.add(top); foldMid.add(mid, foldTop); letterMesh.add(bottom, foldMid);
  foldMid.rotation.x = FOLD; foldTop.rotation.x = -FOLD;
  letterMesh.rotation.x = -Math.PI / 2; letterMesh.position.set(0, 0.003, 0.012); letterMesh.visible = false;
  g.add(body, flap, letterMesh);
  return g;
}
// The postcard Galactic News delivers, printed in the game's own four colours.
function makePostcard() {
  const draw = (x, w, h) => {
    const [ink, rust, mint, paper] = ['#291f23', '#bd502f', '#34d1af', '#f7ecb9'];
    x.fillStyle = paper; x.fillRect(0, 0, w, h);
    x.fillStyle = ink; x.fillRect(0, 0, w, 44);
    x.font = '20px "8bitDarling"'; x.fillStyle = paper; x.fillText('GALACTIC NEWS', 14, 30);
    x.font = '14px "8bitDarling"'; x.fillStyle = mint; x.fillText('DELIVERED', w - 132, 29);
    // the stamp: Omar's logo in a perforated frame
    x.fillStyle = rust; x.fillRect(w - 92, 60, 76, 92);
    x.fillStyle = paper; for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(w - 92 + 4 + i * 8.5, 60, 3, 0, 7); x.arc(w - 92 + 4 + i * 8.5, 152, 3, 0, 7); x.fill(); }
    drawLogo(x, w - 82, 78, 56, paper, ink);
    x.font = '18px "8bitDarling"'; x.fillStyle = ink; x.fillText('TO: YOU', 24, 196);
    x.fillStyle = ink; for (const y of [150, 212, 234]) x.fillRect(24, y, 230, 3);
    x.fillStyle = rust; x.fillText('THE TABLE', 24, 96); x.fillText('IS SET', 24, 128);
  };
  const tex = canvasTex(384, 256, draw);
  const g = new THREE.Group();
  g.userData.redraw = () => { draw(tex.image.getContext('2d'), 384, 256); tex.needsUpdate = true; }; // once the fonts are in
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.002, 0.093), [0, 1, 2, 3, 4, 5].map((k) => k === 2 ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }) : new THREE.MeshStandardMaterial({ color: 0xf7ecb9, roughness: 0.9 })));
  card.position.y = 0.001; card.castShadow = card.receiveShadow = true;
  g.add(card);
  return g;
}
// Lay an object on its broadest face (cartridges, cassettes); up flips it if the back faces up.
function layFlat(obj, up) {
  const s = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
  const thin = s.x < s.y && s.x < s.z ? 'x' : s.z < s.y ? 'z' : 'y';
  if (thin === 'x') obj.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), up ? -Math.PI / 2 : Math.PI / 2);
  if (thin === 'z') obj.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), up ? Math.PI / 2 : -Math.PI / 2);
  if (thin === 'y' && up) obj.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), Math.PI);
}
// Some downloaded models sit skewed in their own file (the GB cartridge is off by ~12° on every
// axis); turn them square, then re-centre and re-normalise so the slot maths can trust the axes.
function straighten(obj, deg) {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...deg.map((d) => THREE.MathUtils.degToRad(d))));
  for (const c of obj.children) { c.position.applyQuaternion(q); c.quaternion.premultiply(q); }
  obj.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(obj, true), s = b.getSize(new THREE.Vector3()), k = 1 / Math.max(s.x, s.y, s.z), ctr = b.getCenter(new THREE.Vector3());
  for (const c of obj.children) { c.position.sub(ctr).multiplyScalar(k); c.scale.multiplyScalar(k); }
}
let monitor, tray; // the PC's monitor and CD tray, once the PC is in (rigPC)
const TRAY = { x: 0.171, y: -0.42, shut: 0.109 - 0.13, open: 0.109 + 0.14 };
let doorPivot, innerCassette; // the tape deck's door and the tape behind it, once the deck is in (rigPlayer)
const AXES = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
async function place(p) {
  const item = byId[p.id];
  if (!item && !p.envelope && !p.postcard) return;
  const obj = p.envelope ? makeEnvelope() : p.postcard ? makePostcard() : p.jewel ? await makeJewel(p.jewel) : await loadItem(item);
  // Crossfader cassettes carry both side letters; the game shows one at a time. Side A is up.
  obj.traverse((n) => { if (/^LabelB/.test(n.name)) n.visible = false; });
  const pose = new THREE.Group();
  pose.add(obj);
  if (p.fix) straighten(obj, p.fix);
  if (p.size) obj.scale.multiplyScalar(p.size); // loadItem normalises to longest side 1
  if (p.flat) layFlat(obj, p.up);
  for (const [axis, deg] of p.pose || []) pose.rotateOnWorldAxis(AXES[axis], THREE.MathUtils.degToRad(deg));
  const root = new THREE.Group();
  root.add(pose);
  root.updateMatrixWorld(true);
  pose.position.y -= new THREE.Box3().setFromObject(pose).min.y;
  root.rotation.y = p.rotY || 0;
  root.position.set(...p.pos);
  const mats = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone();
    for (const m of [].concat(o.material)) if (m.emissive) { m.userData.baseEmissive = m.emissive.clone(); m.userData.baseIntensity = m.emissiveIntensity; mats.push(m); }
    o.userData.hit = p.id;
  });
  (p.spot === 'drawer' ? drawer : scene).add(root);
  root.visible = isFound(p.id);
  objects[p.id] = { root, pose, obj, place: p, item, mats, glow: 0, size: p.size || 1 };
  rig(p.id); reshadow();
}
// What the desk shows first: only what's found. The table, the drawer and the desk's hidden things
// (the DS, the Advance, the tape deck, the postcard) follow when you head there, or once the boot ends.
await Promise.all(PLACES.filter((p) => p.spot === 'desk' && isFound(p.id)).map((p) => place(p).catch((e) => console.error(p.id, e))));
let rest = null, retried = false;
function loadRest() {
  // everything not placed yet: the desk's found things are in by now, so this is the rest (whatever skipStory has just marked found)
  // a download that fails (a dropped connection) is tried again: the next call starts over, and one retry runs by itself after 2s
  if (rest) return rest;
  let failed = false;
  rest = Promise.all(PLACES.filter((p) => !objects[p.id]).map((p) => place(p).catch((e) => { console.warn(p.id, e); failed = true; }))).then(() => {
    if (failed) { rest = null; if (!retried) { retried = true; setTimeout(loadRest, 2000); } return; }
    // each disc's insert art doubles as what the PC shows when it runs
    for (const id of ['holon-disc', 'spacerim-disc', 'cd-jewel']) {
      const name = objects[id]?.place.jewel; if (!name) continue;
      loadTexture(`labels/${name}-insert.jpg`).then((t) => { objects[id].insertTex = t; });
    }
    rest.done = true;
  });
  return rest;
}

// ---------- system parts: screens, the PC's monitor and CD tray, the cassette door ----------
// Screens are dark until a game goes in. Then they show that game's own frame (P3), from the art its case study already has,
// at native resolution with nearest-neighbour sampling (P1). A GB game on the Advance sits in the middle, unscaled, as the hardware shows it.
const SCREEN_ART = {
  'gb-cart': { src: 'study/galactic-news/title.still.png', w: 160, h: 144 },
  'gba-cart': { src: 'study/minamoto/battle.still.png', w: 240, h: 160 },
  'ds-cart': { src: 'study/legends-arise/battle.png', w: 256, h: 192, split: true }, // the top screen over the touch screen
};
const SCREEN_SIZE = { 'gb-console': [160, 144], 'gba-console': [240, 160], 'ds-console': [256, 192] };
const screenArt = {}; // 'game sys half' -> texture
function gameScreen(game, sys, half) {
  const a = SCREEN_ART[game], size = SCREEN_SIZE[sys]; if (!a || !size) return null;
  const key = `${game} ${sys} ${half}`;
  if (screenArt[key]) return screenArt[key];
  const [w, h] = size;
  // emissive and unlit by the room's colour: the frame's bytes reach the glass as drawn, like the windows (NoColorSpace)
  const t = screenArt[key] = canvasTex(w, h, (x) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); }, THREE.NoColorSpace);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.flipY = sys !== 'ds-console'; // the GB's and GBA's own UVs run bottom-up; the DS's flat ones top-down
  const img = new Image();
  img.onload = () => {
    const x = t.image.getContext('2d'); x.imageSmoothingEnabled = false;
    x.drawImage(img, 0, a.split && half === 'down' ? a.h : 0, a.w, a.h, Math.floor((w - a.w) / 2), Math.floor((h - a.h) / 2), a.w, a.h);
    t.needsUpdate = true;
  };
  img.src = a.src;
  return t;
}
// The DS's screens carry no usable UVs (a corner of a shared atlas): they get a flat one, across the glass.
// Both lie in the same plane in the file; the lid turns the top one over, so its rows run the other way.
function planarUV(m, flip) {
  if (m.userData.planar) return;
  m.geometry = m.geometry.clone(); m.geometry.computeBoundingBox();
  const P = m.geometry.attributes.position, { min, max } = m.geometry.boundingBox, uv = new Float32Array(P.count * 2);
  for (let i = 0; i < P.count; i++) { uv[i * 2] = (P.getX(i) - min.x) / (max.x - min.x || 1); const v = (P.getZ(i) - min.z) / (max.z - min.z || 1); uv[i * 2 + 1] = flip ? 1 - v : v; }
  m.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); m.userData.planar = true;
}
function setScreen(id, on, game) {
  const o = objects[id]; if (!o) return;
  o.root.traverse((m) => {
    if (!m.isMesh) return;
    for (const mat of [].concat(m.material)) {
      if (!/screen|blinn2/i.test(mat.name)) continue;
      if (!mat.userData.screenMap) mat.userData.screenMap = mat.map;
      const half = /down/i.test(mat.name) ? 'down' : 'up';
      const art = on && game && !/edge/i.test(mat.name) ? gameScreen(game, id, half) : null;
      if (art && id === 'ds-console') planarUV(m, half === 'up');
      // the game's frame is the light itself: no room colour under it, so its palette stays its own (P4)
      mat.map = art ? null : on ? mat.userData.screenMap : null;
      mat.color.set(art ? 0x000000 : on ? 0xffffff : 0x1a2018);
      mat.emissive = new THREE.Color(on ? 0xffffff : 0x000000); mat.emissiveMap = art || (on ? mat.userData.screenMap : null); mat.emissiveIntensity = art ? 1 : on ? 0.7 : 0;
      mat.needsUpdate = true;
    }
  });
}
// Each thing's own parts, set up as it arrives (a hidden one arrives later, with the rest).
function rig(id) {
  if (PLAYS[id] && id !== 'pc') setScreen(id, false);
  // the DS's glass is a transmission material: that renders the whole scene a second time, every frame. Plain see-through glass looks the same.
  if (id === 'ds-console') objects[id].root.traverse((m) => { if (m.isMesh) for (const mat of [].concat(m.material)) if (mat.transmission > 0) { mat.transmission = 0; mat.transparent = true; mat.opacity = 0.35; mat.needsUpdate = true; } });
  if (id === 'crossfader-player') rigPlayer(objects[id]);
  if (id === 'pc') rigPC(objects[id]);
}

// PC: a lit monitor (Omar's logo) and a CD tray that slides out of the drive bay.
// Set up when the PC arrives: with the first models, or later with the rest if its download failed once.
function rigPC(pc) {
  if (tray) return;
  monitor = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.502), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false, transparent: true, alphaTest: 0.5 }));
  monitor.position.set(0.0055, 0.18, 0.119); monitor.userData.hit = 'pc';
  pc.obj.add(monitor);
  const screenGlow = new THREE.PointLight(0x6fb6c8, 0.6, 0.7, 2); screenGlow.position.set(0, 0.18, 0.4); pc.obj.add(screenGlow);
  tray = new THREE.Group(); tray.position.set(TRAY.x, TRAY.y, TRAY.shut);
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.6 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.012, 0.26), trayMat);
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.222, 0.034, 0.008), new THREE.MeshStandardMaterial({ color: 0xb9a27f, roughness: 0.55 }));
  face.position.set(0, 0.002, 0.13);
  const well = new THREE.Mesh(new THREE.CircleGeometry(0.095, 40), new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.8 }));
  well.rotation.x = -Math.PI / 2; well.position.set(0, 0.0065, 0);
  tray.add(slab, face, well);
  tray.traverse((m) => { if (m.isMesh) { m.userData.hit = 'pc'; m.castShadow = true; } });
  pc.obj.add(tray);
}
function showOnMonitor(tex) { paintScreen(tex); }

// Crossfader player: the door swings on a hinge at its bottom edge; the cassette inside appears once the real one goes in.
function rigPlayer(player) {
  let door;
  player.obj.traverse((n) => { if (n.name === 'Door') door = n; if (n.name === 'Cassette') innerCassette = n; });
  if (door) {
    const parent = door.parent; const hinge = new THREE.Vector3(0, -0.285, 0.17);
    parent.updateMatrixWorld(true);
    doorPivot = new THREE.Group(); player.obj.add(doorPivot); doorPivot.position.copy(hinge);
    doorPivot.attach(door);
  }
  if (innerCassette) innerCassette.visible = false;
}

// ---------- camera spots ----------
const SPOTS = {
  desk: { pos: [0, 1.34, 0.36], look: [0, 0.86, -0.55] },
  table: { pos: [-1.3, 0.9, 0.34], look: [-1.46, 0.42, -0.01] },
  drawer: { pos: [0.55, 1.12, 0.42], look: [0.55, 0.52, -0.16] },
};
// A tablet draws A and B in the tube's bottom right, where the rulebook lies: there the table is seen from a step back and to the right
const TABLE_TOUCH = { pos: [-1.31, 1.05, 0.5], look: [-1.4, 0.42, -0.03] };
// the handheld's 4:3 tube draws the box along its bottom: the table is seen from higher and further back, so the rulebook sits above it
const TABLE_HANDHELD = { pos: [-1.37, 1.14, 0.6], look: [-1.45, 0.34, 0.02] };
const view = (s) => s === 'table' && handheld ? TABLE_HANDHELD : s === 'table' && touchUI ? TABLE_TOUCH : SPOTS[s];
const look = new THREE.Vector3(...SPOTS.desk.look);
camera.position.set(...SPOTS.desk.pos);
let spot = 'desk';
const sway = { x: 0, y: 0 };
function moveTo(pos, at, dur = DUR) {
  gsap.to(camera.position, { x: pos[0], y: pos[1], z: pos[2], duration: dur, ease: 'power3.inOut', overwrite: true });
  gsap.to(look, { x: at[0], y: at[1], z: at[2], duration: dur, ease: 'power3.inOut', overwrite: true });
}
function setNav(s) { spot = s; document.querySelectorAll('#nav button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.spot === s))); }
function goSpot(s, said) {
  if (!SPOTS[s] || state.busy) return;
  // a place that isn't open yet answers with the hint, instead of nothing
  if (!spotOpen(s)) { say(nextHint(false) || '* not yet.', 2.4); speak('Not open yet'); return; }
  // a game is in: the camera stays with it, and so does its menu (eject moves on)
  if (state.playing) { if (!panel) openProject(state.playing.game, true); if (!said) say(LINES.takeOut, 2); return; }
  acted();
  if (s !== 'desk') loadRest();
  closePanel();
  if (state.mode !== 'choose') state.mode = 'free';
  setNav(s);
  moveTo(view(s).pos, view(s).look);
  gsap.to(drawer.position, { z: s === 'drawer' ? DRAWER_OPEN : DRAWER_SHUT, duration: DUR * 0.9, ease: 'back.out(1.2)', delay: s === 'drawer' ? DUR * 0.4 : 0 });
  // the first time the table is open, Minamoto is waiting on it
  // (reveal marks it found once it is really there, so a failed download turns it up on the next visit)
  if (STORY && s === 'table' && story.flags.has('postcard-read') && !story.found.has('gba-cart') && !state.revealing) { state.revealing = true; setTimeout(() => reveal('gba-cart').finally(() => { state.revealing = false; }), DUR * 1000); }
  if (s === 'drawer' && !sawDrawer()) { markDrawer(); setTimeout(() => { say(LINES.drawer); glitchName(); }, DUR * 1000 + 300); }
  burst(0.35);
  speak(said || PLACE[s]);
}
// a place picked from the DOM nav hands the keys back to the room (the handheld's pills stay where the thumb is)
document.getElementById('nav').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; goSpot(b.dataset.spot); if (!handheld) canvas.focus({ preventScroll: true }); });
// Look at an object from above and in front, at a distance that fits its size.
function frameObject(id, dist = 1, dur = DUR) {
  const o = objects[id]; const b = new THREE.Box3().setFromObject(o.root);
  const c = b.getCenter(new THREE.Vector3()); const r = Math.max(0.12, b.getSize(new THREE.Vector3()).length());
  moveTo([c.x + r * 0.15 * dist, c.y + r * 0.9 * dist, c.z + r * 1.0 * dist], [c.x, c.y, c.z], dur);
}

// ---------- narrator (drawn inside the tube) ----------
let lastSpeak = performance.now();
const nar = { name: 'OMAR', text: '', shown: 0, queue: [], until: 0, visible: false, cur: null, box: null };
// say() cuts in: the narrator answers what you just did. queue() waits its turn (boot, idle).
// A line can be a string or { t, keep, stale }. Kept lines are story beats: a say() cutting in puts them back after itself,
// once (cut again, it's dropped; back, it shows whole). stale() says a line no longer applies, and it is never said.
const TITLES = new Set(['galactic news', 'minamoto', 'legends arise', 'crossfader', 'holon', 'spacerim', 'haunt record']);
const live = (q) => q && !q.stale?.();
const lineItems = (lines, hold, opts = {}) => [].concat(lines).map((l) => typeof l === 'string' ? { t: l, hold, keep: !!opts.keep } : { hold, ...l });
const kept = (lines) => [].concat(lines).map((t) => ({ t, keep: true }));
function say(lines, hold = 3.2, opts) {
  // a group (the lamp and the flashlight) is one beat: what cuts in waits behind the rest of it
  if (nar.visible && nar.cur?.group) {
    const g = nar.cur.group, rest = nar.queue.filter((q) => q.group === g);
    nar.queue = [...rest, ...lineItems(lines, hold, opts), ...nar.queue.filter((q) => q.group !== g && q.keep)].filter(live);
    return;
  }
  // the current beat counts as heard once it has been on screen whole for a second
  // a line that did something as it started (the envelope lit, the name slipped) has happened: it isn't put back
  const unheard = nar.visible && nar.cur?.keep && !nar.cur.restored && !nar.cur.on && (nar.shown < nar.text.length || performance.now() < nar.until - (nar.hold - 1) * 1000);
  if (unheard) nar.cur.restored = true;
  nar.queue = [...lineItems(lines, hold, opts), ...(unheard ? [nar.cur] : []), ...nar.queue.filter((q) => q.keep)].filter(live);
  next();
}
function queue(lines, hold = 3.2, opts) {
  nar.queue.push(...lineItems(lines, hold, opts));
  if (!nar.visible) next();
}
function next() {
  if (nar.slip && nar.cur === nar.slip) { nar.slip = null; nar.name = 'OMAR'; }
  if (nar.visible) lastSpeak = performance.now();
  nar.cur?.after?.(); // a line can hand over to what follows it (the end card)
  let n = nar.queue.shift(); while (n && !live(n)) n = nar.queue.shift();
  if (!n) { nar.visible = false; nar.cur = null; return; }
  // two lines in a row about the same game: the second drops the title, so it doesn't stutter
  const head = n.t.match(/^\* ([^.]+)\. /);
  if (head && head[1] === nar.head && TITLES.has(head[1]) && performance.now() - nar.headAt < 30000) n.t = '* ' + n.t.slice(head[0].length);
  else if (head) { nar.head = head[1]; nar.headAt = performance.now(); }
  if (!head) nar.head = null;
  nar.cur = n; nar.text = n.t; nar.shown = 0; nar.visible = true; nar.until = Infinity;
  // longer lines stay up longer
  nar.hold = n.brisk ? Math.max(2, 0.8 + n.t.split(' ').length * 0.2) : Math.max(n.hold || 3.2, 1.2 + n.t.split(' ').length * 0.3); // the boot reads quicker: the envelope is named within ~8s
  // a line put back after a cut comes back whole, so it reads as the same line, not a stutter
  if (quiet || n.restored) { nar.shown = nar.text.length; nar.until = performance.now() + nar.hold * 1000; }
  sayAria(n.t.replace(/^\* /, ''));
  n.on?.(); // and do something as it starts (the envelope lights on its line); a line put back does it again
}
// A click on the box (or Space, Enter, A) finishes the line; the next press moves on.
function hurry() {
  if (!nar.visible) return false;
  if (nar.shown < nar.text.length) { nar.shown = nar.text.length; nar.until = performance.now() + nar.hold * 1000; } else next();
  return true;
}
function boxAt(u, v) {
  const b = nar.box; if (!b || !nar.visible) return false;
  const [cu, cv] = curve(u, v); const px = cu * W, py = (1 - cv) * H;
  return px >= b.x && px <= b.x + b.w && py >= b.y - 12 && py <= b.y + b.h;
}
function glitchName() {
  // the only visible crack in act 1: the name tag slips. The burst marks the change (short, gone under quiet);
  // the slipped name is a state, not a glitch: it stays for the whole line, and next() puts OMAR back when the line goes
  nar.name = '0MAR'; nar.slip = nar.cur; burst(0.6);
}
function tickNarrator(dt) {
  if (!nar.visible) return;
  if (nar.shown < nar.text.length) {
    nar.shown = Math.min(nar.text.length, nar.shown + dt * 38);
    if (nar.shown >= nar.text.length) nar.until = performance.now() + nar.hold * 1000;
  } else if (performance.now() > nar.until) { lastSpeak = performance.now(); next(); }
}

// ---------- interaction state ----------
// The drawer's first line slips the name tag: once per run in the story (kept with the save), once per visit in ?free
const sawDrawer = () => STORY ? story.flags.has('saw-drawer') : state.sawDrawer;
function markDrawer() { state.sawDrawer = true; if (STORY && !story.flags.has('saw-drawer')) { story.flags.add('saw-drawer'); persist(); } }
const state = { mode: 'boot', system: null, hover: null, sawDrawer: false, said: new Set(), idle: 0, busy: false, playing: null, hintStage: 0, tl: null, tlAt: 0, replayed: new Set() };
// Stuck hints run on wall-clock time since the last real action (moving the mouse isn't one).
let lastAct = performance.now();
const acted = () => { lastAct = performance.now(); state.hintStage = 0; state.acted = true; };
// A ceremony (insert, eject, the letter) keeps its timeline here, so a press can finish it at once.
function ceremony(tl) { state.tl = tl; state.tlAt = performance.now(); return tl; }
function skipCeremony() {
  const tl = state.tl;
  if (!state.busy || !tl || tl.progress() >= 1 || performance.now() - state.tlAt < 150) return false;
  state.tl = null;
  tl.progress(1); // the onComplete beats still run
  gsap.getTweensOf([camera.position, look]).forEach((t) => t.progress(1));
  return true;
}
// End the boot early: the first press counts, and is then handled as usual.
// A press that will hurry the narrator anyway (on the box, Space, Enter, A) leaves the line to it.
function endBoot(timer, hurries) {
  if (state.mode !== 'boot' || !powered) return; // nothing to end before the tube is on
  state.mode = 'free'; loadRest();
  if (!hurries && nar.visible && nar.shown < nar.text.length) { nar.shown = nar.text.length; nar.until = performance.now() + nar.hold * 1000; }
  if (timer) { highlight([...Object.keys(PLAYS), 'envelope'].filter(isFound)); setTimeout(() => { if (state.mode === 'free') highlight([]); }, 2600); }
}
// A menu row is an action
function pickRow(it) { acted(); it.act(); }
// B and Escape step back: a window's back row is marked (the skip question's is KEEP PLAYING), else it is the last
const backRow = () => panel.items.find((i) => i.back) || panel.items.at(-1);
// What a system will take right now: found games only, and an unwoken GBA only takes the old cartridge.
const playable = (sys) => (PLAYS[sys] || []).filter((g) => isFound(g) && (sys !== 'gba-console' || gbaAwake() || g === 'gb-cart'));
const PROMPT = (id) => {
  if (id === 'drawer') return spot === 'drawer' ? null : 'OPEN';
  if (id === 'envelope') return 'OPEN';
  if (id === 'postcard') return 'READ';
  if (PLAYS[id]) return 'USE';
  if (state.mode === 'choose') return playable(state.system).includes(id) ? 'INSERT' : null;
  if (id === 'ptcg-cube-rulebook' && STORY) return 'READ';
  return 'LOOK';
};
// What a screen reader hears for a thing: the game's title, or what the object is. Never an internal id.
const NAME = (id) => PROJECTS[id]?.title || { pc: 'the PC', 'gb-console': 'Game Boy', 'gba-console': 'Game Boy Advance', 'ds-console': 'Nintendo DS', 'crossfader-player': 'cassette player', envelope: 'a letter', postcard: 'a postcard', drawer: 'the drawer' }[id] || id;
const PLACE = { desk: 'Desk', table: 'Table', drawer: 'Drawer' };
// #status says where you are and what is picked; the same words twice still get read (a trailing space flips)
const statusEl = document.getElementById('status');
// a status that lands with a fresh narrator line waits 700ms behind it, so one doesn't drown the other (the latest status wins)
let sayAt = -1e9, statusTimer = 0, statusAt = -1e9;
// and a narrator line that lands while a window is still being read waits behind it (the line on screen doesn't)
let panelSaid = { at: -1e9, ms: 0 }, sayTimer = 0;
function sayAria(t) {
  clearTimeout(sayTimer);
  const put = () => { document.getElementById('say').textContent = t; sayAt = performance.now(); };
  const wait = Math.min(12000, panelSaid.at + panelSaid.ms - performance.now());
  if (wait > 0) sayTimer = setTimeout(put, wait); else put();
}
function speak(t) {
  if (!statusEl) return;
  clearTimeout(statusTimer);
  // the same words again within 3s are the same news (closing a window, then arriving at that place): said once
  const set = () => { const same = statusEl.textContent.trim() === t; if (same && performance.now() - statusAt < 3000) return; statusEl.textContent = same && statusEl.textContent === t ? t + '\u00a0' : t; statusAt = performance.now(); };
  const wait = sayAt + 700 - performance.now();
  if (wait > 0) statusTimer = setTimeout(set, wait); else set();
}
function highlight(ids) {
  for (const [id, o] of Object.entries(objects)) gsap.to(o, { glow: ids.includes(id) ? 1 : 0, duration: 0.4 });
}
function resetChoice() { state.mode = 'free'; state.system = null; highlight([]); }

function activate(id) {
  if (!id || state.busy) return;
  if (state.playing) return; // the menu handles eject first
  acted();
  if (id === 'drawer') {
    if (spotOpen('drawer')) return goSpot('drawer');
    say(STORY_LINES.drawerLocked, 2.4);
    if (!quiet) gsap.fromTo(drawer.position, { z: DRAWER_SHUT }, { z: DRAWER_SHUT + 0.015, duration: 0.07, yoyo: true, repeat: 3 });
    return;
  }
  if (id === 'envelope') return openLetter();
  if (id === 'postcard') return readPostcard();
  const o = objects[id]; if (!o) return;
  if (PLAYS[id] && !rest?.done && PLAYS[id].some((g) => isFound(g) && !objects[g])) { highlight([id]); loadRest().then(() => { if (rest?.done) activate(id); }); return; } // its games are still on their way: light it now, act once they're in
  if (PLAYS[id]) {
    // pick a system: look over at the games that fit, lit up
    state.mode = 'choose'; state.system = id;
    const asleep = id === 'gba-console' && !gbaAwake();
    const games = playable(id).filter((g) => objects[g]);
    if (!games.length) { resetChoice(); say(LINES.nothingYet, 2.4); return; }
    highlight([id, ...games]);
    if (games.length === 1 && !asleep) return insert(games[0], id); // only one thing fits: no need to ask, or to say so
    say(asleep ? STORY_LINES.gbaAsleep : LINES.choose[id]);
    if (games.length && games.every((g) => objects[g].place.spot === 'drawer')) return goSpot('drawer');
    // the games that fit are on the desk already (the story keeps Galactic News there): stay put
    const at = games.length && games.every((g) => objects[g].place.spot === 'desk') ? 'desk' : 'table';
    setNav(at); closePanel();
    moveTo(view(at).pos, view(at).look);
    return;
  }
  if (state.mode === 'choose') {
    if (!playable(state.system).includes(id)) {
      const refuse = state.system === 'gba-console' && (PLAYS['gba-console'] || []).includes(id);
      say(refuse ? STORY_LINES.gbaRefuses : LINES.wrong, 1.6); burst(0.25); return;
    }
    return insert(id, state.system);
  }
  // free look at a game
  if (id === 'ptcg-cube-rulebook' && STORY) return readRulebook();
  if (id === 'ptcg-cube-rulebook') say(LINES.rulebook);
  else if (SYSTEM_OF[id] && !state.said.has('hint-' + id)) { state.said.add('hint-' + id); if (!state.said.has(id)) { state.said.add(id); say(LINES.hover[id]); } } // its hover line counts: no second telling
  frameObject(id, 0.9, DUR * 0.8);
  highlight([id]);
  openProject(id, false);
}

// ---------- inserting and ejecting ----------
// Each system has its own motion: cartridges slide into their slot, the DS card goes in from the
// back, the cassette door swings open, the PC's tray comes out for the disc. All in GSAP timelines.
function tweenLocal(tl, obj, pos, quat, scale, dur, ease = 'power2.inOut', at) {
  const p0 = obj.position.clone(), q0 = obj.quaternion.clone(); let s0 = obj.scale.x;
  const k = { t: 0 };
  tl.to(k, { t: 1, duration: dur, ease, onUpdate: () => {
    obj.position.lerpVectors(p0, pos, k.t);
    obj.quaternion.slerpQuaternions(q0, quat, k.t);
    obj.scale.setScalar(s0 + (scale - s0) * k.t);
  } }, at);
  // capture the start when this segment begins, not when it is queued
  const seg = tl.getChildren(false, true, false).at(-1);
  seg.eventCallback('onStart', () => { p0.copy(obj.position); q0.copy(obj.quaternion); s0 = obj.scale.x; });
}
function cameraTo(id, dist) { frameObject(id, dist); }

function insert(game, sys) {
  const g = objects[game], s = objects[sys];
  // a model still on its way (or its download failed once): fetch the rest, then go in
  if (!g || !s) { loadRest().then(() => { if (objects[game] && objects[sys] && !state.busy && !state.playing) insert(game, sys); }); return; }
  state.mode = 'playing'; state.busy = true; highlight([]); closePanel(); acted();
  setNav('desk');
  const home = { parent: g.obj.parent, pos: g.obj.position.clone(), quat: g.obj.quaternion.clone(), scale: g.obj.scale.x };
  state.playing = { game, sys, home };
  const tl = ceremony(gsap.timeline({ onComplete: () => { state.busy = false; started(game, sys); } }));
  // seen it before: the second time it goes in quicker
  if (STORY ? story.played.has(game) : state.replayed.has(game)) tl.timeScale(2.5);
  state.replayed.add(game);
  if (sys === 'pc') frameDrive(); else if (!SLOTS[sys]) cameraTo(sys, 1.6);
  if (sys === 'pc') return insertDisc(tl, g, s);
  if (sys === 'crossfader-player') return insertCassette(tl, g, s);
  const spec = SLOTS[sys];
  // the cartridge moves into the system's own frame, so the slot maths stays local
  s.obj.attach(g.obj);
  const r = g.size / s.size;
  const d = new THREE.Vector3(...spec.dir);
  const e = spec.extent * r / 2;
  const slot = new THREE.Vector3(...spec.slot);
  const end = slot.clone().addScaledVector(d, e * (1 - 2 * spec.stick));
  const mouth = slot.clone().addScaledVector(d, -e - 0.02); // tip just outside the slot
  const up = localUp(s.obj, spec.lift ?? 0.06);
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...spec.euler));
  frameSlot(s, slot, d);
  // fly over, line up above the slot, lower to it, a beat, then push it home with a click
  tweenLocal(tl, g.obj, mouth.clone().addScaledVector(d, -(spec.back ?? 0.1)).add(up), q, r, DUR * 1.4, 'power2.inOut', 0);
  tweenLocal(tl, g.obj, mouth, q, r, 0.4, 'power2.inOut');
  tl.to({}, { duration: 0.2 });
  tweenLocal(tl, g.obj, end.clone().addScaledVector(d, -e * 0.12), q, r, 0.55, 'power1.inOut');
  tweenLocal(tl, g.obj, end, q, r, 0.09, 'power4.in');
  tl.call(() => burst(0.2));
  tl.to(s.pose.position, { y: -0.004, duration: 0.06, yoyo: true, repeat: 1 });
  tl.to({}, { duration: 0.35 });
}
// a world-space lift expressed in an object's local frame
function localUp(obj, metres) {
  const o = obj.getWorldPosition(new THREE.Vector3());
  return obj.worldToLocal(o.clone().add(new THREE.Vector3(0, metres, 0))).sub(obj.worldToLocal(o.clone()));
}
// look at a slot from beside it, close enough to watch the cartridge go in
function frameSlot(s, slotLocal, dir) {
  const w = s.obj.localToWorld(slotLocal.clone());
  const o = s.obj.localToWorld(slotLocal.clone().sub(dir)).sub(w).setY(0).normalize(); // out of the slot
  const p = new THREE.Vector3(-o.z, 0, o.x); if (p.z < 0) p.negate(); // the side facing the room
  moveTo([w.x + p.x * 0.17 + o.x * 0.07, w.y + 0.16, w.z + p.z * 0.17 + o.z * 0.07], [w.x, w.y, w.z]);
}

function insertCassette(tl, g, s) {
  // the door opens, the cassette drops in, the door clicks shut
  s.obj.attach(g.obj);
  const inner = innerCassette ? new THREE.Box3().setFromObject(innerCassette) : null;
  const centreW = inner ? inner.getCenter(new THREE.Vector3()) : new THREE.Vector3();
  const centre = s.obj.worldToLocal(centreW.clone());
  const q = new THREE.Quaternion();
  if (doorPivot) tl.to(doorPivot.rotation, { x: 1.15, duration: 0.45, ease: 'back.out(2)' }, 0);
  tweenLocal(tl, g.obj, centre.clone().add(new THREE.Vector3(0, 0, 0.7)), q, 0.61, DUR * 1.2, 'power2.inOut', 0.1);
  tweenLocal(tl, g.obj, centre, q, 0.61, 0.4, 'power3.in');
  tl.call(() => { g.obj.visible = false; if (innerCassette) innerCassette.visible = true; });
  if (doorPivot) tl.to(doorPivot.rotation, { x: 0, duration: 0.3, ease: 'power3.in' });
  tl.call(() => burst(0.2));
}

function insertDisc(tl, g, s) {
  // the case is brought up to the drive, opens, the tray slides out, the disc goes down onto it, the tray closes
  let lid, disc;
  g.obj.traverse((n) => { if (n.name === 'Lid') lid = n; if (n.name === 'Disc') disc = n; });
  state.playing.disc = disc; state.playing.lid = lid;
  scene.attach(g.obj);
  tweenLocal(tl, g.obj, CASE_HELD.pos, CASE_HELD.quat, g.obj.scale.x, DUR * 1.3, 'power2.inOut', 0);
  if (lid) tl.to(lid.rotation, { z: 2.4, duration: 0.5, ease: 'back.out(1.6)' });
  tl.to(tray.position, { z: TRAY.open, duration: 0.7, ease: 'power2.out' }, '<0.1');
  tl.call(() => { state.playing.discHome = { parent: disc.parent, pos: disc.position.clone(), quat: disc.quaternion.clone(), scale: disc.scale.x }; tray.attach(disc); });
  const flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const r = 1 / s.size; // the disc is built in metres; the tray lives in the PC's normalised frame
  const lift = gsap.timeline();
  tweenLocal(lift, disc, new THREE.Vector3(0, 0.12, 0.05), flat, r, 0.7, 'power2.inOut');
  tweenLocal(lift, disc, new THREE.Vector3(0, 0.008, 0), flat, r, 0.35, 'power3.in');
  tl.add(lift);
  tl.to({}, { duration: 0.2 });
  tl.to(tray.position, { z: TRAY.shut, duration: 0.6, ease: 'power2.inOut' });
  if (lid) tl.to(lid.rotation, { z: 0, duration: 0.35, ease: 'power2.in' }, '<');
  tweenLocal(tl, g.obj, CASE_DOWN.pos, CASE_DOWN.quat, g.obj.scale.x, 0.6, 'power2.inOut');
  tl.call(() => { burst(0.3); showOnMonitor(null); frameObject('pc', 0.75); });
  tl.call(() => showOnMonitor(g.insertTex || desktopTex), null, '+=0.5');
  tl.to({}, { duration: 0.6 });
}
// look closely at the PC's drive bay while a disc goes in
// the open case is held beside the drive, then left on the desk while the disc plays
const CASE_HELD = { pos: new THREE.Vector3(0.33, 0.86, -0.47), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, -0.5, 0)) };
const CASE_DOWN = { pos: new THREE.Vector3(0.37, 0.753, -0.52), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.35, 0)) };
function frameDrive() { moveTo([0.0, 1.0, -0.12], [0.17, 0.82, -0.56]); }

function started(game, sys) {
  if (sys !== 'pc') setScreen(sys, true, game);
  if (SLOTS[sys]) cameraTo(sys, 1.6);
  if (state.resumed) { state.resumed = false; state.playedAt = performance.now(); return openProject(game, true); }
  const line = storyPlayed(game, sys) || STORY_LINES.played[game] || `* ${PROJECTS[game].title.toLowerCase()}.`;
  // the first game of the run also says how the story moves: taking it out is what turns things up
  const tip = STORY && !story.flags.has('told-eject');
  if (tip) { story.flags.add('told-eject'); persist(); }
  say(tip ? [line, { t: STORY_LINES.ejectTip, keep: true, stale: () => story.flags.has('ejected') }] : line);
  state.playedAt = performance.now();
  openProject(game, true);
}

// ---------- story beats ----------
let memFlash = -10; // when the last memory came back, for the corner logo's blink
function storyPlayed(game, sys) {
  if (!STORY) return null;
  let line = null;
  if (sys === 'gba-console' && game === 'gb-cart' && !story.flags.has('gba-awake')) { story.flags.add('gba-awake'); line = STORY_LINES.gbaWakes; burst(0.5); }
  if (game === 'gba-cart') line = STORY_LINES.minamoto;
  if (GAMES.includes(game) && !story.played.has(game)) { story.played.add(game); memFlash = clock.elapsedTime; memorySpoken(); }
  persist();
  return line;
}
// The counter is the run's only progress meter: a screen reader hears it too, a beat after the window is announced.
// It rides at the head of the game's window announcement (announcePanel), so one never cuts the other off; without a window it is said alone.
function memorySpoken() {
  state.memNews = `Memory ${story.played.size} of ${GAMES.length} came back`;
  setTimeout(() => { const t = state.memNews; state.memNews = null; if (t) speak(t); }, 1200);
}
// What happens once a game is taken out again: the next thing turns up.
function storyEjected(game) {
  if (!STORY) return;
  if (game === 'gb-cart' && !story.found.has('postcard')) setTimeout(() => { reveal('postcard'); say(STORY_LINES.postcard); }, 400);
  if (game === 'gba-cart' && !story.found.has('ptcg-cube-rulebook')) {
    // the camera settles on the rulebook, and it keeps glowing until it is read
    setTimeout(() => { goSpot('table'); say(STORY_LINES.rulebook); setTimeout(async () => { await reveal('ptcg-cube-rulebook', true); frameObject('ptcg-cube-rulebook', 1.2); }, DUR * 1000); }, 400);
  }
  const lines = [];
  if (game === 'holon-disc' && !story.found.has('spacerim-disc')) {
    const rim = kept(STORY_LINES.spacerim);
    // "it's on the table" is past once the disc is picked up or going in
    rim[2].stale = () => story.played.has('spacerim-disc') || state.playing?.game === 'spacerim-disc' || state.system === 'pc' || state.said.has('hint-spacerim-disc');
    lines.push(...rim); setTimeout(() => { goSpot('table'); setTimeout(() => reveal('spacerim-disc'), DUR * 1000); }, 400); }
  const drawerNow = game === 'crossfader-cassette' && !story.spots.has('drawer');
  if (drawerNow) {
    // side B opens the drawer, and the visitor goes to watch it slide out; its first line follows the two
    markDrawer();
    lines.push(...kept(STORY_LINES.drawerOpens), { t: LINES.drawer, keep: true, on: glitchName });
    setTimeout(() => {
      openSpot('drawer'); reveal('cd-jewel');
      if (!quiet) gsap.fromTo(drawer.position, { z: DRAWER_SHUT }, { z: DRAWER_SHUT + 0.03, duration: 0.12, yoyo: true, repeat: 1 });
      goSpot('drawer');
    }, 400);
  }
  // picks left and none waiting (SpaceRim counts, from the moment Holon leaves it): the rulebook glows until it is read again,
  // and the camera goes to it (the hint engine says so if the drawer just opened)
  const rimWaits = (story.found.has('spacerim-disc') || game === 'holon-disc') && !story.played.has('spacerim-disc');
  if ((DRAFT.includes(game) || game === 'spacerim-disc') && DRAFT.some((g) => !story.found.has(g)) && !rimWaits && !DRAFT.some((g) => story.found.has(g) && !story.played.has(g))) {
    if (!drawerNow) { lines.push(STORY_LINES.draftNext); setTimeout(() => goSpot('table'), 400); }
    beckon.add('ptcg-cube-rulebook');
  }
  // the last pick played: the rulebook closes the draft, and points at whatever is still out
  if (DRAFT.includes(game) && DRAFT.every((g) => story.played.has(g)) && !drawerNow && story.played.size < GAMES.length) {
    lines.push(STORY_LINES.lastPick);
    if (story.found.has('cd-jewel') && !story.played.has('cd-jewel')) lines.push(STORY_LINES.drawerStill);
  }
  // the desk lamp goes after the first draft game, once the eject lines are said
  if (DRAFT.includes(game) && !story.flags.has('torch')) setTimeout(lampGoes, 2600);
  if (story.played.size === GAMES.length && !story.flags.has('complete')) {
    story.flags.add('complete'); persist();
    // the end card follows the last line, about a second after it (or 9s into that line at most, if it is held up)
    lines.push(...endingLines());
  }
  // the ending speaks on its own: whatever was still waiting to be said is past now
  const ending = lines.some((l) => l.t === STORY_LINES.complete[0]);
  if (lines.length) setTimeout(() => { if (ending) { nar.queue = []; if (nar.cur) nar.cur.keep = false; } say(lines); }, 500);
}
// The three closing lines: the envelope lights on its line, and the end card follows the last one,
// about a second after it (or 9s into that line at most, if it is held up), and never later than 30s.
function endingLines() {
  const done = kept(STORY_LINES.complete);
  envelopeLine(done[1]);
  Object.assign(done.at(-1), { on: () => setTimeout(finale, 9000), after: () => setTimeout(finale, 1000) });
  setTimeout(finale, 30000);
  return done;
}
// A line about the envelope: the envelope glows while it is said, and the box keeps off it so it can be clicked.
function envelopeLine(item) {
  return Object.assign(item, { near: 'envelope',
    on: () => beckon.add('envelope'),
    after: () => { if (!beckon.delete('envelope')) return; const o = objects['envelope']; if (o) { o.glow = 1; gsap.to(o, { glow: 0, duration: 1.2 }); } } });
}
// 8/8: the envelope lights and the end card lists where to read about every game.
function finale() {
  if (state.ended) return;
  if (state.busy || state.playing || state.leaving) return void setTimeout(finale, 1000);
  state.ended = true; if (STORY) { story.flags.add('ended'); persist(); }
  const o = objects['envelope']; if (o) { o.glow = 1; gsap.to(o, { glow: 0, duration: 2.4, delay: 1 }); }
  openPanel(endPanel());
}
function endPanel(title = 'All eight') {
  const open = GAMES.filter((g) => PUBLISHED.has(SLUG[g])), rest = GAMES.filter((g) => !PUBLISHED.has(SLUG[g]));
  return {
    kind: 'memories', tag: 'MEMORIES', title, kana: '', body: [`Every game in the room. ${['None', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'][open.length]} ${open.length === 1 ? 'has' : 'have'} a case study.`],
    items: [...open.map((g) => ({ label: PROJECTS[g].title.toUpperCase(), note: 'case study', act: () => openStudy(g) })),
      ...rest.map((g) => ({ label: PROJECTS[g].title.toUpperCase(), note: PROJECTS[g].medium.toLowerCase(), act: () => { closePanel(); activate(g); } })),
      { label: 'THE LETTER', note: 'contact', act: () => { closePanel(); openLetter(); } },
      { label: 'STAY IN THE ROOM', act: closePanel }],
  };
}
// Things that keep glowing until they are used (the rulebook, while it has a pick to deal).
const beckon = new Set();
// Something turns up: it drops into place with a little bounce, lit for a moment.
async function reveal(id, hold = false) {
  if (!objects[id]) await loadRest();
  if (!objects[id]) await loadRest(); // its download failed: one more try before giving up (it isn't marked found, so the beat can come again)
  const o = objects[id]; if (!o) return;
  story.found.add(id); persist();
  o.root.traverse((n) => n.userData.redraw?.());
  o.root.visible = true;
  const y = o.root.position.y;
  gsap.fromTo(o.root.position, { y: y + 0.18 }, { y, duration: quiet ? 0.01 : 0.55, ease: 'bounce.out' });
  burst(0.35);
  if (hold) beckon.add(id); else { o.glow = 1; gsap.to(o, { glow: 0, duration: 2.4, delay: 1 }); }
}
// The desk lamp starts to go (the first thing in the room that fails), and the narrator hands over a flashlight.
const LAMP_FULL = lamp.intensity;
function dimLamp() { lamp.intensity = LAMP_FULL * 0.45; bulb.material.color.set(0xb89a6c); }
// It waits for a quiet moment (nothing playing, nothing being said, no window open), at the desk where the lamp is,
// so the beat isn't said over a game starting; after 20s it takes any quiet moment.
function lampGoes(since = performance.now()) {
  if (story.flags.has('torch')) return;
  const calm = !state.playing && !state.busy && !panel && !nar.visible && state.mode === 'free';
  if (!calm || (spot !== 'desk' && performance.now() - since < 20000)) return void setTimeout(() => lampGoes(since), 700);
  story.flags.add('torch'); persist();
  // the lamp flickers as its line starts, and the flashlight comes on with the next; if the lines never get said, both happen anyway
  let flickered = false, lit = false;
  const flicker = () => {
    if (flickered) return; flickered = true;
    const tl = gsap.timeline();
    for (const k of [0.1, 1, 0.05, 0.8, 0.02, 0.6]) tl.set(lamp, { intensity: LAMP_FULL * k }, `+=${quiet ? 0 : 0.09}`);
    tl.call(() => { dimLamp(); burst(0.3); });
  };
  const light = () => { if (lit) return; lit = true; flicker(); gsap.to(torch, { intensity: TORCH, duration: quiet ? 0.01 : 0.6, ease: 'power2.out' }); };
  // one beat: what cuts in waits behind the pair (see say), and once the flashlight is on neither line comes back
  queue([{ t: STORY_LINES.torch[0], keep: true, group: 'torch', on: flicker, stale: () => lit }, { t: STORY_LINES.torch[1], keep: true, group: 'torch', on: light, stale: () => lit }]);
  setTimeout(light, 30000);
}
if (STORY && story.flags.has('torch')) { dimLamp(); torch.intensity = TORCH; }
function openSpot(s) { if (story.spots.has(s)) return; story.spots.add(s); persist(); navFlash[s] = clock.elapsedTime; burst(0.3); }
const navFlash = {};
function readPostcard() {
  frameObject('postcard', 1.1);
  openPanel({ kind: 'project', tag: 'POSTCARD', title: 'Delivered', kana: 'ハイタツ  DELIVERY', body: ['Galactic News delivered this one. On the back, in Omar’s hand: “The table is set. Come and see the rest.”'],
    items: [{ label: 'GO TO THE TABLE', act: () => { closePanel(); goSpot('table'); say(STORY_LINES.table); } }, { label: 'BACK', act: () => { closePanel(); goSpot('desk'); } }] });
  if (!story.flags.has('postcard-read')) {
    story.flags.add('postcard-read'); openSpot('table');
  }
}
// Minamoto wants the GBA, which hasn't turned up yet: wanting to play it is what finds it.
function findSystem(sys, game) {
  goSpot('desk');
  say(STORY_LINES.find[sys] || STORY_LINES.findGba);
  setTimeout(async () => {
    await reveal(sys);
    // the sleeping GBA: it's chosen already, so the next click on the grey cartridge wakes it
    if (sys === 'gba-console' && !gbaAwake()) {
      if (state.busy || state.playing) return;
      state.mode = 'choose'; state.system = 'gba-console'; highlight(['gba-console', 'gb-cart']);
      return queue(STORY_LINES.gbaAsleep); // after "it was under some papers", not over it
    }
    // found it: put the game in
    if (game && playable(sys).includes(game)) setTimeout(() => { if (!state.busy && !state.playing) insert(game, sys); }, quiet ? 300 : 1600);
  }, DUR * 1000 + 200);
}
// The Cube's rulebook deals the next games: one face-down pick at a time, the next once the last is played.
function readRulebook() {
  acted();
  if (!story.played.has('ptcg-cube-rulebook')) { story.played.add('ptcg-cube-rulebook'); memFlash = clock.elapsedTime; memorySpoken(); persist(); }
  frameObject('ptcg-cube-rulebook', 0.9, DUR * 0.8);
  beckon.delete('ptcg-cube-rulebook');
  highlight(['ptcg-cube-rulebook']);
  const left = DRAFT.filter((g) => !story.found.has(g));
  const waiting = DRAFT.find((g) => story.found.has(g) && !story.played.has(g));
  if (!left.length || waiting) {
    openProject('ptcg-cube-rulebook', false);
    say(waiting ? STORY_LINES.draftWait : LINES.rulebook);
    if (waiting) highlight([waiting]);
    return;
  }
  if (left.length === DRAFT.length) say(STORY_LINES.draft, undefined, { keep: true }); else say(left.length === 1 ? STORY_LINES.draftLast : STORY_LINES.draftAgain);
  const draft = { kind: 'project', tag: 'DRAFT', title: left.length === DRAFT.length ? 'Pick one' : 'Next pick', kana: 'ドラフト  DRAFT',
    body: [`Pick ${DRAFT.length - left.length + 1} of ${DRAFT.length}. ${left.length === 1 ? 'The last one. Nobody passes it back.' : 'Keep one, the rest come round again.'}`],
    items: [...left.map((g) => ({ label: DRAFT_FACE[g][0], note: DRAFT_FACE[g][1], act: () => draftPick(g) })),
      { label: 'READ THE RULES', act: () => openPanel(rulesPanel(draft)) },
      { label: 'BACK', act: () => {
        closePanel(); highlight([]); goSpot('table');
        // nothing picked yet: the book keeps glowing, and its draft lines aren't said to an empty table
        if (!DRAFT.some((g) => story.found.has(g))) { beckon.add('ptcg-cube-rulebook'); dropLines(STORY_LINES.draft); }
      } }] };
  openPanel(draft);
}
// What a cube is, from the rulebook's own case study; BACK returns to the pick.
function rulesPanel(draft) {
  return { kind: 'project', tag: 'RULEBOOK', title: 'PTCG Cube', kana: 'キューブ  CUBE',
    body: ['A cube is a fixed collection of cards, curated so that players can draft from it and build decks on the spot. Nobody brings a deck.', 'Everyone opens the same pool, picks a card, passes the rest, and plays what they built.'],
    items: [{ label: 'BACK', act: () => openPanel(draft) }] };
}
function draftPick(g) {
  closePanel(); highlight([]); goSpot('table');
  // picking answers "you pick first": drop it if it hadn't been said yet
  dropLines(STORY_LINES.draft);
  say(STORY_LINES.picked[g]);
  setTimeout(() => reveal(g), DUR * 1000);
}
// Drop lines that are past (and don't put the current one back if it is one of them).
function dropLines(lines) {
  const stale = (q) => q && lines.includes(q.t);
  nar.queue = nar.queue.filter((q) => !stale(q)); if (stale(nar.cur)) nar.cur.keep = false;
}
function skipStory() {
  for (const p of PLACES) story.found.add(p.id);
  for (const s of Object.keys(SPOTS)) story.spots.add(s);
  story.flags.add('gba-awake'); story.flags.add('postcard-read'); story.flags.add('skipped');
  persist();
  // the four with case studies light up for a moment, so it's clear where to start
  // then the same list as the end card: the case studies, the rest, the letter
  loadRest().then(() => {
    for (const o of Object.values(objects)) o.root.visible = true;
    highlight(GAMES.filter((g) => PUBLISHED.has(SLUG[g])));
    setTimeout(() => { highlight([]); if (!panel && !state.busy && !state.playing) openPanel(endPanel('Everything’s out')); }, 2600);
  });
  // no story now: whatever it still had to say is past
  nar.queue = []; if (nar.cur) nar.cur.keep = false;
  say(STORY_LINES.skip);
}

// after: what happens once it is out and home (PUT IN MINAMOTO puts the next one in)
function eject(after) {
  const p = state.playing; if (!p || state.busy) return;
  const g = objects[p.game];
  state.busy = true; closePanel(); acted();
  if (STORY && !story.flags.has('ejected')) { story.flags.add('ejected'); persist(); }
  const tl = ceremony(gsap.timeline({ onComplete: () => { state.busy = false; state.playing = null; resetChoice(); goSpot('desk'); storyEjected(p.game); if (typeof after === 'function') after(); } }));
  if (p.sys === 'pc') {
    showOnMonitor(desktopTex); frameDrive();
    tweenLocal(tl, g.obj, CASE_HELD.pos, CASE_HELD.quat, g.obj.scale.x, 0.6, 'power2.inOut', 0.2);
    if (p.lid) tl.to(p.lid.rotation, { z: 2.4, duration: 0.45, ease: 'back.out(1.6)' });
    tl.to(tray.position, { z: TRAY.open, duration: 0.6, ease: 'power2.out' }, '<');
    tl.call(() => p.discHome.parent.attach(p.disc));
    const back = gsap.timeline();
    tweenLocal(back, p.disc, p.discHome.pos.clone().add(new THREE.Vector3(0, 0.04, 0)), p.discHome.quat, p.discHome.scale, 0.6, 'power2.out');
    tweenLocal(back, p.disc, p.discHome.pos, p.discHome.quat, p.discHome.scale, 0.25, 'power2.in');
    tl.add(back);
    tl.to(tray.position, { z: TRAY.shut, duration: 0.5 }, '<0.3');
    if (p.lid) tl.to(p.lid.rotation, { z: 0, duration: 0.35, ease: 'power2.in' });
    tl.call(() => p.home.parent.attach(g.obj));
    const home = gsap.timeline();
    tweenLocal(home, g.obj, p.home.pos, p.home.quat, p.home.scale, DUR * 1.1, 'power2.inOut');
    tl.add(home);
    return;
  }
  if (p.sys === 'crossfader-player') {
    if (doorPivot) tl.to(doorPivot.rotation, { x: 1.15, duration: 0.4, ease: 'back.out(2)' });
    tl.call(() => { if (innerCassette) innerCassette.visible = false; g.obj.visible = true; });
  } else {
    setScreen(p.sys, false);
  }
  // slide back out along the way it came, then home to the table
  const up = g.obj.position.clone().add(new THREE.Vector3(0, 0, 0));
  if (SLOTS[p.sys]) up.addScaledVector(new THREE.Vector3(...SLOTS[p.sys].dir), -0.6); else up.z += 0.7;
  tweenLocal(tl, g.obj, up, g.obj.quaternion.clone(), g.obj.scale.x, 0.35, 'power2.out');
  tl.call(() => p.home.parent.attach(g.obj));
  const home = gsap.timeline();
  tweenLocal(home, g.obj, p.home.pos, p.home.quat, p.home.scale, DUR * 1.1, 'power2.inOut');
  tl.add(home);
  if (p.sys === 'crossfader-player' && doorPivot) tl.to(doorPivot.rotation, { x: 0, duration: 0.3 }, '<0.2');
}

// ---------- the envelope ----------
function openLetter() {
  state.busy = true; closePanel(); say(LINES.letter);
  frameObject('envelope', 1.1);
  const tl = ceremony(gsap.timeline({ onComplete: () => { state.busy = false; if (letterEl) showLetter(); else openPanel(letterPanel()); } }));
  // in full the first time (about 2.5s, and a press finishes it); after that it opens three times as fast (P2)
  if (letterSeen) tl.timeScale(3);
  tl.to(flap.rotation, { x: FLAP_OPEN, duration: 0.6, ease: 'power2.out' }, 0.2);
  tl.call(() => { letterMesh.visible = true; });
  // slide the folded letter out, lift it toward you, then open it a third at a time
  tl.to(letterMesh.position, { z: 0.17, y: 0.006, duration: 0.6, ease: 'power2.out' });
  tl.to(letterMesh.position, { y: 0.07, duration: 0.45, ease: 'power2.inOut' });
  tl.to(letterMesh.rotation, { x: -1.15, duration: 0.45, ease: 'power2.inOut' }, '<');
  tl.to(foldTop.rotation, { x: 0, duration: 0.45, ease: 'power2.inOut' }, '-=0.1');
  tl.to(foldMid.rotation, { x: 0, duration: 0.45, ease: 'power2.inOut' }, '-=0.2');
  tl.to({}, { duration: 0.15 });
}
function closeLetter() {
  const tl = ceremony(gsap.timeline({ onComplete: () => { letterMesh.visible = false; state.busy = false; goSpot('desk', 'Letter folded away. Desk.'); } }));
  state.busy = true; tl.timeScale(2); // putting it away is quicker than taking it out
  // fold it back in three, lay it down, slide it home
  tl.to(foldMid.rotation, { x: FOLD, duration: 0.4, ease: 'power2.inOut' });
  tl.to(foldTop.rotation, { x: -FOLD, duration: 0.4, ease: 'power2.inOut' }, '-=0.15');
  tl.to(letterMesh.rotation, { x: -Math.PI / 2, duration: 0.35, ease: 'power2.inOut' });
  tl.to(letterMesh.position, { y: 0.006, duration: 0.35, ease: 'power2.inOut' }, '<');
  tl.to(letterMesh.position, { z: 0.012, y: 0.003, duration: 0.45, ease: 'power2.in' });
  tl.to(flap.rotation, { x: FLAP_SHUT, duration: 0.45, ease: 'power2.in' });
}

// The letter itself is real text over the glass (P1): the dialog in index.html, filled here from LETTER.
// While it is open, a stand-in panel keeps the room quiet (no hints, no nav, no narrator box) and B folds it.
const letterEl = document.getElementById('letter');
if (letterEl) {
  const $ = (q) => letterEl.querySelector(q);
  $('#letter-h').textContent = LETTER.name;
  $('.role').textContent = LETTER.role; $('.kana').textContent = LETTER.kana;
  for (const t of LETTER.body) $('.body').appendChild(document.createElement('p')).textContent = t;
  $('.skills').textContent = LETTER.skills;
  for (const c of LETTER.contacts) {
    const a = $('.contacts').appendChild(document.createElement('li')).appendChild(document.createElement('a'));
    a.href = c.url; if (!c.url.startsWith('mailto')) { a.target = '_blank'; a.rel = 'noopener'; }
    a.appendChild(document.createElement('span')).textContent = c.label; a.append(c.note);
  }
  $('.fold').addEventListener('click', () => foldLetter());
  letterEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); foldLetter(); return; }
    if (e.key !== 'Tab') return;
    // Tab stays inside the letter
    const f = [...letterEl.querySelectorAll('a[href], button')]; const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });
}
let letterSeen = STORY && story.flags.has('letter-read');
function showLetter() {
  letterSeen = true;
  if (STORY && !story.flags.has('letter-read')) { story.flags.add('letter-read'); persist(); }
  panel = { kind: 'letter', dom: true, sel: 0, items: [{ label: 'FOLD IT AWAY', act: () => foldLetter() }] };
  letterEl.hidden = false; letterEl.scrollTop = 0;
  // the letter is modal: the places and the small print wait under it (A and B fold it)
  navEl.inert = fineEl.inert = true;
  letterEl.querySelector('#letter-h').focus({ preventScroll: true });
}
function foldLetter() {
  if (letterEl.hidden) return;
  letterEl.hidden = true; panel = null;
  navEl.inert = fineEl.inert = upright.matches;
  canvas.focus({ preventScroll: true });
  closeLetter();
}

// ---------- the menu inside the tube ----------
// One JRPG window for everything you can do with a thing: project facts on top, a cursor menu below.
let panel = null;
function openPanel(p) { panel = p; panel.sel = 0; announcePanel(); }
function closePanel() {
  const opener = panel?.opener;
  if (panel && !panel.dom) speak(PLACE[spot]);
  panel = null;
  // closed for good (a row that opens something else leaves a window up): focus goes back to the small print that opened it
  if (opener) queueMicrotask(() => { if (!panel && !handheld && document.activeElement === canvas) opener.focus({ preventScroll: true }); });
}
const rowSpeech = (it) => it.speech || (it.note ? `${it.label}, ${it.note}` : it.label);
function announcePanel() {
  if (!panel || panel.dom) return;
  // one sentence per part, no doubled periods: 'Crossfader. A game jam game… My part: … Options: PLAY IT; CASE STUDY; BACK'
  const news = state.memNews; state.memNews = null;
  const parts = [news, panel.title, panel.body?.join(' '), panel.part && 'My part: ' + panel.part, 'Options: ' + (panel.options || panel.items.map(rowSpeech)).join('; ')].filter(Boolean).map((t) => t.trim().replace(/\.$/, ''));
  const text = parts.reduce((a, t) => a + (/[?!:]$/.test(a) ? ' ' : '. ') + t);
  speak(text);
  // a window takes about 0.35s a word to read out: the narrator's next line waits for it (see sayAria)
  panelSaid = { at: performance.now() + Math.max(0, sayAt + 700 - performance.now()), ms: text.split(/\s+/).length * 350 };
}
// PLAY IT goes straight in when the system is out and takes it; otherwise the system says why not.
function playIt(id) {
  closePanel();
  const sys = SYSTEM_OF[id];
  if (!isFound(sys)) return findSystem(sys, id);
  if (playable(sys).includes(id)) return insert(id, sys);
  activate(sys);
}
function openProject(id, playing) {
  const p = PROJECTS[id]; if (!p) return;
  const items = [];
  // the grey cartridge just woke the GBA: one press swaps it for Minamoto
  if (playing && id === 'gb-cart' && state.playing?.sys === 'gba-console' && STORY && !story.played.has('gba-cart'))
    items.push({ label: 'PUT IN MINAMOTO', act: () => eject(() => { if (!state.busy && !state.playing && objects['gba-cart']) insert('gba-cart', 'gba-console'); }) });
  if (playing) items.push({ label: 'EJECT', act: () => eject() });
  else if (SYSTEM_OF[id]) items.push({ label: 'PLAY IT', act: () => playIt(id) });
  if (STUDIES || PUBLISHED.has(SLUG[id])) items.push({ label: 'CASE STUDY', act: () => openStudy(id) });
  // the real build, the same links as the quick view's PLAY IT
  const url = PLAY_URL[id];
  if (url) items.push({ label: 'PLAY ONLINE', note: /itch\.io/.test(url) ? 'itch.io' : 'web', speech: `PLAY ONLINE, opens ${new URL(url).hostname} in a new tab`, act: () => window.open(url, '_blank', 'noopener') });
  items.push({ label: 'BACK', act: () => { if (playing) eject(); else { closePanel(); highlight([]); goSpot(objects[id].place.spot); } } });
  openPanel({ kind: 'project', tag: p.medium, title: p.title, kana: p.kana, body: [p.pitch], part: p.part, items });
}
// Case studies live on their own pages (study/<slug>/). The ones Omar has passed are linked for everyone; drafts stay behind ?studies.
// Leaving is a channel change: a burst, the picture collapses to a line, then the page goes.
const STUDIES = new URLSearchParams(location.search).has('studies');
const PUBLISHED = new Set(['crossfader', 'spacerim', 'holon', 'galactic-news']);
const PLAY_URL = { 'holon-disc': 'https://holon.primordialrune.com/', 'crossfader-cassette': 'https://primordialrune.itch.io/crossfader', 'gb-cart': 'https://indigomountain.itch.io/galactic-news', 'spacerim-disc': 'https://primordialrune.itch.io/spacerim' };
const SLUG = { 'gb-cart': 'galactic-news', 'gba-cart': 'minamoto', 'ds-cart': 'legends-arise', 'crossfader-cassette': 'crossfader', 'holon-disc': 'holon', 'spacerim-disc': 'spacerim', 'ptcg-cube-rulebook': 'ptcg-cube', 'cd-jewel': 'haunt-record' };
const RESUME_KEY = 'room-resume';
let resumeAt = null;
try { resumeAt = sessionStorage.getItem(RESUME_KEY)?.split(' '); sessionStorage.removeItem(RESUME_KEY); } catch { /* none */ }
// Back from a case study: the game that was in goes straight back in, with no ceremony and no second line.
function resumeGame([game, sys]) {
  loadRest().then(() => {
    if (!objects[game] || !objects[sys] || !isFound(game) || !isFound(sys) || state.playing || state.busy || panel) return;
    state.resumed = true; endBoot(); insert(game, sys);
    if (state.tl) { const tl = state.tl; state.tl = null; tl.progress(1); gsap.getTweensOf([camera.position, look]).forEach((tw) => tw.progress(1)); }
  });
}
function openStudy(id) {
  if (!SLUG[id] || state.leaving) return;
  state.leaving = true; closePanel(); burst(0.8);
  // the game left in goes back in when the room loads again (BACK TO THE ROOM is a fresh load of the page)
  try { if (state.playing) sessionStorage.setItem(RESUME_KEY, `${state.playing.game} ${state.playing.sys}`); } catch { /* no storage: it comes back out */ }
  gsap.to(crtMat.uniforms.uPower, { value: 0, duration: quiet ? 0.05 : 0.35, ease: 'power2.in', onComplete: () => { location.href = `study/${SLUG[id]}/`; } });
}
// Coming back with BACK can restore this page from the browser's cache with the picture still off: switch it on.
addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  state.leaving = false;
  try { sessionStorage.removeItem(RESUME_KEY); } catch { /* none */ } // this page kept its game: a later load mustn't put it in again
  if (state.playing && !state.busy && !panel) openProject(state.playing.game, true); // the game is still in: its menu comes back with it
  gsap.to(crtMat.uniforms.uPower, { value: 1, duration: quiet ? 0.05 : 0.5, ease: 'power2.out' });
});
function letterPanel() {
  return {
    kind: 'letter', tag: 'A LETTER', title: LETTER.name, kana: `${LETTER.role}  ${LETTER.kana}`, body: LETTER.body, extra: LETTER.skills,
    items: [...LETTER.contacts.map((c) => ({ label: c.label, note: c.note, act: () => window.open(c.url, c.url.startsWith('mailto') ? '_self' : '_blank', 'noopener') })),
      { label: 'ALL THE GAMES', note: 'quick view', act: () => { location.href = 'quick/' + location.search; } },
      { label: 'FOLD IT AWAY', act: () => { closePanel(); closeLetter(); } }],
  };
}
let panelHits = [], panelRect = null; // panelRect: where the open window is, in UI pixels, so the dialogue box keeps off it
// Omar's photo, pixelated to four colours, pinned to the letter's corner
const portrait = new Image(); portrait.src = 'labels/omar-pixel.png';
function drawPanel(t) {
  panelHits = []; panelRect = null;
  // a game in is never left without its menu (a window opened over it and closed, a place picked): it comes back
  if (!panel && state.playing && !state.busy && !state.leaving) openProject(state.playing.game, true);
  crtMat.uniforms.uClean.value = 0;
  if (!panel || panel.dom) return;
  const letter = panel.kind === 'letter', wide = letter || panel.kind === 'credits' || panel.kind === 'memories';
  const short = H < 480; // phones sideways: wider windows, bigger rows for thumbs, clear of the bigger nav
  // with a finger, the game window grows and keeps clear of the A/B buttons on the right
  const big = touchUI && !wide;
  // handheld: the nav and A/B live on the bezel, so the window can sit high and right
  // while a game plays on the handheld or a tablet's 4:3 tube, its window shrinks to the top right corner,
  // so the console in the middle stays in view, and the dialogue box (bottom) and a tablet's A/B (bottom right) stay clear of it
  const compact = (handheld || (touchUI && W / H < 1.6)) && !wide && !!state.playing;
  const w = compact ? 220 : wide ? (handheld ? W - 28 : Math.min(W - 96, short ? 780 : 600)) : handheld ? 300 : big ? 360 : (short ? 300 : 260);
  const x = wide ? Math.round((W - w) / 2) : W - w - (handheld || compact ? 16 : big ? 150 : 28); const y = wide ? (short ? 24 : 36) : handheld ? 28 : compact ? 72 : (short ? 82 : 58);
  g2.font = `900 ${wide ? 15 : 14}px "FK Grotesk", sans-serif`;
  const bodyLines = compact ? [] : panel.body.flatMap((p) => [...wrap(p, w - 40), '']);
  // what Omar did on it: a pixel label, then Omar's own words in Grotesk (P5: no pixel paragraph)
  g2.font = '900 14px "FK Grotesk", sans-serif'; const partLines = compact || !panel.part ? [] : wrap(panel.part, w - 40);
  const lineH = wide ? 18 : 17;
  // a small phone's memories and end card: the rows go two to a line, label over note, so each is a thumb tall (24 CSS px or more)
  const cols = handheld && panel.kind === 'memories' && canvas.clientHeight < 345 ? 2 : 1;
  panel.cols = cols;
  const itemH = cols > 1 ? 44 : handheld ? 30 : big ? 36 : short ? (wide ? 23 : 28) : wide ? 19 : 22;
  const h = 84 + (letter && !short ? 30 : 0) + bodyLines.length * lineH + (panel.extra ? 22 : 0) + (partLines.length ? 24 + partLines.length * 17 : 0) + Math.ceil(panel.items.length / cols) * itemH + 14;
  // a window taller than the tube shrinks to fit it (the letter on a phone's 4:3 tube)
  // and a game's window keeps clear of the dialogue box under it (with MY PART it runs long)
  const k = Math.min(1, (H - 10 - (handheld && !wide && !compact ? 96 : !handheld && !wide && !short ? 94 : 0) - y) / h), cx0 = x + w / 2;
  g2.save();
  if (k < 1) { g2.translate(cx0, y); g2.scale(k, k); g2.translate(-cx0, -y); }
  // the shader lays this window on clean (no fringe, no scanlines), tag included; the narrator box and HUD keep the tube
  if (panel.kind === 'project' || panel.kind === 'memories' || panel.kind === 'credits') {
    const l = cx0 + (x - 2 - cx0) * k, r = cx0 + (x + w + 2 - cx0) * k, top = y - 13 * k, bot = y + (h + 2) * k;
    crtMat.uniforms.uClean.value = 1; crtMat.uniforms.uRect.value.set(l / W, 1 - bot / H, r / W, 1 - top / H);
  }
  panelRect = { x: cx0 + (x - cx0) * k, y: y - 13 * k, w: w * k, h: (h + 13) * k, wide };
  // window: same family as the dialogue box
  g2.fillStyle = 'rgba(16,47,65,0.96)'; g2.fillRect(x, y, w, h);
  g2.strokeStyle = '#fce8cd'; g2.lineWidth = 2; g2.strokeRect(x + 4, y + 4, w - 8, h - 8);
  g2.font = '11px "8bitDarling"'; const tw = g2.measureText(panel.tag).width + 16;
  g2.fillStyle = '#ec563b'; g2.fillRect(x + 14, y - 11, tw, 20);
  g2.fillStyle = '#fce8cd'; g2.fillText(panel.tag, x + 22, y - 1);
  g2.font = '900 24px "FK Grotesk", sans-serif'; g2.fillStyle = '#fce8cd'; g2.fillText(panel.title, x + 20, y + 34);
  g2.font = '900 11px "FK Grotesk", sans-serif'; g2.fillStyle = '#4eb99f'; g2.fillText(panel.kana, x + 20, y + 54);
  let cy = y + 78;
  if (letter && portrait.complete && portrait.naturalWidth) {
    const ps = short ? 60 : 84, px = x + w - ps - 22, py = y + 16;
    g2.imageSmoothingEnabled = false;
    g2.fillStyle = '#fce8cd'; g2.fillRect(px - 4, py - 4, ps + 8, ps + 8);
    g2.drawImage(portrait, px, py, ps, ps);
    g2.imageSmoothingEnabled = true;
    if (!short) cy += 30;
  }
  g2.font = `900 ${wide ? (panel.kind === 'credits' ? 12 : 15) : 14}px "FK Grotesk", sans-serif`; g2.fillStyle = 'rgba(252,232,205,0.92)';
  for (const l of bodyLines) { g2.fillText(l, x + 20, cy); cy += lineH; }
  if (partLines.length) {
    g2.font = '10px "8bitDarling"'; g2.fillStyle = '#fadb68'; g2.fillText('MY PART', x + 20, cy); cy += 16;
    g2.font = '900 14px "FK Grotesk", sans-serif'; g2.fillStyle = 'rgba(252,232,205,0.92)';
    for (const l of partLines) { g2.fillText(l, x + 20, cy); cy += 17; }
    cy += 8;
  }
  if (panel.extra) { g2.font = '10px "8bitDarling"'; g2.fillStyle = '#fadb68'; g2.fillText(panel.extra.toUpperCase(), x + 20, cy); cy += 22; }
  // the cursor menu
  g2.fillStyle = 'rgba(252,232,205,0.25)'; g2.fillRect(x + 16, cy - 6, w - 32, 1);
  cy += 8;
  const cw = (w - 28) / cols;
  panel.items.forEach((it, i) => {
    const on = i === panel.sel, ix = x + 14 + (i % cols) * cw, iy = cy + Math.floor(i / cols) * itemH;
    // the picked row: peacock on gold, the strongest contrast the palette has
    if (on) { g2.fillStyle = '#fadb68'; g2.fillRect(ix, iy - itemH / 2 + 1, cw - (cols > 1 ? 4 : 0), itemH - 2); }
    g2.font = `${big || cols > 1 ? 15 : 12}px "8bitDarling"`; g2.fillStyle = on ? '#102f41' : 'rgba(252,232,205,0.85)';
    g2.fillText((on ? '▶ ' : '  ') + it.label, ix + 8, cols > 1 ? iy - 3 : iy + 1);
    if (it.note) {
      g2.font = '900 12px "FK Grotesk", sans-serif'; g2.fillStyle = on ? '#102f41' : '#4eb99f';
      if (cols > 1) g2.fillText(it.note, ix + 8 + g2.measureText('▶ ').width + 6, iy + 14);
      else { g2.textAlign = 'right'; g2.fillText(it.note, x + w - 24, iy + 1); g2.textAlign = 'left'; }
    }
    panelHits.push({ i, x: cx0 + (ix - cx0) * k, y: y + (iy - itemH / 2 - y) * k, w: cw * k, h: itemH * k });
  });
  cy += Math.ceil(panel.items.length / cols) * itemH;
  g2.restore();
}
function panelAt(u, v) {
  const [cu, cv] = curve(u, v); const px = cu * W, py = (1 - cv) * H;
  return panelHits.find((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
}
function navAt(u, v) {
  const [cu, cv] = curve(u, v); const px = cu * W, py = (1 - cv) * H;
  // A and B are round: a tap in their square's corner falls through to the room
  return navHits.find((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h && (!r.round || Math.hypot(px - r.x - r.w / 2, py - r.y - r.h / 2) <= r.w / 2));
}
// The nav lives in the tube now: three channel bars top right, credits and the quick view bottom right.
let navHits = [], navHover = null;
const NAV = [['desk', '01', 'DESK', 'デスク'], ['table', '02', 'TABLE', 'テーブル'], ['drawer', '03', 'DRAWER', 'ヒキダシ']];
const navScale = () => touchUI ? Math.max(1.35, 44 / (30 * canvas.clientHeight / H)) : canvas.clientHeight < 520 ? 1.35 : 1;
function drawNav() {
  syncDomNav(); // the DOM nav hides places not found yet, for keyboards too, on every layout
  if (handheld) return; // the bezel carries the nav and the small print
  if (panel && panel.kind !== 'project') return;
  // on short screens (phones sideways) the bars grow so a thumb can hit them
  // and with a finger every bar and link is at least 44 CSS px tall (a tablet's tube is scaled only a little)
  const ns = navScale();
  g2.save(); g2.translate(W, 0); g2.scale(ns, ns); g2.translate(-W, 0);
  let x = W - 18;
  for (const [id, num, label, kana] of [...NAV].filter(([id]) => spotOpen(id)).reverse()) {
    g2.font = `11px "${FONT_PIX}"`; const lw = g2.measureText(label).width;
    g2.font = `900 9px "${FONT_G}", sans-serif`; const kw = g2.measureText(kana).width;
    const w = 34 + Math.max(lw, kw) + 12, h = 30, y = 10; x -= w;
    const on = spot === id, hot = navHover === id;
    // a channel that just opened blinks gold for a couple of seconds
    const fresh = navFlash[id] !== undefined && clock.elapsedTime - navFlash[id] < 2.4 && (quiet || Math.floor((clock.elapsedTime - navFlash[id]) * 4) % 2 === 0); // steady when quiet
    g2.fillStyle = fresh ? '#fadb68' : on ? '#ec563b' : hot ? 'rgba(236,86,59,0.6)' : 'rgba(236,86,59,0.35)';
    g2.beginPath(); g2.roundRect(x, y, w, h, 15); g2.fill();
    g2.fillStyle = '#102f41'; g2.fillRect(x + 8, y + 9, 20, 12);
    g2.font = `8px "${FONT_PIX}"`; g2.fillStyle = '#fce8cd'; g2.fillText(num, x + 11, y + 15.5);
    g2.font = `11px "${FONT_PIX}"`; g2.fillText(label, x + 34, y + 11);
    g2.font = `900 9px "${FONT_G}", sans-serif`; g2.fillStyle = 'rgba(252,232,205,0.85)'; g2.fillText(kana, x + 34, y + 23);
    navHits.push({ id, x: W - (W - x) * ns, y: y * ns, w: w * ns, h: h * ns, act: () => goSpot(id) });
    x -= 8;
  }
  g2.restore();
  // small print, bottom right, above nothing else; while a keyboard is on the DOM row, its pills stand in for it
  if (panel || fineEl.matches(':focus-within')) return;
  g2.font = `${Math.round(11 * ns)}px "${FONT_PIX}"`; g2.textAlign = 'right';
  // on a desktop the sticker on the bezel is the quick view, so the tube only lists it on a handheld
  const links = [['credits', 'CREDITS', () => openPanel(creditsPanel())]];
  if (handheld) links.unshift(['quick', 'QUICK VIEW →', () => { location.href = 'quick/' + location.search; }]);
  links.push(['crt', quiet ? 'CRT: QUIET' : 'CRT: FULL', toggleQuiet]);
  if (STORY && !story.flags.has('skipped') && !story.flags.has('complete')) links.push(['skip', 'SKIP STORY', () => openPanel(skipPanel())]);
  let rx = W - 18; const ry = H - 16;
  // a dark plate under the row, like the channel plate, so it reads in the vignette's corner; the way out (SKIP STORY) in gold
  const rowW = links.reduce((s, [, label]) => s + g2.measureText(label).width + 18, -18);
  g2.fillStyle = 'rgba(6,9,11,0.6)'; g2.beginPath(); g2.roundRect(rx - rowW - 10, ry - 14 * ns, rowW + 20, 26 * ns, 8); g2.fill();
  for (const [id, label, act] of links) {
    const w = g2.measureText(label).width;
    g2.fillStyle = navHover === id || id === 'skip' ? '#fadb68' : '#fce8cd'; g2.fillText(label, rx, ry);
    navHits.push({ id, x: rx - w - 6, y: ry - 12 * ns, w: w + 12, h: 24 * ns, act });
    rx -= w + 18;
  }
  g2.textAlign = 'left';
}
function skipPanel() {
  return { kind: 'project', tag: 'SKIP STORY', title: 'Skip the story?', kana: 'スキップ', body: ['Eight games, a few minutes of story. Skipping puts them all out at once; the memories stay as they are.'],
    items: [{ label: 'KEEP PLAYING', back: true, act: closePanel }, { label: 'SHOW ME EVERYTHING', act: () => { closePanel(); skipStory(); } }] };
}
function creditsPanel() {
  return { kind: 'credits', tag: 'CREDITS', title: 'Model credits', kana: 'クレジット', body: [CREDIT_TEXT], items: [{ label: 'BACK', act: closePanel }] };
}

// ---------- picking through the curved glass ----------
const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); const mouse = { u: 0.5, v: 0.5, in: false };
function pick() {
  const [u, v] = curve(mouse.u, mouse.v);
  if (u < 0 || u > 1 || v < 0 || v > 1) return null;
  ndc.set(u * 2 - 1, v * 2 - 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(scene.children, true);
  for (const h of hits) {
    let o = h.object; while (o && !o.userData.hit) o = o.parent;
    if (!o) continue;
    let shown = true; for (let a = o; a; a = a.parent) if (!a.visible) shown = false;
    if (shown) return o.userData.hit;
  }
  return null;
}
let pointerType = 'mouse', wentFull = false;
// Phones play the room like a handheld: tap to aim, tap again (or A) to use, swipe like a D-pad, B to go back.
let touchUI = matchMedia('(pointer: coarse)').matches;
function setMouse(e) { const r = canvas.getBoundingClientRect(); mouse.u = (e.clientX - r.left) / r.width; mouse.v = 1 - (e.clientY - r.top) / r.height; }
// Touch has no hover: a tap is the first and only time we learn where the finger is.
let swipeFrom = null, swiped = false;
canvas.addEventListener('pointerdown', (e) => {
  pointerType = e.pointerType; setMouse(e);
  swiped = false;
  endBoot(false, boxAt(mouse.u, mouse.v));
  if (e.pointerType === 'touch') { touchUI = true; if (!coarse) { coarse = true; resize(); } swipeFrom = { x: e.clientX, y: e.clientY, t: performance.now() }; }
});
canvas.addEventListener('pointerup', (e) => {
  if (e.pointerType !== 'touch') return;
  // a quick drag is a swipe: left/right walks through the objects in view, up/down through menu rows
  if (swipeFrom) {
    const dx = e.clientX - swipeFrom.x, dy = e.clientY - swipeFrom.y;
    if (Math.hypot(dx, dy) > 36 && performance.now() - swipeFrom.t < 700) {
      swiped = true; state.idle = 0;
      if (Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? -1 : 1, 'x'); else step(dy > 0 ? 1 : -1, 'y');
    }
    swipeFrom = null;
  }
  // on phones, take the whole screen sideways where the browser allows it (a touch counts as a gesture on lift)
  if (wentFull || document.fullscreenElement) return;
  wentFull = true;
  document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).then(() => innerWidth > innerHeight && screen.orientation?.lock?.('landscape')).catch(() => {});
});
// A finger is fat and the table's games are small: when a tap misses, take the nearest thing in reach.
function pickNear() {
  const [u, v] = curve(mouse.u, mouse.v); const px = u * W, py = (1 - v) * H;
  const reach = 46 * H / canvas.clientHeight;
  let best = null, bd = reach;
  for (const id of inView()) { const at = screenOf(id, true); if (!at) continue; const d = Math.hypot(at[0] - px, at[1] - py); if (d < bd) { bd = d; best = id; } }
  return best;
}
canvas.addEventListener('pointermove', (e) => {
  pointerType = e.pointerType; setMouse(e); mouse.in = pointerType !== 'touch'; state.keyHover = false;
  sway.x = (mouse.u - 0.5); sway.y = (mouse.v - 0.5);
  state.idle = 0;
  if (pointerType === 'touch') return; // a finger sliding over a menu doesn't choose anything
  const nh = navAt(mouse.u, mouse.v); navHover = nh?.id || null;
  if (panel) { const hit = panelAt(mouse.u, mouse.v); if (hit) panel.sel = hit.i; canvas.style.cursor = hit || nh ? 'pointer' : 'crosshair'; }
  else canvas.style.cursor = nh ? 'pointer' : 'crosshair';
});
canvas.addEventListener('pointerleave', () => { mouse.in = false; });
canvas.addEventListener('click', (e) => {
  setMouse(e);
  const touch = pointerType === 'touch';
  if (touch) { mouse.in = false; navHover = null; if (swiped) { swiped = false; return; } }
  // the dialogue box wins over the small print beside it: a tap meant to hurry a line never opens SKIP STORY
  const nh = boxAt(mouse.u, mouse.v) ? null : navAt(mouse.u, mouse.v);
  if (nh && (nh.id === 'quick' || nh.id === 'credits' || nh.id === 'crt')) return nh.act();
  // mid-ceremony, a click finishes it
  if (skipCeremony()) return;
  if (nh) { if (!state.busy) { acted(); nh.act(); } return; }
  if (panel) {
    const hit = panelAt(mouse.u, mouse.v);
    // with a finger, the first tap on a row picks it and the second uses it
    if (hit && touch && panel.sel !== hit.i) { panel.sel = hit.i; return; }
    if (hit) return pickRow(panel.items[hit.i]);
  }
  if (boxAt(mouse.u, mouse.v) && hurry()) return;
  if (panel) return;
  if (state.mode === 'boot' || state.busy || state.playing) return;
  const id = pick() || (touch ? pickNear() : null);
  if (!id) { state.hover = null; if (state.mode === 'choose') say(LINES.chooseHelp(), 2.4); return; }
  if (touch && state.hover !== id) { state.hover = id; return; } // aim first: the prompt shows over it
  if (touch) state.hover = null;
  activate(id);
});
// The handheld's buttons. A uses what's aimed at (or the chosen row), B steps back.
function pressA() {
  endBoot(false, !panel);
  if (skipCeremony()) return;
  if (panel) return pickRow(panel.items[panel.sel]);
  // something aimed at is used at once, as Enter does: the prompt says (A), so A never only clears a line about it
  if (state.hover && !state.busy && !state.playing && state.mode !== 'boot') { const id = state.hover; state.hover = null; return activate(id); }
  if (hurry()) return;
  if (state.mode === 'boot' || state.busy || state.playing) return;
  if (!state.hover) return step(1, 'x'); // nothing aimed yet: A aims at the first thing
  const id = state.hover; state.hover = null; activate(id);
}
function pressB() {
  endBoot();
  if (skipCeremony()) return;
  if (panel) return pickRow(backRow());
  if (state.busy) return;
  state.hover = null;
  if (state.mode === 'choose') { resetChoice(); goSpot(spot); } else if (spot !== 'desk') goSpot('desk');
}
// The bezel's buttons (handheld layout)
// On a desktop the small print is reached by keyboard: a window it opens takes the keys (focus goes to the tube).
function bez(sel, fn) { document.querySelectorAll(sel).forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); state.idle = 0;
  if (letterEl && !letterEl.hidden && !b.closest('.ab')) return; // only A and B reach an open letter (they fold it)
  if (handheld || e.pointerType === 'touch') touchUI = true; endBoot(); fn(b);
  // a window it opened takes the keys, and gives them back to this button when it closes (see closePanel)
  if (!handheld && panel && !panel.dom) { if (b.closest('.fine')) panel.opener = b; canvas.focus({ preventScroll: true }); } })); }
bez('.ab .a', pressA); bez('.ab .b', pressB);
bez('.dpad [data-d]', (b) => { const d = b.dataset.d; step(d === 'left' || d === 'up' ? -1 : 1, d === 'left' || d === 'right' ? 'x' : 'y'); });
bez('[data-link="credits"]', () => openPanel(creditsPanel()));
bez('[data-link="skip"]', () => openPanel(skipPanel()));
bez('[data-link="memories"]', () => openPanel(memoriesOrEnd()));
bez('[data-link="crt"]', () => toggleQuiet());
document.querySelector('[data-link="memories"]').hidden = !STORY;
// CRT: FULL / QUIET. The pick is saved on its own key; without one, the system's reduced motion decides, live.
function setQuiet(q) {
  quiet = q; DUR = q ? 0.35 : 1.1; crtMat.uniforms.uQuiet.value = q ? 1 : 0;
  if (q) crtMat.uniforms.uBurst.value = 0;
}
function toggleQuiet() {
  setQuiet(!quiet);
  try { localStorage.setItem(CRT_KEY, quiet ? 'quiet' : 'full'); } catch { /* no storage: it lasts this visit */ }
  speak(quiet ? 'CRT quiet: no noise, no motion' : 'CRT full');
}
motionQ.addEventListener?.('change', (e) => { let picked = null; try { picked = localStorage.getItem(CRT_KEY); } catch { /* none */ } if (!picked) setQuiet(e.matches); });
const crtBtn = document.querySelector('[data-link="crt"]');
function syncDomNav() {
  const t = clock.elapsedTime;
  for (const b of navEl.querySelectorAll('button')) {
    const id = b.dataset.spot, hide = !spotOpen(id);
    if (b.hidden !== hide) b.hidden = hide;
    const fresh = navFlash[id] !== undefined && t - navFlash[id] < 2.4 && (quiet || Math.floor((t - navFlash[id]) * 4) % 2 === 0);
    if (b.classList.contains('fresh') !== fresh) b.classList.toggle('fresh', fresh);
  }
  const sk = document.querySelector('[data-link="skip"]'), noSkip = !(STORY && !story.flags.has('skipped') && !story.flags.has('complete'));
  if (sk.hidden !== noSkip) sk.hidden = noSkip;
  const crt = quiet ? 'CRT: QUIET' : 'CRT: FULL'; if (crtBtn.textContent !== crt) { crtBtn.textContent = crt; crtBtn.setAttribute('aria-pressed', String(quiet)); }
}
// D-pad: along x through the objects in view, left to right as they sit on screen; along y through menu rows.
function step(dir, axis) {
  if (panel) { const d = axis === 'y' && panel.cols > 1 ? dir * panel.cols : dir; panel.sel = (panel.sel + d + panel.items.length) % panel.items.length; return; } // two columns: up and down move a line
  if (axis === 'y' || state.mode === 'boot' || state.busy || state.playing) return;
  const list = inView().map((id) => [id, screenOf(id, true)]).filter(([, at]) => at && at[0] > 0 && at[0] < W).sort((p, q) => p[1][0] - q[1][0]).map(([id]) => id);
  if (!list.length) return;
  const i = list.indexOf(state.hover), j = i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length;
  state.hover = list[j];
  return { list, i: j };
}

// keyboard: arrows pick among objects in view (or menu entries), Enter uses, Esc steps back, 1-3 move, Q the quick view
function inView() { return Object.entries(objects).filter(([id, o]) => (o.place.spot === spot || (state.mode === 'choose' && playable(state.system).includes(id))) && o.root.visible).map(([id]) => id); }
addEventListener('keydown', (e) => {
  endBoot(false, e.key === 'Enter' || e.key === ' ');
  // Escape on the DOM nav or the small print goes back to the room
  if (e.key === 'Escape' && e.target.closest?.('nav, .fine') && !handheld) { canvas.focus({ preventScroll: true }); return; }
  if (e.target.closest && e.target.closest('nav, details, .letter')) return;
  // Enter and Space on a focused link or button belong to it
  const own = !!e.target.closest?.('a, button, input, textarea, select');
  if ((e.key === 'Enter' || e.key === ' ') && !own && skipCeremony()) { e.preventDefault(); return; }
  if (panel) {
    if (own && (e.key === 'Enter' || e.key === ' ')) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { panel.sel = (panel.sel + 1) % panel.items.length; e.preventDefault(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { panel.sel = (panel.sel - 1 + panel.items.length) % panel.items.length; e.preventDefault(); }
    else if (e.key === 'Enter' || e.key === ' ') { pickRow(panel.items[panel.sel]); e.preventDefault(); }
    else if (e.key === 'Escape') pickRow(backRow());
    if (panel && /^Arrow/.test(e.key)) speak(rowSpeech(panel.items[panel.sel]));
    return;
  }
  // single-key shortcuts only while the room itself has the keys (WCAG 2.1.4)
  const inRoom = (e.target === canvas || e.target === document.body) && !e.ctrlKey && !e.metaKey && !e.altKey;
  if (inRoom && e.key === '1') goSpot('desk'); else if (inRoom && e.key === '2') goSpot('table'); else if (inRoom && e.key === '3') goSpot('drawer');
  else if (inRoom && (e.key === 'q' || e.key === 'Q')) location.href = 'quick/' + location.search;
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    // the same screen order (left to right) as the D-pad and swipes
    const r = step(e.key === 'ArrowRight' ? 1 : -1, 'x'); if (!r) return;
    state.keyHover = true; e.preventDefault();
    const id = r.list[r.i], pr = PROMPT(id);
    speak([NAME(id), pr, `${r.i + 1} of ${r.list.length}`].filter(Boolean).join('. '));
  } else if (e.key === 'Enter' && !own && state.keyHover && state.hover) { activate(state.hover); e.preventDefault(); }
  else if ((e.key === 'Enter' || e.key === ' ') && !own && !state.keyHover && hurry()) e.preventDefault();
  else if (e.key === 'Escape') { resetChoice(); goSpot(spot); }
});

// ---------- burst ----------
function burst(a) { if (quiet) return; crtMat.uniforms.uBurst.value = Math.max(crtMat.uniforms.uBurst.value, a); }

// ---------- UI drawn into the tube ----------
const FONT_PIX = '8bitDarling', FONT_G = 'FK Grotesk';
await Promise.allSettled([document.fonts.load(`16px "${FONT_PIX}"`), document.fonts.load(`900 16px "${FONT_G}", sans-serif`)]);
// fonts are in now: redraw the canvases that use them
paintScreen(desktopTex);
function wrap(text, maxW) {
  const words = text.split(' '); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g2.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
function screenOf(id, centre = false) {
  const o = objects[id]; if (!o) return null;
  const b = new THREE.Box3().setFromObject(o.root); const c = b.getCenter(new THREE.Vector3()); if (!centre) c.y = b.max.y;
  c.project(camera); return [(c.x * 0.5 + 0.5) * W, (1 - (c.y * 0.5 + 0.5)) * H];
}
// an object's outline on screen, from its box's eight corners: [left, top, right, bottom] in UI pixels
const corner = new THREE.Vector3();
function rectOf(id) {
  const o = objects[id]; if (!o) return null;
  const b = new THREE.Box3().setFromObject(o.root); let l = Infinity, t = Infinity, r = -Infinity, d = -Infinity;
  for (let i = 0; i < 8; i++) {
    corner.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(camera);
    const x = (corner.x * 0.5 + 0.5) * W, y = (1 - (corner.y * 0.5 + 0.5)) * H;
    l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); d = Math.max(d, y);
  }
  return [l, t, r, d];
}
function drawUI(t) {
  g2.clearRect(0, 0, W, H); navHits = []; // the plate, the bars, the small print and the pad add theirs
  g2.textBaseline = 'middle'; g2.textAlign = 'left';
  // prompt over the hovered object
  const id = state.hover; const label = id && !panel && state.mode !== 'boot' && !state.busy && !state.playing ? PROMPT(id) : null;
  if (label) {
    const at = id === 'drawer' ? (() => { const v = new THREE.Vector3(); knob.getWorldPosition(v); v.project(camera); return [(v.x * 0.5 + 0.5) * W, (1 - (v.y * 0.5 + 0.5)) * H - 10]; })() : screenOf(id);
    if (at) {
      g2.font = `12px "${FONT_PIX}"`;
      const txt = '▶ ' + label + (touchUI ? ' (A)' : ''); const w = g2.measureText(txt).width + 14;
      const x = Math.round(Math.min(W - w - 6, Math.max(6, at[0] - w / 2))), y = Math.round(Math.max(8, at[1] - 30 + (quiet ? 0 : Math.sin(t * 5) * 2)));
      g2.fillStyle = '#ec563b'; g2.fillRect(x, y, w, 20);
      g2.fillStyle = '#fce8cd'; g2.fillText(txt, x + 7, y + 11);
      g2.fillStyle = '#ec563b'; g2.beginPath(); g2.moveTo(x + w / 2 - 5, y + 20); g2.lineTo(x + w / 2 + 5, y + 20); g2.lineTo(x + w / 2, y + 26); g2.fill();
    }
  }
  // spot label, top-left, like a channel number; drawn under any window, so a window over the corner stays whole
  if (!panel || panel.kind === 'project') {
    // a dark plate so the corner reads over a lit desk
    if (STORY) { g2.fillStyle = 'rgba(6,9,11,0.6)'; g2.beginPath(); g2.roundRect(8, 6, 184, 70, 8); g2.fill(); }
    g2.font = `12px "${FONT_PIX}"`; g2.fillStyle = 'rgba(252,232,205,0.95)';
    g2.fillText({ desk: 'CH 01 DESK', table: 'CH 02 TABLE', drawer: 'CH 03 DRAWER' }[spot], 18, 20);
    if (STORY) drawMemories(t);
  }
  drawPanel(t);
  // the dialogue box
  nar.box = null;
  if (nar.visible && !(panel && panel.kind === 'letter')) {
    // on short screens the box keeps to the bottom left so it hides less of the room
    // the handheld's 4:3 tube is narrow: there the box spans it and grows with the line
    const short = H < 480; let bw = handheld ? W - 40 : short ? Math.min(Math.round(W * 0.56), 560) : Math.min(W - 80, 760), bx = handheld ? 20 : short ? 24 : Math.round((W - bw) / 2);
    // a tablet's A and B sit bottom right: the box stops short of them
    if (touchUI && !handheld && bx + bw > W - 160) { bx = Math.max(24, Math.min(bx, W - 160 - bw)); bw = Math.min(bw, W - 160 - bx); }
    // a window open beside it (zoomed in, a short tube): the box stops short of the window, so its rows and cursor stay in view
    const pr = panelRect && !panelRect.wide ? panelRect : null;
    // (a tall tube's window already ends 94px above the bottom: there a box squeezed under ~260px would only wrap into the window, so it keeps its width below it)
    if (pr && pr.y + pr.h > H - 140 && bx + bw > pr.x - 12 && (handheld || H < 480 || pr.x - 12 - bx >= 260)) bw = Math.max(180, Math.round(pr.x - 12 - bx));
    g2.font = `900 17px "${FONT_G}", sans-serif`;
    // the box is as tall as the whole line needs (a box narrowed beside a window wraps more), up to five lines
    const n = Math.min(5, Math.max(2, wrap(nar.text, bw - 50).length));
    const lines = wrap(nar.text.slice(0, Math.floor(nar.shown)), bw - 50).slice(0, n);
    const bh = (handheld ? 30 : 28) + n * 22;
    let by = H - bh - 20;
    // a tablet's small print (44px tall for a finger) sits bottom right: the box stays above its row, so a tap on the box never lands on SKIP STORY
    if (touchUI && !handheld && !panel) by = Math.min(by, Math.round(H - 16 - 14 * navScale() - bh - 10));
    // the box never covers what it's pointing at: the thing its line is about, the hovered or a glowing object sends it to the top
    // (not over an open window), just under the channel plate and the bars so the name tag and the memories stay clear
    if (!panel) {
      // a thing counts as under the box when a good part of its outline is (its centre alone misses a console half under the name tag)
      const under = (oid) => {
        // only the part inside the tube counts (the rulebook lies half outside the handheld's)
        const o = oid && objects[oid]?.root.visible && rectOf(oid), r = o && [Math.max(0, o[0]), Math.max(0, o[1]), Math.min(W, o[2]), Math.min(H, o[3])];
        if (!r || r[3] - r[1] > H * 0.45) return false; // the PC is never hidden by a box
        const top = by - 14 - (oid === state.hover ? 24 : 0), ov = Math.min(r[3], by + bh) - Math.max(r[1], top);
        return r[2] >= bx && r[0] <= bx + bw && ov > 0 && ov >= 0.25 * (r[3] - r[1]);
      };
      // the envelope (the contacts) lies above the box on every screen; on the handheld it still always keeps clear of it
      if (under(nar.cur?.near) || (handheld && under('envelope')) || under(state.hover) || Object.entries(objects).some(([oid, o]) => (o.glow > 0 || beckon.has(oid)) && under(oid))) by = STORY ? 92 : 58;
    }
    nar.box = { x: bx, y: by, w: bw, h: bh }; // for clicks: UI pixels, like the panel rows
    g2.fillStyle = 'rgba(16,47,65,0.94)'; g2.fillRect(bx, by, bw, bh);
    g2.strokeStyle = '#fce8cd'; g2.lineWidth = 2; g2.strokeRect(bx + 4, by + 4, bw - 8, bh - 8);
    g2.font = `12px "${FONT_PIX}"`;
    const nw = g2.measureText(nar.name).width + 16;
    g2.fillStyle = '#ec563b'; g2.fillRect(bx + 14, by - 12, nw, 22);
    // a slipped letter is drawn as an inverse cell, so the zero reads at tag size (the face's slash alone is a pixel)
    let nx = bx + 22;
    for (const ch of nar.name) {
      const cw = g2.measureText(ch).width;
      if (ch === '0') { g2.fillStyle = '#fce8cd'; g2.fillRect(nx - 1, by - 10, cw + 2, 18); }
      g2.fillStyle = ch === '0' ? '#102f41' : '#fce8cd'; g2.fillText(ch, nx, by - 1); nx += cw;
    }
    g2.font = `900 17px "${FONT_G}", sans-serif`; g2.fillStyle = '#fce8cd';
    lines.forEach((l, i) => g2.fillText(l, bx + 22, by + 28 + i * 22));
    if (nar.shown >= nar.text.length && (quiet || Math.sin(t * 6) > 0)) { g2.fillStyle = '#fadb68'; g2.beginPath(); g2.moveTo(bx + bw - 26, by + bh - 22); g2.lineTo(bx + bw - 16, by + bh - 22); g2.lineTo(bx + bw - 21, by + bh - 15); g2.fill(); }
  }
  drawNav();
  if (touchUI && !handheld) drawPad();
  uiTex.needsUpdate = true;
}

// A and B, drawn like a Game Boy's: A up and right, B down and left, big enough for a thumb.
let padFlash = { id: null, t: -1 };
function drawPad() {
  // bottom right, above the small print: the desk's objects sit across the middle band
  const r = 30, ax = W - 46, ay = H - 112, bx = ax - 70, by = ay + 30;
  for (const [id, cx, cy, label, act] of [['btnB', bx, by, 'B', pressB], ['btnA', ax, ay, 'A', pressA]]) {
    const lit = padFlash.id === id && clock.elapsedTime - padFlash.t < 0.15;
    g2.fillStyle = lit ? '#fadb68' : 'rgba(236,86,59,0.9)';
    g2.beginPath(); g2.arc(cx, cy, r, 0, Math.PI * 2); g2.fill();
    g2.strokeStyle = 'rgba(252,232,205,0.5)'; g2.lineWidth = 2; g2.stroke();
    g2.font = `16px "${FONT_PIX}"`; g2.fillStyle = '#fce8cd'; g2.textAlign = 'center'; g2.fillText(label, cx, cy + 1); g2.textAlign = 'left';
    navHits.push({ id, round: true, x: cx - r - 6, y: cy - r - 6, w: (r + 6) * 2, h: (r + 6) * 2, act: () => { padFlash = { id, t: clock.elapsedTime }; act(); } });
  }
}
// The narrator's face in the corner: Omar's logo, its inside filling one step per memory given back.
function drawMemories(t) {
  const n = story.played.size, size = 34, x = 18, y = 34;
  const blink = t - memFlash < 1.6 && (quiet || Math.floor((t - memFlash) * 5) % 2 === 0);
  const shown = blink && !quiet ? n - 1 : n;
  g2.save(); g2.translate(x, y); g2.scale(size / 555, size / 555);
  // the face talks: while a line types, its outline flicks gold in hard steps (steady gold when quiet)
  const talking = nar.visible && nar.shown < nar.text.length && (quiet || Math.floor(t / 0.12) % 2 === 0);
  g2.fillStyle = talking ? '#fadb68' : '#fce8cd'; g2.fill(new Path2D(LOGO_OUTER));
  const inner = new Path2D(LOGO_INNER);
  g2.fillStyle = 'rgba(252,232,205,0.16)'; g2.fill(inner);
  // the inside spans about y 137 to 417 in logo units; it fills from its wide top edge in eight hard steps
  const top = 137, hgt = (417 - top) * shown / GAMES.length;
  g2.clip(inner); g2.fillStyle = '#ec563b'; g2.fillRect(0, top, 555, hgt);
  g2.restore();
  g2.font = `11px "${FONT_PIX}"`; g2.fillStyle = blink ? '#fadb68' : 'rgba(252,232,205,0.95)';
  const label = `MEMORIES ${n}/${GAMES.length}`;
  g2.fillText(label, x + size + 8, y + size / 2);
  if (!panel) navHits.push({ id: 'memories', x: x - 4, y: y - 4, w: size + 16 + g2.measureText(label).width, h: size + 8, act: () => openPanel(memoriesOrEnd()) });
}
// After 8/8 the corner opens the end card; after a skip, the same list (everything is out, nothing is unknown).
const memoriesOrEnd = () => story.flags.has('complete') ? endPanel() : story.flags.has('skipped') ? endPanel('Everything’s out') : memoriesPanel();
// A trainer card of what's been given back: played games by name, the rest still unknown.
function memoriesPanel() {
  return {
    kind: 'memories', tag: 'MEMORIES', title: `${story.played.size} of ${GAMES.length}`, kana: 'メモリー',
    body: ['Every game you play gives one memory back.'],
    items: [...GAMES.map((g) => story.played.has(g)
      ? { label: PROJECTS[g].title.toUpperCase(), note: PROJECTS[g].medium.toLowerCase(), act: () => { closePanel(); activate(g); } }
      : { label: '? ? ?', note: '', speech: `Memory ${GAMES.indexOf(g) + 1}, not found yet. Enter for a hint`, act: () => say(nextHint(true) || '* not yet.', 2.4) }),
    { label: 'BACK', act: closePanel }],
    // read out as a sum: the games found by name, then how many are still out there
    options: [...GAMES.filter((g) => story.played.has(g)).map((g) => PROJECTS[g].title.toUpperCase()), ...(story.played.size < GAMES.length ? [`${GAMES.length - story.played.size} not found yet, Enter on one for a hint`] : []), 'BACK'],
  };
}
// The hint for wherever the visitor is stuck: a nudge first, the plain instruction the second time.
function nextHint(plain) {
  if (story.flags.has('skipped')) return null; // the fast lane gets no story hints
  const h = STORY_LINES.hints.find(([cond]) => cond());
  if (!h) return null;
  // where the table is depends on the hands: the left bezel on the handheld, key 2 on a keyboard, the top right bars with a mouse
  const where = touchUI ? (handheld ? 'the table, on the left' : 'the table') : state.keyHover ? 'the table (press 2)' : 'the table, top right';
  return h[plain ? 2 : 1].replace('the table, top right', where).replace('go to the drawer and play', spot === 'drawer' ? 'play' : 'go to the drawer and play');
}

// ---------- loop ----------
const clock = new THREE.Clock();
const tmpCol = new THREE.Color(), GOLD = new THREE.Color(0xfadb68);
const tweening = () => gsap.globalTimeline.getChildren(true, true, false).some((tw) => tw.isActive());
// A phone held upright only shows the turn-it-sideways card (tablets upright get a 4:3 tube): the room doesn't draw behind it,
// and doesn't even switch on (or fetch the table and drawer) until the first sideways frame.
const upright = matchMedia('(orientation: portrait) and (max-width: 599px) and (pointer: coarse)'); // a tablet or a narrow window gets the tube
// At rest the tube draws every other frame (30fps on a 60Hz screen): nothing moving, nothing typing, no game on,
// no pointer or key for 2s. Anything that moves brings back every frame on the next one.
let lastInput = 0, odd = false;
addEventListener('pointermove', () => { lastInput = performance.now(); }, { passive: true });
addEventListener('pointerdown', () => { lastInput = performance.now(); }, { passive: true });
addEventListener('keydown', () => { lastInput = performance.now(); });
const resting = () => powered && !state.playing && !state.busy && state.mode !== 'boot' && crtMat.uniforms.uBurst.value < 0.01
  && (shadowFrames === 0 || !renderer.shadowMap.enabled) // lite has no shadow pass to count shadowFrames down
  && !(nar.visible && nar.shown < nar.text.length) && performance.now() - lastInput > 2000 && !tweening();
const loop = () => {
  if (resting() && (odd = !odd)) return;
  if (!powered) { powered = true; clock.getDelta(); powerOn(); }
  const rawDt = clock.getDelta(), dt = Math.min(rawDt, 0.05), t = clock.elapsedTime;
  crtMat.uniforms.uTime.value = t;
  crtMat.uniforms.uBurst.value *= Math.pow(0.04, rawDt);
  // hover
  if (mouse.in && !state.keyHover) state.hover = state.mode === 'boot' || panel || navHover ? null : pick();
  const hov = state.hover;
  if (hov && hov !== state.lastHover && hov !== 'drawer' && state.mode === 'free' && !state.said.has(hov) && LINES.hover[hov]) {
    state.said.add(hov); if (!nar.visible) queue(LINES.hover[hov], 2.4);
  }
  state.lastHover = hov;
  // glow: highlighted objects breathe gold, the hovered one warms a little
  for (const [id, o] of Object.entries(objects)) {
    const k = Math.max(Math.max(o.glow, beckon.has(id) ? 1 : 0) * (quiet ? 0.5 : 0.35 + 0.25 * Math.sin(t * 4)), id === hov ? 0.22 : 0);
    for (const m of o.mats) {
      if (/screen|blinn2/i.test(m.name)) continue;
      tmpCol.copy(m.userData.baseEmissive).lerp(GOLD, Math.min(1, k * 1.5));
      m.emissive.copy(tmpCol); m.emissiveIntensity = (m.userData.baseIntensity || 1) + k * 0.6;
    }
  }
  // idle: the narrator nudges, once in a while
  state.idle += dt;
  const now = performance.now();
  if (STORY) {
    // a game left playing 12s with no input: say once that ejecting it moves the story on
    if (state.playing && !state.busy && panel && !story.flags.has('nudged-eject') && now - Math.max(lastAct, state.playedAt || 0) > 12000) {
      story.flags.add('nudged-eject'); persist(); say(STORY_LINES.ejectNudge);
    }
    // stuck in the story: a nudge 15s after the last action, the plain instruction at 30s (wall clock, so slow frames don't stretch it)
    // a project window can be open; the letter, credits and memories are being read
    if (nextHint(false) && (state.mode === 'free' || state.mode === 'choose') && (!panel || panel.kind === 'project') && !nar.visible && now - lastSpeak > 4000) {
      if (state.hintStage === 0 && now - lastAct > 15000) { state.hintStage = 1; say(nextHint(false)); }
      else if (state.hintStage === 1 && now - lastAct > 30000) { state.hintStage = 2; say(nextHint(true)); }
    }
    // after 8/8 the room is quiet, but not empty: a line now and then, each once
    else if (story.flags.has('complete') && !nextHint(false) && state.mode === 'free' && !panel && !nar.visible && now - lastSpeak > 25000 && now - lastAct > 25000) {
      const k = state.afterN = (state.afterN || 0);
      if (k < STORY_LINES.after.length) { state.afterN++; say(STORY_LINES.after[k]); }
    }
  } else if (state.mode === 'free' && !panel && !nar.visible && state.idle > 22 && now - lastSpeak > 20000) {
    state.idle = 0;
    const line = LINES.idle[(state.idleN = (state.idleN || 0) + 1) % LINES.idle.length];
    say(line);
    if (/drawer/.test(line) && !quiet) gsap.fromTo(drawer.position, { z: DRAWER_SHUT }, { z: DRAWER_SHUT + 0.04, duration: 0.25, yoyo: true, repeat: 1 });
  }
  tickNarrator(Math.min(rawDt, 0.25)); // typing keeps real time too
  // camera: target plus a gentle sway toward the cursor
  const s = quiet || panel ? 0 : 0.05;
  camera.lookAt(look.x + sway.x * s, look.y + sway.y * s * 0.6, look.z);
  if (torch.intensity) {
    // the beam follows the cursor through the curved glass, from just below the eye; with a finger, it finds what you aimed at
    torch.position.copy(camera.position).add(new THREE.Vector3(0.05, -0.08, 0));
    const aimed = touchUI && state.hover && objects[state.hover];
    if (aimed) new THREE.Box3().setFromObject(aimed.root).getCenter(torch.target.position);
    else {
      const [u, v] = curve(mouse.u, mouse.v); ndc.set(u * 2 - 1, v * 2 - 1); ray.setFromCamera(ndc, camera);
      torch.target.position.copy(ray.ray.origin).addScaledVector(ray.ray.direction, 1.2);
    }
  }
  // shadows at rest are reused (see reshadow); the flashlight casts none, so only moving things redraw them
  if (renderer.shadowMap.enabled && (shadowFrames > 0 || tweening())) { renderer.shadowMap.needsUpdate = true; shadowFrames = Math.max(0, shadowFrames - 1); }
  renderer.setRenderTarget(rt); renderer.render(scene, camera);
  drawUI(t);
  renderer.setRenderTarget(null); renderer.render(quadScene, quadCam);
};
const main = document.querySelector('main');
const run = () => {
  const up = upright.matches;
  // the card is the page while upright: nothing behind it takes focus, and it takes it first
  for (const el of [main, navEl, fineEl, document.querySelector('.sticker'), document.querySelector('.credits'), document.querySelector('.quick')]) if (el) el.inert = up;
  if (up) document.getElementById('tilt-name')?.focus({ preventScroll: true });
  if (!up) reshadow();
  renderer.setAnimationLoop(up ? null : loop);
};
upright.addEventListener('change', run);
run();

// ---------- power on ----------
// On the first frame the room draws (on a phone, the first sideways one), so the boot's clocks count from the picture.
function powerOn() {
  // the standby card leaves as the tube switches on, so the switch-on stays the only ceremony
  document.getElementById('standby')?.remove(); document.body.classList.remove('cold', 'slow');
  lastAct = performance.now(); // the hint clock starts with the picture
  gsap.to(crtMat.uniforms.uPower, { value: 1, duration: quiet ? 0.2 : 0.9, ease: 'power2.out', delay: 0.2 });
  if (!quiet) crtMat.uniforms.uBurst.value = 0.9;
  setTimeout(() => {
    // a finished run that never saw its ending (the last game was left in) gets it now
    const owed = STORY && story.flags.has('complete') && !story.flags.has('ended');
    const boot = owed ? endingLines() : lineItems(STORY ? (returning ? (story.flags.has('ended') ? STORY_LINES.backDone : STORY_LINES.back) : STORY_LINES.boot) : LINES.boot, 2.6, { keep: STORY });
    if (STORY && !returning) {
      // the envelope glows while its line is said; once the letter is read, or a game is under way, those lines are past
      // and a boot line pushed back past 25s by a quick visitor is out of its moment (the envelope glows with the boot's end anyway)
      const bootAt = performance.now();
      envelopeLine(boot[2]).stale = () => story.flags.has('letter-read') || performance.now() - bootAt > 25000;
      boot[3].stale = () => story.played.size > 0 || story.flags.has('skipped') || !!state.system || !!state.playing;
      boot[3].near = 'gb-console'; // the box keeps off the Game Boy while it points at it
      // the greeting is for arriving: once the visitor has done something (opened the letter), a cut never brings it back
      boot[0].stale = boot[1].stale = () => !!state.acted;
    }
    if (!returning && !owed) for (const b of boot) b.brisk = true;
    if (STORY && returning && story.flags.has('ended')) memFlash = clock.elapsedTime; // the counter is where the end card lives
    // on touch, how to play comes right after "start with the grey one", short
    if (touchUI && !returning && !owed) boot.push({ t: handheld ? '* tap to point, tap again to use. or the pad and a.' : '* tap to point, tap again to use. a and b work too.', hold: 2.6 });
    // the stuck-hint clock starts once the boot has had its say
    const last = boot.at(-1), was = last.after;
    last.after = () => { was?.(); lastAct = performance.now(); };
    queue(boot);
    if (resumeAt) resumeGame(resumeAt);
  }, quiet ? 300 : 1300);
  // the boot ends on its own, or at the first press (see endBoot)
  setTimeout(() => endBoot(true), quiet ? 1500 : 4200);
}
window.__room = { nar, say, lampGoes, pressA, pressB, step, THREE, look, crtMat, objects, goSpot, state, camera, activate, story, reveal, skipStory, eject, openLetter, get panel() { return panel; }, get tray() { return tray; }, TRAY, get doorPivot() { return doorPivot; }, frameObject };
