import fs from 'node:fs/promises';
import {NodeIO} from '../tools/node_modules/@gltf-transform/core/dist/index.js';
import {ALL_EXTENSIONS} from '../tools/node_modules/@gltf-transform/extensions/dist/index.js';
import sharp from '../tools/node_modules/sharp/dist/index.mjs';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
for(const id of ['gb-cart']){
 for(const dir of ['source/web','out']){
  if(dir==='out')continue;
  const d=await io.read('restoration/'+dir+'/'+id+'.glb');const m=d.getRoot().listMaterials().find(m=>m.getName()==='Sticker');
  console.log(dir,m.getBaseColorTextureInfo().listExtensions().map(e=>e.toString()));
  await sharp(m.getBaseColorTexture().getImage()).png().toFile('restoration/work/gb-cart-web-label.png');
  for(const mesh of d.getRoot().listMeshes())for(const p of mesh.listPrimitives())if(p.getMaterial()===m){
   const uv=p.getAttribute('TEXCOORD_0');console.log('UV',uv.getMin([]),uv.getMax([]),Array.from(uv.getArray()).slice(0,24));
  }
 }
}
