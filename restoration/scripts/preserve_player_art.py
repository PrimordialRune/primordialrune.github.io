from pathlib import Path
p=Path('restoration/scripts/restore.py');s=p.read_text(encoding='utf-8-sig').replace("   if o.name in ['ReelRight','ReelLeft','VolumeWheel']:collapse(o,.5)\n   elif o.name not in ['Door','CassetteShell']:collapse(o,.8)","   if o.name=='VolumeWheel':collapse(o,.5)\n   elif o.name=='Body':collapse(o,.8)")
p.write_text(s,encoding='utf-8')
