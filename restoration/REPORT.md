# Restoration report — 2026-10-26

Completed all nine GLBs: **888,516 bytes (888.516 KB)** against a strict **900,000-byte** total budget. Total triangles: **104,815 → 57,839**. All individual triangle limits, texture caps, WebP requirements, protected bounding boxes, required names and artwork checks pass.

The supplied `source/web/` files total **5,064,128 bytes**, not the brief's approximate 1.26 MB. This delivery is 82.45% smaller than those actual inputs. None of the supplied web copies declared meshopt compression; all nine outputs require `EXT_meshopt_compression`.

## Delivery and verification

- [Final model overview](renders/overview.png), [machine-readable verification and hashes](verification.json), [licences and authors](LICENSES.md).
- `out/` contains exactly nine GLBs. `renders/` contains 18 matched before/after views, three console rear views, and one extra cassette B-letter view, all 1200 × 900 EEVEE PNGs. The overview is an additional contact sheet.
- Each model was restored, compressed, reloaded and measured before proceeding. Geometry came from the untouched download after mesh-coordinate correspondence checks; PC used only its web file. Web materials/UVs supplied Omar's art. Per-face material indices were preserved for the multicolour Crossfader meshes.
- The final compressed files were read with MeshoptDecoder. Their decoded, dequantized copies—not the uncompressed intermediate exports—were used for the after renders. Khronos validation reports zero errors and zero warnings on every compressed container and decoded final model.
- Validator informational notices include unsupported inspection of the meshopt extension, some unused compression fallback buffers, and non-power-of-two images. The separate decoder/reload and decoded-model validation cover the compressed geometry; no notice was counted as an error or hidden.
- Existing in-budget screen WebPs were copied byte-for-byte. Cart artwork uses lossless WebP after the stated resampling; RGBA SHA-256 comparisons against those expected source pixels pass. The GB cart uses the supplied clean PNG master. No new game artwork was generated. Non-art card diffuse maps use WebP quality 85; normal maps and baked body detail use quality 92.
- Static hardware parts were consolidated into compatible material groups. Separate screen maps and materials were kept, including `Screen_Edge`. Crossfader art retains the original floating-point material colours rather than an 8-bit atlas.
- All cameras and lights are identical within each before/after pair, with neutral-grey backgrounds and framing derived from the web reference. The DS and PC use wider fixed framing to prevent clipping. Cassette A/B visibility matches the room's initial A selection; no GLB geometry or node was hidden/deleted to make those renders.
- `public/` is unchanged, including the GB cart `fix` entry. No commit, push or deployment was performed. Individual GLB rendering and structural interaction checks were performed; the website was not switched to these files for a full browser/gameplay or phone performance test.

## Measured results

KB below is decimal (1 KB = 1,000 bytes), measured on the GLB itself, without gzip/Brotli. Box change is the maximum absolute per-axis size change from the web file.

| Model | Tris before → after | Limit | KB before → after | Max box change | Result |
|---|---:|---:|---:|---:|---|
| [gb-console](out/gb-console.glb) | 18,081 → 13,490 | 15,000 | 835.612 → 165.600 | 0.00707% | PASS |
| [gba-console](out/gba-console.glb) | 12,083 → 8,203 | 15,000 | 445.976 → 82.792 | 0.00642% | PASS |
| [ds-console](out/ds-console.glb) | 49,560 → 14,443 | 15,000 | 2354.176 → 249.400 | 0.01069% | PASS |
| [pc](out/pc.glb) | 11,891 → 9,285 | 12,000 | 435.724 → 71.316 | 0.01713% | PASS |
| [crossfader-player](out/crossfader-player.glb) | 7,800 → 7,018 | 8,000 | 323.888 → 79.372 | 0.14926% | PASS |
| [gb-cart](out/gb-cart.glb) | 2,320 → 2,320 | 3,000 | 206.428 → 32.584 | 0.00808% | PASS |
| [gba-cart](out/gba-cart.glb) | 1,522 → 1,522 | 3,000 | 311.916 → 103.476 | 1.78447% | PASS |
| [ds-cart](out/ds-cart.glb) | 1,026 → 1,026 | 3,000 | 109.196 → 86.108 | 0.01085% | PASS |
| [crossfader-cassette](out/crossfader-cassette.glb) | 532 → 532 | 3,000 | 41.212 → 17.868 | 0.00472% | PASS |

