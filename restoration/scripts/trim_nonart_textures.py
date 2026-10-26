from pathlib import Path
p=Path('restoration/scripts/finish.mjs');s=p.read_text(encoding='utf-8-sig').replace("pipeline.webp(useLossy?{quality:92,effort:6}", "pipeline.webp(useLossy?{quality:!normalTextures.has(tex)&&(id==='gba-cart'||id==='ds-cart')?85:92,effort:6}");p.write_text(s,encoding='utf-8')
