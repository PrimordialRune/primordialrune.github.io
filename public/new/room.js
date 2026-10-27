// Omar's room: a small early-2000s 3D scene rendered at 640x480 and shown through a Trinitron shader.
// Systems lie around the desk with the old PC in the middle, games wait on the table, the archive is
// in the desk drawer. Everything the visitor reads (narrator, project menu, the letter) is drawn
// inside the tube.
import * as THREE from 'three';
import { loadItem, loadTexture } from './stage.js';

// The picture is always 480 lines; its width follows the window, so the tube can fill it edge to edge.
let H = 480, W = 640;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
// The room plays as an adventure: things are hidden until found, and each game unlocks the next.
// Story mode is the default; ?free opens every object at once (no memories, no locks)
const STORY = !new URLSearchParams(location.search).has('free');
const DUR = reduce ? 0.35 : 1.1;
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
  { id: 'envelope', spot: 'desk', envelope: true, pos: [0.12, DESK_Y, -0.22], rotY: 0.22 },
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
  'gb-cart': { title: 'Galactic News', kana: 'ギャラクティック・ニュース', medium: 'GAME BOY CARTRIDGE', pitch: 'A GBJAM 11 entry for the Game Boy, made in Godot: four colours, 160 × 144 pixels.' },
  'gba-cart': { title: 'Project Minamoto', kana: 'プロジェクト・ミナモト', medium: 'GAME BOY ADVANCE CARTRIDGE', pitch: 'A Pokémon fan game that re-reads Generation 1 on the GBA.' },
  'ds-cart': { title: 'Legends Arise', kana: 'レジェンズ・アライズ', medium: 'NINTENDO DS GAME CARD', pitch: 'Project Legends Arise, on a DS game card.' },
  'crossfader-cassette': { title: 'Crossfader', kana: 'クロスフェーダー', medium: 'CASSETTE', pitch: 'A game jam game about cassettes: a music puzzle in three views. Flip the side, remix the song.' },
  'holon-disc': { title: 'Holon', kana: 'ホロン', medium: 'PC DISC', pitch: 'Holon, the RS-PK simulator.' },
  'spacerim-disc': { title: 'SpaceRim', kana: 'スペースリム', medium: 'PC DISC', pitch: 'SpaceRim, a game jam game.' },
  'ptcg-cube-rulebook': { title: 'PTCG Cube', kana: 'キューブ', medium: 'RULEBOOK', pitch: 'A cube format for the Pokémon TCG, with Roguelike and Co-op modes. This is its rulebook.' },
  'cd-jewel': { title: 'Haunt Record', kana: 'ホーント・レコード', medium: 'ARCHIVED DISC', pitch: 'A dungeon crawler where the player is complicit. Graphics with Edoardo Zuliani.' },
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
    'gba-console': '* it plays the grey cartridges too. backwards compatible.',
    'ds-console': '* two screens. i only ever looked at one.',
    'crossfader-player': '* that one’s from crossfader. the real one.',
    'envelope': '* that’s for you. it’s about me.',
    'gb-cart': '* galactic news. four colours.',
    'gba-cart': '* minamoto. gen 1, again.',
    'ds-cart': '* legends arise.',
    'crossfader-cassette': '* side a. always side a first.',
    'holon-disc': '* holon. the logo took longer than some games.',
    'spacerim-disc': '* spacerim. a jam game. it shows.',
    'ptcg-cube-rulebook': '* the rulebook. i wrote every page. in italian.',
    'cd-jewel': '* that one’s archived.',
  },
  choose: {
    'pc': '* a disc. any of the cases.',
    'gb-console': '* the grey cartridges. pick one.',
    'gba-console': '* anything that fits. grey ones too.',
    'ds-console': '* the little card. careful, it’s small.',
    'crossfader-player': '* the cassette. it only takes the one.',
  },
  wrong: '* that doesn’t go in there.',
  nothingYet: '* nothing for that one yet. keep looking.',
  chooseHelp: '* one of the lit ones. or the bars up top, if you changed your mind.',
  rulebook: '* you don’t put this one in anything. you read it.',
  letter: '* go on. it’s short. i wrote it myself.',
  study: '* the case studies are still in the other room. soon.',
  idle: ['* ...you can look around, you know.', '* the drawer’s just old stuff.', '* take your time. i have plenty.'],
  drawer: '* that one’s archived. it doesn’t— it’s fine.',
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
  boot: ['* oh. you’re here. sit, sit.', '* everything’s asleep. start with the grey one.'],
  back: ['* you’re back. i kept everything where you left it.'],
  postcard: '* mail. for you. i always answer mail.',
  postcardHover: '* that wasn’t there before.',
  table: '* the table. go on, it’s set for you.',
  findGba: ['* that one needs the advance.', '* it was under some papers. here.'],
  gbaAsleep: '* it’s asleep. give it something old. it remembers old things.',
  gbaRefuses: '* not that one yet. something older first.',
  gbaWakes: '* see? old game, new hardware. that’s minamoto, really.',
  minamoto: '* minamoto. gen 1, read again.',
  rulebook: '* something’s on the table now. a rulebook. i wrote it.',
  draft: ['* a cube is drafted. open the pack, keep one, pass the rest.', '* you pick first.'],
  draftNext: '* your turn again. the rulebook has another pick.',
  draftWait: '* play your pick first. then we draft again.',
  picked: {
    'crossfader-cassette': '* the cassette. two sides, and both of them matter.',
    'holon-disc': '* holon. heavy case. it’s mostly numbers.',
    'ds-cart': '* the little card. two screens, two stories.',
  },
  find: {
    'crossfader-player': ['* that needs its tape deck.', '* it was behind the monitor. here.'],
    'ds-console': ['* that needs the ds.', '* it was still charging. here.'],
  },
  spacerim: '* holon left a second disc on the table. spacerim.',
  drawerOpens: ['* side b. that’s the drawer’s tune.', '* it’s open now. the old stuff is in there.'],
  complete: ['* that’s all eight.', '* ...you can stay, you know. i’ll keep the room as it is.'],
  torch: ['* hm. the lamp’s going.', '* here. take the flashlight. point it at things, they’re easier to find.'],
  drawerLocked: '* that’s just old stuff. it’s stuck anyway.',
  skip: '* everything’s out. no story, just the games.',
  hints: [
    // [condition, gentle nudge, plain instruction]
    [() => !story.played.has('gb-cart'), '* the grey one. the cartridge is right next to it.', '* click the game boy, then the cartridge beside it.'],
    [() => !story.flags.has('postcard-read'), '* something came in the mail.', '* the postcard on the desk. read it.'],
    [() => !story.found.has('gba-console'), '* there’s something new on the table.', '* the table, top right. play the cartridge waiting there.'],
    [() => !story.flags.has('gba-awake'), '* the advance is asleep. it remembers old things.', '* use the advance, then the grey cartridge.'],
    [() => !story.played.has('gba-cart'), '* it’s awake now. minamoto fits.', '* use the advance, then the minamoto cartridge on the table.'],
    [() => !story.played.has('ptcg-cube-rulebook'), '* the rulebook on the table. it’s your pick.', '* go to the table and use the rulebook, then pick a game.'],
    [() => DRAFT.some((g) => story.found.has(g) && !story.played.has(g)), '* you picked one. go on, play it.', '* play the game you picked: it’s on the table, choose PLAY IT.'],
    [() => story.found.has('spacerim-disc') && !story.played.has('spacerim-disc'), '* holon left another disc on the table.', '* play spacerim: the second disc on the table.'],
    [() => story.found.has('cd-jewel') && !story.played.has('cd-jewel'), '* the drawer’s open now.', '* go to the drawer and play the disc inside.'],
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
      if (new URLSearchParams(location.search).has('reset')) localStorage.removeItem(SAVE_KEY);
      Object.assign(s, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'));
    } catch { /* no storage: the run just isn't kept */ }
  }
  return { found: new Set(s.found), played: new Set(s.played), spots: new Set(s.spots), flags: new Set(s.flags) };
})();
const returning = STORY && story.played.size > 0;
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
renderer.setPixelRatio(lite ? 1 : Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = !lite;
renderer.shadowMap.type = THREE.PCFShadowMap;
const rt = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, samples: 0 });
rt.texture.colorSpace = THREE.SRGBColorSpace;

