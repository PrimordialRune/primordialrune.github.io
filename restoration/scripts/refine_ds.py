from pathlib import Path
p=Path('restoration/scripts/restore.py');s=p.read_text(encoding='utf-8-sig')
s=s.replace(" elif id=='ds-console':\n", " elif id=='ds-console':\n  from atlas import snapshot, bake_ds\n  high=snapshot(obs)\n")
s=s.replace("  notes.append('Reduced case tessellation, retained all controls and screen geometry.')", "  low=[o for o in obs if o.name not in ['Object_9','Object_28','Object_14','Object_15']]\n  bake_ds(high,low)\n  notes.append('Graphite shell atlas; high-to-low tangent normal bake retains source embossing, screws and vents; separate screen art.')")
p.write_text(s,encoding='utf-8')
p=Path('restoration/scripts/finish.mjs');s=p.read_text(encoding='utf-8-sig')
s=s.replace("await doc.transform(dedup(),", "if(id==='ds-console')for(const m of doc.getRoot().listMaterials()){\n if(/screen/i.test(m.getName()))m.setEmissiveTexture(null).setEmissiveFactor([0,0,0]);\n}\nawait doc.transform(dedup(),")
s=s.replace("tex.setImage(await pipeline.webp({lossless:true,effort:6}).toBuffer()).setMimeType('image/webp');", "const isBakedDetail=/DS_graphite_atlas|DS_source_detail_normal/.test(tex.getName());\n tex.setImage(await pipeline.webp(isBakedDetail?{quality:90,effort:6}:{lossless:true,effort:6}).toBuffer()).setMimeType('image/webp');")
p.write_text(s,encoding='utf-8')
