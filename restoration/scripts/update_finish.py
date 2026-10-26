from pathlib import Path
p=Path('restoration/scripts/finish.mjs')
s=p.read_text(encoding='utf-8-sig')
s=s.replace("// Replace any Blender image", "const originalName={'crossfader-player':'cassette_player','crossfader-cassette':'cassette_memory'}[id]||id;\nlet original=null;\ntry {original=await io.read(path.join(root,'source/original',originalName+'.glb'));}catch(e){if(id!=='pc')throw e;}\n// Restore full-quality manufacturer maps from the download; Omar's art always comes from web.\nif(original)for(const m of doc.getRoot().listMaterials()){\n const src=original.getRoot().listMaterials().find(s=>s.getName()===m.getName());\n if(!src||artMaterials.test(m.getName()))continue;\n for(const slot of ['BaseColor','Normal','Occlusion','MetallicRoughness','Emissive']){\n  const a=src['get'+slot+'Texture'](),b=m['get'+slot+'Texture']();\n  if(a&&b)b.setImage(a.getImage()).setMimeType(a.getMimeType());\n }\n}\n// Replace any Blender image")
p.write_text(s,encoding='utf-8')
