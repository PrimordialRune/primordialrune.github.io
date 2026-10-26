/** Compress and verify ONE restored model. Art is encoded losslessly; carts use a 512px cap. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {NodeIO,getBounds} from '../tools/node_modules/@gltf-transform/core/dist/index.js';
import {ALL_EXTENSIONS,EXTMeshoptCompression} from '../tools/node_modules/@gltf-transform/extensions/dist/index.js';
import {dedup,prune,weld,palette,join,meshopt,dequantize,unweld,flatten} from '../tools/node_modules/@gltf-transform/functions/dist/index.js';
import {MeshoptEncoder,MeshoptDecoder} from '../tools/node_modules/meshoptimizer/index.js';
import mikk from '../tools/node_modules/mikktspace/dist/main/mikktspace_main.js';
import sharp from '../tools/node_modules/sharp/dist/index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const id=process.argv[2];
if(!id) throw Error('Usage: node restoration/scripts/finish.mjs ID');
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const source=await io.read(path.join(root,'source/web',id+'.glb'));
const doc=await io.read(path.join(root,'work',id+'-restored.glb'));
const limit=id.endsWith('cart')||id==='crossfader-cassette'?512:1024;
const artMaterials=/screen|blinn2|Sticker|gblabel|presetNdsiCartridgeFront4/i;
const originalName={'crossfader-player':'cassette_player','crossfader-cassette':'cassette_memory'}[id]||id;
let original=null;
try {original=await io.read(path.join(root,'source/original',originalName+'.glb'));}catch(e){if(id!=='pc')throw e;}
// Restore full-quality manufacturer maps from the download; Omar's art always comes from web.
if(original)for(const m of doc.getRoot().listMaterials()){
 const src=original.getRoot().listMaterials().find(s=>s.getName()===m.getName());
 if(!src||artMaterials.test(m.getName()))continue;
 for(const slot of ['BaseColor','Normal','Occlusion','MetallicRoughness','Emissive']){
  const a=src['get'+slot+'Texture'](),b=m['get'+slot+'Texture']();
  if(a&&b)b.setImage(a.getImage()).setMimeType(a.getMimeType());
 }
}
// Replace any Blender image re-encoding with the authoritative web pixels.
for(const m of doc.getRoot().listMaterials()) {
 const src=source.getRoot().listMaterials().find(s=>s.getName()===m.getName());
 if(!src||!artMaterials.test(m.getName()))continue;
 for(const slot of ['BaseColor','Emissive']) {
  const a=src['get'+slot+'Texture'](), b=m['get'+slot+'Texture']();
  if(a&&b) b.setImage(a.getImage()).setMimeType(a.getMimeType()).setName(a.getName()||m.getName()+'-art');
 }
}
// The supplied PNG is the clean pixel-art master; use an exact integer downsample.
if(id==='gb-cart'){
 const label=doc.getRoot().listMaterials().find(m=>m.getName()==='Sticker')?.getBaseColorTexture();
 // The web label occupies a vertically reversed rectangle inside a cartridge photo.
 // Register the clean master to the full label surface, without rotating any geometry.
 const mat=doc.getRoot().listMaterials().find(m=>m.getName()==='Sticker');
 for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives())if(p.getMaterial()===mat){
  const old=p.getAttribute('TEXCOORD_0'),lo=old.getMin([]),hi=old.getMax([]),uv=new Float32Array(old.getCount()*2);
  for(let i=0;i<old.getCount();i++){const pair=old.getElement(i,[]);uv[2*i]=(pair[0]-lo[0])/(hi[0]-lo[0]);uv[2*i+1]=1-(pair[1]-lo[1])/(hi[1]-lo[1]);}
  p.setAttribute('TEXCOORD_0',doc.createAccessor('Clean_label_UV').setType('VEC2').setArray(uv).setBuffer(doc.getRoot().listBuffers()[0]));
 }
 if(label)label.setImage(await sharp(await fs.readFile(path.join(root,'source/labels/galactic-news-cart.png'))).resize(480,432,{kernel:'nearest'}).png().toBuffer()).setMimeType('image/png').setName('Galactic_News_master');
}
// Untextured screen surrounds also match the room's screen regex: keep their names and maps.
for(const m of doc.getRoot().listMaterials())if(/screen|blinn2/i.test(m.getName())&&!m.getBaseColorTexture()){
 const rgba=m.getBaseColorFactor().map((v,i)=>i===3?Math.round(v*255):Math.round((v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055)*255));
 const tex=doc.createTexture(m.getName()+'-solid').setImage(await sharp({create:{width:2,height:2,channels:4,background:{r:rgba[0],g:rgba[1],b:rgba[2],alpha:rgba[3]/255}}}).png().toBuffer()).setMimeType('image/png');
 m.setBaseColorTexture(tex).setBaseColorFactor([1,1,1,1]);
 for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives())if(p.getMaterial()===m&&!p.getAttribute('TEXCOORD_0'))p.setAttribute('TEXCOORD_0',doc.createAccessor().setType('VEC2').setArray(new Float32Array(p.getAttribute('POSITION').getCount()*2).fill(.5)).setBuffer(doc.getRoot().listBuffers()[0]));
}
if(id==='ds-console')for(const m of doc.getRoot().listMaterials()){
 if(/screen/i.test(m.getName()))m.setEmissiveTexture(null).setEmissiveFactor([0,0,0]);
}
if(id==='ds-cart'){
 for(const ext of doc.getRoot().listExtensionsUsed())if(ext.extensionName==='KHR_materials_unlit')ext.dispose();
 for(const m of doc.getRoot().listMaterials())m.setMetallicFactor(0).setRoughnessFactor(.68);
 const gold=doc.createMaterial('Gold_contacts').setBaseColorFactor([.44,.32,.105,1]).setMetallicFactor(.75).setRoughnessFactor(.32);
 const contacts=doc.getRoot().listNodes().find(n=>n.getName()==='Object_6');
 if(contacts?.getMesh())for(const p of contacts.getMesh().listPrimitives())p.setMaterial(gold);
}
const ownArt=id.startsWith('crossfader-');
if(ownArt)for(const m of doc.getRoot().listMaterials()){
 const src=source.getRoot().listMaterials().find(s=>s.getName()===m.getName());
 if(src)m.setBaseColorFactor(src.getBaseColorFactor()).setMetallicFactor(src.getMetallicFactor()).setRoughnessFactor(src.getRoughnessFactor()).setEmissiveFactor(src.getEmissiveFactor()).setDoubleSided(src.getDoubleSided());
}
await doc.transform(dedup(),prune({keepLeaves:true,keepAttributes:false,keepSolidTextures:true}),weld());
if(!ownArt)await doc.transform(palette({min:2}));
if(!ownArt)await doc.transform(flatten({cleanup:false}));
await doc.transform(join({keepNamed:ownArt,cleanup:false}),dedup(),prune({keepLeaves:ownArt,keepSolidTextures:true}));
const artTextures=new Set(doc.getRoot().listMaterials().filter(m=>artMaterials.test(m.getName())).flatMap(m=>[m.getBaseColorTexture(),m.getEmissiveTexture()]).filter(Boolean));
const normalTextures=new Set(doc.getRoot().listMaterials().map(m=>m.getNormalTexture()).filter(Boolean));
for(const tex of doc.getRoot().listTextures()) {
 const image=sharp(tex.getImage()); const meta=await image.metadata();
 const isArt=artTextures.has(tex);
 const cap=(id==='ds-cart'||id==='gba-cart')&&isArt?384:(id==='gba-cart'||id==='ds-cart')&&!isArt?256:limit;
 const useLossy=!isArt&&(normalTextures.has(tex)||id==='gba-cart'||id==='ds-cart'||/DS_graphite_atlas|DS_source_detail_normal/.test(tex.getName()));
 // Keep existing in-budget WebP art byte-for-byte. Clean PNG masters stay lossless.
 if(!useLossy&&tex.getMimeType()==='image/webp'&&meta.width<=cap&&meta.height<=cap)continue;
 let pipeline=image;
 if(meta.width>cap||meta.height>cap) pipeline=pipeline.resize({width:cap,height:cap,fit:'inside',withoutEnlargement:true,kernel:'lanczos3'});
 tex.setImage(await pipeline.webp(useLossy?{quality:!normalTextures.has(tex)&&(id==='gba-cart'||id==='ds-cart')?85:92,effort:6}:{lossless:true,effort:6}).toBuffer()).setMimeType('image/webp');
}
// Explicit MikkTSpace tangents make baked normals consistent between Blender and the browser.
if(doc.getRoot().listMaterials().some(m=>m.getNormalTexture())){
 await doc.transform(unweld());
 for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives()){
  if(!p.getMaterial()?.getNormalTexture())continue;
  const pos=p.getAttribute('POSITION'),norm=p.getAttribute('NORMAL'),uv=p.getAttribute('TEXCOORD_0');
  if(!pos||!norm||!uv)continue;
  p.setAttribute('TANGENT',doc.createAccessor('MikkTSpace').setType('VEC4').setArray(mikk.generateTangents(pos.getArray(),norm.getArray(),uv.getArray())).setBuffer(doc.getRoot().listBuffers()[0]));
 }
 await doc.transform(weld());
}
// EXT_texture_webp is required for WebP-only textures.
const {EXTTextureWebP}=await import('../tools/node_modules/@gltf-transform/extensions/dist/index.js');
if(doc.getRoot().listTextures().length)doc.createExtension(EXTTextureWebP).setRequired(true);
// Quantization may change mesh-node transforms. Keep runtime pivots on stable parent nodes.
if(id==='crossfader-player'||id==='crossfader-cassette')for(const n of doc.getRoot().listNodes()){
 if(n.getMesh()&&(n.getName()==='Door'||n.getName()==='Cassette'||n.getName().startsWith('LabelB'))){
  const surface=doc.createNode(n.getName()+'Surface').setMesh(n.getMesh());n.setMesh(null).addChild(surface);
 }
}
await doc.transform(meshopt({encoder:MeshoptEncoder,level:'high',quantizePosition:14,quantizeNormal:10,quantizeTexcoord:14}));
const out=path.join(root,'out',id+'.glb'); await io.write(out,doc);
const final=await io.read(out);
function stats(d) {
 const b=getBounds(d.getRoot().listScenes()[0]);
 const size=b.max.map((x,i)=>x-b.min[i]);const center=b.min.map((x,i)=>(x+b.max[i])/2);
 const meshes=d.getRoot().listNodes().filter(n=>n.getMesh()).map(n=>n.getMesh());
 return {tris:meshes.reduce((sum,m)=>sum+m.listPrimitives().reduce((s,p)=>s+(p.getMode()===4?(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3:0),0),0),
 bounds:{...b,size,center},materials:d.getRoot().listMaterials().map(m=>m.getName()),nodes:d.getRoot().listNodes().map(n=>n.getName()),
 textures:d.getRoot().listTextures().map(t=>({name:t.getName(),size:t.getSize(),bytes:t.getImage()?.length,mime:t.getMimeType()}))};
}
const before=stats(source),after=stats(final);
const delta=after.bounds.size.map((v,i)=>100*(v/before.bounds.size[i]-1));
const centerDelta=after.bounds.center.map((v,i)=>100*(v-before.bounds.center[i])/Math.max(...before.bounds.size));
const triangleLimit=id.endsWith('console')?15000:id==='pc'?12000:id==='crossfader-player'?8000:3000;
const art=[];
for(const s of source.getRoot().listMaterials().filter(m=>artMaterials.test(m.getName()))) {
 const t=final.getRoot().listMaterials().find(m=>m.getName()===s.getName()); if(!t)continue;
 const a=s.getBaseColorTexture(), b=t.getBaseColorTexture();if(!a||!b)continue;
 let artSource='source/web/'+id+'.glb';
 let resize=sharp(a.getImage());
 if(id==='gb-cart'&&s.getName()==='Sticker'){
  artSource='source/labels/galactic-news-cart.png';resize=sharp(await fs.readFile(path.join(root,artSource))).resize(480,432,{kernel:'nearest'});
 }else{
  const cap=id==='ds-cart'||id==='gba-cart'?384:limit;const meta=await resize.metadata();
  if(meta.width>cap||meta.height>cap)resize=resize.resize({width:cap,height:cap,fit:'inside',withoutEnlargement:true,kernel:'lanczos3'});
 }
 const ap=await resize.ensureAlpha().raw().toBuffer(),bp=await sharp(b.getImage()).ensureAlpha().raw().toBuffer();
 art.push({artSource,uvRegistration:id==='gb-cart'?'Photo-atlas UV rectangle normalized to 0..1; V reversed for the upright PNG master':'Source UV registration preserved',material:s.getName(),source:a.getSize(),output:b.getSize(),pixelsEqual:ap.equals(bp),sourcePixelsSHA256:crypto.createHash('sha256').update(ap).digest('hex'),outputPixelsSHA256:crypto.createHash('sha256').update(bp).digest('hex')});
}
const required=id==='crossfader-player'?['Door','Cassette']:id==='crossfader-cassette'?source.getRoot().listNodes().map(n=>n.getName()).filter(n=>n.startsWith('LabelB')):[];
const nodeChecks=required.map(name=>{
 const a=source.getRoot().listNodes().find(n=>n.getName()===name),b=final.getRoot().listNodes().find(n=>n.getName()===name);
 return {name,present:!!b,maxWorldMatrixError:b?Math.max(...a.getWorldMatrix().map((v,i)=>Math.abs(v-b.getWorldMatrix()[i]))):null};
});
const screenChecks=source.getRoot().listMaterials().filter(m=>/screen|blinn2/i.test(m.getName())).map(m=>({name:m.getName(),present:final.getRoot().listMaterials().some(f=>f.getName()===m.getName()&&f.getBaseColorTexture())}));
const ownColorChecks=ownArt?source.getRoot().listMaterials().map(s=>{const equal=final.getRoot().listMaterials().some(m=>JSON.stringify(s.getBaseColorFactor())===JSON.stringify(m.getBaseColorFactor()));return {name:s.getName(),equal};}):[];
const checks={ownColors:ownColorChecks.every(c=>c.equal),screens:screenChecks.every(s=>s.present),triangleLimit,triangles:after.tris<=triangleLimit,textureCap:after.textures.every(t=>Math.max(...t.size)<=limit),webp:after.textures.every(t=>t.mime==='image/webp'),bounds:delta.every(v=>Math.abs(v)<=2)&&centerDelta.every(v=>Math.abs(v)<=2),art:art.every(a=>a.pixelsEqual),nodes:nodeChecks.every(n=>n.present&&n.maxWorldMatrixError<1e-4)};
const audit={id,before:{...before,bytes:(await fs.stat(path.join(root,'source/web',id+'.glb'))).size},after:{...after,bytes:(await fs.stat(out)).size},boxDeltaPercent:delta,centerDeltaPercentOfLongest:centerDelta,art,nodeChecks,screenChecks,ownColorChecks,checks};
await fs.writeFile(path.join(root,'work',id+'-verification.json'),JSON.stringify(audit,null,2));
console.log(JSON.stringify({id,tris:after.tris,bytes:audit.after.bytes,boxDeltaPercent:delta,checks,art},null,2));
if(Object.entries(checks).some(([k,v])=>k!=='triangleLimit'&&!v)) throw Error('Verification failed for '+id);
// Blender cannot decode meshopt. Decode the ACTUAL final file, without changing its data, for rendering.
for(const ext of final.getRoot().listExtensionsUsed())if(ext.extensionName==='EXT_meshopt_compression')ext.dispose();
await final.transform(dequantize());
await io.write(path.join(root,'work',id+'-render.glb'),final);

