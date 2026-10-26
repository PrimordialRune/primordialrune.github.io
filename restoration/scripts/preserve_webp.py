from pathlib import Path
p=Path('restoration/scripts/finish.mjs');s=p.read_text(encoding='utf-8-sig').replace("const image=sharp(tex.getImage()); const meta=await image.metadata();", "const image=sharp(tex.getImage()); const meta=await image.metadata();\n // Existing in-budget WebP art is copied byte-for-byte, avoiding needless recompression.\n if(tex.getMimeType()==='image/webp'&&meta.width<=limit&&meta.height<=limit)continue;")
p.write_text(s,encoding='utf-8')
