from pathlib import Path
p=Path('restoration/scripts/finish.mjs');s=p.read_text(encoding='utf-8-sig').replace('dequantize,unweld}', 'dequantize,unweld,flatten}')
s=s.replace("await doc.transform(join({keepNamed:true}),dedup(),prune({keepLeaves:true,keepSolidTextures:true}));", "if(!ownArt)await doc.transform(flatten({cleanup:false}));\nawait doc.transform(join({keepNamed:ownArt,cleanup:false}),dedup(),prune({keepLeaves:ownArt,keepSolidTextures:true}));")
p.write_text(s,encoding='utf-8')
p=Path('restoration/scripts/render.py');s=p.read_text(encoding='utf-8-sig').replace("'gba-cart': (-2.5,-0.9,1.1)", "'gba-cart': (2.5,0.9,1.1)");p.write_text(s,encoding='utf-8')
