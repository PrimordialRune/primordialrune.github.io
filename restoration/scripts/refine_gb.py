from pathlib import Path
p=Path('restoration/scripts/restore.py');s=p.read_text(encoding='utf-8-sig').replace("'Object_6':.82", "'Object_6':1.0").replace("collapse(o,ratios[o.name]); weighted(o)","collapse(o,ratios[o.name])\n    if o.name!='Object_6':weighted(o)")
p.write_text(s,encoding='utf-8')
