# Reproducing the restoration

Run from the repository root. All generated data stays inside `restoration/`; the website is not modified.

## Setup

- Blender 5.2.1 LTS, Python 3 and Node 22 were used.
- The default Blender path is `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`. Set `RESTORATION_BLENDER` to override it.
- Keep `source/original/`, `source/web/`, `source/labels/` and `source/LICENSES.md` intact.

```powershell
npm.cmd ci --prefix restoration/tools --cache restoration/work/npm-cache
python restoration/scripts/restore_all.py
```

The full run inventories the sources, restores **one model at a time**, reloads its compressed output, checks its triangle count, dimensions, artwork and required names, runs the Khronos validator, and renders the evidence before advancing. It finishes with the overview, `verification.json`, `LICENSES.md` and `REPORT.md`. The total size check uses a strict 900,000-byte limit.

## Re-run one model

After the inventory exists in `work/`:

```powershell
python restoration/scripts/run.py gba-cart
python restoration/scripts/report.py
```

Valid IDs are `gb-console`, `gba-console`, `ds-console`, `pc`, `crossfader-player`, `gb-cart`, `gba-cart`, `ds-cart`, `crossfader-cassette`.

For a packing-only change, using the existing restored intermediate:

```powershell
python restoration/scripts/repack.py gba-cart
node restoration/scripts/contact_sheet.mjs
python restoration/scripts/report.py
```

## Production scripts

- `inventory.py`: source geometry, material, image and frame inventory.
- `glb_utils.py`: default-pose working import copies; leaves the source files untouched.
- `restore.py`: original-mesh restoration and authoritative web art/material transfer, including per-face material indices.
- `atlas.py`: DS shell colour/normal bake from the source-detail mesh to the simplified target.
- `finish.mjs`: art-preserving texture policy, compatible material grouping, explicit tangents, stable interaction parents, meshopt encoding, reload and measured verification.
- `validate.mjs`: Khronos validation of both the shipping container and decoded final geometry; any error or warning fails.
- `render.py`: fixed, matched EEVEE studio views. After views load decoded copies of the actual final compressed files. Cassette A/B letter visibility follows the room convention.
- `run.py`, `repack.py`, `restore_all.py`: sequential orchestration.
- `bundle_check.py`: all nine models, the strict bundle budget, image dimensions, zero validator errors/warnings, protected frame ratios and unchanged `public/`; records SHA-256 hashes.
- `contact_sheet.mjs`: overview of the final renders.
- `report.py`: final report and attributed copy of the licences.

The other scripts are retained inspection/refinement history from this session. They document edits to the production scripts and are **not prerequisites** to rerun. Do not run them as a batch: their changes are already present. Temporary GLBs, logs, extraction images and the npm cache live in ignored `work/`; installed packages live in ignored `tools/node_modules/`. The package manifest and lockfile are retained.

`verification.json` is the durable evidence record even when `work/` is removed. The source model dimensions are arbitrary author units; comparisons use native glTF X/Y/Z world coordinates and the same default pose as the room, with centre shifts expressed as a fraction of the source longest side.
