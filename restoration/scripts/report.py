"""Write the attributed licences and measured report from the final verification evidence."""
import json
from pathlib import Path
from collections import Counter
from bundle_check import verify
from run import ROOT,IDS

DETAILS={
'gb-console':dict(
 changes='Warm-grey #c4bebb ABS, maroon #842447 A/B buttons, charcoal D-pad and satin screen surround. Removed the dimming glass overlay and the preinserted cartridge behind the shell; the room supplies its own cartridge. Reduced controls and metalwork while retaining the full original body mesh. Recovered manufacturer decal maps from the download, generated MikkTSpace tangents and consolidated static geometry/material palettes. Galactic News screen retained byte-for-byte.',
 facts='The DMG-01 is 90 × 148 × 32 mm, with light-grey casing and darker controls. [iFixit hardware record](https://www.ifixit.com/Device/Game_Boy). The requested colours come from the brief; they are restoration choices, not spectrophotometer measurements.',
 deferred='At 148 mm height, the protected source box corresponds to approximately 89.2 mm width and 35.3 mm depth. Making depth 32 mm needs about a 9% change, so it was deferred. Blank rear decal planes and some body shading around the controls remain as supplied; no missing manufacturer art was invented.',
 licence='warm-grey plastics and controls; hidden cartridge/glass removed; reduced tessellation, restored decal maps and tangents; meshopt'),
'gba-console':dict(
 changes='Indigo/violet #4e4785 casing, grey controls, darker moulded lettering and satin bezel. Corrected the internal screen aperture from 4:3 to 3:2, without changing the image or UVs; the overall box is unchanged. Reduced dense geometric wordmarks and consolidated static geometry into material groups. Minamoto screen retained byte-for-byte.',
 facts='Nintendo lists Violet as a launch colour and a 2.9-inch display. [Nintendo hardware page](https://www.nintendo.co.jp/n08/hardware/gba/index.html). The display is 240 × 160 (3:2); the physical system is 144.5 × 82 × 24.5 mm. [Contemporary hardware review and specification table](https://game.watch.impress.co.jp/docs/20010316/gba/main.htm).',
 deferred='At 144.5 mm model width the source box implies roughly 95.7 mm height and 17.6 mm depth. Fixing those to 82 and 24.5 mm exceeds 2%, so the outer silhouette remains. The downloaded rear shell is plain; battery-door and regulatory artwork were not reconstructed.',
 licence='launch indigo/violet plastics; 3:2 internal display aperture; reduced wordmark tessellation and material groups; meshopt'),
'ds-console':dict(
 changes='Preserved the black Graphite appearance. Simplified the original shell, baked its high-poly geometry and existing surface detail into one 1024² body colour atlas and one 512² tangent normal map. Retained separate control legends and both independently named screen materials. Removed stale Nintendo boot-image emission maps that were showing through Omar\'s art. Added explicit tangents and consolidated static parts.',
 facts='The original DS is 148.7 × 84.7 × 28.9 mm when closed, with two 3-inch displays. [Nintendo specifications](https://www.nintendo.co.jp/ds/series/ds/spec/index.html). Graphite Black is an original-DS colour, distinct from a DS Lite redesign. [Nintendo colour catalogue](https://www.nintendo.co.jp/ds/series/ds/index.html).',
 deferred='The supplied model is open; its complete open box cannot be compared directly with closed-console thickness. The lower case footprint, scaled to 148.7 mm width, is about 82.9 mm deep rather than 84.7 mm; correcting this needs slightly more than 2%. Some very small case legends soften in the atlas; control-button legends keep their separate source UVs.',
 licence='Graphite shell optimisation, body/detail atlas and tangent bake; stale boot emission removed; separate original screen art retained; meshopt'),
'pc':dict(
 changes='Worked solely from source/web/pc.glb. Changed the warm-yellow plastic to neutral warm-beige #c5c1b4 ABS with matte roughness. Reduced case, stand and keyboard tessellation; retained monitor glass and all drive-bay placement. Consolidated static material groups. The room still supplies the monitor image and CD tray.',
 facts='The credited [Desktop Computer by Mark](https://sketchfab.com/3d-models/e6332b415ccd4a61acdff22b4636ce16) depicts a generic CRT, horizontal system unit and keyboard. No exact commercial manufacturer or hardware dimensions are supplied, so none are claimed here.',
 deferred='The source monitor aperture is approximately square. Rebuilding it as a typical 4:3 CRT would require changes beyond the protected box and the room\'s fixed 0.5 × 0.502 monitor overlay. No speculative make, model, keyboard lettering or manufacturer badge was added.',
 licence='neutral beige ABS; reduced case/stand/keyboard tessellation and static material groups; monitor and drive frame preserved; meshopt'),
'crossfader-player':dict(
 changes='Used Omar\'s original player geometry and exact floating-point material colours. Retained the complete cassette/reels, button symbols and Door geometry. Reduced only the body and volume-wheel tessellation. Removed unused imported animation clips so the delivered model uses the glTF default pose. Kept Door and Cassette as stable named parents, with quantized mesh data beneath them.',
 facts='This is Omar\'s authored Crossfader device, not a documented commercial player. At the room\'s 160 mm longest-side scale, its original default box is about 160 mm wide, 114.6 mm tall and 57.0 mm deep. These are scene-derived dimensions, not manufacturer specifications.',
 deferred='No commercial hardware redesign was imposed on Omar\'s stylised device. The inner cassette remains because the room hides/shows it during insertion. Material colour art was deliberately kept as materials rather than quantized into an 8-bit colour atlas.',
 licence='default-pose export; body/wheel simplification; exact authored colours and cassette art retained; stable Door/Cassette nodes; meshopt'),
'gb-cart':dict(
 changes='Changed violet-grey plastic to neutral #a7a4a5. Retained the source shell, embossed logo and authored tilt. Remapped the label from its vertically reversed photo-atlas rectangle onto the full upright PNG master. Replaced the noisy web-label encoding with Omar\'s supplied galactic-news-cart.png master, using an exact 2:1 nearest-neighbour reduction from 960 × 864 to 480 × 432, then lossless WebP. This preserves the pixel grid and eliminates inherited WebP ringing. Retained manufacturer embossing normals and generated tangents.',
 facts='Original Game Boy cartridges are grey, with an approximately 65.5 × 57 × 9 mm overall envelope. [iFixit cartridge identification](https://www.ifixit.com/Device/Nintendo_Game_Cartridge). Raised details and revisions can affect the reported thickness.',
 deferred='The model remains tilted, so its raw world-axis box is not a physical width/height/depth measurement. room.js fix [-12.75, 12, -11] is unchanged. The separate display/back shell and backdrop from the download were not reintroduced; rebuilding a complete closed rear envelope would require registration and thickness changes outside this pass\'s protected frame.',
 licence='neutral grey plastic; clean supplied Galactic News pixel-art master; embossed logo/tangents and tilt retained; meshopt'),
'gba-cart':dict(
 changes='Corrected overall height by about −1.78% to the 34.5/60 height-to-width ratio, centred in the existing frame. Made the ABS shell dielectric. Kept ribs, contact geometry, screw and Minamoto UVs. Used the exact source/web Minamoto image resized to 384² and encoded losslessly. Reduced non-art board/shell maps to at most 256 px, with WebP compression and explicit normal-map tangents.',
 facts='Nintendo specifies the Advance Game Pak as 60 mm wide and 34.5 mm high. [Nintendo hardware diagram, item 8](https://www.nintendo.co.jp/n08/hardware/gba/index.html). This is the outer lip envelope, not just the narrower cartridge body.',
 deferred='At 60 mm width the protected source depth is about 7.3 mm. No thicker shell, remeshed front crease, replacement moulded branding or recreated PCB was added. Vendor texture shading remains; the 57 mm room slot scale was not changed.',
 licence='Nintendo 60:34.5 envelope within 2%; dielectric shell, smaller non-art maps; Minamoto label preserved; tangents and meshopt'),
'ds-cart':dict(
 changes='Kept the notched shell and all 1,026 triangles. Replaced unlit shading with matte dielectric plastic and separated the contact faces into a metallic gold material. Retained the exact web-composited Legends Arise/Nintendo label, resized to 384² and encoded losslessly; manufacturer shell maps are at most 256 px. Consolidated static geometry.',
 facts='DS game cards have a nominal 35 × 33 × 3.8 mm envelope; the dimensional reference is community-maintained. [ConsoleMods dimensional table](https://consolemods.org/wiki/Dimensions_for_Game_Cartridges). Nintendo specifies label-down insertion into SLOT-1. [Nintendo insertion guide](https://en-americas-support.nintendo.com/app/answers/detail/a_id/3906/~/how-to-insert-and-play-a-nintendo-ds-game-card).',
 deferred='At 35 mm height the supplied box is about 34.85 mm wide and 2.64 mm thick. Correcting it to 33 × 3.8 mm would change the box by more than 2%, so those errors are documented rather than applied. No new label or back-side game identification was invented.',
 licence='matte physical plastic and separate metallic contacts; smaller shell maps and lossless resized original label; meshopt'),
'crossfader-cassette':dict(
 changes='Preserved all 532 source triangles, exact authored material colours, reels and geometric art. Removed unused idle clips to deliver the default pose. Retained LabelB and a stable parent above its quantized mesh. No texture atlas was introduced because the material colours are part of Omar\'s art. Evidence views show A by default, matching room.js visibility, with an extra B-letter render.',
 facts='A conventional Compact Cassette is about 100.4 × 63.8 × 12 mm including its raised portions. [Sharp\'s cassette mechanism patent, dimensional description](https://www.freepatentsonline.net/5566037.html). The Crossfader object is a stylised authored cassette, not a measured consumer shell.',
 deferred='The authored default box has about a 2:1 width/height ratio, rather than a conventional cassette\'s 1.57:1. Correcting its height would need roughly +27%, exceeding the hard rule and changing Omar\'s art. A/B letters occupy the same authored face and are visibility-switched; both nodes remain in the file.',
 licence='default-pose export; original geometry and exact colour art retained; stable LabelB node; meshopt')
}

