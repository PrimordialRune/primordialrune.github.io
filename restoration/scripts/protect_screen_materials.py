from pathlib import Path
p=Path('restoration/scripts/finish.mjs');s=p.read_text(encoding='utf-8-sig').replace('keepLeaves:true,keepAttributes:false','keepLeaves:true,keepAttributes:false,keepSolidTextures:true').replace('prune({keepLeaves:true})','prune({keepLeaves:true,keepSolidTextures:true})');p.write_text(s,encoding='utf-8')
