/** Khronos validation of the shipping container and meshopt-decoded final geometry. */
import fs from 'node:fs/promises';
import validator from '../tools/node_modules/gltf-validator/index.js';
const id=process.argv[2];if(!id)throw Error('model id required');
const report={id};
for(const [key,file] of Object.entries({compressed:'restoration/out/'+id+'.glb',decoded:'restoration/work/'+id+'-render.glb'})){
 const result=await validator.validateBytes(new Uint8Array(await fs.readFile(file)),{uri:file,maxIssues:100});
 report[key]=result;
 console.log(key,id,'errors',result.issues.numErrors,'warnings',result.issues.numWarnings,JSON.stringify(result.issues.messages.slice(0,8)));
}
await fs.writeFile('restoration/work/'+id+'-validation.json',JSON.stringify(report,null,2));
if(['compressed','decoded'].some(k=>report[k].issues.numErrors||report[k].issues.numWarnings))process.exitCode=1;
