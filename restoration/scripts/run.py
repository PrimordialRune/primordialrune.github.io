"""Re-run one model and verify it before processing another.
Dependencies: npm ci --prefix restoration/tools --cache restoration/work/npm-cache
Usage: python restoration/scripts/run.py MODEL [--render-only]
"""
import sys, subprocess, json, os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BLENDER=os.environ.get('RESTORATION_BLENDER',r'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe')
IDS=['gb-console','gba-console','ds-console','pc','crossfader-player','gb-cart','gba-cart','ds-cart','crossfader-cassette']
def run(args,log):
 print('RUN', ' '.join(map(str,args)),flush=True)
 with (ROOT/'work'/log).open('w',encoding='utf-8') as out:
  subprocess.run(list(map(str,args)),stdout=out,stderr=subprocess.STDOUT,check=True)
def model(id,render_only=False):
 if id not in IDS:raise ValueError('Unknown model: '+id)
 if not render_only:
  run([BLENDER,'-b','-t','6','-P',ROOT/'scripts/restore.py','--',id],id+'-restore.log')
  run(['node',ROOT/'scripts/finish.mjs',id],id+'-finish.log')
  run(['node',ROOT/'scripts/validate.mjs',id],id+'-validate.log')
  audit=json.loads((ROOT/'work'/(id+'-verification.json')).read_text())
  assert all(v for k,v in audit['checks'].items() if k!='triangleLimit'),audit['checks']
 render_jobs=[('before',ROOT/'source/web'/(id+'.glb')),('after',ROOT/'work'/(id+'-render.glb'))]+([('after_back',ROOT/'work'/(id+'-render.glb'))] if id.endswith('console') else [])
 if id=='crossfader-cassette':render_jobs.append(('after_side_b',ROOT/'work'/(id+'-render.glb')))
 for suffix,path in render_jobs:
  run([BLENDER,'-b','-t','6','-P',ROOT/'scripts/render.py','--',id,path,suffix],id+'-'+suffix+'.log')
 print('VERIFIED',id,flush=True)
if __name__=='__main__':
 model(sys.argv[1],'--render-only' in sys.argv)
