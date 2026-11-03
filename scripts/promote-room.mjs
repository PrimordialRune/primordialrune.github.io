// Puts the room on the home page: public/new/index.html -> public/index.html (generated, gitignored).
// A <base href="/new/"> keeps every relative path of the room (room.js, models, fonts, quick/, study/)
// pointing at /new/, so the room still lives in one folder and /new/ keeps working.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const room = readFileSync(join(root, 'public/new/index.html'), 'utf8');

// the description and the canonical link are in the room's own head, so /new/ carries them too
const head = `<base href="/new/">
<link rel="icon" href="/favicon.ico">
<meta property="og:type" content="website">
<meta property="og:title" content="Omar’s Room">
<meta property="og:description" content="Game design and development by Omar Golinelli (PrimordialRune).">
<meta property="og:url" content="https://www.primordialrune.com/">
<meta property="og:site_name" content="Omar Golinelli · Game designer & developer">
<meta property="og:image" content="https://www.primordialrune.com/new/og.png">
<meta property="og:image:alt" content="Omar’s room: a desk with an old PC, a Game Boy and an envelope, seen through a Trinitron.">
<meta name="twitter:card" content="summary_large_image">`;

if (!room.includes('<title>')) throw new Error('promote-room: no <title> in public/new/index.html');
// Pages caches files for 10 minutes under fixed names: the home page asks for this build's room.js and stage.js by content hash,
// so a fresh page never runs an old room (stage.js is imported by room.js: the import map points it at its versioned copy)
const v = (f) => createHash('sha1').update(readFileSync(join(root, 'public/new', f))).digest('hex').slice(0, 8);
let page = room.replace('<title>', `${head}\n<title>`);
const sub = (a, b) => { if (!page.includes(a)) throw new Error(`promote-room: no ${a} in public/new/index.html`); page = page.replace(a, b); };
sub('src="room.js"', `src="room.js?v=${v('room.js')}"`);
sub('<link rel="modulepreload" href="room.js">', `<link rel="modulepreload" href="room.js?v=${v('room.js')}">`);
sub('<link rel="modulepreload" href="stage.js">', `<link rel="modulepreload" href="stage.js?v=${v('stage.js')}">`);
sub('"three/addons/": "./lib/three/addons/"', `"three/addons/": "./lib/three/addons/",\n  "./stage.js": "./stage.js?v=${v('stage.js')}"`);
writeFileSync(join(root, 'public/index.html'), page);
console.log('promote-room: public/index.html');
