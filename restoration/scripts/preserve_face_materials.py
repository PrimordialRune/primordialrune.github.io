from pathlib import Path
p=Path('restoration/scripts/restore.py');s=p.read_text(encoding='utf-8-sig').replace(' source={}\n', ' source={}; source_indices={}\n')
s=s.replace("   if o.type=='MESH': source[o.name]=o.data.copy()", "   if o.type=='MESH':\n    source[o.name]=o.data.copy()\n    source_indices[o.name]=[p.material_index for p in o.data.polygons]")
s=s.replace("   for m in mats:o.data.materials.append(m)\n   matches.append", "   for m in mats:o.data.materials.append(m)\n   for poly,index in zip(o.data.polygons,source_indices[o.name]):\n    if index>=len(mats):raise RuntimeError('Material slot mismatch: '+o.name)\n    poly.material_index=index\n   matches.append")
p.write_text(s,encoding='utf-8')
p=Path('restoration/scripts/finish.mjs');s=p.read_text(encoding='utf-8-sig').replace("const t=final.getRoot().listMaterials().find(m=>m.getName()===s.getName());return {name:s.getName(),equal:!!t&&JSON.stringify(s.getBaseColorFactor())===JSON.stringify(t.getBaseColorFactor())};", "const equal=final.getRoot().listMaterials().some(m=>JSON.stringify(s.getBaseColorFactor())===JSON.stringify(m.getBaseColorFactor()));return {name:s.getName(),equal};")
p.write_text(s,encoding='utf-8')
