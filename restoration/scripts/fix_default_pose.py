from pathlib import Path
for file in ['inventory.py','restore.py','render.py']:
 p=Path('restoration/scripts')/file;s=p.read_text(encoding='utf-8-sig')
 if file=='inventory.py':
  s=s.replace('import bpy, json','import bpy, json, sys\nsys.path.insert(0,str(__import__("pathlib").Path(__file__).resolve().parent))\nfrom glb_utils import static_file')
 elif file=='render.py':
  s=s.replace('from mathutils import Vector','from mathutils import Vector\nsys.path.insert(0,str(Path(__file__).resolve().parent))\nfrom glb_utils import static_file')
 else:s=s.replace('from inventory import bounds','from inventory import bounds\nfrom glb_utils import static_file')
 s=s.replace('filepath=str(path)', 'filepath=str(static_file(path))').replace('filepath=str(original)', 'filepath=str(static_file(original))').replace("filepath=str(ROOT/'source'/'web'/(id+'.glb'))", "filepath=str(static_file(ROOT/'source'/'web'/(id+'.glb')))")
 p.write_text(s,encoding='utf-8')