Budget headroom: **11,484 bytes**. Larger hardware-proportion corrections are explicitly deferred below because of the ±2% frame rule.

## Bounding-box convention

All box tuples below use native glTF **X, Y, Z** world coordinates in the author's units, before the room's longest-side normalization. Centre deltas are percentages of the source longest side, which remains meaningful when a centre component is zero. Both raw axis-size change and normalized axis-ratio change were checked against 2%. No object was intentionally rotated or recentered. Static transform baking preserves world orientation; the GB cartridge tilt remains authored. Crossfader imports were evaluated at the glTF default pose, with unused clips removed from working import copies, because Blender otherwise activates an idle pose that the room never plays.

## gb-console

| Check | Before (`source/web/`) | After (`out/`) |
|---|---|---|
| Triangles | 18,081 | 13,490; limit 15,000 — PASS |
| File size | 835,612 bytes / 835.612 KB | 165,600 bytes / 165.600 KB |
| Texture sizes (count × dimensions) | 1 × 1024×1024, 2 × 512×256, 1 × 256×256 | 2 × 512×256, 1 × 256×256, 3 × 64×4, 1 × 2×2; all embedded textures WebP |
| Materials | 21 | 6 |
| Box size X, Y, Z | `(1.1382, 4.774469, 2.877064)` | `(1.13812, 4.774469, 2.877183)` |
| Box centre X, Y, Z | `(-0.4703627, 1.288085, 0.7633142)` | `(-0.4704044, 1.288085, 0.7633142)` |
| Raw size change | Reference | `(-0.00707%, -0.00001%, +0.00413%)` — PASS |
| Normalized box-ratio change | Reference | `(-0.00706%, +0.00000%, +0.00414%)` — PASS |
| Centre change / source longest side | Reference | `(-0.00087%, -0.00000%, -0.00000%)` — PASS |
| Khronos validation | — | Compressed and decoded: 0 errors, 0 warnings |

**Changed:** Warm-grey #c4bebb ABS, maroon #842447 A/B buttons, charcoal D-pad and satin screen surround. Removed the dimming glass overlay and the preinserted cartridge behind the shell; the room supplies its own cartridge. Reduced controls and metalwork while retaining the full original body mesh. Recovered manufacturer decal maps from the download, generated MikkTSpace tangents and consolidated static geometry/material palettes. Galactic News screen retained byte-for-byte.

