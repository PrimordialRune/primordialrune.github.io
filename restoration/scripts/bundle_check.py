"""Verify the complete delivery, recording immutable evidence for REPORT.md."""
import json,struct,hashlib,subprocess
from pathlib import Path
from run import ROOT,IDS

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def glb_json(path):
 data=path.read_bytes();magic,version,size=struct.unpack_from('<III',data)
 assert magic==0x46546c67 and version==2 and size==len(data),path
 length=struct.unpack_from('<I',data,12)[0]
 return json.loads(data[20:20+length])

def verify():
 models=[];renders=[]
 assert sorted(p.stem for p in (ROOT/'out').glob('*.glb'))==sorted(IDS)
 for id in IDS:
  audit=json.loads((ROOT/'work'/(id+'-verification.json')).read_text())
  validation=json.loads((ROOT/'work'/(id+'-validation.json')).read_text())
  restoration=json.loads((ROOT/'work'/(id+'-restoration.json')).read_text())
  path=ROOT/'out'/(id+'.glb');doc=glb_json(path)
  assert audit['after']['bytes']==path.stat().st_size,id
  assert all(v for k,v in audit['checks'].items() if k!='triangleLimit'),id
  assert 'EXT_meshopt_compression' in doc.get('extensionsRequired',[]),id
  assert all(im.get('mimeType')=='image/webp' for im in doc.get('images',[])),id
  for mode in ['compressed','decoded']:
   assert validation[mode]['issues']['numErrors']==0,(id,mode)
   assert validation[mode]['issues']['numWarnings']==0,(id,mode)
  audit['boxRatioDeltaPercent']=[100*((audit['after']['bounds']['size'][i]/max(audit['after']['bounds']['size']))/(audit['before']['bounds']['size'][i]/max(audit['before']['bounds']['size']))-1) for i in range(3)]
  assert max(map(abs,audit['boxRatioDeltaPercent']))<=2,id
  evidence=dict(id=id,sha256=sha(path),audit=audit,validation=validation,restoration=restoration)
  models.append(evidence)
  suffixes=['before','after']+(['after_back'] if id.endswith('console') else [])
  if id=='crossfader-cassette':suffixes+=['after_side_b']
  for suffix in suffixes:
   path=ROOT/'renders'/(id+'_'+suffix+'.png');data=path.read_bytes()
   assert data[:8]==b'\x89PNG\r\n\x1a\n',path
   width,height=struct.unpack_from('>II',data,16)
   assert (width,height)==(1200,900),(path,width,height)
   assert len(data)>10000,path
   renders.append(dict(file=str(path.relative_to(ROOT)).replace('\\','/'),width=width,height=height,sha256=sha(path)))
 total=sum(m['audit']['after']['bytes'] for m in models)
 assert total<=900000,('Bundle exceeds 900 KB',total)
 changed=subprocess.run(['git','-c','safe.directory='+str(ROOT.parent).replace('\\','/'),'diff','--name-only','--','public/'],capture_output=True,text=True,check=True)
 assert not changed.stdout.strip(),changed.stdout
 sources={str(p.relative_to(ROOT)).replace('\\','/'):sha(p) for p in (ROOT/'source').rglob('*') if p.is_file()}
 result=dict(date='2026-10-26',bytes=total,limitBytes=900000,sourceBytes=sum(m['audit']['before']['bytes'] for m in models),
  tris=sum(m['audit']['after']['tris'] for m in models),sourceTris=sum(m['audit']['before']['tris'] for m in models),
  publicChanged=False,models=models,renders=renders,sourceSHA256=sources)
 (ROOT/'verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
 print('DELIVERY PASS',total,'bytes',result['tris'],'tris',len(renders),'renders',flush=True)
 return result
if __name__=='__main__':verify()
