#!/usr/bin/env python3
"""Subset GenEiKiwamiGo to the CJK characters the studio actually uses, plus ASCII.

The full face is 2.4 MB; the subtitle voice needs ~120 glyphs (about 25 KB as woff2).
Run after adding new katakana/kanji anywhere under src/:

    pip install fonttools brotli
    npm run subset-kana

Writes src/studio/fonts/GenEiKiwamiGo-subset.woff2 (loaded by src/app/layout.tsx).
"""
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public/fonts/GenEiKiwamiGo.ttf"
OUT = ROOT / "src/studio/fonts/GenEiKiwamiGo-subset.woff2"


def cjk(c: str) -> bool:
    o = ord(c)
    return 0x3000 <= o <= 0x30FF or 0x4E00 <= o <= 0x9FFF or 0xFF00 <= o <= 0xFFEF


chars = set()
for p in (ROOT / "src").rglob("*"):
    if p.suffix in (".ts", ".tsx", ".css"):
        chars |= {c for c in p.read_text(errors="ignore") if cjk(c)}

text = "".join(sorted(chars))
OUT.parent.mkdir(parents=True, exist_ok=True)
with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
    f.write(text)
cmd = [
    sys.executable, "-m", "fontTools.subset", str(SOURCE),
    f"--text-file={f.name}", "--unicodes=U+0020-007E",
    "--layout-features=*", "--flavor=woff2", f"--output-file={OUT}",
]
subprocess.run(cmd, check=True)
print(f"{len(text)} CJK characters -> {OUT.relative_to(ROOT)} ({OUT.stat().st_size} bytes)")