**Hardware reference:** The DMG-01 is 90 × 148 × 32 mm, with light-grey casing and darker controls. [iFixit hardware record](https://www.ifixit.com/Device/Game_Boy). The requested colours come from the brief; they are restoration choices, not spectrophotometer measurements.

**Deferred / limits:** At 148 mm height, the protected source box corresponds to approximately 89.2 mm width and 35.3 mm depth. Making depth 32 mm needs about a 9% change, so it was deferred. Blank rear decal planes and some body shading around the controls remain as supplied; no missing manufacturer art was invented.

**Artwork verification:** `Screen` from `source/web/gb-console.glb` → 256×256: exact expected RGBA match. Hashes are in `verification.json`.

**Runtime screens:** `Screen`, `Screen_Edge` survive as separately mapped materials.

[Before](renders/gb-console_before.png) · [After](renders/gb-console_after.png) · [Rear](renders/gb-console_after_back.png)

## gba-console

| Check | Before (`source/web/`) | After (`out/`) |
|---|---|---|
| Triangles | 12,083 | 8,203; limit 15,000 — PASS |
| File size | 445,976 bytes / 445.976 KB | 82,792 bytes / 82.792 KB |
| Texture sizes (count × dimensions) | 1 × 960×640 | 1 × 960×640, 2 × 32×4; all embedded textures WebP |
| Materials | 12 | 3 |
| Box size X, Y, Z | `(13.33376, 8.82971, 1.626737)` | `(13.33376, 8.829493, 1.626632)` |
| Box centre X, Y, Z | `(-0.07074785, 8.24191, 6.337351)` | `(-0.07074785, 8.241909, 6.33735)` |
| Raw size change | Reference | `(+0.00000%, -0.00246%, -0.00642%)` — PASS |
| Normalized box-ratio change | Reference | `(+0.00000%, -0.00246%, -0.00642%)` — PASS |
| Centre change / source longest side | Reference | `(+0.00000%, -0.00000%, -0.00000%)` — PASS |
| Khronos validation | — | Compressed and decoded: 0 errors, 0 warnings |

**Changed:** Indigo/violet #4e4785 casing, grey controls, darker moulded lettering and satin bezel. Corrected the internal screen aperture from 4:3 to 3:2, without changing the image or UVs; the overall box is unchanged. Reduced dense geometric wordmarks and consolidated static geometry into material groups. Minamoto screen retained byte-for-byte.

**Hardware reference:** Nintendo lists Violet as a launch colour and a 2.9-inch display. [Nintendo hardware page](https://www.nintendo.co.jp/n08/hardware/gba/index.html). The display is 240 × 160 (3:2); the physical system is 144.5 × 82 × 24.5 mm. [Contemporary hardware review and specification table](https://game.watch.impress.co.jp/docs/20010316/gba/main.htm).

**Deferred / limits:** At 144.5 mm model width the source box implies roughly 95.7 mm height and 17.6 mm depth. Fixing those to 82 and 24.5 mm exceeds 2%, so the outer silhouette remains. The downloaded rear shell is plain; battery-door and regulatory artwork were not reconstructed.

**Artwork verification:** `blinn2` from `source/web/gba-console.glb` → 960×640: exact expected RGBA match. Hashes are in `verification.json`.

**Runtime screens:** `blinn2` survive as separately mapped materials.

[Before](renders/gba-console_before.png) · [After](renders/gba-console_after.png) · [Rear](renders/gba-console_after_back.png)

## ds-console

| Check | Before (`source/web/`) | After (`out/`) |
|---|---|---|
| Triangles | 49,560 | 14,443; limit 15,000 — PASS |
| File size | 2,354,176 bytes / 2354.176 KB | 249,400 bytes / 249.400 KB |
| Texture sizes (count × dimensions) | 14 × 1024×1024 | 4 × 1024×1024, 1 × 512×512, 3 × 8×4; all embedded textures WebP |
| Materials | 8 | 6 |
| Box size X, Y, Z | `(0.133, 0.07969614, 0.1071494)` | `(0.1330009, 0.07968761, 0.1071544)` |
| Box centre X, Y, Z | `(3.72529e-09, 0.02202963, 0.01632487)` | `(7.450581e-09, 0.02203794, 0.01632503)` |
| Raw size change | Reference | `(+0.00066%, -0.01069%, +0.00464%)` — PASS |
| Normalized box-ratio change | Reference | `(+0.00000%, -0.01135%, +0.00399%)` — PASS |
| Centre change / source longest side | Reference | `(+0.00000%, +0.00625%, +0.00013%)` — PASS |
| Khronos validation | — | Compressed and decoded: 0 errors, 0 warnings |

**Changed:** Preserved the black Graphite appearance. Simplified the original shell, baked its high-poly geometry and existing surface detail into one 1024² body colour atlas and one 512² tangent normal map. Retained separate control legends and both independently named screen materials. Removed stale Nintendo boot-image emission maps that were showing through Omar's art. Added explicit tangents and consolidated static parts.

**Hardware reference:** The original DS is 148.7 × 84.7 × 28.9 mm when closed, with two 3-inch displays. [Nintendo specifications](https://www.nintendo.co.jp/ds/series/ds/spec/index.html). Graphite Black is an original-DS colour, distinct from a DS Lite redesign. [Nintendo colour catalogue](https://www.nintendo.co.jp/ds/series/ds/index.html).

**Deferred / limits:** The supplied model is open; its complete open box cannot be compared directly with closed-console thickness. The lower case footprint, scaled to 148.7 mm width, is about 82.9 mm deep rather than 84.7 mm; correcting this needs slightly more than 2%. Some very small case legends soften in the atlas; control-button legends keep their separate source UVs.

**Artwork verification:** `screen_up.002` from `source/web/ds-console.glb` → 1024×1024: exact expected RGBA match; `screen_down.002` from `source/web/ds-console.glb` → 1024×1024: exact expected RGBA match. Hashes are in `verification.json`.

**Runtime screens:** `screen_up.002`, `screen_down.002` survive as separately mapped materials.

[Before](renders/ds-console_before.png) · [After](renders/ds-console_after.png) · [Rear](renders/ds-console_after_back.png)

## pc

| Check | Before (`source/web/`) | After (`out/`) |
|---|---|---|
| Triangles | 11,891 | 9,285; limit 12,000 — PASS |
| File size | 435,724 bytes / 435.724 KB | 71,316 bytes / 71.316 KB |
| Texture sizes (count × dimensions) | None; solid material colours | 2 × 8×4; all embedded textures WebP |
| Materials | 2 | 2 |
| Box size X, Y, Z | `(790, 940, 906.5317)` | `(789.9937, 940, 906.687)` |
| Box centre X, Y, Z | `(-5, -170, -6.265863)` | `(-4.999989, -170, -6.26948)` |
| Raw size change | Reference | `(-0.00079%, -0.00001%, +0.01713%)` — PASS |
| Normalized box-ratio change | Reference | `(-0.00078%, +0.00000%, +0.01714%)` — PASS |
| Centre change / source longest side | Reference | `(+0.00000%, -0.00000%, -0.00038%)` — PASS |
| Khronos validation | — | Compressed and decoded: 0 errors, 0 warnings |

**Changed:** Worked solely from source/web/pc.glb. Changed the warm-yellow plastic to neutral warm-beige #c5c1b4 ABS with matte roughness. Reduced case, stand and keyboard tessellation; retained monitor glass and all drive-bay placement. Consolidated static material groups. The room still supplies the monitor image and CD tray.

**Hardware reference:** The credited [Desktop Computer by Mark](https://sketchfab.com/3d-models/e6332b415ccd4a61acdff22b4636ce16) depicts a generic CRT, horizontal system unit and keyboard. No exact commercial manufacturer or hardware dimensions are supplied, so none are claimed here.

**Deferred / limits:** The source monitor aperture is approximately square. Rebuilding it as a typical 4:3 CRT would require changes beyond the protected box and the room's fixed 0.5 × 0.502 monitor overlay. No speculative make, model, keyboard lettering or manufacturer badge was added.

[Before](renders/pc_before.png) · [After](renders/pc_after.png)

## crossfader-player

| Check | Before (`source/web/`) | After (`out/`) |
|---|---|---|
| Triangles | 7,800 | 7,018; limit 8,000 — PASS |
| File size | 323,888 bytes / 323.888 KB | 79,372 bytes / 79.372 KB |
| Texture sizes (count × dimensions) | None; solid material colours | None; solid material colours; all embedded textures WebP |
| Materials | 13 | 13 |
| Box size X, Y, Z | `(0.4095, 0.2932, 0.146)` | `(0.4088888, 0.2931886, 0.1459875)` |
| Box centre X, Y, Z | `(0.009749996, 0.1466, 0.002000002)` | `(0.009444389, 0.1466056, 0.002004135)` |
| Raw size change | Reference | `(-0.14926%, -0.00388%, -0.00859%)` — PASS |
| Normalized box-ratio change | Reference | `(+0.00000%, +0.14560%, +0.14088%)` — PASS |
| Centre change / source longest side | Reference | `(-0.07463%, +0.00138%, +0.00101%)` — PASS |
| Khronos validation | — | Compressed and decoded: 0 errors, 0 warnings |

**Changed:** Used Omar's original player geometry and exact floating-point material colours. Retained the complete cassette/reels, button symbols and Door geometry. Reduced only the body and volume-wheel tessellation. Removed unused imported animation clips so the delivered model uses the glTF default pose. Kept Door and Cassette as stable named parents, with quantized mesh data beneath them.

**Hardware reference:** This is Omar's authored Crossfader device, not a documented commercial player. At the room's 160 mm longest-side scale, its original default box is about 160 mm wide, 114.6 mm tall and 57.0 mm deep. These are scene-derived dimensions, not manufacturer specifications.

**Deferred / limits:** No commercial hardware redesign was imposed on Omar's stylised device. The inner cassette remains because the room hides/shows it during insertion. Material colour art was deliberately kept as materials rather than quantized into an 8-bit colour atlas.

**Runtime nodes:** `Door` survives; maximum default world-matrix error 0; `Cassette` survives; maximum default world-matrix error 0. Quantization transforms live on mesh children, preserving the named interaction parent.

[Before](renders/crossfader-player_before.png) · [After](renders/crossfader-player_after.png)

## gb-cart

| Check | Before (`source/web/`) | After (`out/`) |
|---|---|---|
| Triangles | 2,320 | 2,320; limit 3,000 — PASS |
| File size | 206,428 bytes / 206.428 KB | 32,584 bytes / 32.584 KB |
| Texture sizes (count × dimensions) | 1 × 1024×1024, 1 × 512×128 | 1 × 512×128, 1 × 480×432; all embedded textures WebP |
| Materials | 3 | 3 |
| Box size X, Y, Z | `(1.784753, 4.49807, 4.114418)` | `(1.784609, 4.497978, 4.11452)` |
| Box centre X, Y, Z | `(1.667534, 0.1868858, -2.66949)` | `(1.667543, 0.1868412, -2.66942)` |
| Raw size change | Reference | `(-0.00808%, -0.00204%, +0.00247%)` — PASS |
| Normalized box-ratio change | Reference | `(-0.00604%, +0.00000%, +0.00451%)` — PASS |
| Centre change / source longest side | Reference | `(+0.00019%, -0.00099%, +0.00156%)` — PASS |
| Khronos validation | — | Compressed and decoded: 0 errors, 0 warnings |

**Changed:** Changed violet-grey plastic to neutral #a7a4a5. Retained the source shell, embossed logo and authored tilt. Remapped the label from its vertically reversed photo-atlas rectangle onto the full upright PNG master. Replaced the noisy web-label encoding with Omar's supplied galactic-news-cart.png master, using an exact 2:1 nearest-neighbour reduction from 960 × 864 to 480 × 432, then lossless WebP. This preserves the pixel grid and eliminates inherited WebP ringing. Retained manufacturer embossing normals and generated tangents.

**Hardware reference:** Original Game Boy cartridges are grey, with an approximately 65.5 × 57 × 9 mm overall envelope. [iFixit cartridge identification](https://www.ifixit.com/Device/Nintendo_Game_Cartridge). Raised details and revisions can affect the reported thickness.

**Deferred / limits:** The model remains tilted, so its raw world-axis box is not a physical width/height/depth measurement. room.js fix [-12.75, 12, -11] is unchanged. The separate display/back shell and backdrop from the download were not reintroduced; rebuilding a complete closed rear envelope would require registration and thickness changes outside this pass's protected frame.

**Artwork verification:** `Sticker` from `source/labels/galactic-news-cart.png` → 480×432: exact expected RGBA match. Hashes are in `verification.json`.

[Before](renders/gb-cart_before.png) · [After](renders/gb-cart_after.png)

## gba-cart

| Check | Before (`source/web/`) | After (`out/`) |
|---|---|---|
| Triangles | 1,522 | 1,522; limit 3,000 — PASS |
| File size | 311,916 bytes / 311.916 KB | 103,476 bytes / 103.476 KB |
| Texture sizes (count × dimensions) | 4 × 1024×1024, 1 × 1024×512, 1 × 128×128 | 1 × 384×384, 3 × 256×256, 1 × 256×128, 1 × 128×128; all embedded textures WebP |
| Materials | 5 | 5 |
| Box size X, Y, Z | `(0.1121198, 0.5405383, 0.9232327)` | `(0.1121206, 0.5308925, 0.9233109)` |
| Box centre X, Y, Z | `(0.01541959, 0.006183633, 0)` | `(0.01541918, 0.006183632, 0)` |
| Raw size change | Reference | `(+0.00072%, -1.78447%, +0.00847%)` — PASS |
| Normalized box-ratio change | Reference | `(-0.00775%, -1.79279%, +0.00000%)` — PASS |
| Centre change / source longest side | Reference | `(-0.00004%, -0.00000%, +0.00000%)` — PASS |
| Khronos validation | — | Compressed and decoded: 0 errors, 0 warnings |

**Changed:** Corrected overall height by about −1.78% to the 34.5/60 height-to-width ratio, centred in the existing frame. Made the ABS shell dielectric. Kept ribs, contact geometry, screw and Minamoto UVs. Used the exact source/web Minamoto image resized to 384² and encoded losslessly. Reduced non-art board/shell maps to at most 256 px, with WebP compression and explicit normal-map tangents.

**Hardware reference:** Nintendo specifies the Advance Game Pak as 60 mm wide and 34.5 mm high. [Nintendo hardware diagram, item 8](https://www.nintendo.co.jp/n08/hardware/gba/index.html). This is the outer lip envelope, not just the narrower cartridge body.

**Deferred / limits:** At 60 mm width the protected source depth is about 7.3 mm. No thicker shell, remeshed front crease, replacement moulded branding or recreated PCB was added. Vendor texture shading remains; the 57 mm room slot scale was not changed.

**Artwork verification:** `gblabel` from `source/web/gba-cart.glb` → 384×384: exact expected RGBA match. Hashes are in `verification.json`.

[Before](renders/gba-cart_before.png) · [After](renders/gba-cart_after.png)

## ds-cart

| Check | Before (`source/web/`) | After (`out/`) |
|---|---|---|
| Triangles | 1,026 | 1,026; limit 3,000 — PASS |
| File size | 109,196 bytes / 109.196 KB | 86,108 bytes / 86.108 KB |
| Texture sizes (count × dimensions) | 3 × 512×512 | 1 × 384×384, 2 × 256×256; all embedded textures WebP |
| Materials | 3 | 4 |
| Box size X, Y, Z | `(0.06954656, 0.005270408, 0.06984842)` | `(0.06954998, 0.00527098, 0.06984842)` |
| Box centre X, Y, Z | `(0.0002512863, 0.1020324, -0.0006590643)` | `(0.0002512863, 0.1020324, -0.0006590643)` |
| Raw size change | Reference | `(+0.00492%, +0.01085%, -0.00000%)` — PASS |
| Normalized box-ratio change | Reference | `(+0.00492%, +0.01085%, +0.00000%)` — PASS |
| Centre change / source longest side | Reference | `(+0.00000%, +0.00001%, -0.00000%)` — PASS |
| Khronos validation | — | Compressed and decoded: 0 errors, 0 warnings |

**Changed:** Kept the notched shell and all 1,026 triangles. Replaced unlit shading with matte dielectric plastic and separated the contact faces into a metallic gold material. Retained the exact web-composited Legends Arise/Nintendo label, resized to 384² and encoded losslessly; manufacturer shell maps are at most 256 px. Consolidated static geometry.

**Hardware reference:** DS game cards have a nominal 35 × 33 × 3.8 mm envelope; the dimensional reference is community-maintained. [ConsoleMods dimensional table](https://consolemods.org/wiki/Dimensions_for_Game_Cartridges). Nintendo specifies label-down insertion into SLOT-1. [Nintendo insertion guide](https://en-americas-support.nintendo.com/app/answers/detail/a_id/3906/~/how-to-insert-and-play-a-nintendo-ds-game-card).

**Deferred / limits:** At 35 mm height the supplied box is about 34.85 mm wide and 2.64 mm thick. Correcting it to 33 × 3.8 mm would change the box by more than 2%, so those errors are documented rather than applied. No new label or back-side game identification was invented.

**Artwork verification:** `presetNdsiCartridgeFront4` from `source/web/ds-cart.glb` → 384×384: exact expected RGBA match. Hashes are in `verification.json`.

[Before](renders/ds-cart_before.png) · [After](renders/ds-cart_after.png)

## crossfader-cassette

| Check | Before (`source/web/`) | After (`out/`) |
|---|---|---|
| Triangles | 532 | 532; limit 3,000 — PASS |
| File size | 41,212 bytes / 41.212 KB | 17,868 bytes / 17.868 KB |
| Texture sizes (count × dimensions) | None; solid material colours | None; solid material colours; all embedded textures WebP |
| Materials | 8 | 7 |
| Box size X, Y, Z | `(0.605, 0.30272, 0.083248)` | `(0.605, 0.3027073, 0.08325193)` |
| Box centre X, Y, Z | `(0, -0.02464, -4.097819e-09)` | `(0, -0.02464, -4.097819e-09)` |
| Raw size change | Reference | `(+0.00000%, -0.00419%, +0.00472%)` — PASS |
| Normalized box-ratio change | Reference | `(+0.00000%, -0.00419%, +0.00472%)` — PASS |
| Centre change / source longest side | Reference | `(+0.00000%, +0.00000%, +0.00000%)` — PASS |
| Khronos validation | — | Compressed and decoded: 0 errors, 0 warnings |

**Changed:** Preserved all 532 source triangles, exact authored material colours, reels and geometric art. Removed unused idle clips to deliver the default pose. Retained LabelB and a stable parent above its quantized mesh. No texture atlas was introduced because the material colours are part of Omar's art. Evidence views show A by default, matching room.js visibility, with an extra B-letter render.

**Hardware reference:** A conventional Compact Cassette is about 100.4 × 63.8 × 12 mm including its raised portions. [Sharp's cassette mechanism patent, dimensional description](https://www.freepatentsonline.net/5566037.html). The Crossfader object is a stylised authored cassette, not a measured consumer shell.

**Deferred / limits:** The authored default box has about a 2:1 width/height ratio, rather than a conventional cassette's 1.57:1. Correcting its height would need roughly +27%, exceeding the hard rule and changing Omar's art. A/B letters occupy the same authored face and are visibility-switched; both nodes remain in the file.

**Runtime nodes:** `LabelB` survives; maximum default world-matrix error 0. Quantization transforms live on mesh children, preserving the named interaction parent.

[Before](renders/crossfader-cassette_before.png) · [After](renders/crossfader-cassette_after.png) · [B-letter view](renders/crossfader-cassette_after_side_b.png)

## Re-running

The production entry point is `scripts/run.py`; see [scripts/README.md](scripts/README.md) for setup and the full sequence. Dependencies are locked under `tools/package-lock.json` and installed only under `restoration/`. Working GLBs, logs, source inventories and npm cache are under ignored `work/`. All scripts used during the pass, including refinement history, are retained. `verification.json` keeps the final measurements, validator results, source/output hashes and render hashes independently of that temporary directory.

Tools used: Blender 5.2.1 LTS, glTF Transform 4.5.1, meshoptimizer 1.3.0, Sharp 0.35.5, MikkTSpace 1.1.1 and the Khronos glTF Validator. Packing follows the installed glTF Transform API; [meshopt documentation](https://gltf-transform.dev/modules/functions/functions/meshopt) describes the final compression step.
