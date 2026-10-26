/** One-page visual review of the nine final EEVEE renders. */
import fs from 'node:fs/promises';
import sharp from '../tools/node_modules/sharp/dist/index.mjs';
const ids=['gb-console','gba-console','ds-console','pc','crossfader-player','gb-cart','gba-cart','ds-cart','crossfader-cassette'];
const layers=[];
for(let i=0;i<ids.length;i++){
 const id=ids[i],left=i%3*400,top=Math.floor(i/3)*328;
 layers.push({input:Buffer.from(`<svg width="400" height="28"><rect width="400" height="28" fill="#3c3c3c"/><text x="12" y="20" font-family="sans-serif" font-size="15" fill="white">${id}</text></svg>`),left,top});
 layers.push({input:await sharp('restoration/renders/'+id+'_after.png').resize(400,300).png().toBuffer(),left,top:top+28});
}
await sharp({create:{width:1200,height:984,channels:3,background:'#666666'}}).composite(layers).png().toFile('restoration/renders/overview.png');
