/** Extract source texture evidence as PNG and build a labelled contact sheet. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {NodeIO} from '../tools/node_modules/@gltf-transform/core/dist/index.js';
import {ALL_EXTENSIONS} from '../tools/node_modules/@gltf-transform/extensions/dist/index.js';
import sharp from '../tools/node_modules/sharp/dist/index.mjs';
const id=process.argv[2]; const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc=await io.read('restoration/source/original/'+id+'.glb');
const ts=doc.getRoot().listTextures();const blocks=[];
for(let i=0;i<ts.length;i++) {
 const tex=ts[i];await sharp(tex.getImage()).png().toFile('restoration/work/'+id+'-tex'+i+'.png');
 const b=await sharp(tex.getImage()).resize(256,256,{fit:'contain',background:'#aaaaaa'}).png().toBuffer();
 blocks.push({input:b,left:(i%4)*256,top:Math.floor(i/4)*280+24});
 const svg=Buffer.from(`<svg width="256" height="24"><text x="5" y="18" fill="white" font-size="14">${i}: ${tex.getName()||'source texture'}</text></svg>`);
 blocks.push({input:svg,left:(i%4)*256,top:Math.floor(i/4)*280});
}
await sharp({create:{width:1024,height:Math.ceil(ts.length/4)*280,channels:3,background:'#444444'}}).composite(blocks).png().toFile('restoration/work/'+id+'-textures.png');
for(const m of doc.getRoot().listMaterials())console.log(m.getName(),['BaseColor','Normal','MetallicRoughness','Occlusion','Emissive'].map(s=>s+':'+ts.indexOf(m['get'+s+'Texture']())).join(' '));
