#!/usr/bin/env bash
# Builds the static export into a folder that can be published as a claude.ai artifact:
# files are served relative to the page, names starting with "_" are reserved, and
# U+FFFD characters are refused, so _next becomes nxt and literal U+FFFD is escaped.
# Usage: scripts/artifact-preview.sh <dest-dir>
set -euo pipefail
DEST=${1:?dest dir}
rm -rf out "$DEST" && ASSET_PREFIX=. npx next build
mkdir -p "$DEST/resources" "$DEST/fonts"
cp -r out/_next "$DEST/nxt" && cp -r out/resources/desk "$DEST/resources/" && cp out/favicon.ico "$DEST/"
cp out/fonts/8bitDarling-Regular.otf out/fonts/FKGrotesk-*.otf out/fonts/GN-KillGothic-U-KanaNA.ttf "$DEST/fonts/"
sed 's#<title>[^<]*</title>#<title>The Night Desk</title>#' out/index.html > "$DEST/index.html"
grep -rl "_next/" "$DEST" | xargs sed -i 's#_next/#nxt/#g'
find "$DEST" -name '*.map' -delete
python3 - "$DEST" <<'PY'
import glob, json, os, sys
d = sys.argv[1]
for f in glob.glob(d + "/**/*.js", recursive=True) + [d + "/index.html"]:
    s = open(f, encoding="utf-8").read()
    if "�" in s:
        open(f, "w", encoding="utf-8").write(s.replace("�", "\\ufffd"))
files = {}
for root, _, names in os.walk(d):
    for n in names:
        p = os.path.relpath(os.path.join(root, n), d)
        if p != "index.html":
            files[p] = {"from": p, "contentType": "font/ttf"} if p.endswith(".ttf") else p
json.dump(files, open(d + "/../artifact-files.json", "w"))
PY
echo "files map: $DEST/../artifact-files.json"
