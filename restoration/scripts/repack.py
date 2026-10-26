"""Apply final packing policy model by model, validate and refresh each changed render."""
import sys,json
from pathlib import Path
from run import run,ROOT,BLENDER
for id in sys.argv[1:]:
 run(['node',ROOT/'scripts/finish.mjs',id],id+'-finish.log')
 run(['node',ROOT/'scripts/validate.mjs',id],id+'-validate.log')
 a=json.loads((ROOT/'work'/(id+'-verification.json')).read_text())
 assert all(v for k,v in a['checks'].items() if k!='triangleLimit')
 print('PASS',id,a['after']['tris'],'tris',a['after']['bytes'],'bytes',flush=True)
 for suffix in ['after']+(['after_back'] if id.endswith('console') else []):
  run([BLENDER,'-b','-t','6','-P',ROOT/'scripts/render.py','--',id,ROOT/'work'/(id+'-render.glb'),suffix],id+'-'+suffix+'.log')
