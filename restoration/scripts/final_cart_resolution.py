from pathlib import Path
p=Path('restoration/scripts/finish.mjs');s=p.read_text(encoding='utf-8-sig').replace("id==='ds-cart'&&isArt?384", "(id==='ds-cart'||id==='gba-cart')&&isArt?384").replace("const cap=id==='ds-cart'?384:limit", "const cap=id==='ds-cart'||id==='gba-cart'?384:limit");p.write_text(s,encoding='utf-8')