const ui = document.createElement('canvas'); ui.width = W; ui.height = H;
const g2 = ui.getContext('2d');
const uiTex = new THREE.CanvasTexture(ui); uiTex.minFilter = uiTex.magFilter = THREE.NearestFilter; uiTex.colorSpace = THREE.SRGBColorSpace;

// Trinitron glass is curved left-to-right only, so the bend is mostly horizontal.
const CURVE = 'vec2 curve(vec2 uv){ uv = uv * 2.0 - 1.0; uv.x *= 1.0 + 0.045 * uv.y * uv.y; uv.y *= 1.0 + 0.012 * uv.x * uv.x; return uv * 0.5 + 0.5; }';
function curve(u, v) { let x = u * 2 - 1, y = v * 2 - 1; x *= 1 + 0.045 * y * y; y *= 1 + 0.012 * x * x; return [x * 0.5 + 0.5, y * 0.5 + 0.5]; }

const crtMat = new THREE.ShaderMaterial({
  uniforms: { tScene: { value: rt.texture }, tUI: { value: uiTex }, uTime: { value: 0 }, uBurst: { value: 0 }, uPower: { value: 0 }, uOut: { value: new THREE.Vector2(1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D tScene, tUI; uniform float uTime, uBurst, uPower; uniform vec2 uOut;
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
      float c = 0.0009 + uBurst * 0.004;
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
      col += (hash(uv * uOut + uTime) - 0.5) * (0.035 + uBurst * 0.25);
      col *= 1.0 + 0.6 * (1.0 - smoothstep(0.0, 0.08, abs(band - open))) * (1.0 - open);
      gl_FragColor = vec4(col * 1.12, 1.0);
    }`,
  depthTest: false, depthWrite: false,
});
const quadScene = new THREE.Scene();
quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), crtMat));
const quadCam = new THREE.Camera();

let cam = null; // the room camera, once it exists
// Phones sideways become a handheld: a 4:3 tube in the middle, the pad and the nav on the left bezel, A and B on the right.
const navEl = document.getElementById('nav'), bezelL = document.querySelector('.bezel.left');
let coarse = matchMedia('(pointer: coarse)').matches, handheld = false;
function layout() {
  const hh = coarse && innerWidth / innerHeight > 1.75;
  if (hh === handheld) return;
  handheld = hh;
  document.body.classList.toggle('handheld', hh);
  if (hh) bezelL.prepend(navEl); else document.body.insertBefore(navEl, document.querySelector('.credits'));
}
function resize() {
  layout();
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
  if (cam) { cam.aspect = W / H; cam.fov = 2 * Math.atan(Math.tan(25 * Math.PI / 180) * Math.min(1, 1.78 / cam.aspect)) * 180 / Math.PI; cam.updateProjectionMatrix(); }
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
const tableLamp = new THREE.PointLight(0xffb070, 4.5, 2.2, 1.6); tableLamp.position.set(-1.3, 1.05, 0.25); tableLamp.castShadow = true; scene.add(tableLamp);
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
for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.018), new THREE.MeshBasicMaterial({ color: 0xec563b })); s.position.set(0.6, 1.3 + i * 0.03, -0.968); scene.add(s); }

// ---------- Omar's logo, drawn once for the monitor and the wax seal ----------
const LOGO_OUTER = 'M260.32,454.02l-159.33-159.33c-8.33-8.33-8.33-21.82,0-30.15l168.17-168.17c4-4,9.42-6.24,15.08-6.24h159.92c5.17,0,6.81-6.96,2.19-9.27L289.14,2.25c-8.21-4.1-18.12-2.5-24.61,3.99L6.24,264.53c-8.33,8.33-8.33,21.82,0,30.15l254.08,254.08c8.33,8.33,21.82,8.33,30.15,0l260.8-260.79c3.08-3.08.9-8.36-3.46-8.36h-72.56c-6.63,0-13,2.64-17.69,7.33l-167.08,167.08c-8.33,8.33-21.82,8.33-30.15,0Z';
const LOGO_INNER = 'M551.25,137.49h-263.74c-7.75,0-15.19,3.08-20.67,8.56l-125.39,125.39c-3.01,3.01-.88,8.16,3.38,8.16h101.34c16.14,0,29.23,13.09,29.23,29.23v101.34c0,4.26,5.15,6.39,8.16,3.38l270.14-270.14c2.19-2.19.64-5.92-2.45-5.92Z';
function drawLogo(ctx, x, y, size, outer = '#102f41', inner = '#ec563b') {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 555, size / 555);
  ctx.fillStyle = outer; ctx.fill(new Path2D(LOGO_OUTER));
  ctx.fillStyle = inner; ctx.fill(new Path2D(LOGO_INNER));
  ctx.restore();
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// The PC's screen: one square canvas the size of the whole glass, corners rounded to the tube.
// It shows the desktop (Omar's logo on peacock blue), a running disc's cover, or nothing.
const desktopTex = { desktop: true };
const screenTex = canvasTex(512, 512, () => {});
function paintScreen(src) {
  const x = screenTex.image.getContext('2d'), w = 512, h = 512;
  x.clearRect(0, 0, w, h);
  x.save(); x.beginPath(); x.roundRect(0, 0, w, h, 46); x.clip();
  x.fillStyle = src === null ? '#050708' : '#102f41'; x.fillRect(0, 0, w, h);
  if (src !== null) {
    x.fillStyle = 'rgba(51,153,153,0.18)'; for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 2);
    if (src === desktopTex) {
      drawLogo(x, w / 2 - 110, 92, 220, '#fce8cd', '#ec563b');
      x.fillStyle = '#fce8cd'; x.font = '900 34px "FK Grotesk"'; x.textAlign = 'center'; x.fillText('PRIMORDIALRUNE', w / 2, 384); x.textAlign = 'left';
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
    x.fillStyle = '#102f41'; x.font = '900 34px "FK Grotesk"'; x.fillText(LETTER.name, 116, 72);
    x.fillStyle = '#ec563b'; x.font = '900 18px "FK Grotesk"'; x.fillText(LETTER.role.toUpperCase(), 116, 96);
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
}
// The desk loads first so the room can switch on; the table and drawer follow when you head there
// (or once the opening lines are done).
await Promise.all(PLACES.filter((p) => p.spot === 'desk').map((p) => place(p).catch((e) => console.error(p.id, e))));
let rest = null;
function loadRest() {
  rest ??= Promise.all(PLACES.filter((p) => p.spot !== 'desk').map((p) => place(p).catch((e) => console.error(p.id, e)))).then(() => {
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
// Screens are dark until a game goes in.
function setScreen(id, on) {
  const o = objects[id]; if (!o) return;
  o.root.traverse((m) => {
    if (!m.isMesh) return;
    for (const mat of [].concat(m.material)) {
      if (!/screen|blinn2/i.test(mat.name)) continue;
      if (!mat.userData.screenMap) mat.userData.screenMap = mat.map;
      mat.map = on ? mat.userData.screenMap : null;
      mat.color.set(on ? 0xffffff : 0x1a2018);
      mat.emissive = new THREE.Color(on ? 0xffffff : 0x000000); mat.emissiveMap = on ? mat.userData.screenMap : null; mat.emissiveIntensity = on ? 0.7 : 0;
      mat.needsUpdate = true;
    }
  });
}
for (const id of Object.keys(PLAYS)) if (id !== 'pc') setScreen(id, false);

// PC: a lit monitor (Omar's logo) and a CD tray that slides out of the drive bay.
const pc = objects['pc'];
let monitor, tray;
const TRAY = { x: 0.171, y: -0.42, shut: 0.109 - 0.13, open: 0.109 + 0.14 };
if (pc) {
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
const player = objects['crossfader-player'];
let doorPivot, innerCassette;
if (player) {
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
const look = new THREE.Vector3(...SPOTS.desk.look);
camera.position.set(...SPOTS.desk.pos);
let spot = 'desk';
const sway = { x: 0, y: 0 };
function moveTo(pos, at, dur = DUR) {
  gsap.to(camera.position, { x: pos[0], y: pos[1], z: pos[2], duration: dur, ease: 'power3.inOut', overwrite: true });
  gsap.to(look, { x: at[0], y: at[1], z: at[2], duration: dur, ease: 'power3.inOut', overwrite: true });
}
function setNav(s) { spot = s; document.querySelectorAll('#nav button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.spot === s))); }
function goSpot(s) {
  if (!SPOTS[s] || state.busy || !spotOpen(s)) return;
  if (s !== 'desk') loadRest();
  closePanel();
  if (state.mode !== 'choose') state.mode = 'free';
  setNav(s);
  moveTo(SPOTS[s].pos, SPOTS[s].look);
  gsap.to(drawer.position, { z: s === 'drawer' ? DRAWER_OPEN : DRAWER_SHUT, duration: DUR * 0.9, ease: 'back.out(1.2)', delay: s === 'drawer' ? DUR * 0.4 : 0 });
  // the first time the table is open, Minamoto is waiting on it
  if (STORY && s === 'table' && story.flags.has('postcard-read') && !story.found.has('gba-cart')) { story.found.add('gba-cart'); setTimeout(() => reveal('gba-cart'), DUR * 1000); }
  if (s === 'drawer' && !state.sawDrawer) { state.sawDrawer = true; setTimeout(() => { say(LINES.drawer); glitchName(); }, DUR * 1000 + 300); }
  burst(0.35);
  focusIdx = -1;
}
document.getElementById('nav').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) goSpot(b.dataset.spot); });
// Look at an object from above and in front, at a distance that fits its size.
function frameObject(id, dist = 1, dur = DUR) {
  const o = objects[id]; const b = new THREE.Box3().setFromObject(o.root);
  const c = b.getCenter(new THREE.Vector3()); const r = Math.max(0.12, b.getSize(new THREE.Vector3()).length());
  moveTo([c.x + r * 0.15 * dist, c.y + r * 0.9 * dist, c.z + r * 1.0 * dist], [c.x, c.y, c.z], dur);
}

// ---------- narrator (drawn inside the tube) ----------
const nar = { name: 'OMAR', text: '', shown: 0, queue: [], until: 0, visible: false };
// say() cuts in: the narrator answers what you just did. queue() waits its turn (boot, idle).
function say(lines, hold = 3.2) { nar.queue = [].concat(lines).map((t) => ({ t, hold })); next(); }
function queue(lines, hold = 3.2) {
  nar.queue.push(...[].concat(lines).map((t) => ({ t, hold })));
  if (!nar.visible) next();
}
function next() {
  const n = nar.queue.shift();
  if (!n) { nar.visible = false; return; }
  nar.text = n.t; nar.shown = 0; nar.visible = true; nar.hold = n.hold; nar.until = Infinity;
  document.getElementById('say').textContent = n.t.replace(/^\* /, '');
}
function glitchName() {
  // the only crack in act 1: the name tag slips for a frame or two
  nar.name = '0MAR'; burst(0.6);
  setTimeout(() => { nar.name = 'OMAR'; }, reduce ? 400 : 160);
}
let lastSpeak = performance.now();
function tickNarrator(dt) {
  if (!nar.visible) return;
  if (nar.shown < nar.text.length) {
    nar.shown = Math.min(nar.text.length, nar.shown + dt * 38);
    if (nar.shown >= nar.text.length) nar.until = performance.now() + nar.hold * 1000;
  } else if (performance.now() > nar.until) { lastSpeak = performance.now(); next(); }
}

// ---------- interaction state ----------
const state = { mode: 'boot', system: null, hover: null, sawDrawer: false, said: new Set(), idle: 0, busy: false, playing: null };
// What a system will take right now: found games only, and an unwoken GBA only takes the old cartridge.
const playable = (sys) => (PLAYS[sys] || []).filter((g) => isFound(g) && (sys !== 'gba-console' || gbaAwake() || g === 'gb-cart'));
const PROMPT = (id) => {
  if (id === 'drawer') return spot === 'drawer' ? null : 'OPEN';
  if (id === 'envelope') return 'OPEN';
  if (id === 'postcard') return 'READ';
  if (PLAYS[id]) return 'USE';
  if (state.mode === 'choose') return playable(state.system).includes(id) ? 'INSERT' : null;
  return 'LOOK';
};
function highlight(ids) {
  for (const [id, o] of Object.entries(objects)) gsap.to(o, { glow: ids.includes(id) ? 1 : 0, duration: 0.4 });
}
function resetChoice() { state.mode = 'free'; state.system = null; highlight([]); }

function activate(id) {
  if (!id || state.busy) return;
  if (state.playing) return; // the menu handles eject first
  if (id === 'drawer') {
    if (spotOpen('drawer')) return goSpot('drawer');
    say(STORY_LINES.drawerLocked, 2.4);
    gsap.fromTo(drawer.position, { z: DRAWER_SHUT }, { z: DRAWER_SHUT + 0.015, duration: 0.07, yoyo: true, repeat: 3 });
    return;
  }
  if (id === 'envelope') return openLetter();
  if (id === 'postcard') return readPostcard();
  const o = objects[id]; if (!o) return;
  if (PLAYS[id] && !rest?.done) { loadRest().then(() => activate(id)); return; } // its games are still on their way
  if (PLAYS[id]) {
    // pick a system: look over at the games that fit, lit up
    state.mode = 'choose'; state.system = id;
    const asleep = id === 'gba-console' && !gbaAwake();
    say(asleep ? STORY_LINES.gbaAsleep : LINES.choose[id]);
    const games = playable(id).filter((g) => objects[g]);
    if (!games.length) { resetChoice(); say(LINES.nothingYet, 2.4); return; }
    highlight([id, ...games]);
    if (games.length === 1 && !asleep) return insert(games[0], id); // only one thing fits: no need to ask
    if (games.length && games.every((g) => objects[g].place.spot === 'drawer')) return goSpot('drawer');
    // the games that fit are on the desk already (the story keeps Galactic News there): stay put
    const at = games.length && games.every((g) => objects[g].place.spot === 'desk') ? 'desk' : 'table';
    setNav(at); closePanel();
    moveTo(SPOTS[at].pos, SPOTS[at].look);
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
  else if (SYSTEM_OF[id] && !state.said.has('hint-' + id)) { state.said.add('hint-' + id); say(LINES.hover[id]); }
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
  state.mode = 'playing'; state.busy = true; highlight([]); closePanel();
  setNav('desk');
  const home = { parent: g.obj.parent, pos: g.obj.position.clone(), quat: g.obj.quaternion.clone(), scale: g.obj.scale.x };
  state.playing = { game, sys, home };
  const tl = gsap.timeline({ onComplete: () => { state.busy = false; started(game, sys); } });
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
  if (sys !== 'pc') setScreen(sys, true);
  if (SLOTS[sys]) cameraTo(sys, 1.6);
  say(storyPlayed(game, sys) || `* ${PROJECTS[game].title.toLowerCase()}. good choice.`);
  openProject(game, true);
}

// ---------- story beats ----------
let memFlash = -10; // when the last memory came back, for the corner logo's blink
function storyPlayed(game, sys) {
  if (!STORY) return null;
  let line = null;
  if (sys === 'gba-console' && game === 'gb-cart' && !story.flags.has('gba-awake')) { story.flags.add('gba-awake'); line = STORY_LINES.gbaWakes; burst(0.5); }
  if (game === 'gba-cart') line = STORY_LINES.minamoto;
  if (GAMES.includes(game) && !story.played.has(game)) { story.played.add(game); memFlash = clock.elapsedTime; }
  persist();
  return line;
}
// What happens once a game is taken out again: the next thing turns up.
function storyEjected(game) {
  if (!STORY) return;
  if (game === 'gb-cart' && !story.found.has('postcard')) setTimeout(() => { reveal('postcard'); say(STORY_LINES.postcard); }, 400);
  if (game === 'gba-cart' && !story.found.has('ptcg-cube-rulebook')) {
    setTimeout(() => { goSpot('table'); say(STORY_LINES.rulebook); setTimeout(() => reveal('ptcg-cube-rulebook'), DUR * 1000); }, 400);
    setTimeout(lampGoes, 5200);
  }
  const lines = [];
  if (game === 'holon-disc' && !story.found.has('spacerim-disc')) { lines.push(STORY_LINES.spacerim); setTimeout(() => { goSpot('table'); setTimeout(() => reveal('spacerim-disc'), DUR * 1000); }, 400); }
  if (game === 'crossfader-cassette' && !story.spots.has('drawer')) {
    lines.push(...STORY_LINES.drawerOpens);
    setTimeout(() => {
      openSpot('drawer'); reveal('cd-jewel');
      gsap.fromTo(drawer.position, { z: DRAWER_SHUT }, { z: DRAWER_SHUT + 0.03, duration: 0.12, yoyo: true, repeat: 1 });
    }, 400);
  }
  if (DRAFT.includes(game) && DRAFT.some((g) => !story.found.has(g))) {
    lines.push(STORY_LINES.draftNext);
    setTimeout(() => { const o = objects['ptcg-cube-rulebook']; if (o) { o.glow = 1; gsap.to(o, { glow: 0, duration: 2.4, delay: 2 }); } }, 400);
  }
  if (story.played.size === GAMES.length && !story.flags.has('complete')) { story.flags.add('complete'); persist(); lines.push(...STORY_LINES.complete); }
  if (lines.length) setTimeout(() => say(lines), 500);
}
// Something turns up: it drops into place with a little bounce, lit for a moment.
async function reveal(id) {
  if (!objects[id]) await loadRest();
  const o = objects[id]; if (!o) return;
  story.found.add(id); persist();
  o.root.traverse((n) => n.userData.redraw?.());
  o.root.visible = true;
  const y = o.root.position.y;
  gsap.fromTo(o.root.position, { y: y + 0.18 }, { y, duration: reduce ? 0.01 : 0.55, ease: 'bounce.out' });
  burst(0.35);
  o.glow = 1; gsap.to(o, { glow: 0, duration: 2.4, delay: 1 });
}
// The desk lamp starts to go (the first thing in the room that fails), and the narrator hands over a flashlight.
const LAMP_FULL = lamp.intensity;
function dimLamp() { lamp.intensity = LAMP_FULL * 0.45; bulb.material.color.set(0xb89a6c); }
function lampGoes() {
  if (story.flags.has('torch')) return;
  story.flags.add('torch'); persist();
  const tl = gsap.timeline();
  for (const k of [0.1, 1, 0.05, 0.8, 0.02, 0.6]) tl.set(lamp, { intensity: LAMP_FULL * k }, `+=${reduce ? 0 : 0.09}`);
  tl.call(() => { dimLamp(); burst(0.3); say(STORY_LINES.torch); });
  tl.to(torch, { intensity: TORCH, duration: reduce ? 0.01 : 0.6, ease: 'power2.out' }, '+=1.2');
}
if (STORY && story.flags.has('torch')) { dimLamp(); torch.intensity = TORCH; }
function openSpot(s) { if (story.spots.has(s)) return; story.spots.add(s); persist(); navFlash[s] = clock.elapsedTime; burst(0.3); }
const navFlash = {};
function readPostcard() {
  frameObject('postcard', 1.1);
  openPanel({ kind: 'project', tag: 'POSTCARD', title: 'Delivered', kana: 'はいたつ  DELIVERY', body: ['Galactic News delivered this one. On the back, in Omar’s hand: “The table is set. Come and see the rest.”'],
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
    // found it: put the game in, unless the system has its own condition first (the sleeping GBA)
    if (game && playable(sys).includes(game)) setTimeout(() => { if (!state.busy && !state.playing) insert(game, sys); }, reduce ? 300 : 1600);
  }, DUR * 1000 + 200);
}
// The Cube's rulebook deals the next games: one face-down pick at a time, the next once the last is played.
function readRulebook() {
  if (!story.played.has('ptcg-cube-rulebook')) { story.played.add('ptcg-cube-rulebook'); memFlash = clock.elapsedTime; persist(); }
  frameObject('ptcg-cube-rulebook', 0.9, DUR * 0.8);
  highlight(['ptcg-cube-rulebook']);
  const left = DRAFT.filter((g) => !story.found.has(g));
  const waiting = DRAFT.find((g) => story.found.has(g) && !story.played.has(g));
  if (!left.length || waiting) {
    openProject('ptcg-cube-rulebook', false);
    say(waiting ? STORY_LINES.draftWait : LINES.rulebook);
    if (waiting) highlight([waiting]);
    return;
  }
  say(left.length === DRAFT.length ? STORY_LINES.draft : STORY_LINES.draftNext);
  openPanel({ kind: 'project', tag: 'DRAFT', title: left.length === DRAFT.length ? 'Pick one' : 'Next pick', kana: 'ドラフト  DRAFT',
    body: [`Pick ${DRAFT.length - left.length + 1} of ${DRAFT.length}. Keep one, the rest come round again.`],
    items: [...left.map((g) => ({ label: DRAFT_FACE[g][0], note: DRAFT_FACE[g][1], act: () => draftPick(g) })),
      { label: 'READ THE RULES', act: () => openProject('ptcg-cube-rulebook', false) },
      { label: 'BACK', act: () => { closePanel(); highlight([]); goSpot('table'); } }] });
}
function draftPick(g) {
  closePanel(); highlight([]); goSpot('table');
  say(STORY_LINES.picked[g]);
  setTimeout(() => reveal(g), DUR * 1000);
}
function skipStory() {
  for (const p of PLACES) story.found.add(p.id);
  for (const s of Object.keys(SPOTS)) story.spots.add(s);
  story.flags.add('gba-awake'); story.flags.add('postcard-read'); story.flags.add('skipped');
  persist();
  loadRest().then(() => { for (const o of Object.values(objects)) o.root.visible = true; });
  say(STORY_LINES.skip);
}

function eject() {
  const p = state.playing; if (!p || state.busy) return;
  const g = objects[p.game];
  state.busy = true; closePanel();
  const tl = gsap.timeline({ onComplete: () => { state.busy = false; state.playing = null; resetChoice(); goSpot('desk'); storyEjected(p.game); } });
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
  const tl = gsap.timeline({ onComplete: () => { state.busy = false; openPanel(letterPanel()); } });
  tl.to(flap.rotation, { x: FLAP_OPEN, duration: 0.6, ease: 'power2.out' }, DUR * 0.6);
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
  const tl = gsap.timeline({ onComplete: () => { letterMesh.visible = false; state.busy = false; goSpot('desk'); } });
  state.busy = true;
  // fold it back in three, lay it down, slide it home
  tl.to(foldMid.rotation, { x: FOLD, duration: 0.4, ease: 'power2.inOut' });
  tl.to(foldTop.rotation, { x: -FOLD, duration: 0.4, ease: 'power2.inOut' }, '-=0.15');
  tl.to(letterMesh.rotation, { x: -Math.PI / 2, duration: 0.35, ease: 'power2.inOut' });
  tl.to(letterMesh.position, { y: 0.006, duration: 0.35, ease: 'power2.inOut' }, '<');
  tl.to(letterMesh.position, { z: 0.012, y: 0.003, duration: 0.45, ease: 'power2.in' });
  tl.to(flap.rotation, { x: FLAP_SHUT, duration: 0.45, ease: 'power2.in' });
}

// ---------- the menu inside the tube ----------
// One JRPG window for everything you can do with a thing: project facts on top, a cursor menu below.
let panel = null;
function openPanel(p) { panel = p; panel.sel = 0; announcePanel(); }
function closePanel() { panel = null; }
function announcePanel() {
  if (!panel) return;
  document.getElementById('say').textContent = [panel.title, panel.body?.join(' '), 'Options: ' + panel.items.map((i) => i.label).join(', ')].filter(Boolean).join('. ');
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
  if (playing) items.push({ label: 'EJECT', act: eject });
  else if (SYSTEM_OF[id]) items.push({ label: 'PLAY IT', act: () => playIt(id) });
  if (STUDIES || PUBLISHED.has(SLUG[id])) items.push({ label: 'CASE STUDY', act: () => openStudy(id) });
  items.push({ label: 'BACK', act: () => { if (playing) eject(); else { closePanel(); highlight([]); goSpot(objects[id].place.spot); } } });
  openPanel({ kind: 'project', tag: p.medium, title: p.title, kana: p.kana, body: [p.pitch], items });
}
// Case studies live on their own pages (study/<slug>/). The ones Omar has passed are linked for everyone; drafts stay behind ?studies.
// Leaving is a channel change: a burst, the picture collapses to a line, then the page goes.
const STUDIES = new URLSearchParams(location.search).has('studies');
const PUBLISHED = new Set(['crossfader', 'spacerim', 'holon', 'galactic-news']);
const SLUG = { 'gb-cart': 'galactic-news', 'gba-cart': 'minamoto', 'ds-cart': 'legends-arise', 'crossfader-cassette': 'crossfader', 'holon-disc': 'holon', 'spacerim-disc': 'spacerim', 'ptcg-cube-rulebook': 'ptcg-cube', 'cd-jewel': 'haunt-record' };
function openStudy(id) {
  if (!SLUG[id] || state.leaving) return;
  state.leaving = true; closePanel(); burst(0.8);
  gsap.to(crtMat.uniforms.uPower, { value: 0, duration: reduce ? 0.05 : 0.35, ease: 'power2.in', onComplete: () => { location.href = `study/${SLUG[id]}/`; } });
}
// Coming back with BACK can restore this page from the browser's cache with the picture still off: switch it on.
addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  state.leaving = false;
  gsap.to(crtMat.uniforms.uPower, { value: 1, duration: reduce ? 0.05 : 0.5, ease: 'power2.out' });
});
function letterPanel() {
  return {
    kind: 'letter', tag: 'A LETTER', title: LETTER.name, kana: `${LETTER.role}  ${LETTER.kana}`, body: LETTER.body, extra: LETTER.skills,
    items: [...LETTER.contacts.map((c) => ({ label: c.label, note: c.note, act: () => window.open(c.url, c.url.startsWith('mailto') ? '_self' : '_blank', 'noopener') })),
      { label: 'FOLD IT AWAY', act: () => { closePanel(); closeLetter(); } }],
  };
}
let panelHits = [];
// Omar's photo, pixelated to four colours, pinned to the letter's corner
const portrait = new Image(); portrait.src = 'labels/omar-pixel.png';
function drawPanel(t) {
  panelHits = [];
  if (!panel) return;
  const letter = panel.kind === 'letter', wide = letter || panel.kind === 'credits' || panel.kind === 'memories';
  const short = H < 480; // phones sideways: wider windows, bigger rows for thumbs, clear of the bigger nav
  // with a finger, the game window grows and keeps clear of the A/B buttons on the right
  const big = touchUI && !wide;
  // handheld: the nav and A/B live on the bezel, so the window can sit high and right
  // while a game plays on the handheld, its window shrinks to the corner so the console's screen stays in view
  const compact = handheld && !wide && !!state.playing;
  const w = compact ? 220 : wide ? (handheld ? W - 28 : Math.min(W - 96, short ? 780 : 600)) : handheld ? 300 : big ? 360 : (short ? 300 : 260);
  const x = wide ? Math.round((W - w) / 2) : W - w - (handheld ? 16 : big ? 150 : 28); let y = wide ? (short ? 24 : 36) : handheld ? 28 : (short ? 82 : 70);
  g2.font = `900 ${wide ? 15 : 14}px "FK Grotesk"`;
  const bodyLines = compact ? [] : panel.body.flatMap((p) => [...wrap(p, w - 40), '']);
  const lineH = wide ? 18 : 17;
  const itemH = handheld ? 30 : big ? 36 : short ? (wide ? 23 : 28) : wide ? 19 : 22;
  const h = 84 + (letter && !short ? 30 : 0) + bodyLines.length * lineH + (panel.extra ? 22 : 0) + panel.items.length * itemH + 14;
  if (compact) y = H - h - 14;
  // a window taller than the tube shrinks to fit it (the letter on a phone's 4:3 tube)
  const k = Math.min(1, (H - 10 - (handheld && !wide && !compact ? 96 : 0) - y) / h), cx0 = x + w / 2;
  g2.save();
  if (k < 1) { g2.translate(cx0, y); g2.scale(k, k); g2.translate(-cx0, -y); }
  // window: same family as the dialogue box
  g2.fillStyle = 'rgba(16,47,65,0.96)'; g2.fillRect(x, y, w, h);
  g2.strokeStyle = '#fce8cd'; g2.lineWidth = 2; g2.strokeRect(x + 4, y + 4, w - 8, h - 8);
  g2.font = '11px "8bitDarling"'; const tw = g2.measureText(panel.tag).width + 16;
  g2.fillStyle = '#ec563b'; g2.fillRect(x + 14, y - 11, tw, 20);
  g2.fillStyle = '#fce8cd'; g2.fillText(panel.tag, x + 22, y - 1);
  g2.font = '900 24px "FK Grotesk"'; g2.fillStyle = '#fce8cd'; g2.fillText(panel.title, x + 20, y + 34);
  g2.font = '900 11px "FK Grotesk"'; g2.fillStyle = '#4eb99f'; g2.fillText(panel.kana, x + 20, y + 54);
  let cy = y + 78;
  if (letter && portrait.complete && portrait.naturalWidth) {
    const ps = short ? 60 : 84, px = x + w - ps - 22, py = y + 16;
    g2.imageSmoothingEnabled = false;
    g2.fillStyle = '#fce8cd'; g2.fillRect(px - 4, py - 4, ps + 8, ps + 8);
    g2.drawImage(portrait, px, py, ps, ps);
    g2.imageSmoothingEnabled = true;
    if (!short) cy += 30;
  }
  g2.font = `900 ${wide ? (panel.kind === 'credits' ? 12 : 15) : 14}px "FK Grotesk"`; g2.fillStyle = 'rgba(252,232,205,0.92)';
  for (const l of bodyLines) { g2.fillText(l, x + 20, cy); cy += lineH; }
  if (panel.extra) { g2.font = '10px "8bitDarling"'; g2.fillStyle = '#fadb68'; g2.fillText(panel.extra.toUpperCase(), x + 20, cy); cy += 22; }
  // the cursor menu
  g2.fillStyle = 'rgba(252,232,205,0.25)'; g2.fillRect(x + 16, cy - 6, w - 32, 1);
  cy += 8;
  panel.items.forEach((it, i) => {
    const on = i === panel.sel;
    if (on) { g2.fillStyle = '#ec563b'; g2.fillRect(x + 14, cy - itemH / 2 + 1, w - 28, itemH - 2); }
    g2.font = `${big ? 15 : 12}px "8bitDarling"`; g2.fillStyle = on ? '#fce8cd' : 'rgba(252,232,205,0.85)';
    g2.fillText((on ? '▶ ' : '  ') + it.label, x + 22, cy + 1);
    if (it.note) { g2.font = '900 12px "FK Grotesk"'; g2.fillStyle = on ? '#fce8cd' : '#4eb99f'; g2.textAlign = 'right'; g2.fillText(it.note, x + w - 24, cy + 1); g2.textAlign = 'left'; }
    panelHits.push({ i, x: cx0 + (x + 14 - cx0) * k, y: y + (cy - itemH / 2 - y) * k, w: (w - 28) * k, h: itemH * k });
    cy += itemH;
  });
  g2.restore();
}
function panelAt(u, v) {
  const [cu, cv] = curve(u, v); const px = cu * W, py = (1 - cv) * H;
  return panelHits.find((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
}
function navAt(u, v) {
  const [cu, cv] = curve(u, v); const px = cu * W, py = (1 - cv) * H;
  return navHits.find((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
}
// The nav lives in the tube now: three channel bars top right, credits and the quick view bottom right.
let navHits = [], navHover = null;
const NAV = [['desk', '01', 'DESK', 'デスク'], ['table', '02', 'TABLE', 'テーブル'], ['drawer', '03', 'DRAWER', 'ひきだし']];
function drawNav() {
  navHits = [];
  syncBezel(); // the DOM nav hides places not found yet, for keyboards too
  if (handheld) return; // the bezel carries the nav and the small print
  if (panel && panel.kind !== 'project') return;
  // on short screens (phones sideways) the bars grow so a thumb can hit them
  const ns = canvas.clientHeight < 520 ? 1.35 : 1;
  g2.save(); g2.translate(W, 0); g2.scale(ns, ns); g2.translate(-W, 0);
  let x = W - 18;
  for (const [id, num, label, kana] of [...NAV].filter(([id]) => spotOpen(id)).reverse()) {
    g2.font = `11px "${FONT_PIX}"`; const lw = g2.measureText(label).width;
    g2.font = `900 9px "${FONT_G}"`; const kw = g2.measureText(kana).width;
    const w = 34 + Math.max(lw, kw) + 12, h = 30, y = 10; x -= w;
    const on = spot === id, hot = navHover === id;
    // a channel that just opened blinks gold for a couple of seconds
    const fresh = navFlash[id] !== undefined && clock.elapsedTime - navFlash[id] < 2.4 && Math.floor((clock.elapsedTime - navFlash[id]) * 4) % 2 === 0;
    g2.fillStyle = fresh ? '#fadb68' : on ? '#ec563b' : hot ? 'rgba(236,86,59,0.6)' : 'rgba(236,86,59,0.35)';
    g2.beginPath(); g2.roundRect(x, y, w, h, 15); g2.fill();
    g2.fillStyle = '#102f41'; g2.fillRect(x + 8, y + 9, 20, 12);
    g2.font = `8px "${FONT_PIX}"`; g2.fillStyle = '#fce8cd'; g2.fillText(num, x + 11, y + 15.5);
    g2.font = `11px "${FONT_PIX}"`; g2.fillText(label, x + 34, y + 11);
    g2.font = `900 9px "${FONT_G}"`; g2.fillStyle = 'rgba(252,232,205,0.85)'; g2.fillText(kana, x + 34, y + 23);
    navHits.push({ id, x: W - (W - x) * ns, y: y * ns, w: w * ns, h: h * ns, act: () => goSpot(id) });
    x -= 8;
  }
  g2.restore();
  if (panel) return;
  // small print, bottom right, above nothing else
  g2.font = `${Math.round(9 * ns)}px "${FONT_PIX}"`; g2.textAlign = 'right';
  // on a desktop the sticker on the bezel is the quick view, so the tube only lists it on a handheld
  const links = [['credits', 'CREDITS', () => openPanel(creditsPanel())]];
  if (handheld) links.unshift(['quick', 'QUICK VIEW →', () => { location.href = 'quick/' + location.search; }]);
  if (STORY && !story.flags.has('skipped') && !story.flags.has('complete')) links.push(['skip', 'SKIP STORY', () => openPanel(skipPanel())]);
  let rx = W - 18; const ry = H - 16;
  for (const [id, label, act] of links) {
    const w = g2.measureText(label).width;
    g2.fillStyle = navHover === id ? '#fadb68' : 'rgba(252,232,205,0.55)'; g2.fillText(label, rx, ry);
    navHits.push({ id, x: rx - w - 6, y: ry - 12 * ns, w: w + 12, h: 24 * ns, act });
    rx -= w + 18;
  }
  g2.textAlign = 'left';
}
function skipPanel() {
  return { kind: 'project', tag: 'SKIP STORY', title: 'Skip the story?', kana: 'スキップ  SKIP', body: ['Everything in the room comes out at once. The memories stay as they are.'],
    items: [{ label: 'KEEP PLAYING', act: closePanel }, { label: 'SKIP IT', act: () => { closePanel(); skipStory(); } }] };
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
  document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).then(() => screen.orientation?.lock?.('landscape')).catch(() => {});
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
  const nh = navAt(mouse.u, mouse.v); if (nh) { if (nh.id === 'quick' || nh.id === 'credits' || !state.busy) nh.act(); return; }
  if (panel) {
    const hit = panelAt(mouse.u, mouse.v); if (!hit) return;
    // with a finger, the first tap on a row picks it and the second uses it
    if (touch && panel.sel !== hit.i) { panel.sel = hit.i; return; }
    panel.items[hit.i].act(); return;
  }
  if (state.mode === 'boot' || state.busy || state.playing) return;
  const id = pick() || (touch ? pickNear() : null);
  if (!id) { state.hover = null; if (state.mode === 'choose') say(LINES.chooseHelp, 2.4); return; }
  if (touch && state.hover !== id) { state.hover = id; return; } // aim first: the prompt shows over it
  if (touch) state.hover = null;
  activate(id);
});
// The handheld's buttons. A uses what's aimed at (or the chosen row), B steps back.
function pressA() {
  if (panel) return panel.items[panel.sel].act();
  if (state.mode === 'boot' || state.busy || state.playing) return;
  if (!state.hover) return step(1, 'x'); // nothing aimed yet: A aims at the first thing
  const id = state.hover; state.hover = null; activate(id);
}
function pressB() {
  if (panel) return panel.items.at(-1).act();
  if (state.busy) return;
  state.hover = null;
  if (state.mode === 'choose') { resetChoice(); goSpot(spot); } else if (spot !== 'desk') goSpot('desk');
}
// The bezel's buttons (handheld layout)
function bez(sel, fn) { document.querySelectorAll(sel).forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); state.idle = 0; touchUI = true; fn(b); })); }
bez('.ab .a', pressA); bez('.ab .b', pressB);
bez('.dpad [data-d]', (b) => { const d = b.dataset.d; step(d === 'left' || d === 'up' ? -1 : 1, d === 'left' || d === 'right' ? 'x' : 'y'); });
bez('[data-link="credits"]', () => openPanel(creditsPanel()));
bez('[data-link="skip"]', () => openPanel(skipPanel()));
function syncBezel() {
  const t = clock.elapsedTime;
  for (const b of navEl.querySelectorAll('button')) {
    const id = b.dataset.spot, hide = !spotOpen(id);
    if (b.hidden !== hide) b.hidden = hide;
    const fresh = navFlash[id] !== undefined && t - navFlash[id] < 2.4 && Math.floor((t - navFlash[id]) * 4) % 2 === 0;
    if (b.classList.contains('fresh') !== fresh) b.classList.toggle('fresh', fresh);
  }
  const sk = document.querySelector('[data-link="skip"]'), noSkip = !(STORY && !story.flags.has('skipped') && !story.flags.has('complete'));
  if (sk.hidden !== noSkip) sk.hidden = noSkip;
}
// D-pad: along x through the objects in view, left to right as they sit on screen; along y through menu rows.
function step(dir, axis) {
  if (panel) { panel.sel = (panel.sel + dir + panel.items.length) % panel.items.length; return; }
  if (axis === 'y' || state.mode === 'boot' || state.busy || state.playing) return;
  const list = inView().map((id) => [id, screenOf(id, true)]).filter(([, at]) => at && at[0] > 0 && at[0] < W).sort((p, q) => p[1][0] - q[1][0]).map(([id]) => id);
  if (!list.length) return;
  const i = list.indexOf(state.hover);
  state.hover = list[i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length];
}

// keyboard: arrows pick among objects in view (or menu entries), Enter uses, Esc steps back, 1-3 move
let focusIdx = -1;
function inView() { return Object.entries(objects).filter(([id, o]) => (o.place.spot === spot || (state.mode === 'choose' && playable(state.system).includes(id))) && o.root.visible).map(([id]) => id); }
addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('nav, details')) return;
  if (panel) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { panel.sel = (panel.sel + 1) % panel.items.length; e.preventDefault(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { panel.sel = (panel.sel - 1 + panel.items.length) % panel.items.length; e.preventDefault(); }
    else if (e.key === 'Enter' || e.key === ' ') { panel.items[panel.sel].act(); e.preventDefault(); }
    else if (e.key === 'Escape') panel.items.at(-1).act();
    if (panel) document.getElementById('say').textContent = panel.items[panel.sel].label;
    return;
  }
  if (e.key === '1') goSpot('desk'); else if (e.key === '2') goSpot('table'); else if (e.key === '3') goSpot('drawer');
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const list = inView(); if (!list.length) return;
    focusIdx = (focusIdx + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length;
    state.hover = list[focusIdx]; state.keyHover = true; e.preventDefault();
    document.getElementById('say').textContent = `${state.hover}: ${PROMPT(state.hover) || ''}`;
  } else if (e.key === 'Enter' && state.keyHover && state.hover) { activate(state.hover); e.preventDefault(); }
  else if (e.key === 'Escape') { resetChoice(); goSpot(spot); }
});

// ---------- burst ----------
function burst(a) { if (reduce) return; crtMat.uniforms.uBurst.value = Math.max(crtMat.uniforms.uBurst.value, a); }

// ---------- UI drawn into the tube ----------
const FONT_PIX = '8bitDarling', FONT_G = 'FK Grotesk';
await Promise.allSettled([document.fonts.load(`16px "${FONT_PIX}"`), document.fonts.load(`900 16px "${FONT_G}"`)]);
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
function drawUI(t) {
  g2.clearRect(0, 0, W, H);
  g2.textBaseline = 'middle'; g2.textAlign = 'left';
  // prompt over the hovered object
  const id = state.hover; const label = id && !panel && state.mode !== 'boot' && !state.busy && !state.playing ? PROMPT(id) : null;
  if (label) {
    const at = id === 'drawer' ? (() => { const v = new THREE.Vector3(); knob.getWorldPosition(v); v.project(camera); return [(v.x * 0.5 + 0.5) * W, (1 - (v.y * 0.5 + 0.5)) * H - 10]; })() : screenOf(id);
    if (at) {
      g2.font = `12px "${FONT_PIX}"`;
      const txt = '▶ ' + label + (touchUI ? ' (A)' : ''); const w = g2.measureText(txt).width + 14;
      const x = Math.round(Math.min(W - w - 6, Math.max(6, at[0] - w / 2))), y = Math.round(Math.max(8, at[1] - 30 + Math.sin(t * 5) * 2));
      g2.fillStyle = '#ec563b'; g2.fillRect(x, y, w, 20);
      g2.fillStyle = '#fce8cd'; g2.fillText(txt, x + 7, y + 11);
      g2.fillStyle = '#ec563b'; g2.beginPath(); g2.moveTo(x + w / 2 - 5, y + 20); g2.lineTo(x + w / 2 + 5, y + 20); g2.lineTo(x + w / 2, y + 26); g2.fill();
    }
  }
  drawPanel(t);
  // the dialogue box
  if (nar.visible && !(panel && panel.kind === 'letter')) {
    // on short screens the box keeps to the bottom left so it hides less of the room
    // the handheld's 4:3 tube is narrow: there the box spans it and grows with the line
    const short = H < 480, bw = handheld ? W - 40 : short ? Math.min(Math.round(W * 0.56), 560) : Math.min(W - 80, 760), bx = handheld ? 20 : short ? 24 : Math.round((W - bw) / 2);
    g2.font = `900 17px "${FONT_G}"`;
    const lines = wrap(nar.text.slice(0, Math.floor(nar.shown)), bw - 50).slice(0, 3);
    const bh = handheld ? 30 + Math.max(2, wrap(nar.text, bw - 50).length) * 22 : 72, by = H - bh - 20;
    g2.fillStyle = 'rgba(16,47,65,0.94)'; g2.fillRect(bx, by, bw, bh);
    g2.strokeStyle = '#fce8cd'; g2.lineWidth = 2; g2.strokeRect(bx + 4, by + 4, bw - 8, bh - 8);
    g2.font = `12px "${FONT_PIX}"`;
    const nw = g2.measureText(nar.name).width + 16;
    g2.fillStyle = '#ec563b'; g2.fillRect(bx + 14, by - 12, nw, 22);
    g2.fillStyle = '#fce8cd'; g2.fillText(nar.name, bx + 22, by - 1);
    g2.font = `900 17px "${FONT_G}"`; g2.fillStyle = '#fce8cd';
    lines.forEach((l, i) => g2.fillText(l, bx + 22, by + 28 + i * 22));
    if (nar.shown >= nar.text.length && Math.sin(t * 6) > 0) { g2.fillStyle = '#fadb68'; g2.beginPath(); g2.moveTo(bx + bw - 26, by + bh - 22); g2.lineTo(bx + bw - 16, by + bh - 22); g2.lineTo(bx + bw - 21, by + bh - 15); g2.fill(); }
  }
  drawNav();
  // spot label, top-left, like a channel number
  if (!panel || panel.kind === 'project') {
    // a dark plate so the corner reads over a lit desk
    if (STORY) { g2.fillStyle = 'rgba(6,9,11,0.6)'; g2.beginPath(); g2.roundRect(8, 6, 184, 70, 8); g2.fill(); }
    g2.font = `12px "${FONT_PIX}"`; g2.fillStyle = 'rgba(252,232,205,0.7)';
    g2.fillText({ desk: 'CH 01 DESK', table: 'CH 02 TABLE', drawer: 'CH 03 DRAWER' }[spot], 18, 20);
    if (STORY) drawMemories(t);
  }
  if (touchUI && !handheld) drawPad();
  uiTex.needsUpdate = true;
}

// A and B, drawn like a Game Boy's: A up and right, B down and left, big enough for a thumb.
let padFlash = { id: null, t: -1 };
function drawPad() {
  const r = 30, ax = W - 46, ay = Math.round(H * 0.46), bx = ax - 70, by = ay + 40;
  for (const [id, cx, cy, label, act] of [['btnB', bx, by, 'B', pressB], ['btnA', ax, ay, 'A', pressA]]) {
    const lit = padFlash.id === id && clock.elapsedTime - padFlash.t < 0.15;
    g2.fillStyle = lit ? '#fadb68' : 'rgba(236,86,59,0.9)';
    g2.beginPath(); g2.arc(cx, cy, r, 0, Math.PI * 2); g2.fill();
    g2.strokeStyle = 'rgba(252,232,205,0.5)'; g2.lineWidth = 2; g2.stroke();
    g2.font = `16px "${FONT_PIX}"`; g2.fillStyle = '#fce8cd'; g2.textAlign = 'center'; g2.fillText(label, cx, cy + 1); g2.textAlign = 'left';
    navHits.push({ id, x: cx - r - 6, y: cy - r - 6, w: (r + 6) * 2, h: (r + 6) * 2, act: () => { padFlash = { id, t: clock.elapsedTime }; act(); } });
  }
}
// The narrator's face in the corner: Omar's logo, its inside filling one step per memory given back.
function drawMemories(t) {
  const n = story.played.size, size = 34, x = 18, y = 34;
  const blink = t - memFlash < 1.6 && Math.floor((t - memFlash) * 5) % 2 === 0;
  const shown = blink ? n - 1 : n;
  g2.save(); g2.translate(x, y); g2.scale(size / 555, size / 555);
  g2.fillStyle = '#fce8cd'; g2.fill(new Path2D(LOGO_OUTER));
  const inner = new Path2D(LOGO_INNER);
  g2.fillStyle = 'rgba(252,232,205,0.16)'; g2.fill(inner);
  // the inside spans about y 137 to 417 in logo units; it fills from its wide top edge in eight hard steps
  const top = 137, hgt = (417 - top) * shown / GAMES.length;
  g2.clip(inner); g2.fillStyle = '#ec563b'; g2.fillRect(0, top, 555, hgt);
  g2.restore();
  g2.font = `11px "${FONT_PIX}"`; g2.fillStyle = blink ? '#fadb68' : 'rgba(252,232,205,0.8)';
  const label = `MEMORIES ${n}/${GAMES.length}`;
  g2.fillText(label, x + size + 8, y + size / 2);
  if (!panel) navHits.push({ id: 'memories', x: x - 4, y: y - 4, w: size + 16 + g2.measureText(label).width, h: size + 8, act: () => openPanel(memoriesPanel()) });
}
// A trainer card of what's been given back: played games by name, the rest still unknown.
function memoriesPanel() {
  return {
    kind: 'memories', tag: 'MEMORIES', title: `${story.played.size} of ${GAMES.length}`, kana: 'きおく  MEMORIES',
    body: ['Every game you play gives one memory back.'],
    items: [...GAMES.map((g) => story.played.has(g)
      ? { label: PROJECTS[g].title.toUpperCase(), note: PROJECTS[g].medium.toLowerCase(), act: () => { closePanel(); activate(g); } }
      : { label: '? ? ?', note: '', act: () => say(nextHint(true) || '* not yet.', 2.4) }),
    { label: 'BACK', act: closePanel }],
  };
}
// The hint for wherever the visitor is stuck: a nudge first, the plain instruction the second time.
function nextHint(plain) {
  const h = STORY_LINES.hints.find(([cond]) => cond());
  return h ? h[plain ? 2 : 1] : null;
}

// ---------- loop ----------
const clock = new THREE.Clock();
const tmpCol = new THREE.Color(), GOLD = new THREE.Color(0xfadb68);
renderer.setAnimationLoop(() => {
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
    const k = Math.max(o.glow * (0.35 + 0.25 * Math.sin(t * 4)), id === hov ? 0.22 : 0);
    for (const m of o.mats) {
      if (/screen|blinn2/i.test(m.name)) continue;
      tmpCol.copy(m.userData.baseEmissive).lerp(GOLD, Math.min(1, k * 1.5));
      m.emissive.copy(tmpCol); m.emissiveIntensity = (m.userData.baseIntensity || 1) + k * 0.6;
    }
  }
  // idle: the narrator nudges, once in a while
  state.idle += dt;
  if (state.mode === 'free' && !panel && !nar.visible && state.idle > 22 && performance.now() - lastSpeak > 20000) {
    state.idle = 0;
    // in the story, being stuck gets a nudge first and the plain instruction the next time
    const gentle = STORY && nextHint(false);
    const line = gentle ? (state.hinted === gentle ? nextHint(true) : gentle) : LINES.idle[(state.idleN = (state.idleN || 0) + 1) % LINES.idle.length];
    if (gentle) state.hinted = gentle;
    say(line);
    if (/drawer/.test(line)) gsap.fromTo(drawer.position, { z: DRAWER_SHUT }, { z: DRAWER_SHUT + 0.04, duration: 0.25, yoyo: true, repeat: 1 });
  }
  tickNarrator(dt);
  // camera: target plus a gentle sway toward the cursor
  const s = reduce || panel ? 0 : 0.05;
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
  renderer.setRenderTarget(rt); renderer.render(scene, camera);
  drawUI(t);
  renderer.setRenderTarget(null); renderer.render(quadScene, quadCam);
});

// ---------- power on ----------
// the standby card leaves as the tube switches on, so the switch-on stays the only ceremony
document.getElementById('standby')?.remove(); document.body.classList.remove('cold');
gsap.to(crtMat.uniforms.uPower, { value: 1, duration: reduce ? 0.2 : 0.9, ease: 'power2.out', delay: 0.2 });
if (!reduce) crtMat.uniforms.uBurst.value = 0.9;
setTimeout(() => {
  queue(STORY ? (returning ? STORY_LINES.back : STORY_LINES.boot) : LINES.boot, 2.6);
  if (touchUI) queue(handheld ? '* tap a thing to point at it, tap again to use it. or the pad and a, like a game boy.' : '* tap something to point at it, tap again to use it. a and b work too.', 3.4);
}, reduce ? 300 : 1300);
setTimeout(() => { loadRest(); if (state.mode === 'boot') state.mode = 'free'; highlight(Object.keys(PLAYS).filter(isFound)); setTimeout(() => highlight([]), 2600); }, reduce ? 1500 : (STORY ? 4200 : 6500));
window.__room = { lampGoes, pressA, pressB, step, THREE, look, crtMat, objects, goSpot, state, camera, activate, story, reveal, skipStory, eject, openLetter, get panel() { return panel; }, tray, TRAY, doorPivot, frameObject };
