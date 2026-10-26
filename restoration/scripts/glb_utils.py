"""Prepare read-only GLB imports at their glTF default pose, not Blender's first NLA clip."""
import json, struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def static_file(path):
 path=Path(path);data=path.read_bytes();length=struct.unpack_from('<I',data,12)[0]
 doc=json.loads(data[20:20+length])
 if not doc.get('animations'):return path
 doc.pop('animations',None)
 encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
 tail=data[20+length:]
 result=struct.pack('<III',0x46546c67,2,20+len(encoded)+len(tail))+struct.pack('<II',len(encoded),0x4E4F534A)+encoded+tail
 out=ROOT/'work'/('static-'+path.parent.name+'-'+path.name);out.write_bytes(result)
 return out
