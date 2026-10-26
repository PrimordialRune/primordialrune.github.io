# 3D model restoration pass: brief

You are restoring the 9 real-hardware models that Omar's Room (the home page of www.primordialrune.com, code in `public/new/`) loads. Omar is a game designer; the room is an early-2000s desk seen through a Trinitron. The objects must read as the REAL hardware, remembered lovingly: right proportions, right plastics, crisp labels. They are seen small (5 to 60 cm objects, camera ~0.5 to 1.2 m away, 2.4:1 canvas, CRT shader on top) and must also load fast on phones.

## Goals, in order
1. **Look closer to the real thing** (restoration): fix proportions that are off against the real hardware dimensions, fix colours (e.g. DMG-01 warm grey #c4bebb body / purple-maroon A-B buttons / dark-grey D-pad; indigo launch GBA; original black DS "Graphite"), clean broken normals/shading, remove junk geometry (backdrops, hidden interior parts nobody sees), and give screens/labels sharp, correctly mapped textures. Bake small details (screws, vents, grip texture, embossed logos) into normal maps when that is cheaper than geometry.
2. **Fewer triangles, smaller files.** Targets per model: handheld consoles ≤ 15k tris, PC ≤ 12k, carts/cassette ≤ 3k, player ≤ 8k. Total for the 9 shipped files: ≤ 900 KB (now ~1.26 MB). Texture budget: 1024 px max for consoles/PC, 512 px for carts, WebP, merge materials into one atlas per model where it doesn't break the rules below. Ship with meshopt compression (`gltf-transform meshopt`) like the current files.

## Hard rules: the room's code depends on these (read `public/new/room.js` and `public/new/stage.js`)
- Keep each model's **orientation, centre and proportions of its bounding box** within ±2% of the current `restoration/source/web/<id>.glb` (stage.js normalises the longest side to 1; slot positions in `SLOTS`, the PC's monitor plane at (0.0055, 0.18, 0.119) and CD tray in `TRAY`, and the cassette door hinge are all in that normalised frame). If a real-hardware proportion fix needs the box to change more, list it in the report instead of doing it.
- The GB cart file is tilted ~12° (room.js fixes it with `fix: [-12.75, 12, -11]`). You may straighten it in the file; if you do, say so, and also remove `fix` from that PLACES entry in room.js.
- Keep these names: any material whose name matches `/screen|blinn2/i` is a screen (the room swaps its map on/off; keep screen surfaces as separate materials with their own texture). Crossfader player: nodes `Door` and `Cassette` must survive as separate nodes. Crossfader cassette: nodes starting `LabelB` (side B labels) must survive.
- Keep Omar's art on labels and screens exactly (from `restoration/source/web/*.glb` or `restoration/source/labels/`). Never invent new label art.
- PC: no source in `original/`; work from `source/web/pc.glb`. Its screen is drawn by the room, so the monitor glass can stay plain.
- Licences: every third-party model is CC BY 4.0 (`restoration/source/LICENSES.md`). Keep the authors; add a short "restored: ..." note per model to the Changes column of a copy at `restoration/LICENSES.md`. Crossfader models are Omar's own.

## Sources
- `restoration/source/original/`: the untouched downloads (higher detail, use these as the restoration base). `cassette_memory.glb` = crossfader-cassette, `cassette_player.glb` = crossfader-player.
- `restoration/source/web/`: what the site uses today, with Omar's labels baked in. This is the "before" and the reference frame.
- Blender 5.2: `"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b -P script.py`. Node has `npx @gltf-transform/cli` for inspect/meshopt/webp.

## Deliverables (write only inside `restoration/`, do not touch `public/` except the one room.js `fix` line above)
- `restoration/out/<id>.glb` for all 9: gb-console, gba-console, ds-console, pc, crossfader-player, gb-cart, gba-cart, ds-cart, crossfader-cassette.
- `restoration/scripts/`: every script you used, so the pass can be re-run.
- `restoration/renders/<id>_before.png` and `<id>_after.png`: same camera, same light, 1200×900, three-quarter view, neutral grey background, rendered with Blender (EEVEE) from the web/ file and the out/ file. Plus `<id>_after_back.png` for consoles.
- `restoration/REPORT.md`: a table per model with tris before/after, KB before/after, texture sizes, what you changed and why (with real-hardware reference facts), bounding-box check result, and anything you could not do.
- Do not commit or push; the operator does that.
