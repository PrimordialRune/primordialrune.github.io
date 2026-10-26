/** Measure texture encodings without modifying any model. */
import fs from 'node:fs/promises';
import sharp from '../tools/node_modules/sharp/dist/index.mjs';
import {NodeIO} from '../tools/node_modules/@gltf-transform/core/dist/index.js';
import {ALL_EXTENSIONS} from '../tools/node_modules/@gltf-transform/extensions/dist/index.js';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
for(const id of ['gba-cart','ds-cart']){
 const doc=await io.read('restoration/source/web/'+id+'.glb');
 const tex=doc.getRoot().listMaterials().find(m=>/gblabel|presetNdsi/i.test(m.getName())).getBaseColorTexture();
 for(const size of [512,384,256]){
  const p=sharp(tex.getImage()).resize({width:size,height:size,fit:'inside',withoutEnlargement:true});
  console.log(id,'web',size,'lossless',(await p.clone().webp({lossless:true,effort:6}).toBuffer()).length);
 }
}
for(const file of ['galactic-news-cart.png','minamoto-gba-label.jpg','legends-arise-ds.jpg']){
 for(const size of [512,384,256]){
  const p=sharp('restoration/source/labels/'+file).resize({width:size,height:size,fit:'inside',withoutEnlargement:true});
  console.log(file,size,'lossless',(await p.clone().webp({lossless:true,effort:6}).toBuffer()).length);
 }
}
