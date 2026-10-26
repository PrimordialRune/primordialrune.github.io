from pathlib import Path
p=Path('restoration/scripts/finish.mjs');s=p.read_text(encoding='utf-8-sig')
s=s.replace("// Untextured screen surrounds", "// The supplied PNG is the clean pixel-art master; use an exact integer downsample.\nif(id==='gb-cart'){\n const label=doc.getRoot().listMaterials().find(m=>m.getName()==='Sticker')?.getBaseColorTexture();\n if(label)label.setImage(await sharp(await fs.readFile(path.join(root,'source/labels/galactic-news-cart.png'))).resize(480,432,{kernel:'nearest'}).png().toBuffer()).setMimeType('image/png').setName('Galactic_News_master');\n}\n// Untextured screen surrounds")
start=s.index('for(const tex of doc.getRoot().listTextures()) {')
end=s.index('// Explicit MikkTSpace',start)
s=s[:start]+'''const artTextures=new Set(doc.getRoot().listMaterials().filter(m=>artMaterials.test(m.getName())).flatMap(m=>[m.getBaseColorTexture(),m.getEmissiveTexture()]).filter(Boolean));
const normalTextures=new Set(doc.getRoot().listMaterials().map(m=>m.getNormalTexture()).filter(Boolean));
for(const tex of doc.getRoot().listTextures()) {
 const image=sharp(tex.getImage()); const meta=await image.metadata();
 const isArt=artTextures.has(tex);
 const cap=id==='ds-cart'&&isArt?384:(id==='gba-cart'||id==='ds-cart')&&!isArt?256:limit;
 const useLossy=!isArt&&(normalTextures.has(tex)||id==='gba-cart'||id==='ds-cart'||/DS_graphite_atlas|DS_source_detail_normal/.test(tex.getName()));
 // Keep existing in-budget WebP art byte-for-byte. Clean PNG masters stay lossless.
 if(!useLossy&&tex.getMimeType()==='image/webp'&&meta.width<=cap&&meta.height<=cap)continue;
 let pipeline=image;
 if(meta.width>cap||meta.height>cap) pipeline=pipeline.resize({width:cap,height:cap,fit:'inside',withoutEnlargement:true,kernel:'lanczos3'});
 tex.setImage(await pipeline.webp(useLossy?{quality:92,effort:6}:{lossless:true,effort:6}).toBuffer()).setMimeType('image/webp');
}
''' + s[end:]
s=s.replace(" let resize=sharp(a.getImage()); const meta=await resize.metadata();\n if(meta.width>limit||meta.height>limit)resize=resize.resize({width:limit,height:limit,fit:'inside',withoutEnlargement:true,kernel:'lanczos3'});", " let artSource='source/web/'+id+'.glb';\n let resize=sharp(a.getImage());\n if(id==='gb-cart'&&s.getName()==='Sticker'){\n  artSource='source/labels/galactic-news-cart.png';resize=sharp(await fs.readFile(path.join(root,artSource))).resize(480,432,{kernel:'nearest'});\n }else{\n  const cap=id==='ds-cart'?384:limit;const meta=await resize.metadata();\n  if(meta.width>cap||meta.height>cap)resize=resize.resize({width:cap,height:cap,fit:'inside',withoutEnlargement:true,kernel:'lanczos3'});\n }")
s=s.replace("art.push({material:s.getName(),source:", "art.push({artSource,material:s.getName(),source:")
p.write_text(s,encoding='utf-8')
p=Path('restoration/scripts/restore.py');s=p.read_text(encoding='utf-8-sig')
s=s.replace("  notes.append('Retained shell ribs, contact fingers, screw and Minamoto label.')", "  # Nintendo specifies the outer Game Pak envelope as 60 x 34.5 mm.\n  # Correct only the 1.8% excess height; the fixed room frame still fits.\n  target_ratio=34.5/60\n  factor=target_ratio*before['size'][1]/before['size'][2]\n  for o in obs:\n   inverse=o.matrix_world.inverted();cz=before['center'][2]\n   for v in o.data.vertices:\n    co=o.matrix_world@v.co;co.z=cz+(co.z-cz)*factor;v.co=inverse@co\n  notes.append('Corrected height to the Nintendo 60 x 34.5 mm envelope within 2%; dielectric ABS; retained ribs, contacts, screw and Minamoto label.')")
p.write_text(s,encoding='utf-8')