def fmt(vec):return '('+', '.join(f'{v:.7g}' for v in vec)+')'
def pct(vec):return '('+', '.join(f'{v:+.5f}%' for v in vec)+')'
def textures(items):
 c=Counter(tuple(t['size']) for t in items)
 return ', '.join(f'{n} × {w}×{h}' for (w,h),n in sorted(c.items(),reverse=True)) or 'None; solid material colours'

def licences():
 source=(ROOT/'source/LICENSES.md').read_text(encoding='utf-8-sig')
 result=[]
 for line in source.splitlines():
  if line.startswith('| File (web/)'):
   line=line.replace('Changes (all: textures resized to 1024 px WebP)','Changes (web preparation; restoration for out/)')
  for id in IDS:
   if line.startswith('| '+id+'.glb |'):
    line=line[:-1].rstrip()+'; restored: '+DETAILS[id]['licence']+' |'
  result.append(line)
 text='\n'.join(result)+'\n'
 text=text.replace('| File | Origin |\n|---|---|', '| File | Origin | Changes |\n|---|---|---|')
 rows=[]
 in_own=False
 for line in text.splitlines():
  if line.startswith("## Omar's own assets"):in_own=True
  if in_own and line.startswith('| ') and not line.startswith('| File |'):
   if 'crossfader-cassette.glb' in line:line=line.rstrip()+' restored: '+DETAILS['crossfader-cassette']['licence']+' |'
   elif 'crossfader-player.glb' in line:line=line.rstrip()+' restored: '+DETAILS['crossfader-player']['licence']+' |'
   else:line=line.rstrip()+' Unchanged artwork source |'
  rows.append(line)
 text='\n'.join(rows)+'\n'
 text+='\nRestoration notes added 2026-10-26 apply to the nine files in `out/`. All other credits and preparation notes are copied from `source/LICENSES.md`; their files were not part of this pass. No third-party ownership is claimed over Omar\'s Crossfader models or game art.\n'
 (ROOT/'LICENSES.md').write_text(text,encoding='utf-8')

