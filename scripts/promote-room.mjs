// Puts the room on the home page: public/new/index.html -> public/index.html (generated, gitignored).
// A <base href="/new/"> keeps every relative path of the room (room.js, models, fonts, quick/, study/)
// pointing at /new/, so the room still lives in one folder and /new/ keeps working.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const room = readFileSync(join(root, 'public/new/index.html'), 'utf8');

const head = `<base href="/new/">
<meta name="description" content="Omar Golinelli (PrimordialRune), game designer and developer. Step into omar's room, seen through an old Trinitron, and find the games on the desk.">
<link rel="canonical" href="https://www.primordialrune.com/">
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
writeFileSync(join(root, 'public/index.html'), room.replace('<title>', `${head}\n<title>`));
console.log('promote-room: public/index.html');
