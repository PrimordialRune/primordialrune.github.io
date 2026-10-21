// Builds the room's case studies: content/studies/<slug>.md -> public/new/study/<slug>/index.html.
// Each study is written as the insert that comes with its medium (a cartridge's instruction booklet,
// a disc's liner notes...). The Markdown stays small on purpose so Omar can edit it by hand:
//   # Title | カタカナ   a new page          * line   the narrator in the margin
//   ?? line             a question (draft only)  - line   a list item
//   ![caption](file "x3" | "wide")   a picture from the study's folder
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'content/studies');
const OUT = join(root, 'public/new/study');

// Omar's logo, the narrator's face, read straight from src/lib/logo.ts so the paths are never retyped
const logo = readFileSync(join(root, 'src/lib/logo.ts'), 'utf8');
const LOGO_OUTER = logo.match(/LOGO_OUTER =\s*"([^"]+)"/)[1];
const LOGO_INNER = logo.match(/LOGO_INNER =\s*"([^"]+)"/)[1];

// What each medium's insert is called, and the words on its cover
const MEDIA = {
  gb: { insert: 'INSTRUCTION BOOKLET', kana: 'とりあつかいせつめいしょ', system: 'GAME BOY' },
  gba: { insert: 'INSTRUCTION BOOKLET', kana: 'とりあつかいせつめいしょ', system: 'GAME BOY ADVANCE' },
  ds: { insert: 'INSTRUCTION BOOKLET', kana: 'とりあつかいせつめいしょ', system: 'NINTENDO DS' },
  disc: { insert: 'LINER NOTES', kana: 'ライナーノーツ', system: 'PC CD-ROM' },
  cassette: { insert: 'J-CARD', kana: 'ジェイカード', system: 'CASSETTE' },
  rulebook: { insert: 'RULEBOOK', kana: 'ルールブック', system: 'TABLETOP' },
  archive: { insert: 'RECOVERED NOTES', kana: 'ふっきゅう', system: 'ARCHIVED DISC' },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// inline: **bold**, *italic*, [text](url)
const inline = (s) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
  .replace(/\[(.+?)\]\((.+?)\)/g, (_, t, u) => `<a href="${u}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`);

// Just enough YAML for the front matter: "key: value", one level of nesting, # comments.
function frontMatter(text) {
  const data = {}; let parent = null;
  for (const raw of text.split('\n')) {
    if (/^\s*(#|$)/.test(raw)) continue;
    const m = raw.match(/^(\s*)([^:]+):\s*(.*)$/);
    if (!m) continue;
    const quoted = m[3].match(/^"(.*)"/);
    const value = quoted ? quoted[1] : m[3].replace(/\s+#.*$/, '').trim();
    if (m[1] && parent) data[parent][m[2].trim()] = value;
    else if (value === '' && !quoted) { parent = m[2].trim(); data[parent] = {}; }
    else { parent = null; data[m[2].trim()] = value; }
  }
  return data;
}

// Pixel art is anything up to Game Boy Advance width; bigger pictures are screenshots, shown full width.
function imageWidth(dir, file) {
  try {
    const b = readFileSync(join(dir, file));
    if (b.toString('ascii', 1, 4) === 'PNG') return b.readUInt32BE(16);
    if (b.toString('ascii', 0, 3) === 'GIF') return b.readUInt16LE(6);
  } catch (_) { /* missing file: treat as a screenshot */ }
  return Infinity;
}
const isPixel = (dir, file) => imageWidth(dir, file) <= 320;

function figure(caption, file, opt, dir) {
  const wide = opt === 'wide' || !isPixel(dir, file);
  const scale = (opt || '').match(/^x(\d)$/)?.[1];
  const cls = wide ? 'fig wide' : `fig screen${scale ? ` x${scale}` : ''}`;
  return `<figure class="${cls}"><img src="${esc(file)}" alt="${esc(caption)}"${wide ? ' loading="lazy"' : ''}${wide ? '' : ' data-pixel'}><figcaption>${inline(caption)}</figcaption></figure>`;
}

function body(md, draft, dir) {
  const pages = []; let page = null; let list = null; let aside = null; let para = [];
  const flushPara = () => { if (para.length) { page.html.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list) { page.html.push(`<ul>${list.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`); list = null; } };
  const flushAside = () => {
    if (!aside) return;
    page.html.push(`<aside class="narrator" aria-label="The narrator"><svg viewBox="0 0 555 555" aria-hidden="true"><path d="${LOGO_OUTER}"/><path class="inner" d="${LOGO_INNER}"/></svg><div><span class="who">OMAR</span>${aside.map((l) => `<p>${inline(l)}</p>`).join('')}</div></aside>`);
    aside = null;
  };
  const flush = () => { flushPara(); flushList(); flushAside(); };
  for (const raw of md.split('\n')) {
    const line = raw.trim();
    const h = line.match(/^#\s+(.+?)(?:\s*\|\s*(.+))?$/);
    if (h) { if (page) flush(); page = { title: h[1], kana: h[2] || '', html: [] }; pages.push(page); continue; }
    if (!page) continue;
    if (!line) { flush(); continue; }
    if (line.startsWith('* ')) { flushPara(); flushList(); (aside ||= []).push(line); continue; }
    if (line.startsWith('?? ')) { flush(); if (draft) page.html.push(`<p class="question"><span>QUESTION FOR OMAR</span>${inline(line.slice(3))}</p>`); continue; }
    if (line.startsWith('- ')) { flushPara(); flushAside(); (list ||= []).push(line.slice(2)); continue; }
    const img = line.match(/^!\[(.*?)\]\((\S+?)(?:\s+"(.+?)")?\)$/);
    if (img) { flush(); page.html.push(figure(img[1], img[2], img[3], dir)); continue; }
    flushList(); flushAside(); para.push(line);
  }
  if (page) flush();
  return pages;
}

// The page number, in the medium's own counting: a tape has two sides of tracks, a disc has tracks.
function folio(medium, i, n) {
  if (medium === 'cassette') { const half = Math.ceil(n / 2); return i < half ? `SIDE A · A${i + 1}` : `SIDE B · B${i - half + 1}`; }
  if (medium === 'disc' || medium === 'archive') return `TRACK ${String(i + 1).padStart(2, '0')}`;
  return `— ${i + 2} —`;
}

function render(fm, pages, dir) {
  const draft = fm.status !== 'final';
  const medium = MEDIA[fm.medium] || MEDIA.gb;
  const [ink, accent, accent2, paper] = (fm.palette || '#102f41 #ec563b #339999 #fce8cd').split(/\s+/);
  const facts = Object.entries(fm.facts || {}).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${inline(v.replace(/\s*\?\?$/, ''))}${draft && /\?\?$/.test(v) ? ' <span class="unsure" title="To confirm">?</span>' : ''}</dd></div>`).join('');
  const play = fm.play ? `<a class="play" href="${esc(fm.play)}" target="_blank" rel="noopener">PLAY IT →</a>` : '';
  const pageHtml = pages.map((p, i) => `
  <section class="page" aria-labelledby="p${i + 1}">
    <header><h2 id="p${i + 1}">${inline(p.title)}</h2>${p.kana ? `<div class="kana" lang="ja">${esc(p.kana)}</div>` : ''}</header>
    ${p.html.join('\n    ')}
    <footer class="folio">${folio(fm.medium, i, pages.length)}</footer>
  </section>`).join('\n');
  return `<!doctype html>
<html lang="en" data-medium="${esc(fm.medium || 'gb')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fm.title)} · Omar Golinelli</title>
<meta name="description" content="${esc(fm.title)}: the ${esc(medium.insert.toLowerCase())}, a case study by Omar Golinelli.">
${draft ? '<meta name="robots" content="noindex">\n' : ''}<link rel="stylesheet" href="../study.css">
<style>:root { --ink: ${ink}; --accent: ${accent}; --accent2: ${accent2}; --paper: ${paper}; }</style>
</head>
<body>
<!-- Generated from content/studies/${esc(fm.slug)}.md by scripts/build-studies.mjs. Edit the Markdown, not this file. -->
<nav class="bar"><a class="back" href="/" data-back>← BACK TO THE ROOM</a><span class="insert">${medium.insert}</span></nav>
<main class="booklet">
  <section class="page cover" aria-label="Cover">
    ${draft ? '<div class="stamp" title="Drafted with Claude, waiting for Omar\'s pass">DRAFT</div>' : ''}
    <div class="system">${medium.system}</div>
    ${fm.cover ? `<img class="cover-art" src="${esc(fm.cover)}" alt="${esc(fm.title)} cover"${isPixel(dir, fm.cover) ? ' data-pixel' : ' data-wide'}>` : ''}
    <h1>${esc(fm.title)}</h1>
    <div class="kana" lang="ja">${esc(fm.kana || '')}</div>
    <dl class="facts">${facts}</dl>
    ${play}
    <footer class="folio">${medium.insert} <span lang="ja">${medium.kana}</span></footer>
  </section>
${pageHtml}
</main>
<script>
// Back to the room the way you came (keeps ?story and the room's state); a direct visit goes to /new/.
document.querySelector('[data-back]').addEventListener('click', (e) => {
  try { const from = document.referrer && new URL(document.referrer); if (from && from.origin === location.origin && (from.pathname === '/' || from.pathname.replace(/index\\.html$/, '').endsWith('/new/'))) { e.preventDefault(); history.back(); } } catch (_) {}
});
// Pixel art at the largest integer scale that fits (P1: never 2.5x)
const fit = () => document.querySelectorAll('img[data-pixel]').forEach((img) => {
  if (!img.naturalWidth) return;
  const box = img.parentElement.clientWidth - 2 * (parseFloat(getComputedStyle(img).borderLeftWidth) || 0), want = +(img.closest('[class*=" x"]')?.className.match(/x(\\d)/)?.[1] || 3);
  const s = Math.max(1, Math.min(want, Math.floor(box / img.naturalWidth)));
  img.style.width = img.naturalWidth * s + 'px';
});
document.querySelectorAll('img[data-pixel]').forEach((img) => img.addEventListener('load', fit));
addEventListener('resize', fit); fit();
</script>
</body>
</html>
`;
}

mkdirSync(OUT, { recursive: true });
for (const file of readdirSync(SRC).filter((f) => f.endsWith('.md'))) {
  const text = readFileSync(join(SRC, file), 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) { console.warn(`skip ${file}: no front matter`); continue; }
  const fm = frontMatter(m[1]);
  fm.slug ||= file.replace(/\.md$/, '');
  const dir = join(OUT, fm.slug);
  const pages = body(m[2], fm.status !== 'final', dir);
  mkdirSync(join(OUT, fm.slug), { recursive: true });
  writeFileSync(join(dir, 'index.html'), render(fm, pages, dir));
  console.log(`study: ${fm.slug} (${pages.length} pages, ${fm.status || 'draft'})`);
}