def write_report(evidence):
 lines=['# Restoration report — 2026-10-26','',
  f"Completed all nine GLBs: **{evidence['bytes']:,} bytes ({evidence['bytes']/1000:.3f} KB)** against a strict **900,000-byte** total budget. Total triangles: **{evidence['sourceTris']:,} → {evidence['tris']:,}**. All individual triangle limits, texture caps, WebP requirements, protected bounding boxes, required names and artwork checks pass.",'',
  f"The supplied `source/web/` files total **{evidence['sourceBytes']:,} bytes**, not the brief's approximate 1.26 MB. This delivery is {100*(1-evidence['bytes']/evidence['sourceBytes']):.2f}% smaller than those actual inputs. None of the supplied web copies declared meshopt compression; all nine outputs require `EXT_meshopt_compression`.",'',
  '## Delivery and verification','',
  '- [Final model overview](renders/overview.png), [machine-readable verification and hashes](verification.json), [licences and authors](LICENSES.md).',
  '- `out/` contains exactly nine GLBs. `renders/` contains 18 matched before/after views, three console rear views, and one extra cassette B-letter view, all 1200 × 900 EEVEE PNGs. The overview is an additional contact sheet.',
  '- Each model was restored, compressed, reloaded and measured before proceeding. Geometry came from the untouched download after mesh-coordinate correspondence checks; PC used only its web file. Web materials/UVs supplied Omar\'s art. Per-face material indices were preserved for the multicolour Crossfader meshes.',
  '- The final compressed files were read with MeshoptDecoder. Their decoded, dequantized copies—not the uncompressed intermediate exports—were used for the after renders. Khronos validation reports zero errors and zero warnings on every compressed container and decoded final model.',
  '- Validator informational notices include unsupported inspection of the meshopt extension, some unused compression fallback buffers, and non-power-of-two images. The separate decoder/reload and decoded-model validation cover the compressed geometry; no notice was counted as an error or hidden.',
  '- Existing in-budget screen WebPs were copied byte-for-byte. Cart artwork uses lossless WebP after the stated resampling; RGBA SHA-256 comparisons against those expected source pixels pass. The GB cart uses the supplied clean PNG master. No new game artwork was generated. Non-art card diffuse maps use WebP quality 85; normal maps and baked body detail use quality 92.',
  '- Static hardware parts were consolidated into compatible material groups. Separate screen maps and materials were kept, including `Screen_Edge`. Crossfader art retains the original floating-point material colours rather than an 8-bit atlas.',
  '- All cameras and lights are identical within each before/after pair, with neutral-grey backgrounds and framing derived from the web reference. The DS and PC use wider fixed framing to prevent clipping. Cassette A/B visibility matches the room\'s initial A selection; no GLB geometry or node was hidden/deleted to make those renders.',
  '- `public/` is unchanged, including the GB cart `fix` entry. No commit, push or deployment was performed. Individual GLB rendering and structural interaction checks were performed; the website was not switched to these files for a full browser/gameplay or phone performance test.','',
  '## Measured results','',
  'KB below is decimal (1 KB = 1,000 bytes), measured on the GLB itself, without gzip/Brotli. Box change is the maximum absolute per-axis size change from the web file.','',
  '| Model | Tris before → after | Limit | KB before → after | Max box change | Result |',
  '|---|---:|---:|---:|---:|---|']
 for model in evidence['models']:
  a=model['audit'];b=a['before'];c=a['after']
  lines.append(f"| [{a['id']}](out/{a['id']}.glb) | {b['tris']:,} → {c['tris']:,} | {a['checks']['triangleLimit']:,} | {b['bytes']/1000:.3f} → {c['bytes']/1000:.3f} | {max(map(abs,a['boxDeltaPercent'])):.5f}% | PASS |")
 lines+=['',f"Budget headroom: **{900000-evidence['bytes']:,} bytes**. Larger hardware-proportion corrections are explicitly deferred below because of the ±2% frame rule.",'',
 '## Bounding-box convention','',
 'All box tuples below use native glTF **X, Y, Z** world coordinates in the author\'s units, before the room\'s longest-side normalization. Centre deltas are percentages of the source longest side, which remains meaningful when a centre component is zero. Both raw axis-size change and normalized axis-ratio change were checked against 2%. No object was intentionally rotated or recentered. Static transform baking preserves world orientation; the GB cartridge tilt remains authored. Crossfader imports were evaluated at the glTF default pose, with unused clips removed from working import copies, because Blender otherwise activates an idle pose that the room never plays.','']
 for model in evidence['models']:
  a=model['audit'];id=a['id'];b=a['before'];c=a['after'];d=DETAILS[id]
  lines += [f'## {id}','',
   '| Check | Before (`source/web/`) | After (`out/`) |','|---|---|---|',
   f"| Triangles | {b['tris']:,} | {c['tris']:,}; limit {a['checks']['triangleLimit']:,} — PASS |",
   f"| File size | {b['bytes']:,} bytes / {b['bytes']/1000:.3f} KB | {c['bytes']:,} bytes / {c['bytes']/1000:.3f} KB |",
   f"| Texture sizes (count × dimensions) | {textures(b['textures'])} | {textures(c['textures'])}; all embedded textures WebP |",
   f"| Materials | {len(b['materials'])} | {len(c['materials'])} |",
   f"| Box size X, Y, Z | `{fmt(b['bounds']['size'])}` | `{fmt(c['bounds']['size'])}` |",
   f"| Box centre X, Y, Z | `{fmt(b['bounds']['center'])}` | `{fmt(c['bounds']['center'])}` |",
   f"| Raw size change | Reference | `{pct(a['boxDeltaPercent'])}` — PASS |",
   f"| Normalized box-ratio change | Reference | `{pct(a['boxRatioDeltaPercent'])}` — PASS |",
   f"| Centre change / source longest side | Reference | `{pct(a['centerDeltaPercentOfLongest'])}` — PASS |",
   '| Khronos validation | — | Compressed and decoded: 0 errors, 0 warnings |','',
   '**Changed:** '+d['changes'],'', '**Hardware reference:** '+d['facts'],'', '**Deferred / limits:** '+d['deferred'],'']
  if a.get('art'):
   parts=[]
   for art in a['art']:
    src=art.get('artSource','source/web/'+id+'.glb')
    parts.append(f"`{art['material']}` from `{src}` → {art['output'][0]}×{art['output'][1]}: exact expected RGBA match")
   lines+=['**Artwork verification:** '+'; '.join(parts)+'. Hashes are in `verification.json`.','']
  if a.get('nodeChecks'):
   lines+=['**Runtime nodes:** '+ '; '.join(f"`{n['name']}` survives; maximum default world-matrix error {n['maxWorldMatrixError']:.3g}" for n in a['nodeChecks'])+'. Quantization transforms live on mesh children, preserving the named interaction parent.','']
  if a.get('screenChecks'):
   lines+=['**Runtime screens:** '+', '.join('`'+s['name']+'`' for s in a['screenChecks'])+' survive as separately mapped materials.','']
  links=[f'[Before](renders/{id}_before.png)',f'[After](renders/{id}_after.png)']
  if id.endswith('console'):links.append(f'[Rear](renders/{id}_after_back.png)')
  if id=='crossfader-cassette':links.append('[B-letter view](renders/crossfader-cassette_after_side_b.png)')
  lines+=[' · '.join(links),'']
 lines+=['## Re-running','',
 'The production entry point is `scripts/run.py`; see [scripts/README.md](scripts/README.md) for setup and the full sequence. Dependencies are locked under `tools/package-lock.json` and installed only under `restoration/`. Working GLBs, logs, source inventories and npm cache are under ignored `work/`. All scripts used during the pass, including refinement history, are retained. `verification.json` keeps the final measurements, validator results, source/output hashes and render hashes independently of that temporary directory.','',
 'Tools used: Blender 5.2.1 LTS, glTF Transform 4.5.1, meshoptimizer 1.3.0, Sharp 0.35.5, MikkTSpace 1.1.1 and the Khronos glTF Validator. Packing follows the installed glTF Transform API; [meshopt documentation](https://gltf-transform.dev/modules/functions/functions/meshopt) describes the final compression step.','']
 (ROOT/'REPORT.md').write_text('\n'.join(lines),encoding='utf-8')

if __name__=='__main__':
 evidence=verify();licences();write_report(evidence)
 print('WROTE restoration/LICENSES.md and restoration/REPORT.md')
